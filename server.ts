import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

interface WarriorCustomization {
  cloakColor: string;
  armorColor: string;
  visorColor: string;
  plumeColor: string;
  outfitStyle?: string;
  headgearStyle?: string;
  crownEquipped?: boolean;
}

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
  realm: string;
  guildRank: string;
  bossesDefeated: number;
  color: string;
  customization?: WarriorCustomization;
  worldId: string;
  role: 'host' | 'guest';
  lastSeen: number;
}

interface WorldRoom {
  worldId: string;
  ownHostId: string;
  hostPeerId: string;
  hostName: string;
  biome: string;
  bossesDefeated: number;
  defeatedBosses: number[];
  isPublic: boolean;
  members: Set<string>;
}

interface StoredSaveRecord {
  version: number;
  saveId: string;
  playerName: string;
  savedAt: string;
  biome: string;
  player: {
    level?: number;
    bossesDefeated?: number;
    x?: number;
    gold?: number;
    equippedWeapon?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SAVES_FILE = path.resolve(__dirname, '.bastera-saves.json');

const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';

function loadSavesDisk(): Record<string, StoredSaveRecord> {
  try {
    if (!fs.existsSync(SAVES_FILE)) return {};
    const raw = fs.readFileSync(SAVES_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Record<string, StoredSaveRecord>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeSavesDisk(map: Record<string, StoredSaveRecord>): void {
  try {
    fs.writeFileSync(SAVES_FILE, JSON.stringify(map, null, 2), 'utf8');
  } catch (err) {
    console.warn('Warning writing saves file:', err);
  }
}

function summarizeSave(s: StoredSaveRecord) {
  return {
    saveId: s.saveId,
    playerName: s.playerName || 'BasteraKnight',
    savedAt: s.savedAt || new Date().toISOString(),
    biome: s.biome || 'castle',
    level: Number(s.player?.level ?? 1),
    bossesDefeated: Number(s.player?.bossesDefeated ?? 0),
    distanceMeters: Math.round(((Number(s.player?.x ?? 68) - 68) / 16)),
    gold: Math.round(Number(s.player?.gold ?? 0)),
    equippedWeapon: String(s.player?.equippedWeapon ?? 'claymore'),
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  const savesStore = loadSavesDisk();
  const peers = new Map<string, PeerState>();
  const sockets = new Map<string, WebSocket>();
  const worlds = new Map<string, WorldRoom>();
  let totalGlobalBossesDefeated = 0;
  let totalGlobalSecretsFound = 0;

  const guildRankWeight: Record<string, number> = {
    F: 1,
    E: 2,
    D: 3,
    C: 4,
    B: 5,
    A: 6,
    S: 7,
  };

  const rankTitles: Record<string, string> = {
    F: 'Porcelain Initiate',
    E: 'Bronze Scout',
    D: 'Iron Vanguard',
    C: 'Silver Escort',
    B: 'Mythril Slayer',
    A: 'Crimson Champion',
    S: 'Crowned Royal Sovereign',
  };

  const adventurerRecords = new Map<string, { name: string; rank: string; clears: number }>([
    ['npc_frieren', { name: 'Alden of Axel', rank: 'S', clears: 88 }],
    ['npc_rudeus', { name: 'Freya Silverwind', rank: 'A', clears: 42 }],
    ['npc_megumin', { name: 'Megumin', rank: 'A', clears: 34 }],
    ['npc_rem', { name: 'Kaito Blade', rank: 'B', clears: 27 }],
    ['npc_kazuma', { name: 'Kazuma', rank: 'B', clears: 19 }],
  ]);

  const popularMissionCounts: Record<
    string,
    { title: string; rankReq: string; activeParties: number; completions: number }
  > = {
    f_goblin_warren: { title: 'Goblin Warren Clearing', rankReq: 'F', activeParties: 14, completions: 289 },
    e_hobgoblin_caves: { title: 'Hobgoblin Quarry Purge', rankReq: 'E', activeParties: 8, completions: 174 },
    d_deep_goblin_keep: { title: 'Deep Rocky Goblin Stronghold', rankReq: 'D', activeParties: 5, completions: 112 },
    c_princess_carriage: { title: 'Royal Princess Carriage Escort', rankReq: 'C', activeParties: 9, completions: 142 },
    b_demon_invasion: { title: 'Demon Realm Volcano Vanguard', rankReq: 'B', activeParties: 6, completions: 78 },
    a_three_demon_kings: { title: 'Three Demon Kings Judgment', rankReq: 'A', activeParties: 2, completions: 19 },
  };

  const recentBulletinFeed: string[] = [
    '[S] Alden of Axel cleared Crimson Volcano Realm Invasion in record time!',
    '[A] Megumin triggered Explosion near Graystone Goblin Quarry.',
    '[C] Royal Escort Guild requests guards for Princess Aurelia carriage!',
  ];

  const buildGuildBulletin = () => {
    const rankings = Array.from(adventurerRecords.values())
      .sort((a, b) => (guildRankWeight[b.rank] ?? 0) - (guildRankWeight[a.rank] ?? 0) || b.clears - a.clears)
      .slice(0, 6)
      .map((r) => ({
        name: r.name,
        rank: r.rank,
        score: (guildRankWeight[r.rank] ?? 1) * 500 + r.clears * 25,
        title: rankTitles[r.rank] ?? 'Guild Adventurer',
      }));
    const popularMissions = Object.entries(popularMissionCounts).map(([missionId, info]) => ({
      missionId,
      title: info.title,
      rankReq: info.rankReq,
      activeParties: info.activeParties,
      completions: info.completions,
    }));
    return {
      rankings,
      popularMissions,
      tickerText: recentBulletinFeed.slice(0, 3).join('  ✦  '),
    };
  };

  const listOnlineAdventurers = () =>
    Array.from(peers.values()).map((p) => ({
      id: p.id,
      name: p.name,
      realm: p.realm,
      guildRank: p.guildRank,
      worldId: p.worldId,
    }));

  const listPublicWorlds = () => {
    const list: {
      worldId: string;
      hostPeerId: string;
      hostName: string;
      biome: string;
      bossesDefeated: number;
      playerCount: number;
      isPublic: boolean;
    }[] = [];
    for (const room of worlds.values()) {
      if (!sockets.has(room.hostPeerId)) continue;
      if (!room.isPublic) continue;
      list.push({
        worldId: room.worldId,
        hostPeerId: room.hostPeerId,
        hostName: room.hostName,
        biome: room.biome,
        bossesDefeated: room.bossesDefeated,
        playerCount: room.members.size,
        isPublic: room.isPublic,
      });
    }
    return list;
  };

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      onlineWarriors: peers.size,
      activeWorlds: worlds.size,
      totalGlobalBossesDefeated,
      totalGlobalSecretsFound,
    });
  });

  app.get('/api/worlds', (_req, res) => {
    res.json({ worlds: listPublicWorlds() });
  });

  // Game Save System REST API
  app.get('/api/saves', (_req, res) => {
    const list = Object.values(savesStore)
      .sort((a, b) => String(b.savedAt).localeCompare(String(a.savedAt)))
      .map(summarizeSave);
    res.json({ saves: list });
  });

  app.get('/api/saves/:saveId', (req, res) => {
    const rec = savesStore[req.params.saveId];
    if (!rec) {
      res.status(404).json({ error: 'Save slot not found' });
      return;
    }
    res.json({ save: rec });
  });

  app.post('/api/saves', (req, res) => {
    const body = req.body as StoredSaveRecord | undefined;
    if (!body || typeof body.saveId !== 'string' || !body.player || typeof body.player !== 'object') {
      res.status(400).json({ error: 'Invalid save payload' });
      return;
    }
    const cleanId = body.saveId.trim().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
    if (!cleanId) {
      res.status(400).json({ error: 'Invalid saveId' });
      return;
    }
    const record: StoredSaveRecord = {
      ...body,
      saveId: cleanId,
      playerName: String(body.playerName || 'BasteraKnight').slice(0, 18),
      savedAt: body.savedAt || new Date().toISOString(),
    };
    savesStore[cleanId] = record;
    writeSavesDisk(savesStore);
    res.status(201).json({ ok: true, summary: summarizeSave(record) });
  });

  app.delete('/api/saves/:saveId', (req, res) => {
    if (savesStore[req.params.saveId]) {
      delete savesStore[req.params.saveId];
      writeSavesDisk(savesStore);
    }
    const list = Object.values(savesStore)
      .sort((a, b) => String(b.savedAt).localeCompare(String(a.savedAt)))
      .map(summarizeSave);
    res.json({ ok: true, saves: list });
  });

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  const broadcastAll = (payload: unknown, excludeId?: string) => {
    const encoded = JSON.stringify(payload);
    for (const [id, client] of sockets.entries()) {
      if (id === excludeId) continue;
      if (client.readyState === WebSocket.OPEN) {
        client.send(encoded);
      }
    }
  };

  const broadcastRoom = (worldId: string, payload: unknown, excludeId?: string) => {
    const room = worlds.get(worldId);
    if (!room) return;
    const encoded = JSON.stringify(payload);
    for (const memberId of room.members) {
      if (memberId === excludeId) continue;
      const client = sockets.get(memberId);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(encoded);
      }
    }
  };

  const broadcastWorldsList = () => {
    broadcastAll({
      type: 'worlds:list',
      worlds: listPublicWorlds(),
      onlineCount: peers.size,
      adventurers: listOnlineAdventurers(),
    });
  };

  const broadcastGuildBulletin = () => {
    broadcastAll({
      type: 'guild:bulletin',
      bulletin: buildGuildBulletin(),
    });
  };

  const getRoomPeers = (worldId: string): PeerState[] => {
    const room = worlds.get(worldId);
    if (!room) return [];
    const list: PeerState[] = [];
    for (const id of room.members) {
      const p = peers.get(id);
      if (p) list.push(p);
    }
    return list;
  };

  const movePeerToWorld = (peerId: string, targetWorldId: string) => {
    const peer = peers.get(peerId);
    const targetRoom = worlds.get(targetWorldId);
    const ws = sockets.get(peerId);
    if (!peer || !targetRoom || !ws) return false;

    const prevWorldId = peer.worldId;
    if (prevWorldId && prevWorldId !== targetWorldId) {
      const prevRoom = worlds.get(prevWorldId);
      if (prevRoom) {
        prevRoom.members.delete(peerId);
        broadcastRoom(
          prevWorldId,
          {
            type: 'peer:leave',
            id: peerId,
            worldPlayerCount: prevRoom.members.size,
            onlineCount: peers.size,
          },
          peerId,
        );
      }
    }

    targetRoom.members.add(peerId);
    peer.worldId = targetRoom.worldId;
    peer.role = targetRoom.hostPeerId === peerId ? 'host' : 'guest';

    ws.send(
      JSON.stringify({
        type: 'world:joined',
        worldId: targetRoom.worldId,
        role: peer.role,
        hostPeerId: targetRoom.hostPeerId,
        hostName: targetRoom.hostName,
        isPublic: targetRoom.isPublic,
        defeatedBosses: targetRoom.defeatedBosses,
        peers: getRoomPeers(targetRoom.worldId),
        worldPlayerCount: targetRoom.members.size,
        onlineCount: peers.size,
      }),
    );

    broadcastRoom(
      targetRoom.worldId,
      {
        type: 'peer:join',
        peer,
        worldPlayerCount: targetRoom.members.size,
        onlineCount: peers.size,
      },
      peerId,
    );

    broadcastWorldsList();
    return true;
  };

  wss.on('connection', (ws) => {
    const peerId = `w_${Math.random().toString(36).slice(2, 10)}`;
    const ownWorldId = `WRLD-${peerId.slice(2, 6).toUpperCase()}`;
    const colors = ['#e5b84b', '#60a5fa', '#f472b6', '#34d399', '#c084fc', '#fb923c'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const defaultName = `Knight-${peerId.slice(2, 6).toUpperCase()}`;

    const ownRoom: WorldRoom = {
      worldId: ownWorldId,
      ownHostId: peerId,
      hostPeerId: peerId,
      hostName: defaultName,
      biome: 'castle',
      bossesDefeated: 0,
      defeatedBosses: [],
      isPublic: true,
      members: new Set([peerId]),
    };
    worlds.set(ownWorldId, ownRoom);

    const initialPeer: PeerState = {
      id: peerId,
      name: defaultName,
      x: 120,
      y: 180,
      vx: 0,
      vy: 0,
      facing: 1,
      anim: 'idle',
      weaponId: 'claymore',
      biome: 'castle',
      realm: 'citadel',
      guildRank: 'F',
      bossesDefeated: 0,
      color,
      worldId: ownWorldId,
      role: 'host',
      lastSeen: Date.now(),
    };

    peers.set(peerId, initialPeer);
    sockets.set(peerId, ws);

    ws.send(
      JSON.stringify({
        type: 'world:init',
        selfId: peerId,
        ownWorldId,
        worldId: ownWorldId,
        role: 'host',
        hostName: ownRoom.hostName,
        isPublic: ownRoom.isPublic,
        peers: getRoomPeers(ownWorldId),
        worlds: listPublicWorlds(),
        adventurers: listOnlineAdventurers(),
        bulletin: buildGuildBulletin(),
        stats: {
          onlineCount: peers.size,
          worldPlayerCount: ownRoom.members.size,
          totalGlobalBossesDefeated,
          totalGlobalSecretsFound,
        },
      }),
    );

    broadcastWorldsList();

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
          const prevRealm = current.realm;
          const prevRank = current.guildRank;
          current.realm = typeof msg.realm === 'string' ? msg.realm : current.realm;
          current.guildRank = typeof msg.guildRank === 'string' ? msg.guildRank : current.guildRank;
          current.bossesDefeated = Number.isFinite(msg.bossesDefeated)
            ? msg.bossesDefeated
            : current.bossesDefeated;
          if (msg.customization && typeof msg.customization === 'object') {
            current.customization = msg.customization as WarriorCustomization;
          }
          current.lastSeen = Date.now();

          if (prevRealm !== current.realm || prevRank !== current.guildRank) {
            const existingRec = adventurerRecords.get(peerId) ?? { name: current.name, rank: current.guildRank, clears: 0 };
            existingRec.name = current.name;
            existingRec.rank = current.guildRank;
            adventurerRecords.set(peerId, existingRec);
            broadcastWorldsList();
            broadcastGuildBulletin();
          }

          if (current.role === 'host') {
            const hostedRoom = worlds.get(current.worldId);
            if (hostedRoom && hostedRoom.hostPeerId === peerId) {
              const changedMeta =
                hostedRoom.hostName !== current.name ||
                hostedRoom.biome !== current.biome ||
                hostedRoom.bossesDefeated !== current.bossesDefeated;
              hostedRoom.hostName = current.name;
              hostedRoom.biome = current.biome;
              hostedRoom.bossesDefeated = current.bossesDefeated;
              if (changedMeta) {
                broadcastWorldsList();
              }
            }
          }

          broadcastRoom(
            current.worldId,
            {
              type: 'peer:update',
              peer: current,
            },
            peerId,
          );
        } else if (msg.type === 'world:host') {
          const hostedRoom = worlds.get(ownWorldId);
          if (hostedRoom) {
            if (typeof msg.hostName === 'string' && msg.hostName.trim()) {
              hostedRoom.hostName = msg.hostName.trim().slice(0, 18);
            }
            if (typeof msg.isPublic === 'boolean') {
              hostedRoom.isPublic = msg.isPublic;
            }
            if (typeof msg.biome === 'string') {
              hostedRoom.biome = msg.biome;
            }
            if (Number.isFinite(msg.bossesDefeated)) {
              hostedRoom.bossesDefeated = msg.bossesDefeated;
            }
            if (Array.isArray(msg.defeatedBosses)) {
              hostedRoom.defeatedBosses = msg.defeatedBosses.filter(
                (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n),
              );
              if (current.worldId === ownWorldId) {
                broadcastRoom(
                  ownWorldId,
                  {
                    type: 'world:boss_state',
                    defeatedBosses: hostedRoom.defeatedBosses,
                  },
                  peerId,
                );
              }
            }
            broadcastWorldsList();
          }
        } else if (msg.type === 'world:join' && typeof msg.worldId === 'string') {
          const targetId = msg.worldId.trim().toUpperCase();
          const ok = movePeerToWorld(peerId, targetId);
          if (!ok) {
            ws.send(
              JSON.stringify({
                type: 'world:error',
                message: `World "${targetId}" is offline or unavailable.`,
              }),
            );
          }
        } else if (msg.type === 'world:leave') {
          movePeerToWorld(peerId, ownWorldId);
        } else if (msg.type === 'world:list') {
          ws.send(
            JSON.stringify({
              type: 'worlds:list',
              worlds: listPublicWorlds(),
              onlineCount: peers.size,
              adventurers: listOnlineAdventurers(),
            }),
          );
        } else if (msg.type === 'world:milestone') {
          if (msg.kind === 'boss') totalGlobalBossesDefeated += 1;
          if (msg.kind === 'secret') totalGlobalSecretsFound += 1;
          broadcastRoom(current.worldId, {
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
        } else if (msg.type === 'guild:invite' && typeof msg.toPeerId === 'string' && typeof msg.missionId === 'string') {
          const targetWs = sockets.get(msg.toPeerId);
          if (targetWs && targetWs.readyState === WebSocket.OPEN) {
            const invite = {
              inviteId: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              fromPeerId: peerId,
              fromName: current.name,
              fromRank: current.guildRank,
              toPeerId: msg.toPeerId,
              missionId: msg.missionId,
              missionTitle: typeof msg.missionTitle === 'string' ? msg.missionTitle.slice(0, 60) : msg.missionId,
              worldId: current.worldId,
            };
            targetWs.send(JSON.stringify({ type: 'guild:invite_received', invite }));
          }
        } else if (
          msg.type === 'guild:invite_response' &&
          typeof msg.fromPeerId === 'string' &&
          typeof msg.missionId === 'string'
        ) {
          const hostPeer = peers.get(msg.fromPeerId);
          const hostWs = sockets.get(msg.fromPeerId);
          if (msg.accept && hostPeer) {
            if (current.worldId !== hostPeer.worldId) {
              movePeerToWorld(peerId, hostPeer.worldId);
            }
            const payload = JSON.stringify({
              type: 'guild:party_start',
              missionId: msg.missionId,
              hostPeerId: hostPeer.id,
              partnerName: current.name,
            });
            if (ws.readyState === WebSocket.OPEN) ws.send(payload);
            if (hostWs && hostWs.readyState === WebSocket.OPEN) hostWs.send(payload);
            recentBulletinFeed.unshift(
              `[${hostPeer.guildRank}] ${hostPeer.name} & ${current.name} departed on a Guild Quest!`,
            );
            broadcastGuildBulletin();
          } else if (hostWs && hostWs.readyState === WebSocket.OPEN) {
            hostWs.send(
              JSON.stringify({
                type: 'world:announcement',
                fromName: current.name,
                kind: 'guild_decline',
                label: `${current.name} declined the mission invite.`,
              }),
            );
          }
        } else if (msg.type === 'guild:mission_start' && typeof msg.missionId === 'string') {
          const entry = popularMissionCounts[msg.missionId];
          if (entry) {
            entry.activeParties += 1;
          }
          recentBulletinFeed.unshift(
            `[${current.guildRank}] ${current.name} accepted "${entry?.title ?? msg.missionId}"!`,
          );
          if (recentBulletinFeed.length > 8) recentBulletinFeed.length = 8;
          broadcastGuildBulletin();
        } else if (msg.type === 'guild:mission_complete' && typeof msg.missionId === 'string') {
          const entry = popularMissionCounts[msg.missionId];
          if (entry) {
            entry.activeParties = Math.max(0, entry.activeParties - 1);
            entry.completions += 1;
          }
          const rec = adventurerRecords.get(peerId) ?? { name: current.name, rank: current.guildRank, clears: 0 };
          rec.name = current.name;
          rec.rank = typeof msg.newRank === 'string' ? msg.newRank : current.guildRank;
          rec.clears += 1;
          adventurerRecords.set(peerId, rec);
          recentBulletinFeed.unshift(
            `[${rec.rank}] ${current.name} completed ${entry?.title ?? msg.missionId}!`,
          );
          if (recentBulletinFeed.length > 8) recentBulletinFeed.length = 8;
          broadcastGuildBulletin();
        }
      } catch {
        // Ignore malformed packets
      }
    });

    ws.on('close', () => {
      const leaving = peers.get(peerId);
      const currentWorldId = leaving?.worldId;
      peers.delete(peerId);
      sockets.delete(peerId);

      if (currentWorldId) {
        const room = worlds.get(currentWorldId);
        if (room) {
          room.members.delete(peerId);
          broadcastRoom(currentWorldId, {
            type: 'peer:leave',
            id: peerId,
            worldPlayerCount: room.members.size,
            onlineCount: peers.size,
          });
        }
      }

      // If this peer hosted guests in their own world, cleanly return guests to their own host worlds
      const hosted = worlds.get(ownWorldId);
      if (hosted) {
        const guests = Array.from(hosted.members).filter((mId) => mId !== peerId);
        for (const gId of guests) {
          const guestPeer = peers.get(gId);
          const guestWs = sockets.get(gId);
          if (guestPeer && guestWs) {
            const fallbackWorldId = `WRLD-${gId.slice(2, 6).toUpperCase()}`;
            movePeerToWorld(gId, fallbackWorldId);
            guestWs.send(
              JSON.stringify({
                type: 'world:error',
                message: 'Host disconnected. Returned safely to your own Bastera world.',
              }),
            );
          }
        }
        worlds.delete(ownWorldId);
      }

      broadcastWorldsList();
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
