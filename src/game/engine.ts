import { gameAudio } from './audio';
import {
  buildJotaroAttackAnnouncement,
  buildJotaroDialoguePrompt,
  type JotaroVoicePrompt,
} from './jotaroVoice';
import {
  SKILLS,
  TOTAL_BOSSES,
  TOTAL_HIDDEN_PASSAGES,
  WEAPONS,
  getBiomeDisplayName,
} from './data';
import {
  PIXEL_H,
  PIXEL_W,
  drawBiomeBackdrop,
  drawCandles,
  drawEnemy,
  drawInteractables,
  drawJoJoBoss,
  drawPeer,
  drawPlatforms,
  drawPokemonBossStage,
  drawProjectiles,
  drawWarrior,
} from './pixelSprites';
import {
  BossBattleState,
  createBossBattleState,
  resolveBattlePotion,
  resolvePlayerBattleSkill,
  resolvePlayerBattleSword,
  startBattleEscape,
  startBattleRun,
  toBossBattleSnapshot,
  triggerBossCounterTurn,
} from './battle';
import {
  addInventoryResource,
  allocateStatPoint,
  applyDamageToBoss,
  applyDamageToEnemy,
  assignSkillToSlot,
  calculateAttackDamage,
  clampSecretsCount,
  computeWeaponHitbox,
  craftWeapon,
  createInitialInventory,
  createInitialPlayer,
  equipWeapon,
  grantKillStatPoints,
  rectsOverlap,
  startWeaponAttack,
  stepPlayerPhysics,
  triggerSkillSlot,
  useInventoryItem,
} from './rules';
import type {
  ActiveBoss,
  BiomeId,
  DialogueState,
  EnemyState,
  GameStatus,
  HudSnapshot,
  InteractableProp,
  InventoryItem,
  MultiplayerPeer,
  PlayerState,
  Projectile,
  SkillId,
  StatKey,
  WeaponId,
} from './types';
import {
  CHUNK_WIDTH,
  FLOOR_Y,
  GeneratedChunk,
  generateChunk,
  getBiomeCheckpointList,
  getBiomeForChunk,
} from './worldGen';

interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface FloatingNum {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
}

export class BasteraGameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private onHudUpdate: (snapshot: HudSnapshot) => void;

  private rafId: number | null = null;
  private lastTime = 0;
  private simTime = 0;
  private hitstopTimer = 0;
  private trauma = 0;

  private status: GameStatus = 'title';
  private player: PlayerState = createInitialPlayer();
  private inventory: InventoryItem[] = createInitialInventory();

  private chunks = new Map<number, GeneratedChunk>();
  private defeatedBosses = new Set<number>();
  private discoveredSecrets = new Set<string>();
  private openedChests = new Set<string>();

  private projectiles: Projectile[] = [];
  private dialogue: DialogueState | null = null;
  private announcement: string | null = null;
  private announcementTimer = 0;

  private camX = 0;
  private titlePanX = 0;

  // Input state
  private heldKeys = new Set<string>();
  private justPressed = new Set<string>();
  private virtualInput = {
    left: false,
    right: false,
    jumpHeld: false,
  };

  // Zero-GC particle & floating text pools
  private particles: Particle[] = Array.from({ length: 220 }, () => ({
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    maxLife: 1,
    size: 2,
    color: '#fbbf24',
  }));
  private particleCursor = 0;

  private floatingNums: FloatingNum[] = Array.from({ length: 36 }, () => ({
    active: false,
    x: 0,
    y: 0,
    vy: 0,
    text: '',
    color: '#ffffff',
    life: 0,
  }));
  private floatCursor = 0;

  private ambientMotes = Array.from({ length: 64 }, (_, i) => ({
    x: (i * 53) % PIXEL_W,
    y: (i * 37) % FLOOR_Y,
    vy: -(6 + (i % 5) * 3),
    phase: i * 0.7,
    size: i % 4 === 0 ? 2 : 1,
  }));

  private afterimages = Array.from({ length: 12 }, () => ({
    active: false,
    x: 0,
    y: 0,
    facing: 1 as 1 | -1,
    life: 0,
    color: '#fbbf24',
  }));
  private afterimageCursor = 0;
  private speedLineTimer = 0;

  // Multiplayer WebSocket
  private ws: WebSocket | null = null;
  private selfPeerId: string | null = null;
  private peers = new Map<string, MultiplayerPeer>();
  private onlineCount = 1;
  private netSyncTimer = 0;
  private playerName = 'BasteraKnight';

  private hudEmitTimer = 0;
  private lastHudSignature = '';
  private lastBossVoiceTriggered = -1;
  private modalPaused = false;
  private vignetteCanvas: HTMLCanvasElement | null = null;
  private bossBattle: BossBattleState | null = null;
  private bossEncounterCooldown = 0;
  private encounterFlashTimer = 0;
  private lastJotaroPrompt: JotaroVoicePrompt | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    onHudUpdate: (snapshot: HudSnapshot) => void,
    initialStatus: GameStatus = 'title',
  ) {
    this.canvas = canvas;
    this.canvas.width = PIXEL_W;
    this.canvas.height = PIXEL_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context unavailable');
    ctx.imageSmoothingEnabled = false;
    this.ctx = ctx;
    this.onHudUpdate = onHudUpdate;

    this.ensureChunksAround(0);
    this.setStatus(initialStatus);
    this.attachInputListeners();
    this.connectMultiplayer();
    this.emitHud(true);
  }

  public setModalPaused(paused: boolean): void {
    this.modalPaused = paused;
    if (paused) this.heldKeys.clear();
  }

  public startLoop(): void {
    if (this.rafId !== null) return;
    this.lastTime = performance.now();
    const tick = (now: number) => {
      const rawDt = (now - this.lastTime) / 1000;
      this.lastTime = now;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);
      if (!this.modalPaused && (this.status === 'playing' || this.status === 'title')) {
        this.update(dt);
        this.render();
      }
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  public destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    gameAudio.stopMusic();
    this.detachInputListeners();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public setStatus(next: GameStatus): void {
    this.status = next;
    const bodyState =
      next === 'victory' ? 'gameover' : next;
    document.body.dataset.state = bodyState;
    if (next === 'paused' || next === 'gameover' || next === 'victory' || next === 'title') {
      gameAudio.stopMusic();
      this.heldKeys.clear();
    } else if (next === 'playing') {
      gameAudio.unlock();
      this.heldKeys.clear();
      const activeBoss = this.getActiveNearbyBoss();
      gameAudio.startMusic(this.getCurrentBiome(), activeBoss?.def ?? null);
    }
    this.emitHud(true);
  }

  public startNewGame(): void {
    this.player = createInitialPlayer();
    this.inventory = createInitialInventory();
    this.chunks.clear();
    this.defeatedBosses.clear();
    this.discoveredSecrets.clear();
    this.openedChests.clear();
    this.projectiles = [];
    this.bossBattle = null;
    this.bossEncounterCooldown = 0;
    this.encounterFlashTimer = 0;
    this.lastBossVoiceTriggered = -1;
    this.ensureChunksAround(0);
    this.camX = 0;

    this.setStatus('playing');
    this.openDialogue(
      'Warrior',
      'warrior',
      '#fbbf24',
      [
        'Well, the royal dungeon locked the front door again. Time to fight 120 dramatic villains on an empty stomach.',
        'Inspect thrones [F], smash cracked bricks [J], and try not to bleed on the nice red carpet.',
      ],
    );
  }

  public restartFromCheckpoint(): void {
    this.bossBattle = null;
    this.bossEncounterCooldown = 1.5;
    this.player.hp = this.player.maxHp;
    this.player.stamina = this.player.maxStamina;
    this.player.x = this.player.highestCheckpointX;
    this.player.y = FLOOR_Y - this.player.h - 4;
    this.player.vx = 0;
    this.player.vy = 0;
    this.projectiles = [];
    this.ensureChunksAround(this.player.x);
    this.setStatus('playing');
  }

  public warpToCheckpoint(cpIndex: number): void {
    const cps = getBiomeCheckpointList(this.player.highestCheckpointIndex);
    const target = cps[cpIndex];
    if (!target || !target.reached) return;
    this.bossBattle = null;
    this.bossEncounterCooldown = 1.5;
    this.player.x = target.x;
    this.player.y = FLOOR_Y - this.player.h - 4;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.hp = this.player.maxHp;
    this.projectiles = [];
    this.ensureChunksAround(this.player.x);
    this.camX = Math.max(0, this.player.x - PIXEL_W * 0.32);
    this.setStatus('playing');
    this.emitHud();
  }

  public setPlayerName(name: string): void {
    const clean = name.trim().slice(0, 18);
    if (clean) this.playerName = clean;
  }

  public triggerVirtualKey(action: 'left' | 'right' | 'jump' | 'attack' | 'interact' | 'skill0' | 'skill1' | 'skill2', pressed: boolean): void {
    if (action === 'left') this.virtualInput.left = pressed;
    else if (action === 'right') this.virtualInput.right = pressed;
    else if (action === 'jump') {
      if (pressed && !this.virtualInput.jumpHeld) this.justPressed.add('Space');
      this.virtualInput.jumpHeld = pressed;
    } else if (pressed) {
      if (action === 'attack') this.justPressed.add('KeyJ');
      if (action === 'interact') this.justPressed.add('KeyF');
      if (action === 'skill0') this.justPressed.add('Digit1');
      if (action === 'skill1') this.justPressed.add('Digit2');
      if (action === 'skill2') this.justPressed.add('Digit3');
    }
  }

  public equipWeaponById(weaponId: WeaponId): void {
    if (equipWeapon(this.player, weaponId)) {
      const w = WEAPONS[weaponId];
      this.showAnnouncement(`Equipped ${w.name} (${w.styleName})`);
      this.emitHud();
    }
  }

  public craftOrEquipWeapon(weaponId: WeaponId): { ok: boolean; reason?: string } {
    const res = craftWeapon(this.player, this.inventory, weaponId);
    if (res.ok) {
      this.showAnnouncement(`Forged & equipped ${WEAPONS[weaponId].name}!`);
    }
    this.emitHud();
    return res;
  }

  public swapSkillSlot(slotIndex: 0 | 1 | 2, skillId: SkillId): void {
    assignSkillToSlot(this.player, slotIndex, skillId);
    this.showAnnouncement(`Slot ${slotIndex + 1} -> ${SKILLS[skillId].name}`);
    this.emitHud();
  }

  public useItem(itemId: string): { ok: boolean; message: string } {
    const res = useInventoryItem(this.player, this.inventory, itemId);
    if (res.ok) {
      gameAudio.playSecretFound();
    }
    this.showAnnouncement(res.message);
    this.emitHud();
    return res;
  }

  public allocatePlayerStat(statKey: StatKey, amount = 1): boolean {
    const res = allocateStatPoint(this.player, statKey, amount);
    if (!res.ok) return false;
    gameAudio.playSecretFound();
    const labelMap: Record<StatKey, string> = {
      attack: 'ATK (STR)',
      skillDmg: 'SKILL DMG (INT)',
      hp: 'MAX HP (VIT)',
      speed: 'SPEED (AGI)',
    };
    this.showAnnouncement(`[SYSTEM] ${labelMap[statKey]} +${res.applied}!`);
    this.emitHud(true);
    return true;
  }

  public triggerSkillButton(slotIndex: 0 | 1 | 2): void {
    if (this.status !== 'playing') return;
    if (this.bossBattle) {
      this.battleUseSkill(slotIndex);
      return;
    }
    this.executeSkill(slotIndex);
  }

  private triggerBattleJotaroVoice(prompt: JotaroVoicePrompt): void {
    if (!this.bossBattle) return;
    this.lastJotaroPrompt = prompt;
    this.bossBattle.jotaroLine = prompt.captionLine;
    this.bossBattle.jotaroVoiceError = null;
    gameAudio.announceJotaroBattleVoice(prompt, (status, err) => {
      if (!this.bossBattle) return;
      this.bossBattle.jotaroVoiceStatus = status;
      this.bossBattle.jotaroVoiceError = err;
      this.emitHud(true);
    });
  }

  public battleAttackWeapon(): void {
    if (!this.bossBattle || this.status !== 'playing') return;
    const res = resolvePlayerBattleSword(this.bossBattle, this.player);
    if (res.ok) {
      const weapon = WEAPONS[this.player.equippedWeapon];
      gameAudio.playSwordSlash(this.player.equippedWeapon, 1);
      gameAudio.playHit(false);
      this.triggerBattleJotaroVoice(
        buildJotaroAttackAnnouncement({
          kind: 'player_weapon',
          attackName: weapon.name,
          weaponId: weapon.id,
          weaponStyle: weapon.styleName,
          bossName: this.bossBattle.boss.def.name,
          standName: this.bossBattle.boss.def.standName,
        }),
      );
      this.trauma = Math.min(1, this.trauma + 0.35);
      this.emitHud(true);
    }
  }

  public battleUseSkill(slotIndex: 0 | 1 | 2): void {
    if (!this.bossBattle || this.status !== 'playing') return;
    const res = resolvePlayerBattleSkill(this.bossBattle, this.player, slotIndex);
    if (res.ok) {
      const skill = SKILLS[res.skillId];
      gameAudio.playSkill(res.skillId, false);
      gameAudio.playSlashClaw(true);
      this.triggerBattleJotaroVoice(
        buildJotaroAttackAnnouncement({
          kind: 'player_skill',
          attackName: skill.name,
          skillId: res.skillId,
          bossName: this.bossBattle.boss.def.name,
          standName: this.bossBattle.boss.def.standName,
        }),
      );
      this.trauma = Math.min(1, this.trauma + 0.45);
      this.emitHud(true);
    } else if (res.reason) {
      this.showAnnouncement(res.reason);
    }
  }

  public battleUsePotion(itemId: string): void {
    if (!this.bossBattle || this.status !== 'playing') return;
    const res = resolveBattlePotion(this.bossBattle, this.player, this.inventory, itemId);
    if (res.ok) {
      gameAudio.playSecretFound();
    } else {
      this.showAnnouncement(res.message);
    }
    this.emitHud(true);
  }

  public battleRun(): void {
    if (!this.bossBattle || this.status !== 'playing') return;
    if (startBattleRun(this.bossBattle)) {
      gameAudio.playJump();
      this.triggerBattleJotaroVoice(
        buildJotaroAttackAnnouncement({
          kind: 'retreat',
          attackName: 'Nigerundayo',
          bossName: this.bossBattle.boss.def.name,
          standName: this.bossBattle.boss.def.standName,
        }),
      );
      this.emitHud(true);
    }
  }

  public battleEscape(): void {
    if (!this.bossBattle || this.status !== 'playing') return;
    if (startBattleEscape(this.bossBattle)) {
      gameAudio.playSecretFound();
      this.emitHud(true);
    }
  }

  public battleReplayVoice(): void {
    if (!this.bossBattle) return;
    gameAudio.unlock();
    const prompt =
      this.lastJotaroPrompt ??
      buildJotaroAttackAnnouncement({
        kind: 'boss_intro',
        attackName: this.bossBattle.boss.def.attackName,
        bossName: this.bossBattle.boss.def.name,
        standName: this.bossBattle.boss.def.standName,
      });
    this.triggerBattleJotaroVoice(prompt);
  }

  public advanceDialogue(): void {
    if (!this.dialogue) return;
    const currentLine = this.dialogue.lines[this.dialogue.lineIndex] || '';
    if (this.dialogue.charIndex < currentLine.length) {
      this.dialogue.charIndex = currentLine.length;
    } else if (this.dialogue.lineIndex < this.dialogue.lines.length - 1) {
      this.dialogue.lineIndex += 1;
      this.dialogue.charIndex = 0;
      this.dialogue.charTimer = 0;
      const nextLine = this.dialogue.lines[this.dialogue.lineIndex];
      if (nextLine) {
        gameAudio.speakJotaroDialogue(
          buildJotaroDialoguePrompt(nextLine, this.dialogue.portraitKind),
        );
      }
    } else {
      this.dialogue = null;
    }
    this.emitHud();
  }

  public toggleMute(): void {
    const muted = gameAudio.toggleMute();
    if (!muted && this.status === 'playing') {
      const boss = this.getActiveNearbyBoss();
      gameAudio.startMusic(this.getCurrentBiome(), boss?.def ?? null);
    }
    this.emitHud();
  }

  private openDialogue(
    speaker: string,
    portraitKind: DialogueState['portraitKind'],
    portraitColor: string,
    lines: string[],
  ): void {
    this.dialogue = {
      speaker,
      portraitKind,
      portraitColor,
      lines,
      lineIndex: 0,
      charIndex: 0,
      charTimer: 0,
      active: true,
    };
    if (lines[0]) {
      gameAudio.speakJotaroDialogue(buildJotaroDialoguePrompt(lines[0], portraitKind));
    }
    this.emitHud();
  }

  private showAnnouncement(text: string): void {
    this.announcement = text;
    this.announcementTimer = 2.8;
    this.emitHud();
  }

  private getCurrentChunkIndex(): number {
    return Math.max(0, Math.floor(this.player.x / CHUNK_WIDTH));
  }

  private getCurrentBiome(): BiomeId {
    return getBiomeForChunk(this.getCurrentChunkIndex());
  }

  private ensureChunksAround(worldX: number): void {
    const center = Math.max(0, Math.floor(worldX / CHUNK_WIDTH));
    const minC = Math.max(0, center - 2);
    const maxC = center + 3;
    for (let c = minC; c <= maxC; c++) {
      if (!this.chunks.has(c)) {
        const chunk = generateChunk(c);
        if (chunk.boss && this.defeatedBosses.has(chunk.boss.def.index)) {
          chunk.boss.defeated = true;
          chunk.boss.hp = 0;
          chunk.boss.state = 'ko';
        }
        if (chunk.hiddenPassage && this.discoveredSecrets.has(chunk.hiddenPassage.id)) {
          chunk.hiddenPassage.discovered = true;
        }
        for (const prop of chunk.interactables) {
          if (prop.kind === 'chest' && this.openedChests.has(prop.id)) {
            prop.activated = true;
          }
        }
        this.chunks.set(c, chunk);
      }
    }
    for (const key of this.chunks.keys()) {
      if (key < minC - 1 || key > maxC + 1) {
        this.chunks.delete(key);
      }
    }
  }

  private getActiveChunks(): GeneratedChunk[] {
    return Array.from(this.chunks.values());
  }

  private getActiveNearbyBoss(): ActiveBoss | null {
    for (const ch of this.chunks.values()) {
      if (ch.boss && !ch.boss.defeated) {
        if (Math.abs(this.player.x - ch.boss.x) < 280) {
          return ch.boss;
        }
      }
    }
    return null;
  }

  private update(dt: number): void {
    this.simTime += dt;

    if (this.announcementTimer > 0) {
      this.announcementTimer = Math.max(0, this.announcementTimer - dt);
      if (this.announcementTimer === 0) {
        this.announcement = null;
        this.emitHud();
      }
    }

    if (this.status === 'title') {
      this.titlePanX = (this.titlePanX + dt * 22) % 640;
      this.camX = this.titlePanX;
      this.updateAmbientMotes(dt);
      this.justPressed.clear();
      return;
    }

    if (this.status !== 'playing' || this.modalPaused) {
      this.justPressed.clear();
      return;
    }

    this.speedLineTimer = Math.max(0, this.speedLineTimer - dt);
    this.bossEncounterCooldown = Math.max(0, this.bossEncounterCooldown - dt);
    this.encounterFlashTimer = Math.max(0, this.encounterFlashTimer - dt);
    this.updateAmbientMotes(dt);

    // Trauma shake decay in real dt
    this.trauma = Math.max(0, this.trauma - dt * 2.4);

    // Pokemon-style Boss Battle Mode overrides exploration when engaged
    if (this.bossBattle) {
      this.stepBossBattle(dt);
      this.justPressed.clear();
      return;
    }

    // Dialogue typewriter progression (no letter blips for JJBA boss voicelines—full voice plays!)
    if (this.dialogue) {
      const line = this.dialogue.lines[this.dialogue.lineIndex] || '';
      if (this.dialogue.charIndex < line.length) {
        this.dialogue.charTimer += dt;
        while (this.dialogue.charTimer >= 0.022 && this.dialogue.charIndex < line.length) {
          this.dialogue.charTimer -= 0.022;
          const ch = line.charCodeAt(this.dialogue.charIndex);
          this.dialogue.charIndex += 1;
          if (this.dialogue.charIndex % 2 === 1 && this.dialogue.portraitKind !== 'boss') {
            gameAudio.playDialogueBlip(this.dialogue.portraitKind, ch);
          }
          this.emitHud();
        }
      }
    }

    // Sim-level hitstop freeze
    if (this.hitstopTimer > 0) {
      this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
      this.updateParticles(dt);
      this.justPressed.clear();
      return;
    }

    // Handle quick actions from keyboard
    if (this.justPressed.has('KeyF') || this.justPressed.has('KeyE')) {
      if (this.dialogue) {
        this.advanceDialogue();
      } else {
        this.tryInteract();
      }
    }
    if (this.justPressed.has('KeyJ') || this.justPressed.has('KeyZ')) {
      if (startWeaponAttack(this.player)) {
        gameAudio.playSwordSlash(this.player.equippedWeapon, this.player.comboStep);
      }
    }
    if (this.justPressed.has('Digit1') || this.justPressed.has('KeyQ')) {
      this.executeSkill(0);
    }
    if (this.justPressed.has('Digit2')) {
      this.executeSkill(1);
    }
    if (this.justPressed.has('Digit3') || this.justPressed.has('KeyR')) {
      this.executeSkill(2);
    }
    if (this.justPressed.has('KeyH')) {
      this.useItem('crimson_vial');
    }

    const left =
      this.heldKeys.has('ArrowLeft') || this.heldKeys.has('KeyA') || this.virtualInput.left;
    const right =
      this.heldKeys.has('ArrowRight') || this.heldKeys.has('KeyD') || this.virtualInput.right;
    const jumpHeld =
      this.heldKeys.has('Space') ||
      this.heldKeys.has('ArrowUp') ||
      this.heldKeys.has('KeyW') ||
      this.virtualInput.jumpHeld;
    const jumpJustPressed =
      this.justPressed.has('Space') ||
      this.justPressed.has('ArrowUp') ||
      this.justPressed.has('KeyW');

    const activeChunks = this.getActiveChunks();
    const allPlatforms = activeChunks.flatMap((c) => c.platforms);

    const prevWalkCycle = this.player.walkCycle;
    const phys = stepPlayerPhysics(
      this.player,
      { left, right, jumpJustPressed, jumpHeld },
      allPlatforms,
      dt,
    );
    if (
      this.player.onGround &&
      Math.abs(this.player.vx) > 14 &&
      Math.floor(prevWalkCycle / Math.PI) !== Math.floor(this.player.walkCycle / Math.PI)
    ) {
      const stepNum = Math.floor(this.player.walkCycle / Math.PI);
      gameAudio.playFootstep(this.getCurrentBiome(), stepNum);
      this.spawnBurst(this.player.x + 8, this.player.y + this.player.h, 2, '#a3e635');
    }
    if (phys.jumped) {
      gameAudio.playJump();
      this.spawnBurst(this.player.x + 8, this.player.y + this.player.h, 5, '#d97706');
    }
    if (phys.landed) {
      gameAudio.playFootstep(this.getCurrentBiome(), 0);
      this.spawnBurst(this.player.x + 8, this.player.y + this.player.h, 4, '#94a3b8');
    }

    // Update sword attack phases
    this.stepAttackPhase(dt, activeChunks);

    // Check automatic triggers (floor pressure plates & checkpoints)
    this.checkPassiveTriggers(activeChunks);

    // Stream chunks & update camera smoothly
    this.ensureChunksAround(this.player.x);
    const targetCamX = Math.max(0, this.player.x - PIXEL_W * 0.34);
    this.camX += (targetCamX - this.camX) * Math.min(1, 9 * dt);

    // Update enemies & boss AI
    const frozen = this.player.chronoFreezeTimer > 0;
    this.stepEnemies(activeChunks, dt, frozen);
    this.stepBosses(activeChunks, dt, frozen);
    this.stepProjectiles(activeChunks, dt, frozen);
    this.updateParticles(dt);

    // Trigger Pokemon-style Boss Encounter when approaching an undefeated JoJo boss!
    const nearbyBoss = this.getActiveNearbyBoss();
    if (
      nearbyBoss &&
      !nearbyBoss.defeated &&
      this.bossEncounterCooldown <= 0 &&
      Math.abs(this.player.x - nearbyBoss.x) < 165
    ) {
      this.enterBossBattle(nearbyBoss);
      this.justPressed.clear();
      return;
    }

    gameAudio.startMusic(this.getCurrentBiome(), nearbyBoss?.def ?? null);
    if (nearbyBoss && this.lastBossVoiceTriggered !== nearbyBoss.def.index) {
      this.lastBossVoiceTriggered = nearbyBoss.def.index;
      this.speedLineTimer = 0.55;
      gameAudio.playBossVoiceCue(nearbyBoss.def, 'intro');
    }

    // Network multiplayer sync at ~12 Hz
    this.netSyncTimer += dt;
    if (this.netSyncTimer >= 0.085) {
      this.netSyncTimer = 0;
      this.sendMultiplayerState();
    }

    // Throttled HUD updates
    this.hudEmitTimer += dt;
    if (this.hudEmitTimer >= 0.1) {
      this.hudEmitTimer = 0;
      this.emitHud();
    }

    this.justPressed.clear();
  }

  private enterBossBattle(boss: ActiveBoss): void {
    this.dialogue = null;
    this.projectiles = [];
    this.heldKeys.clear();
    this.player.vx = 0;
    this.encounterFlashTimer = 0.35;
    this.speedLineTimer = 0.65;
    this.bossBattle = createBossBattleState(boss);
    this.lastBossVoiceTriggered = boss.def.index;
    gameAudio.playBattleEncounterStinger();
    gameAudio.startMusic(this.getCurrentBiome(), boss.def);

    const introPrompt = buildJotaroAttackAnnouncement({
      kind: 'boss_intro',
      attackName: boss.def.attackName,
      bossName: boss.def.name,
      standName: boss.def.standName,
    });
    this.triggerBattleJotaroVoice(introPrompt);

    this.emitHud(true);
  }

  private stepBossBattle(dt: number): void {
    const b = this.bossBattle;
    if (!b) return;

    b.phaseTimer = Math.max(0, b.phaseTimer - dt);
    const prog =
      b.phaseDuration > 0 ? Math.min(1, 1 - b.phaseTimer / b.phaseDuration) : 1;
    if (b.slashFx) {
      b.slashFx.progress = prog;
    }

    if (b.phaseTimer > 0) return;

    if (b.phase === 'intro') {
      b.phase = 'menu';
      b.slashFx = null;
      b.speaker = 'Battle';
      b.message = `What will Bastera Knight do against ${b.boss.def.name}?`;
      this.emitHud(true);
    } else if (b.phase === 'player_anim' || b.phase === 'potion_anim') {
      b.slashFx = null;
      if (b.pendingOutcome === 'victory') {
        b.phase = 'victory';
        b.phaseDuration = 1.45;
        b.phaseTimer = 1.45;
        b.speaker = b.boss.def.name;
        b.message = b.boss.def.defeatLine;
        this.trauma = 0.7;
        this.triggerBattleJotaroVoice(
          buildJotaroAttackAnnouncement({
            kind: 'boss_defeat',
            attackName: b.boss.def.attackName,
            bossName: b.boss.def.name,
            standName: b.boss.def.standName,
          }),
        );
        this.emitHud(true);
      } else {
        const turn = triggerBossCounterTurn(b, this.player);
        if (!turn.skippedByFreeze) {
          this.trauma = 0.55;
          gameAudio.playSlashClaw(true);
          gameAudio.playHit(true);
          this.triggerBattleJotaroVoice(
            buildJotaroAttackAnnouncement({
              kind: 'boss_attack',
              attackName: b.boss.def.attackName,
              bossName: b.boss.def.name,
              standName: b.boss.def.standName,
            }),
          );
        }
        this.emitHud(true);
      }
    } else if (b.phase === 'enemy_anim') {
      b.slashFx = null;
      if (b.pendingOutcome === 'defeat' || this.player.hp <= 0) {
        this.bossBattle = null;
        this.setStatus('gameover');
        return;
      }
      b.turnCount += 1;
      b.phase = 'menu';
      b.speaker = 'Battle';
      b.message = `Choose your action! (Fight, Potions, Run, or Escape)`;
      this.emitHud(true);
    } else if (b.phase === 'run_anim') {
      const bossX = b.boss.x;
      this.bossBattle = null;
      this.bossEncounterCooldown = 3.5;
      this.player.x = Math.max(24, bossX - 210);
      this.player.y = FLOOR_Y - this.player.h - 4;
      this.player.vx = 0;
      this.camX = Math.max(0, this.player.x - PIXEL_W * 0.34);
      gameAudio.startMusic(this.getCurrentBiome(), null);
      this.showAnnouncement('Tactical retreat! Back outside boss range.');
      this.emitHud(true);
    } else if (b.phase === 'escape_anim') {
      this.bossBattle = null;
      this.restartFromCheckpoint();
      this.showAnnouncement('Escaped safely back to last Checkpoint!');
      this.emitHud(true);
    } else if (b.phase === 'victory') {
      const defeatedBoss = b.boss;
      this.bossBattle = null;
      this.onBossDefeated(defeatedBoss);
      this.emitHud(true);
    }
  }

  private stepAttackPhase(dt: number, chunks: GeneratedChunk[]): void {
    if (this.player.attackPhase === 'none') return;
    this.player.attackTimer -= dt;
    const weapon = WEAPONS[this.player.equippedWeapon];

    if (this.player.attackPhase === 'windup' && this.player.attackTimer <= 0) {
      this.player.attackPhase = 'active';
      this.player.attackTimer = weapon.active;
      this.resolveMeleeHits(chunks, 1);

      // Arcane Breaker & Iaido styles fire a short slash wave!
      if (weapon.id === 'runeblade' || weapon.id === 'katana') {
        this.projectiles.push({
          id: `sw_${this.simTime}`,
          x: this.player.x + (this.player.facing === 1 ? 20 : -4),
          y: this.player.y + 12,
          vx: this.player.facing * 240,
          vy: 0,
          radius: 8,
          damage: Math.round(calculateAttackDamage(this.player, 0.7)),
          fromPlayer: true,
          color: weapon.accentColor,
          life: 0.55,
          kind: 'slash_wave',
        });
      }
    } else if (this.player.attackPhase === 'active' && this.player.attackTimer <= 0) {
      this.player.attackPhase = 'recovery';
      this.player.attackTimer = weapon.recovery;
    } else if (this.player.attackPhase === 'recovery' && this.player.attackTimer <= 0) {
      this.player.attackPhase = 'none';
    }
  }

  private resolveMeleeHits(
    chunks: GeneratedChunk[],
    skillMult: number,
    isSkill = false,
  ): void {
    const hb = computeWeaponHitbox(this.player);
    const dmg = calculateAttackDamage(this.player, skillMult, isSkill);
    const kb = WEAPONS[this.player.equippedWeapon].knockback * this.player.facing;
    let landedHit = false;

    for (const ch of chunks) {
      // Breakable cracked walls hiding secret passages!
      for (const prop of ch.interactables) {
        if (
          prop.kind === 'broken_brick' &&
          !prop.activated &&
          prop.secretId &&
          rectsOverlap(hb.x, hb.y, hb.w, hb.h, prop.x, prop.y, prop.w, prop.h)
        ) {
          this.activateInteractable(prop, ch);
          landedHit = true;
        }
      }

      for (const en of ch.enemies) {
        if (en.state === 'ko') continue;
        if (rectsOverlap(hb.x, hb.y, hb.w, hb.h, en.x, en.y, en.w, en.h)) {
          const res = applyDamageToEnemy(en, dmg, kb);
          this.spawnFloatingText(en.x + en.w / 2, en.y - 4, `${dmg}`, '#fde047');
          this.spawnBurst(en.x + en.w / 2, en.y + 10, 10, '#f97316');
          landedHit = true;
          if (res.killed) {
            this.onEnemyKilled(en);
          }
        }
      }

      if (ch.boss && !ch.boss.defeated) {
        const b = ch.boss;
        if (rectsOverlap(hb.x, hb.y, hb.w, hb.h, b.x, b.y, b.w, b.h)) {
          const res = applyDamageToBoss(b, dmg, kb);
          this.spawnFloatingText(b.x + b.w / 2, b.y - 6, `${dmg}`, '#fde047');
          this.spawnBurst(b.x + b.w / 2, b.y + 16, 14, b.def.auraColor);
          landedHit = true;
          if (res.defeatedNow) {
            this.onBossDefeated(b);
          }
        }
      }
    }

    if (landedHit) {
      this.hitstopTimer = 0.04;
      this.trauma = Math.min(1, this.trauma + 0.32);
      gameAudio.playHit(skillMult > 1);
      this.emitHud();
    }
  }

  private executeSkill(slotIndex: 0 | 1 | 2): void {
    const res = triggerSkillSlot(this.player, slotIndex);
    if (!res.ok) return;
    const skill = SKILLS[res.skillId];
    gameAudio.playSkill(res.skillId);
    this.spawnBurst(this.player.x + 8, this.player.y + 12, 14, skill.color);

    const chunks = this.getActiveChunks();

    if (res.skillId === 'blade_dash') {
      this.player.vx = this.player.facing * 465;
      this.player.invulnTimer = 0.48;
      this.spawnAfterimage('#fbbf24');
      this.speedLineTimer = 0.35;
      this.resolveMeleeHits(chunks, skill.damageMultiplier, true);
    } else if (res.skillId === 'parry_guard') {
      this.player.parryTimer = 0.5;
      this.player.invulnTimer = 0.25;
      this.spawnFloatingText(this.player.x + 8, this.player.y - 8, 'PARRY!', '#fbbf24');
    } else if (res.skillId === 'candlefire_wave') {
      this.spawnAfterimage('#f97316');
      this.projectiles.push({
        id: `cf_${this.simTime}`,
        x: this.player.x + (this.player.facing === 1 ? 18 : -4),
        y: this.player.y + 12,
        vx: this.player.facing * 260,
        vy: 0,
        radius: 9,
        damage: calculateAttackDamage(this.player, skill.damageMultiplier, true),
        fromPlayer: true,
        color: '#f97316',
        life: 1.1,
        kind: 'fireball',
      });
    } else if (res.skillId === 'chrono_freeze') {
      this.player.chronoFreezeTimer = 2.4;
      this.speedLineTimer = 0.45;
      this.trauma = Math.min(1, this.trauma + 0.45);
      this.spawnFloatingText(this.player.x + 8, this.player.y - 12, 'TOKI WO TOMARE!', '#34d399');
    } else if (res.skillId === 'stand_rush') {
      this.trauma = Math.min(1, this.trauma + 0.4);
      this.speedLineTimer = 0.4;
      this.spawnAfterimage('#a78bfa');
      this.spawnFloatingText(this.player.x + 8, this.player.y - 12, 'ORA ORA ORA!', '#a78bfa');
      this.resolveMeleeHits(chunks, skill.damageMultiplier, true);
    } else if (res.skillId === 'sunburst_cleave') {
      this.trauma = Math.min(1, this.trauma + 0.45);
      this.speedLineTimer = 0.35;
      this.spawnBurst(this.player.x + 8, this.player.y + 12, 24, '#fde047');
      this.resolveMeleeHits(chunks, skill.damageMultiplier, true);
    }
    this.emitHud();
  }

  private tryInteract(): void {
    const chunks = this.getActiveChunks();
    for (const ch of chunks) {
      for (const prop of ch.interactables) {
        if (
          rectsOverlap(
            this.player.x - 10,
            this.player.y - 6,
            this.player.w + 20,
            this.player.h + 12,
            prop.x,
            prop.y,
            prop.w,
            prop.h,
          )
        ) {
          this.activateInteractable(prop, ch);
          return;
        }
      }
    }
  }

  private checkPassiveTriggers(chunks: GeneratedChunk[]): void {
    for (const ch of chunks) {
      for (const prop of ch.interactables) {
        if (prop.activated) continue;
        if (
          (prop.kind === 'pressure_plate' || prop.kind === 'checkpoint') &&
          rectsOverlap(
            this.player.x,
            this.player.y,
            this.player.w,
            this.player.h,
            prop.x,
            prop.y - 6,
            prop.w,
            prop.h + 10,
          )
        ) {
          this.activateInteractable(prop, ch);
        }
      }
    }
  }

  private activateInteractable(prop: InteractableProp, chunk: GeneratedChunk): void {
    if (prop.kind === 'escape_gate') {
      this.setStatus('victory');
      return;
    }

    if (prop.kind === 'checkpoint') {
      if (!prop.activated) {
        prop.activated = true;
        this.player.hp = this.player.maxHp;
        this.player.stamina = this.player.maxStamina;
        if (typeof prop.checkpointIndex === 'number' && prop.checkpointIndex >= this.player.highestCheckpointIndex) {
          this.player.highestCheckpointIndex = prop.checkpointIndex;
          this.player.highestCheckpointX = prop.x;
        }
        gameAudio.playSecretFound();
        this.spawnBurst(prop.x + 10, prop.y + 4, 16, '#38bdf8');
        this.openDialogue(prop.speaker, 'system', '#38bdf8', prop.dialogue);
      } else {
        this.player.hp = this.player.maxHp;
        this.showAnnouncement('Checkpoint warmth restored HP!');
      }
      this.emitHud();
      return;
    }

    if (prop.kind === 'chest') {
      if (prop.activated) {
        this.openDialogue('Empty Chest', 'system', '#94a3b8', [
          'Already looted. Stop shaking an empty wooden box.',
        ]);
        return;
      }
      prop.activated = true;
      this.openedChests.add(prop.id);
      this.player.gold += 35;
      if (prop.rewardItemId) {
        addInventoryResource(this.inventory, prop.rewardItemId, 1);
      }
      if (prop.rewardWeaponId && !this.player.unlockedWeapons.includes(prop.rewardWeaponId)) {
        this.player.unlockedWeapons.push(prop.rewardWeaponId);
      }
      gameAudio.playSecretFound();
      this.spawnBurst(prop.x + 10, prop.y + 8, 18, '#fbbf24');
      this.openDialogue(prop.speaker, 'secret', '#fbbf24', prop.dialogue);
      this.emitHud();
      return;
    }

    // Secret passage triggers (cracked wall, lever, pressure plate, tapestry)
    if (prop.secretId && !prop.activated) {
      prop.activated = true;
      if (chunk.hiddenPassage && !chunk.hiddenPassage.discovered) {
        chunk.hiddenPassage.discovered = true;
        this.discoveredSecrets.add(chunk.hiddenPassage.id);
        this.player.secretsFound = clampSecretsCount(this.discoveredSecrets.size);
        this.player.gold += 25;
        addInventoryResource(
          this.inventory,
          chunk.biome === 'castle' ? 'royal_ember' : chunk.biome === 'forest' ? 'ruin_shard' : 'magma_core',
          1,
        );
        gameAudio.playSecretFound();
        this.spawnBurst(prop.x + 12, prop.y + 12, 20, '#fbbf24');
        this.sendMilestone('secret', `Secret #${chunk.hiddenPassage.index}`);
        this.openDialogue(prop.speaker, 'secret', '#fbbf24', [
          ...prop.dialogue,
          chunk.hiddenPassage.rewardText,
        ]);
        this.emitHud();
        return;
      }
    }

    // Lore objects (Thrones, Broken Bricks, etc.)
    this.openDialogue(
      prop.label,
      prop.kind === 'throne' ? 'throne' : 'warrior',
      '#fbbf24',
      prop.dialogue,
    );
  }

  private onEnemyKilled(enemy: EnemyState): void {
    this.player.gold += enemy.rewardGold;
    const pts = grantKillStatPoints(this.player, 'monster');
    const resId =
      enemy.biome === 'castle'
        ? 'royal_ember'
        : enemy.biome === 'forest'
          ? 'ruin_shard'
          : 'magma_core';
    if (Math.random() < 0.45) {
      addInventoryResource(this.inventory, resId, 1);
    }
    if (Math.random() < 0.2) {
      addInventoryResource(this.inventory, 'crimson_vial', 1);
    }
    this.spawnFloatingText(enemy.x + enemy.w / 2, enemy.y - 12, `+${enemy.rewardGold}G`, '#fbbf24');
    this.spawnFloatingText(enemy.x + enemy.w / 2, enemy.y - 22, `+${pts} STAT PT`, '#38bdf8');
    this.emitHud();
  }

  private onBossDefeated(boss: ActiveBoss): void {
    this.defeatedBosses.add(boss.def.index);
    this.player.bossesDefeated = Math.max(this.player.bossesDefeated, this.defeatedBosses.size);
    this.player.gold += 100 + boss.def.index * 5;
    const pts = grantKillStatPoints(this.player, 'boss');
    addInventoryResource(this.inventory, 'crimson_vial', 1);
    const matId =
      boss.def.biome === 'castle'
        ? 'royal_ember'
        : boss.def.biome === 'forest'
          ? 'ruin_shard'
          : 'magma_core';
    addInventoryResource(this.inventory, matId, 2);

    this.hitstopTimer = 0.08;
    this.trauma = 0.85;
    gameAudio.playSecretFound();
    this.sendMilestone('boss', `${boss.def.name} (#${boss.def.index})`);
    this.showAnnouncement(`Defeated ${boss.def.name}! +${pts} Stat Points!`);

    const lines = [
      boss.def.defeatLine,
      `[SYSTEM] +${pts} Ability Stat Points granted! Press [K] to open Status Window.`,
    ];
    if (boss.def.index === 40) {
      lines.push('40 Bosses felled! Ahead lies the Dark Enchanted Forest of Ancient Ruins!');
    } else if (boss.def.index === 80) {
      lines.push('80 Bosses felled! Brace yourself for the Volcano Hell Citadel!');
    } else if (boss.def.index === TOTAL_BOSSES) {
      lines.push('All 120 JoJo Bosses defeated! Step through the Escape Gate ahead!');
    }
    this.openDialogue(boss.def.name, 'boss', boss.def.primaryColor, lines);
    gameAudio.startMusic(this.getCurrentBiome(), null);
    this.emitHud(true);
  }

  private stepEnemies(chunks: GeneratedChunk[], dt: number, frozen: boolean): void {
    for (const ch of chunks) {
      for (const en of ch.enemies) {
        en.hitFlash = Math.max(0, en.hitFlash - dt);
        if (en.state === 'ko') {
          en.koTimer -= dt;
          en.x += en.vx * dt;
          en.y += en.vy * dt;
          en.vy += 320 * dt;
          continue;
        }
        if (frozen) continue;

        const dx = this.player.x - en.x;
        const dist = Math.abs(dx);
        en.stateTimer -= dt;

        if (en.archetype === 'skeleton_guard') {
          if (en.state === 'patrol') {
            en.facing = dx >= 0 ? 1 : -1;
            if (dist < 140 && dist > 26) {
              en.vx = en.facing * 48;
            } else if (dist <= 26) {
              en.vx = 0;
              en.state = 'windup';
              en.stateTimer = 0.42;
            } else {
              en.vx = Math.sin(this.simTime * 1.5 + en.patrolOriginX) * 24;
            }
          } else if (en.state === 'windup' && en.stateTimer <= 0) {
            en.state = 'attack';
            en.stateTimer = 0.2;
            if (dist < 32 && Math.abs(this.player.y - en.y) < 28) {
              this.damagePlayer(12, en.facing * 120);
            }
          } else if (en.state === 'attack' && en.stateTimer <= 0) {
            en.state = 'recover';
            en.stateTimer = 0.65;
          } else if (en.state === 'recover' && en.stateTimer <= 0) {
            en.state = 'patrol';
          }
          en.x += en.vx * dt;
          en.vx *= 0.88;
        } else if (en.archetype === 'shadow_bat') {
          // Hover & swoop policy
          en.facing = dx >= 0 ? 1 : -1;
          const hoverY = FLOOR_Y - 62 + Math.sin(this.simTime * 3 + en.patrolOriginX) * 14;
          if (en.state === 'patrol') {
            en.x += Math.sin(this.simTime * 2 + en.patrolOriginX) * 35 * dt;
            en.y += (hoverY - en.y) * 4 * dt;
            if (dist < 130 && en.stateTimer <= 0) {
              en.state = 'windup';
              en.stateTimer = 0.35;
            }
          } else if (en.state === 'windup' && en.stateTimer <= 0) {
            en.state = 'attack';
            en.stateTimer = 0.55;
            en.vx = en.facing * 115;
            en.vy = 65;
          } else if (en.state === 'attack') {
            en.x += en.vx * dt;
            en.y += en.vy * dt;
            if (rectsOverlap(en.x, en.y, en.w, en.h, this.player.x, this.player.y, this.player.w, this.player.h)) {
              this.damagePlayer(10, en.facing * 90);
              en.state = 'recover';
              en.stateTimer = 0.8;
            }
            if (en.stateTimer <= 0) {
              en.state = 'recover';
              en.stateTimer = 0.8;
            }
          } else if (en.state === 'recover') {
            en.y += (hoverY - en.y) * 5 * dt;
            if (en.stateTimer <= 0) en.state = 'patrol';
          }
        } else if (en.archetype === 'cultist_mage') {
          // Ranged kiter policy
          en.facing = dx >= 0 ? 1 : -1;
          if (en.state === 'patrol') {
            if (dist < 70) {
              en.x -= en.facing * 42 * dt;
            } else if (dist > 160 && dist < 240) {
              en.x += en.facing * 32 * dt;
            }
            if (dist < 220 && en.stateTimer <= 0) {
              en.state = 'windup';
              en.stateTimer = 0.55;
            }
          } else if (en.state === 'windup' && en.stateTimer <= 0) {
            en.state = 'attack';
            en.stateTimer = 0.25;
            this.projectiles.push({
              id: `mp_${this.simTime}_${en.id}`,
              x: en.x + en.w / 2,
              y: en.y + 10,
              vx: en.facing * 135,
              vy: 0,
              radius: 4,
              damage: 11,
              fromPlayer: false,
              color: '#38bdf8',
              life: 2.0,
              kind: 'rune',
            });
          } else if (en.state === 'attack' && en.stateTimer <= 0) {
            en.state = 'recover';
            en.stateTimer = 1.4;
          } else if (en.state === 'recover' && en.stateTimer <= 0) {
            en.state = 'patrol';
          }
        } else {
          // Gargoyle line-of-sight charger policy
          en.facing = dx >= 0 ? 1 : -1;
          if (en.state === 'patrol') {
            if (dist < 170 && en.stateTimer <= 0) {
              en.state = 'windup';
              en.stateTimer = 0.48;
            }
          } else if (en.state === 'windup' && en.stateTimer <= 0) {
            en.state = 'attack';
            en.stateTimer = 0.5;
            en.vx = en.facing * 165;
          } else if (en.state === 'attack') {
            en.x += en.vx * dt;
            if (rectsOverlap(en.x, en.y, en.w, en.h, this.player.x, this.player.y, this.player.w, this.player.h)) {
              this.damagePlayer(15, en.facing * 150);
              en.state = 'recover';
              en.stateTimer = 0.9;
            }
            if (en.stateTimer <= 0) {
              en.state = 'recover';
              en.stateTimer = 0.9;
            }
          } else if (en.state === 'recover' && en.stateTimer <= 0) {
            en.state = 'patrol';
            en.stateTimer = 1.0;
          }
        }
      }
      ch.enemies = ch.enemies.filter((e) => !(e.state === 'ko' && e.koTimer <= 0));
    }
  }

  private stepBosses(chunks: GeneratedChunk[], dt: number, frozen: boolean): void {
    for (const ch of chunks) {
      const b = ch.boss;
      if (!b) continue;
      b.hitFlash = Math.max(0, b.hitFlash - dt);
      if (b.state === 'ko') {
        b.stateTimer = Math.max(0, b.stateTimer - dt);
        continue;
      }
      if (b.defeated || frozen) continue;

      const dx = this.player.x - b.x;
      const dist = Math.abs(dx);
      if (dist > 340) continue;

      b.facing = dx >= 0 ? 1 : -1;
      b.stateTimer -= dt;
      b.x = Math.max(b.arenaMinX, Math.min(b.arenaMaxX, b.x + b.vx * dt));
      b.vx *= 0.88;

      if (b.state === 'intro' && b.stateTimer <= 0) {
        b.state = 'idle';
        b.stateTimer = 0.6;
      } else if (b.state === 'idle') {
        b.posePhase += dt;
        if (dist > 90) {
          b.vx = b.facing * 52;
        }
        if (b.stateTimer <= 0) {
          b.state = 'windup';
          b.stateTimer = 0.55;
        }
      } else if (b.state === 'windup' && b.stateTimer <= 0) {
        b.state = 'attack';
        b.stateTimer = 0.45;
        if (b.def.attackPattern === 'time_knives' || b.def.attackPattern === 'chrono_shear') {
          [-24, 0, 24].forEach((vyOff) => {
            this.projectiles.push({
              id: `bk_${this.simTime}_${vyOff}`,
              x: b.x + 12,
              y: b.y + 14,
              vx: b.facing * (b.def.attackPattern === 'chrono_shear' ? 205 : 175),
              vy: vyOff,
              radius: 4,
              damage: 13 + Math.floor(b.def.index * 0.25),
              fromPlayer: false,
              color: b.def.secondaryColor,
              life: 2.2,
              kind: 'knife',
            });
          });
        } else if (
          b.def.attackPattern === 'gravity_orb' ||
          b.def.attackPattern === 'magma_eruption'
        ) {
          this.projectiles.push({
            id: `bo_${this.simTime}`,
            x: b.x + 12,
            y: b.y + 12,
            vx: b.facing * 125,
            vy: -20,
            radius: 7,
            damage: 16 + Math.floor(b.def.index * 0.25),
            fromPlayer: false,
            color: b.def.auraColor,
            life: 2.6,
            kind: b.def.attackPattern === 'magma_eruption' ? 'fireball' : 'gravity_orb',
          });
        } else if (b.def.attackPattern === 'lightning_overdrive') {
          this.projectiles.push({
            id: `bl_${this.simTime}`,
            x: b.x + 12,
            y: b.y + 10,
            vx: b.facing * 220,
            vy: 0,
            radius: 5,
            damage: 14 + Math.floor(b.def.index * 0.22),
            fromPlayer: false,
            color: '#fef08a',
            life: 1.9,
            kind: 'rune',
          });
        } else {
          // Stand barrage / pillar slam / blood scythe lunge
          b.vx = b.facing * 185;
        }
      } else if (b.state === 'attack') {
        if (
          (b.def.attackPattern === 'stand_barrage' ||
            b.def.attackPattern === 'pillar_slam' ||
            b.def.attackPattern === 'blood_scythe') &&
          rectsOverlap(b.x - 10, b.y, b.w + 20, b.h, this.player.x, this.player.y, this.player.w, this.player.h)
        ) {
          this.damagePlayer(15 + Math.floor(b.def.index * 0.2), b.facing * 165);
        }
        if (b.stateTimer <= 0) {
          b.state = 'recover';
          b.stateTimer = 0.85;
        }
      } else if (b.state === 'recover' && b.stateTimer <= 0) {
        b.state = 'idle';
        b.stateTimer = 0.7;
      }
    }
  }

  private stepProjectiles(chunks: GeneratedChunk[], dt: number, frozen: boolean): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      if (!pr.fromPlayer && frozen) continue;

      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      pr.life -= dt;

      if (pr.life <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      if (pr.fromPlayer) {
        let hit = false;
        for (const ch of chunks) {
          for (const en of ch.enemies) {
            if (en.state === 'ko') continue;
            if (rectsOverlap(pr.x - pr.radius, pr.y - pr.radius, pr.radius * 2, pr.radius * 2, en.x, en.y, en.w, en.h)) {
              const res = applyDamageToEnemy(en, pr.damage, Math.sign(pr.vx) * 90);
              this.spawnFloatingText(en.x + 8, en.y - 4, `${pr.damage}`, '#fb923c');
              this.spawnBurst(pr.x, pr.y, 8, pr.color);
              if (res.killed) this.onEnemyKilled(en);
              hit = true;
              break;
            }
          }
          if (!hit && ch.boss && !ch.boss.defeated) {
            const b = ch.boss;
            if (rectsOverlap(pr.x - pr.radius, pr.y - pr.radius, pr.radius * 2, pr.radius * 2, b.x, b.y, b.w, b.h)) {
              const res = applyDamageToBoss(b, pr.damage, Math.sign(pr.vx) * 50);
              this.spawnFloatingText(b.x + 12, b.y - 6, `${pr.damage}`, '#fb923c');
              this.spawnBurst(pr.x, pr.y, 10, pr.color);
              if (res.defeatedNow) this.onBossDefeated(b);
              hit = true;
            }
          }
        }
        if (hit) {
          gameAudio.playHit(false);
          this.projectiles.splice(i, 1);
        }
      } else {
        if (
          rectsOverlap(
            pr.x - pr.radius,
            pr.y - pr.radius,
            pr.radius * 2,
            pr.radius * 2,
            this.player.x,
            this.player.y,
            this.player.w,
            this.player.h,
          )
        ) {
          // Parry reflects enemy projectiles!
          if (this.player.parryTimer > 0) {
            pr.fromPlayer = true;
            pr.vx = -pr.vx * 1.4;
            pr.damage = Math.round(pr.damage * 2);
            pr.color = '#fbbf24';
            gameAudio.playHit(true);
            this.spawnFloatingText(this.player.x + 8, this.player.y - 10, 'DEFLECT!', '#fbbf24');
          } else {
            this.damagePlayer(pr.damage, Math.sign(pr.vx) * 100);
            this.projectiles.splice(i, 1);
          }
        }
      }
    }
  }

  private damagePlayer(amount: number, knockbackX: number): void {
    if (this.player.invulnTimer > 0) return;

    if (this.player.parryTimer > 0) {
      this.player.parryTimer = 0;
      this.player.invulnTimer = 0.4;
      gameAudio.playHit(true);
      this.hitstopTimer = 0.05;
      this.spawnFloatingText(this.player.x + 8, this.player.y - 10, 'COUNTER!', '#fbbf24');
      this.resolveMeleeHits(this.getActiveChunks(), 1.8);
      return;
    }

    this.player.hp = Math.max(0, this.player.hp - amount);
    this.player.invulnTimer = 0.65;
    this.player.hitFlash = 0.14;
    this.player.vx = knockbackX;
    this.player.vy = -120;
    this.trauma = Math.min(1, this.trauma + 0.55);
    this.hitstopTimer = 0.04;
    gameAudio.playHit(true);
    this.spawnFloatingText(this.player.x + 8, this.player.y - 8, `-${amount}`, '#ef4444');
    this.spawnBurst(this.player.x + 8, this.player.y + 12, 12, '#ef4444');

    if (this.player.hp <= 0) {
      this.setStatus('gameover');
    } else {
      this.emitHud();
    }
  }

  private spawnBurst(x: number, y: number, count: number, color: string): void {
    for (let i = 0; i < count; i++) {
      const p = this.particles[this.particleCursor];
      this.particleCursor = (this.particleCursor + 1) % this.particles.length;
      const ang = Math.random() * Math.PI * 2;
      const spd = 25 + Math.random() * 95;
      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(ang) * spd;
      p.vy = Math.sin(ang) * spd - 30;
      p.maxLife = 0.25 + Math.random() * 0.3;
      p.life = p.maxLife;
      p.size = Math.random() > 0.5 ? 3 : 2;
      p.color = color;
    }
  }

  private spawnFloatingText(x: number, y: number, text: string, color: string): void {
    const f = this.floatingNums[this.floatCursor];
    this.floatCursor = (this.floatCursor + 1) % this.floatingNums.length;
    f.active = true;
    f.x = x;
    f.y = y;
    f.vy = -34;
    f.text = text;
    f.color = color;
    f.life = 0.75;
  }

  private updateParticles(dt: number): void {
    for (const p of this.particles) {
      if (!p.active) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 180 * dt;
      p.life -= dt;
      if (p.life <= 0) p.active = false;
    }
    for (const f of this.floatingNums) {
      if (!f.active) continue;
      f.y += f.vy * dt;
      f.life -= dt;
      if (f.life <= 0) f.active = false;
    }
    for (const a of this.afterimages) {
      if (!a.active) continue;
      a.life -= dt;
      if (a.life <= 0) a.active = false;
    }
    if (Math.abs(this.player.vx) > 195 && Math.floor(this.simTime * 30) % 2 === 0) {
      this.spawnAfterimage('#e2e8f0');
    }
  }

  private updateAmbientMotes(dt: number): void {
    for (const m of this.ambientMotes) {
      m.y += m.vy * dt;
      m.x += Math.sin(this.simTime * 1.8 + m.phase) * 8 * dt;
      if (m.y < 8) {
        m.y = FLOOR_Y - 4;
        m.x = (m.x + 73) % PIXEL_W;
      }
      if (m.x < 0) m.x += PIXEL_W;
      if (m.x >= PIXEL_W) m.x -= PIXEL_W;
    }
  }

  private spawnAfterimage(color: string): void {
    const a = this.afterimages[this.afterimageCursor];
    this.afterimageCursor = (this.afterimageCursor + 1) % this.afterimages.length;
    a.active = true;
    a.x = this.player.x;
    a.y = this.player.y;
    a.facing = this.player.facing;
    a.life = 0.24;
    a.color = color;
  }

  private render(): void {
    const ctx = this.ctx;
    const shakeAmt = this.trauma * this.trauma * 6;
    const shakeX = shakeAmt > 0.1 ? (Math.random() - 0.5) * shakeAmt : 0;
    const shakeY = shakeAmt > 0.1 ? (Math.random() - 0.5) * shakeAmt : 0;
    const renderCamX = this.camX + shakeX;

    ctx.save();
    ctx.translate(0, Math.round(shakeY));

    const biome = this.status === 'title' ? 'castle' : this.getCurrentBiome();

    if (this.bossBattle && this.status === 'playing') {
      ctx.translate(Math.round(shakeX), 0);
      const b = this.bossBattle;
      const prog =
        b.phaseDuration > 0 ? Math.min(1, 1 - b.phaseTimer / b.phaseDuration) : 1;
      drawPokemonBossStage(
        ctx,
        b.boss.def.biome,
        b.boss,
        this.player,
        b.phase,
        prog,
        b.slashFx,
        b.guardActive,
        b.bossFrozenTurns,
        this.simTime,
      );
      if (this.encounterFlashTimer > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.75, this.encounterFlashTimer * 2.2)})`;
        ctx.fillRect(0, 0, PIXEL_W, PIXEL_H);
      }
      ctx.restore();
      return;
    }

    drawBiomeBackdrop(ctx, biome, renderCamX, this.simTime);

    const chunks = this.getActiveChunks();
    const frozen = this.player.chronoFreezeTimer > 0;

    for (const ch of chunks) {
      drawPlatforms(ctx, ch.platforms, ch.biome, renderCamX, this.simTime);
      drawCandles(ctx, ch.candles, renderCamX, this.simTime);
      drawInteractables(
        ctx,
        ch.interactables,
        ch.hiddenPassage ? [ch.hiddenPassage] : [],
        renderCamX,
        this.simTime,
      );
    }

    // Multiplayer peers in dungeon
    for (const peer of this.peers.values()) {
      drawPeer(ctx, peer, renderCamX, this.simTime);
    }

    // Enemies & JoJo Bosses
    for (const ch of chunks) {
      for (const en of ch.enemies) {
        drawEnemy(ctx, en, renderCamX, this.simTime, frozen);
      }
      if (ch.boss && (!ch.boss.defeated || ch.boss.state === 'ko')) {
        drawJoJoBoss(ctx, ch.boss, renderCamX, this.simTime, frozen);
      }
    }

    // Ambient floating candle embers / forest fireflies / volcano sparks
    const moteColor =
      biome === 'castle' ? '#fbbf24' : biome === 'forest' ? '#6ee7b7' : '#fb923c';
    for (const m of this.ambientMotes) {
      const alpha = 0.28 + 0.35 * Math.abs(Math.sin(this.simTime * 2.5 + m.phase));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = moteColor;
      ctx.fillRect(Math.round(m.x), Math.round(m.y), m.size, m.size);
    }
    ctx.globalAlpha = 1;

    // Afterimage ghost trail silhouettes
    for (const a of this.afterimages) {
      if (!a.active) continue;
      ctx.globalAlpha = Math.max(0, (a.life / 0.24) * 0.45);
      ctx.fillStyle = a.color;
      ctx.fillRect(Math.round(a.x - renderCamX + 2), Math.round(a.y), 12, 24);
    }
    ctx.globalAlpha = 1;

    // Warrior player (even on title screen as resting sentinel!)
    drawWarrior(
      ctx,
      this.player.x,
      this.player.y,
      this.player.facing,
      this.player.squashX,
      this.player.squashY,
      this.player.walkCycle,
      this.status === 'title' ? this.simTime : this.player.idleTimer,
      this.player.attackPhase,
      this.player.equippedWeapon,
      this.player.comboStep,
      this.player.parryTimer > 0,
      this.player.hitFlash,
      renderCamX,
    );

    drawProjectiles(ctx, this.projectiles, renderCamX);

    // Particles
    for (const p of this.particles) {
      if (!p.active) continue;
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x - renderCamX), Math.round(p.y), p.size, p.size);
    }
    ctx.globalAlpha = 1;

    // Floating combat numbers & anime callouts
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    for (const f of this.floatingNums) {
      if (!f.active) continue;
      ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 2));
      ctx.fillStyle = '#09090b';
      ctx.fillText(f.text, Math.round(f.x - renderCamX) + 1, Math.round(f.y) + 1);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, Math.round(f.x - renderCamX), Math.round(f.y));
    }
    ctx.globalAlpha = 1;

    // Anime impact speed-lines around screen edges during Boss Intros & Skills
    if (this.speedLineTimer > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.35)';
      ctx.lineWidth = 1;
      for (let s = 0; s < 16; s++) {
        const ang = (s / 16) * Math.PI * 2 + this.simTime * 4;
        const r1 = 150;
        const r2 = 240;
        ctx.beginPath();
        ctx.moveTo(PIXEL_W / 2 + Math.cos(ang) * r1, PIXEL_H / 2 + Math.sin(ang) * r1 * 0.6);
        ctx.lineTo(PIXEL_W / 2 + Math.cos(ang) * r2, PIXEL_H / 2 + Math.sin(ang) * r2 * 0.6);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Time-stop emerald tint overlay
    if (frozen) {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.14)';
      ctx.fillRect(0, 0, PIXEL_W, PIXEL_H);
    }

    // Subtle candle-lit perimeter vignette (cached offscreen)
    if (!this.vignetteCanvas) {
      const vc = document.createElement('canvas');
      vc.width = PIXEL_W;
      vc.height = PIXEL_H;
      const vctx = vc.getContext('2d');
      if (vctx) {
        const vig = vctx.createRadialGradient(
          PIXEL_W * 0.5,
          PIXEL_H * 0.5,
          PIXEL_W * 0.28,
          PIXEL_W * 0.5,
          PIXEL_H * 0.5,
          PIXEL_W * 0.68,
        );
        vig.addColorStop(0, 'rgba(0,0,0,0)');
        vig.addColorStop(1, 'rgba(6,4,6,0.52)');
        vctx.fillStyle = vig;
        vctx.fillRect(0, 0, PIXEL_W, PIXEL_H);
      }
      this.vignetteCanvas = vc;
    }
    ctx.drawImage(this.vignetteCanvas, 0, 0);

    ctx.restore();
  }

  private getNearbyInteractableLabel(): string | null {
    const chunks = this.getActiveChunks();
    for (const ch of chunks) {
      for (const prop of ch.interactables) {
        if (prop.kind === 'chest' && prop.activated) continue;
        if (
          rectsOverlap(
            this.player.x - 10,
            this.player.y - 6,
            this.player.w + 20,
            this.player.h + 12,
            prop.x,
            prop.y,
            prop.w,
            prop.h,
          )
        ) {
          return `[F] ${prop.label}`;
        }
      }
    }
    return null;
  }

  private emitHud(force = false): void {
    const biome = this.getCurrentBiome();
    const nearbyBoss = this.getActiveNearbyBoss();
    const nearbyPrompt = this.getNearbyInteractableLabel();
    const sig = [
      this.status,
      Math.round(this.player.hp),
      Math.round(this.player.maxHp),
      Math.round(this.player.stamina),
      Math.round(this.player.maxStamina),
      Math.round(this.player.gold),
      this.player.level,
      this.player.statPoints,
      this.player.monstersSlain,
      this.player.stats.skillDmg,
      this.player.stats.attack,
      this.player.stats.hp,
      this.player.stats.speed,
      biome,
      Math.max(0, Math.round((this.player.x - 68) / 16)),
      this.player.bossesDefeated,
      this.player.secretsFound,
      this.player.equippedWeapon,
      this.player.skillSlots.join(','),
      this.player.skillCooldowns.map((c) => c.toFixed(1)).join(','),
      this.dialogue ? `${this.dialogue.lineIndex}:${this.dialogue.charIndex}` : 'none',
      nearbyBoss ? `${nearbyBoss.def.index}:${Math.round(nearbyBoss.hp)}` : 'none',
      this.bossBattle
        ? `${this.bossBattle.phase}:${Math.round(this.bossBattle.boss.hp)}:${this.bossBattle.message}:${this.bossBattle.jotaroVoiceStatus}:${this.bossBattle.jotaroLine ?? ''}:${this.bossBattle.jotaroVoiceError ?? ''}`
        : 'none',
      this.onlineCount,
      this.announcement ?? '',
      nearbyPrompt ?? '',
      gameAudio.isMuted() ? '1' : '0',
    ].join('|');

    if (!force && sig === this.lastHudSignature) return;
    this.lastHudSignature = sig;

    const snapshot: HudSnapshot = {
      status: this.status,
      hp: Math.round(this.player.hp),
      maxHp: Math.round(this.player.maxHp),
      stamina: Math.round(this.player.stamina),
      maxStamina: Math.round(this.player.maxStamina),
      gold: Math.round(this.player.gold),
      level: this.player.level,
      statPoints: this.player.statPoints,
      stats: { ...this.player.stats },
      monstersSlain: this.player.monstersSlain,
      biome,
      biomeLabel: getBiomeDisplayName(biome),
      distanceMeters: Math.max(0, Math.round((this.player.x - 68) / 16)),
      bossesDefeated: this.player.bossesDefeated,
      totalBosses: TOTAL_BOSSES,
      secretsFound: this.player.secretsFound,
      totalSecrets: TOTAL_HIDDEN_PASSAGES,
      equippedWeapon: this.player.equippedWeapon,
      unlockedWeapons: [...this.player.unlockedWeapons],
      skillSlots: [...this.player.skillSlots],
      skillCooldowns: [...this.player.skillCooldowns],
      inventory: this.inventory.map((i) => ({ ...i })),
      dialogue: this.dialogue ? { ...this.dialogue } : null,
      activeBoss: nearbyBoss
        ? {
            index: nearbyBoss.def.index,
            name: nearbyBoss.def.name,
            title: nearbyBoss.def.title,
            standName: nearbyBoss.def.standName,
            hp: Math.round(nearbyBoss.hp),
            maxHp: Math.round(nearbyBoss.maxHp),
            voiceLine: nearbyBoss.def.voiceLine,
          }
        : null,
      bossBattle: this.bossBattle ? toBossBattleSnapshot(this.bossBattle) : null,
      checkpoints: getBiomeCheckpointList(this.player.highestCheckpointIndex),
      onlineCount: this.onlineCount,
      announcement: this.announcement,
      nearbyPrompt,
      muted: gameAudio.isMuted(),
    };
    this.onHudUpdate(snapshot);
  }

  private connectMultiplayer(): void {
    if (typeof window === 'undefined') return;
    try {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${proto}//${window.location.host}/ws`);
      this.ws = ws;

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(String(ev.data));
          if (msg.type === 'world:init') {
            this.selfPeerId = msg.selfId;
            this.peers.clear();
            for (const p of msg.peers || []) {
              if (p.id !== this.selfPeerId) this.peers.set(p.id, p);
            }
            this.onlineCount = msg.stats?.onlineCount ?? 1;
            this.emitHud();
          } else if (msg.type === 'peer:join' && msg.peer) {
            if (msg.peer.id !== this.selfPeerId) {
              this.peers.set(msg.peer.id, msg.peer);
            }
            this.onlineCount = msg.onlineCount ?? this.peers.size + 1;
            this.emitHud();
          } else if (msg.type === 'peer:update' && msg.peer) {
            if (msg.peer.id !== this.selfPeerId) {
              this.peers.set(msg.peer.id, msg.peer);
            }
          } else if (msg.type === 'peer:leave') {
            this.peers.delete(msg.id);
            this.onlineCount = msg.onlineCount ?? Math.max(1, this.peers.size + 1);
            this.emitHud();
          } else if (msg.type === 'world:announcement') {
            this.showAnnouncement(`${msg.fromName}: ${msg.label}`);
          }
        } catch {
          // ignore malformed ws message
        }
      };

      ws.onclose = () => {
        this.ws = null;
      };
    } catch {
      // Offline fallback works seamlessly
    }
  }

  private sendMultiplayerState(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const anim =
      this.player.attackPhase !== 'none'
        ? 'attack'
        : !this.player.onGround
          ? 'jump'
          : Math.abs(this.player.vx) > 8
            ? 'run'
            : 'idle';
    this.ws.send(
      JSON.stringify({
        type: 'player:state',
        name: this.playerName,
        x: Math.round(this.player.x),
        y: Math.round(this.player.y),
        vx: Math.round(this.player.vx),
        vy: Math.round(this.player.vy),
        facing: this.player.facing,
        anim,
        weaponId: this.player.equippedWeapon,
        biome: this.getCurrentBiome(),
        bossesDefeated: this.player.bossesDefeated,
      }),
    );
  }

  private sendMilestone(kind: 'boss' | 'secret', label: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'world:milestone', kind, label }));
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      if (this.status === 'playing' || this.status === 'title') {
        e.preventDefault();
      }
    }
    if (!e.repeat) {
      this.justPressed.add(e.code);
    }
    this.heldKeys.add(e.code);
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.heldKeys.delete(e.code);
  };

  private handleBlur = () => {
    this.heldKeys.clear();
    this.virtualInput.left = false;
    this.virtualInput.right = false;
    this.virtualInput.jumpHeld = false;
  };

  private attachInputListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
  }

  private detachInputListeners(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
  }
}
