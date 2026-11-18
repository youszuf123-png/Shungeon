import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

interface PeerState {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  anim: 'idle' | 'run' | 'jump' | 'attack' | 'skill';
  weaponId: string;
  biome: string;
  bossesDefeated: number;
  color: string;
  lastSeen: number;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';

function createGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface CachedTtsClip {
  audioBase64: string;
  mimeType: string;
  script: string;
}

const ttsAudioCache = new Map<string, CachedTtsClip>();
const MAX_TTS_CACHE = 250;

async function startServer() {
  const app = express();
  app.use(express.json());

  const peers = new Map<string, PeerState>();
  const sockets = new Map<string, WebSocket>();
  let totalGlobalBossesDefeated = 0;
  let totalGlobalSecretsFound = 0;

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      onlineWarriors: peers.size,
      totalGlobalBossesDefeated,
      totalGlobalSecretsFound,
      geminiVoiceConfigured: Boolean(
        process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY',
      ),
    });
  });

  const handleVoiceSynthesis = async (req: express.Request, res: express.Response) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const rawScript = typeof body.ttsScript === 'string' ? body.ttsScript.trim() : '';
    const rawStyle = typeof body.stylePrompt === 'string' ? body.stylePrompt.trim() : '';
    const attackName = typeof body.attackName === 'string' ? body.attackName.trim() : '';

    const script = (rawScript || attackName).slice(0, 360);
    if (!script) {
      res.status(400).json({ error: 'Missing text or attackName for Jotaro AI voice synthesis.' });
      return;
    }

    const style =
      rawStyle.slice(0, 500) ||
      'Perform strictly in the authentic Japanese anime voice of Jotaro Kujo (JoJo Stardust Crusaders): ultra-deep, gravelly, booming baritone packed with raw loudness, aggression, and explosive anime emotion—never calm or robotic.';

    const cacheKey = `jotaro_v3:${script}:${style}`;
    const cached = ttsAudioCache.get(cacheKey);
    if (cached) {
      res.json({ ok: true, cached: true, persona: 'jotaro', ...cached });
      return;
    }

    const ai = createGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'GEMINI_API_KEY is not set. Add your API key in Settings > Secrets to enable Jotaro AI voice.',
      });
      return;
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: script,
                speechMetadata: {
                  style,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Fenrir' },
            },
          },
        },
      });

      const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      const audioBase64 = inlineData?.data;
      if (!audioBase64) {
        res.status(502).json({ error: 'Gemini TTS returned no audio payload.' });
        return;
      }

      const clip: CachedTtsClip = {
        audioBase64,
        mimeType: inlineData?.mimeType || 'audio/wav',
        script,
      };
      if (ttsAudioCache.size >= MAX_TTS_CACHE) {
        const oldestKey = ttsAudioCache.keys().next().value;
        if (oldestKey) ttsAudioCache.delete(oldestKey);
      }
      ttsAudioCache.set(cacheKey, clip);

      res.json({ ok: true, cached: false, persona: 'jotaro', ...clip });
    } catch (err: unknown) {
      const errObj = err as { status?: number; message?: string };
      let status = typeof errObj?.status === 'number' && errObj.status >= 400 ? errObj.status : 502;
      let message =
        errObj?.message || 'Jotaro Gemini TTS synthesis failed. Check your API key in Settings > Secrets.';
      if (message.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(message) as {
            error?: { code?: number; status?: string; message?: string };
          };
          if (parsed.error?.code && parsed.error.code >= 400) {
            status = parsed.error.code;
          }
          if (parsed.error?.status === 'RESOURCE_EXHAUSTED' || status === 429) {
            message = 'Gemini TTS rate limit (Free Tier 3/min) — retrying shortly.';
          } else if (parsed.error?.message) {
            message = parsed.error.message.split('\n')[0].slice(0, 140);
          }
        } catch {
          // keep original message if not JSON
        }
      }
      res.status(status).json({ error: message });
    }
  };

  app.post('/api/voice/tts', handleVoiceSynthesis);
  app.post('/api/voice/jotaro', handleVoiceSynthesis);

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  const broadcast = (payload: unknown, excludeId?: string) => {
    const encoded = JSON.stringify(payload);
    for (const [id, client] of sockets.entries()) {
      if (id === excludeId) continue;
      if (client.readyState === WebSocket.OPEN) {
        client.send(encoded);
      }
    }
  };

  wss.on('connection', (ws) => {
    const peerId = `w_${Math.random().toString(36).slice(2, 10)}`;
    const colors = ['#e5b84b', '#60a5fa', '#f472b6', '#34d399', '#c084fc', '#fb923c'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const initialPeer: PeerState = {
      id: peerId,
      name: `Knight-${peerId.slice(2, 6).toUpperCase()}`,
      x: 120,
      y: 180,
      vx: 0,
      vy: 0,
      facing: 1,
      anim: 'idle',
      weaponId: 'claymore',
      biome: 'castle',
      bossesDefeated: 0,
      color,
      lastSeen: Date.now(),
    };

    peers.set(peerId, initialPeer);
    sockets.set(peerId, ws);

    ws.send(
      JSON.stringify({
        type: 'world:init',
        selfId: peerId,
        peers: Array.from(peers.values()),
        stats: {
          onlineCount: peers.size,
          totalGlobalBossesDefeated,
          totalGlobalSecretsFound,
        },
      }),
    );

    broadcast(
      {
        type: 'peer:join',
        peer: initialPeer,
        onlineCount: peers.size,
      },
      peerId,
    );

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(String(raw));
        const current = peers.get(peerId);
        if (!current) return;

        if (msg.type === 'player:state') {
          current.name = typeof msg.name === 'string' ? msg.name.slice(0, 18) : current.name;
          current.x = Number.isFinite(msg.x) ? msg.x : current.x;
          current.y = Number.isFinite(msg.y) ? msg.y : current.y;
          current.vx = Number.isFinite(msg.vx) ? msg.vx : 0;
          current.vy = Number.isFinite(msg.vy) ? msg.vy : 0;
          current.facing = msg.facing === -1 ? -1 : 1;
          current.anim = typeof msg.anim === 'string' ? (msg.anim as PeerState['anim']) : 'idle';
          current.weaponId = typeof msg.weaponId === 'string' ? msg.weaponId : current.weaponId;
          current.biome = typeof msg.biome === 'string' ? msg.biome : current.biome;
          current.bossesDefeated = Number.isFinite(msg.bossesDefeated)
            ? msg.bossesDefeated
            : current.bossesDefeated;
          current.lastSeen = Date.now();

          broadcast(
            {
              type: 'peer:update',
              peer: current,
            },
            peerId,
          );
        } else if (msg.type === 'world:milestone') {
          if (msg.kind === 'boss') totalGlobalBossesDefeated += 1;
          if (msg.kind === 'secret') totalGlobalSecretsFound += 1;
          broadcast({
            type: 'world:announcement',
            fromName: current.name,
            kind: msg.kind,
            label: typeof msg.label === 'string' ? msg.label.slice(0, 80) : '',
            stats: {
              onlineCount: peers.size,
              totalGlobalBossesDefeated,
              totalGlobalSecretsFound,
            },
          });
        }
      } catch {
        // Ignore malformed packets
      }
    });

    ws.on('close', () => {
      peers.delete(peerId);
      sockets.delete(peerId);
      broadcast({
        type: 'peer:leave',
        id: peerId,
        onlineCount: peers.size,
      });
    });
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Bastera server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
