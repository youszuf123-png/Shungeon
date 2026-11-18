import {
  buildJotaroAttackAnnouncement,
  buildJotaroDialoguePrompt,
  type JotaroVoicePrompt,
} from './jotaroVoice';
import type { BiomeId, BossDef, SkillId, WeaponId } from './types';

class GameAudioEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private musicTimer: number | null = null;
  private stepIndex = 0;
  private activeBossMusic: BossDef | null = null;
  private activeBiome: BiomeId = 'castle';
  private playingMusic = false;
  private aiWavCache = new Map<string, string>();
  private inFlightTts = new Map<string, Promise<{ url: string | null; error: string | null }>>();
  private activeVoiceAudio: HTMLAudioElement | null = null;
  private activeVoiceSeq = 0;
  private lastTtsError: string | null = null;
  private rateLimitedUntil = 0;
  private noiseBuffer: AudioBuffer | null = null;

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(m: boolean): void {
    this.muted = m;
    if (m) {
      this.stopMusic();
      this.stopActiveAiVoice();
    }
  }

  private stopActiveAiVoice(): void {
    this.activeVoiceSeq += 1;
    if (this.activeVoiceAudio) {
      try {
        this.activeVoiceAudio.pause();
        this.activeVoiceAudio.currentTime = 0;
      } catch {
        // ignore
      }
      this.activeVoiceAudio = null;
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  private ensureCtx(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private async fetchJotaroTtsClip(
    cacheKey: string,
    ttsScript: string,
    stylePrompt: string,
    attackName: string,
  ): Promise<{ url: string | null; error: string | null }> {
    const fullKey = `jotaro:${cacheKey}`;
    const cachedUrl = this.aiWavCache.get(fullKey);
    if (cachedUrl) {
      return { url: cachedUrl, error: null };
    }

    const pending = this.inFlightTts.get(fullKey);
    if (pending) return pending;

    const req = (async () => {
      if (typeof fetch === 'undefined') {
        return { url: null, error: 'Fetch API unavailable.' };
      }
      try {
        const resp = await fetch('/api/voice/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            persona: 'jotaro',
            ttsScript,
            stylePrompt,
            attackName,
          }),
        });
        const data = (await resp.json().catch(() => ({}))) as {
          ok?: boolean;
          audioBase64?: string;
          mimeType?: string;
          error?: string;
        };
        if (!resp.ok || !data.audioBase64) {
          const msg = data.error || `Jotaro Gemini TTS failed (HTTP ${resp.status}).`;
          this.lastTtsError = msg;
          if (resp.status === 429) {
            this.rateLimitedUntil = Date.now() + 18000;
          }
          return { url: null, error: msg };
        }

        const byteChars = atob(data.audioBase64);
        const byteNums = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
          byteNums[i] = byteChars.charCodeAt(i);
        }
        const blob = new Blob([byteNums], { type: data.mimeType || 'audio/wav' });
        const url = URL.createObjectURL(blob);
        this.aiWavCache.set(fullKey, url);
        this.lastTtsError = null;
        return { url, error: null };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unable to reach Jotaro voice server.';
        this.lastTtsError = msg;
        return { url: null, error: msg };
      } finally {
        this.inFlightTts.delete(fullKey);
      }
    })();

    this.inFlightTts.set(fullKey, req);
    return req;
  }

  private playWavUrl(url: string): void {
    if (this.muted || typeof Audio === 'undefined') return;
    this.stopActiveAiVoice();
    const audio = new Audio(url);
    audio.volume = 0.95;
    this.activeVoiceAudio = audio;
    audio.play().catch(() => {});
  }

  public prefetchJotaroVoice(prompt: JotaroVoicePrompt): void {
    if (this.muted || this.lastTtsError?.includes('GEMINI_API_KEY')) return;
    void this.fetchJotaroTtsClip(
      prompt.cacheKey,
      prompt.ttsScript,
      prompt.voiceStyle,
      prompt.attackName,
    );
  }

  public announceJotaroBattleVoice(
    prompt: JotaroVoicePrompt,
    onStatus?: (status: 'generating' | 'ready' | 'error', error: string | null) => void,
  ): void {
    if (this.muted) return;
    const seq = ++this.activeVoiceSeq;
    const fullKey = `jotaro:${prompt.cacheKey}`;
    const immediateUrl = this.aiWavCache.get(fullKey);

    // Deep Stand bass impact sting under Jotaro's battle call
    const ctx = this.ensureCtx();
    if (ctx) {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(118, now);
      osc.frequency.exponentialRampToValueAtTime(72, now + 0.22);
      gain.gain.setValueAtTime(0.055, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    }

    if (immediateUrl) {
      this.playWavUrl(immediateUrl);
      onStatus?.('ready', null);
      return;
    }

    onStatus?.('generating', null);
    void this.fetchJotaroTtsClip(
      prompt.cacheKey,
      prompt.ttsScript,
      prompt.voiceStyle,
      prompt.attackName,
    ).then((res) => {
      if (this.muted) return;
      if (res.url) {
        if (seq === this.activeVoiceSeq) {
          this.playWavUrl(res.url);
        }
        onStatus?.('ready', null);
      } else {
        onStatus?.('error', res.error);
      }
    });
  }

  /**
   * Main game voice everywhere outside boss battles: Jotaro Kujo AI voice
   * delivered with genuine emotion via Gemini 3.8 Flash TTS.
   */
  public speakJotaroDialogue(prompt: JotaroVoicePrompt): void {
    if (this.muted) return;
    const seq = ++this.activeVoiceSeq;
    const fullKey = `jotaro:${prompt.cacheKey}`;
    const immediateUrl = this.aiWavCache.get(fullKey);

    if (immediateUrl) {
      this.playWavUrl(immediateUrl);
      return;
    }

    if (this.lastTtsError?.includes('GEMINI_API_KEY') || Date.now() < this.rateLimitedUntil) {
      return;
    }

    void this.fetchJotaroTtsClip(
      prompt.cacheKey,
      prompt.ttsScript,
      prompt.voiceStyle,
      prompt.attackName,
    ).then((res) => {
      if (this.muted || seq !== this.activeVoiceSeq) return;
      if (res.url) {
        this.playWavUrl(res.url);
      }
    });
  }

  public unlock(): void {
    this.ensureCtx();
  }

  /** Authentic Undertale-style text blip per character (used for subtle text cadence) */
  public playDialogueBlip(speakerKind: string, charCode: number): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    if (charCode <= 32) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    let baseHz = 220;
    let wave: OscillatorType = 'square';
    if (speakerKind === 'boss') {
      baseHz = 155 + (charCode % 5) * 12;
      wave = 'sawtooth';
    } else if (speakerKind === 'secret') {
      baseHz = 310 + (charCode % 4) * 14;
      wave = 'triangle';
    } else if (speakerKind === 'warrior') {
      baseHz = 190 + (charCode % 3) * 14;
      wave = 'square';
    } else {
      baseHz = 240 + (charCode % 4) * 12;
      wave = 'square';
    }

    osc.type = wave;
    osc.frequency.setValueAtTime(baseHz, now);
    gain.gain.setValueAtTime(0.032, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.042);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.045);
  }

  public playSwordSlash(weaponId: WeaponId, comboStep: number): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const startHz =
      weaponId === 'rapier'
        ? 680 + comboStep * 45
        : weaponId === 'katana'
          ? 820
          : weaponId === 'crescent'
            ? 560 + comboStep * 35
            : weaponId === 'runeblade'
              ? 240
              : 340;
    const endHz = weaponId === 'runeblade' ? 75 : 130;
    const dur = weaponId === 'rapier' ? 0.08 : weaponId === 'runeblade' ? 0.19 : 0.12;

    osc.type = weaponId === 'katana' ? 'triangle' : 'sawtooth';
    osc.frequency.setValueAtTime(startHz, now);
    osc.frequency.exponentialRampToValueAtTime(endHz, now + dur);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.01);
  }

  public playSlashClaw(heavy = false): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const count = heavy ? 3 : 2;
    for (let i = 0; i < count; i++) {
      const t = now + i * 0.085;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(720 - i * 90, t);
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.11);
      gain.gain.setValueAtTime(0.095, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.13);
    }
  }

  public playHit(heavy = false): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = heavy ? 'sawtooth' : 'square';
    osc.frequency.setValueAtTime(heavy ? 180 : 250, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + (heavy ? 0.14 : 0.08));
    gain.gain.setValueAtTime(heavy ? 0.14 : 0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (heavy ? 0.15 : 0.09));

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playJump(): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(460, now + 0.09);
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer && this.noiseBuffer.sampleRate === ctx.sampleRate) {
      return this.noiseBuffer;
    }
    const len = Math.floor(ctx.sampleRate * 0.08);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    // Soft pink-weighted crisp grassy texture (gentle envelope baked in)
    let b0 = 0;
    let b1 = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.72 * b0 + white * 0.28;
      b1 = 0.45 * b1 + (white - b0) * 0.55;
      const env = Math.sin((i / len) * Math.PI);
      data[i] = (b1 * 0.75 + white * 0.25) * env;
    }
    this.noiseBuffer = buf;
    return buf;
  }

  /**
   * Light, organic, grassy/mossy footstep rustle synced to ground walk stride.
   */
  public playFootstep(biome: BiomeId, stepNum: number): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const isAlt = stepNum % 2 === 0;

    // 1. Light wispy grass-blade & moss brush noise
    const src = ctx.createBufferSource();
    src.buffer = this.getNoiseBuffer(ctx);

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    const baseFreq = biome === 'forest' ? 2350 : biome === 'volcano' ? 1750 : 2080;
    bp.frequency.setValueAtTime(baseFreq + (isAlt ? 140 : -110), now);
    bp.Q.setValueAtTime(biome === 'forest' ? 1.85 : 1.45, now);

    const hiCut = ctx.createBiquadFilter();
    hiCut.type = 'lowpass';
    hiCut.frequency.setValueAtTime(3900, now);

    const brushGain = ctx.createGain();
    brushGain.gain.setValueAtTime(0.001, now);
    brushGain.gain.linearRampToValueAtTime(biome === 'forest' ? 0.055 : 0.044, now + 0.012);
    brushGain.gain.exponentialRampToValueAtTime(0.001, now + 0.068);

    src.connect(bp);
    bp.connect(hiCut);
    hiCut.connect(brushGain);
    brushGain.connect(ctx.destination);
    src.start(now);
    src.stop(now + 0.072);

    // 2. Feather-light soft sole tap underneath grass swish
    const thump = ctx.createOscillator();
    const thumpGain = ctx.createGain();
    thump.type = 'triangle';
    thump.frequency.setValueAtTime(isAlt ? 128 : 114, now);
    thump.frequency.exponentialRampToValueAtTime(56, now + 0.035);
    thumpGain.gain.setValueAtTime(0.022, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.038);
    thump.connect(thumpGain);
    thumpGain.connect(ctx.destination);
    thump.start(now);
    thump.stop(now + 0.04);
  }

  public playSkill(skillId: SkillId, withVoice = true, skillDisplayName?: string): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (skillId === 'chrono_freeze') {
      // Iconic Za Warudo Time Stop: high chime + deep sub bass time-warp + halting clock ticks
      const chime = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(1760, now);
      chime.frequency.exponentialRampToValueAtTime(880, now + 0.42);
      chimeGain.gain.setValueAtTime(0.08, now);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);
      chime.connect(chimeGain);
      chimeGain.connect(ctx.destination);
      chime.start(now);
      chime.stop(now + 0.46);

      const warpOsc = ctx.createOscillator();
      const subOsc = ctx.createOscillator();
      const warpGain = ctx.createGain();
      warpOsc.type = 'sawtooth';
      subOsc.type = 'sine';
      warpOsc.frequency.setValueAtTime(320, now);
      warpOsc.frequency.exponentialRampToValueAtTime(32, now + 0.62);
      subOsc.frequency.setValueAtTime(160, now);
      subOsc.frequency.exponentialRampToValueAtTime(28, now + 0.62);
      warpGain.gain.setValueAtTime(0.15, now);
      warpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.64);
      warpOsc.connect(warpGain);
      subOsc.connect(warpGain);
      warpGain.connect(ctx.destination);
      warpOsc.start(now);
      subOsc.start(now);
      warpOsc.stop(now + 0.65);
      subOsc.stop(now + 0.65);

      // Slowing clock-halt ticks
      [0.05, 0.16, 0.31].forEach((delay, idx) => {
        const tick = ctx.createOscillator();
        const tg = ctx.createGain();
        tick.type = 'square';
        tick.frequency.setValueAtTime(1320 - idx * 210, now + delay);
        tg.gain.setValueAtTime(0.055, now + delay);
        tg.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.035);
        tick.connect(tg);
        tg.connect(ctx.destination);
        tick.start(now + delay);
        tick.stop(now + delay + 0.04);
      });
    } else if (skillId === 'stand_rush') {
      // Iconic ORA ORA ORA rapid 7-punch Stand barrage + uppercut finisher
      const offsets = [0, 0.055, 0.11, 0.165, 0.22, 0.28, 0.35];
      offsets.forEach((delay, idx) => {
        const isFinal = idx === offsets.length - 1;
        const t = now + delay;
        // Heavy punch thump
        const thump = ctx.createOscillator();
        const thumpGain = ctx.createGain();
        thump.type = isFinal ? 'sawtooth' : 'triangle';
        thump.frequency.setValueAtTime(isFinal ? 250 : 165 + (idx % 3) * 22, t);
        thump.frequency.exponentialRampToValueAtTime(isFinal ? 38 : 48, t + (isFinal ? 0.18 : 0.075));
        thumpGain.gain.setValueAtTime(isFinal ? 0.15 : 0.095, t);
        thumpGain.gain.exponentialRampToValueAtTime(0.001, t + (isFinal ? 0.2 : 0.08));
        thump.connect(thumpGain);
        thumpGain.connect(ctx.destination);
        thump.start(t);
        thump.stop(t + (isFinal ? 0.21 : 0.085));

        // Crisp punch impact snap
        const snap = ctx.createBufferSource();
        snap.buffer = this.getNoiseBuffer(ctx);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(isFinal ? 1600 : 1050 + idx * 70, t);
        bp.Q.setValueAtTime(1.2, t);
        const sg = ctx.createGain();
        sg.gain.setValueAtTime(isFinal ? 0.12 : 0.07, t);
        sg.gain.exponentialRampToValueAtTime(0.001, t + 0.055);
        snap.connect(bp);
        bp.connect(sg);
        sg.connect(ctx.destination);
        snap.start(t);
        snap.stop(t + 0.06);
      });
    } else if (skillId === 'parry_guard') {
      // Silver Chariot metallic sword deflect ring + steel spark flash
      [987.77, 1479.98, 2217.46].forEach((hz, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(hz, now);
        gain.gain.setValueAtTime(idx === 0 ? 0.11 : 0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.38);
      });
      const spark = ctx.createBufferSource();
      spark.buffer = this.getNoiseBuffer(ctx);
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(3000, now);
      const sg = ctx.createGain();
      sg.gain.setValueAtTime(0.11, now);
      sg.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      spark.connect(hp);
      hp.connect(sg);
      sg.connect(ctx.destination);
      spark.start(now);
      spark.stop(now + 0.075);
    } else if (skillId === 'candlefire_wave') {
      // Magician's Red Crossfire Flame Whoosh + Ignition boom
      const whoosh = ctx.createBufferSource();
      whoosh.buffer = this.getNoiseBuffer(ctx);
      whoosh.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(260, now);
      bp.frequency.exponentialRampToValueAtTime(1450, now + 0.14);
      bp.frequency.exponentialRampToValueAtTime(320, now + 0.36);
      bp.Q.setValueAtTime(1.1, now);
      const wg = ctx.createGain();
      wg.gain.setValueAtTime(0.001, now);
      wg.gain.linearRampToValueAtTime(0.14, now + 0.08);
      wg.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      whoosh.connect(bp);
      bp.connect(wg);
      wg.connect(ctx.destination);
      whoosh.start(now);
      whoosh.stop(now + 0.39);

      const ignite = ctx.createOscillator();
      const ig = ctx.createGain();
      ignite.type = 'sawtooth';
      ignite.frequency.setValueAtTime(150, now);
      ignite.frequency.exponentialRampToValueAtTime(52, now + 0.25);
      ig.gain.setValueAtTime(0.1, now);
      ig.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
      ignite.connect(ig);
      ig.connect(ctx.destination);
      ignite.start(now);
      ignite.stop(now + 0.27);
    } else if (skillId === 'blade_dash') {
      // Star Finger / Mach Sonic Dash Whip
      const whip = ctx.createOscillator();
      const wg = ctx.createGain();
      whip.type = 'sawtooth';
      whip.frequency.setValueAtTime(1480, now);
      whip.frequency.exponentialRampToValueAtTime(310, now + 0.11);
      whip.frequency.exponentialRampToValueAtTime(860, now + 0.2);
      wg.gain.setValueAtTime(0.1, now);
      wg.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      whip.connect(wg);
      wg.connect(ctx.destination);
      whip.start(now);
      whip.stop(now + 0.23);

      const wind = ctx.createBufferSource();
      wind.buffer = this.getNoiseBuffer(ctx);
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(1800, now);
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.09, now);
      ng.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      wind.connect(hp);
      hp.connect(ng);
      ng.connect(ctx.destination);
      wind.start(now);
      wind.stop(now + 0.17);
    } else {
      // sunburst_cleave: Hamon Sunlight Yellow Overdrive Golden Ripple + Impact Slam
      [330, 440, 554.37, 659.25, 880].forEach((hz, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
        const t = now + idx * 0.028;
        osc.frequency.setValueAtTime(hz, t);
        osc.frequency.exponentialRampToValueAtTime(hz * 1.18, t + 0.24);
        gain.gain.setValueAtTime(0.055, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.29);
      });
      const slam = ctx.createOscillator();
      const sg = ctx.createGain();
      slam.type = 'sine';
      slam.frequency.setValueAtTime(190, now + 0.08);
      slam.frequency.exponentialRampToValueAtTime(42, now + 0.36);
      sg.gain.setValueAtTime(0.14, now + 0.08);
      sg.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      slam.connect(sg);
      sg.connect(ctx.destination);
      slam.start(now + 0.08);
      slam.stop(now + 0.4);
    }

    if (withVoice && skillDisplayName) {
      this.speakJotaroDialogue(
        buildJotaroAttackAnnouncement({
          kind: 'player_skill',
          skillId,
          attackName: skillDisplayName,
        }),
      );
    }
  }

  public playSecretFound(): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const arpeggio = [523.25, 659.25, 783.99, 1046.5];
    arpeggio.forEach((hz, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + i * 0.07;
      osc.frequency.setValueAtTime(hz, t);
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  public playBattleEncounterStinger(): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const sweep = [220, 311.13, 440, 622.25, 880];
    sweep.forEach((hz, idx) => {
      const t = now + idx * 0.055;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(hz, t);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.17);
    });
  }

  /**
   * Jotaro Kujo AI voice line for short battle / attack callouts.
   */
  public playAnimeVoiceline(
    text: string,
    _seed = 1,
    mode: 'intro' | 'attack' | 'defeat' = 'intro',
  ): void {
    const kind = mode === 'attack' ? 'system' : 'warrior';
    this.speakJotaroDialogue(buildJotaroDialoguePrompt(text, kind));
  }

  public playBossVoiceCue(boss: BossDef, mode: 'intro' | 'attack' | 'defeat' = 'intro'): void {
    const prompt = buildJotaroAttackAnnouncement({
      kind: mode === 'defeat' ? 'boss_defeat' : mode === 'attack' ? 'boss_attack' : 'boss_intro',
      attackName: boss.attackName,
      bossName: boss.name,
      standName: boss.standName,
    });
    this.speakJotaroDialogue(prompt);
  }

  public startMusic(biome: BiomeId, boss: BossDef | null): void {
    if (this.muted) return;
    const sameTrack =
      this.playingMusic &&
      this.activeBiome === biome &&
      this.activeBossMusic?.index === boss?.index;
    if (sameTrack) return;

    this.stopMusic();
    this.activeBiome = biome;
    this.activeBossMusic = boss;
    this.playingMusic = true;
    this.stepIndex = 0;

    const bpm = boss ? boss.music.bpm : biome === 'castle' ? 92 : biome === 'forest' ? 84 : 112;
    const stepMs = Math.round((60 / bpm / 2) * 1000);

    this.musicTimer = window.setInterval(() => {
      this.tickMusicStep();
    }, stepMs);
  }

  private tickMusicStep(): void {
    if (!this.playingMusic || this.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const step = this.stepIndex++;

    if (this.activeBossMusic) {
      const m = this.activeBossMusic.music;
      const bassDegree = m.bassPattern[step % m.bassPattern.length];
      const bassSemitone = m.scale[bassDegree % m.scale.length];
      const bassHz = m.rootHz * Math.pow(2, bassSemitone / 12);

      // Driving boss bass
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassHz, now);
      bassGain.gain.setValueAtTime(0.036, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      bassOsc.connect(bassGain);
      bassGain.connect(ctx.destination);
      bassOsc.start(now);
      bassOsc.stop(now + 0.14);

      // Unique per-boss lead motif seeded by boss motifSeed
      const playLead = ((m.motifSeed + step * 3) % 5) !== 0;
      if (playLead) {
        const deg = (m.motifSeed + step * (1 + (this.activeBossMusic.index % 3))) % m.scale.length;
        const leadSemitone = m.scale[deg];
        const leadHz = m.rootHz * 2 * Math.pow(2, leadSemitone / 12);

        const leadOsc = ctx.createOscillator();
        const leadGain = ctx.createGain();
        leadOsc.type = m.leadWave;
        leadOsc.frequency.setValueAtTime(leadHz, now);
        leadGain.gain.setValueAtTime(0.024, now);
        leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        leadOsc.connect(leadGain);
        leadGain.connect(ctx.destination);
        leadOsc.start(now);
        leadOsc.stop(now + 0.17);
      }
    } else {
      // Ambient Biome Exploration Music
      const scale =
        this.activeBiome === 'castle'
          ? [0, 2, 3, 7, 8, 11]
          : this.activeBiome === 'forest'
            ? [0, 3, 5, 7, 10]
            : [0, 1, 5, 7, 8];
      const root =
        this.activeBiome === 'castle' ? 146.83 : this.activeBiome === 'forest' ? 174.61 : 110;

      if (step % 2 === 0) {
        const deg = (step / 2 + (step % 8 === 0 ? 0 : 2)) % scale.length;
        const hz = root * Math.pow(2, scale[deg] / 12);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = this.activeBiome === 'volcano' ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(hz, now);
        gain.gain.setValueAtTime(0.022, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    }
  }

  public stopMusic(): void {
    this.playingMusic = false;
    if (this.musicTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const gameAudio = new GameAudioEngine();
