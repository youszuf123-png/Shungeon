import { gameAudio } from './audio';
import {
  SKILLS,
  TOTAL_BOSSES,
  TOTAL_HIDDEN_PASSAGES,
  WEAPONS,
  createGyroZeppeliBossDef,
  getBiomeDisplayName,
} from './data';
import {
  GUILD_FLOOR2_Y,
  GUILD_MISSIONS,
  ISEKAI_IDLE_TRANSPORT_SECONDS,
  ISEKAI_ROOM_BOUNDS,
  buildIsekaiRoomInteractables,
  buildIsekaiRoomPlatforms,
  buyOrEquipWardrobeItem,
  buyOrEquipWeaponShopItem,
  buyPotionShopItem,
  canAccessGuildFloor2,
  canStartGuildMission,
  createBanditWave,
  createCarriageEscortInit,
  createDemonKingPurpleFlameCast,
  createDemonRealmWave,
  createGoblinDungeonWave,
  createGuildNpcs,
  createPotionShopNpcs,
  createThreeDemonKingsInit,
  createTownNpcs,
  createWardrobeNpcs,
  createWeaponsShopNpcs,
  promoteGuildRankAfterMission,
  rankIndex,
  resetPlayerForIsekai,
  shouldIdleTriggerIsekai,
  stepIsekaiNpcs,
} from './isekai';
import {
  drawCarriageEscortBackdrop,
  drawCoronationCutscene,
  drawDemonKings,
  drawDemonRealmBackdrop,
  drawDungeonDepthOverlay,
  drawGoblinDungeonBackdrop,
  drawIsekaiFloors,
  drawIsekaiGuildInterior,
  drawIsekaiNpcs,
  drawIsekaiPotionShopInterior,
  drawIsekaiTownBackdrop,
  drawIsekaiWardrobeInterior,
  drawIsekaiWeaponsShopInterior,
  drawPurpleFlameZones,
  drawRoyalCarriage,
} from './isekaiSprites';
import {
  createMegaBossInstance,
  pickMegaBossArchetype,
  shouldTriggerMegaBossGlitch,
} from './megaBoss';
import {
  PIXEL_H,
  PIXEL_W,
  drawBiomeBackdrop,
  drawCandles,
  drawDarkSanctumLighting,
  drawEnemy,
  drawInteractables,
  drawJoJoBoss,
  drawMegaBossCutscene,
  drawPeer,
  drawPlatforms,
  drawPokemonBossStage,
  drawProjectiles,
  drawStarPlatinumGuardian,
  drawVolcanoPitChasm,
  drawWarrior,
} from './pixelSprites';
import {
  BossBattleState,
  createBossBattleState,
  resolveBattleOrb,
  resolveBattlePotion,
  resolvePlayerBattleSkill,
  resolvePlayerBattleSword,
  startBattleEscape,
  startBattleRun,
  toBossBattleSnapshot,
  triggerBossCounterTurn,
} from './battle';
import {
  FLAME_ORB_HP_RATIO,
  WIND_ORB_DAMAGE_BONUS,
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
  getMonsterLevelMultiplier,
  grantKillStatPoints,
  recordBossFightProgress,
  rectsOverlap,
  rollMonsterOrbDrop,
  startWeaponAttack,
  stepPlayerPhysics,
  triggerPlayerDash,
  triggerSkillSlot,
  triggerSpinPokeDash,
  updateWarriorCustomization,
  useInventoryItem,
} from './rules';
import {
  BasteraSaveData,
  canPlayerEngageBoss,
  createSavePayload,
  normalizeLoadedSave,
  saveToLocalStorage,
} from './saveSystem';
import type {
  ActiveBoss,
  BiomeId,
  CarriageEscortState,
  CoronationCutsceneHud,
  DemonKingEntity,
  DialogueState,
  DungeonChoicePending,
  EnemyArchetype,
  EnemyState,
  GameStatus,
  GuildInvite,
  GuildMissionId,
  GuildRank,
  HudSnapshot,
  InteractableProp,
  InventoryItem,
  IsekaiMissionHud,
  IsekaiNpc,
  MegaBossArchetype,
  MegaCutsceneHud,
  MegaSkillAnimStyle,
  MultiplayerPeer,
  OnlineAdventurer,
  OrbId,
  OnlineWorldSummary,
  Platform,
  PlayerState,
  Projectile,
  PurpleFlameZone,
  RealmMode,
  SkillId,
  StatKey,
  WarriorCustomization,
  WeaponId,
  WorldRole,
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
  private secretCaption: { title: string; detail: string } | null = null;
  private secretCaptionTimer = 0;
  private darkSanctumDiscovered = false;

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
  private pendingSanctuaryCallback: (() => void) | null = null;
  private postBossInputLockTimer = 0;

  // Mega Boss / Gyro Zeppeli Cutscene + Chunk 41 bridge volcano pit fall
  private megaCutscene: {
    archetype: MegaBossArchetype | 'gyro_zeppeli';
    pendingBoss: ActiveBoss;
    timer: number;
    duration: number;
  } | null = null;
  private volcanoBridgeFallTriggered = false;
  private volcanoBridgeFallTimer = 0;

  // Isekai Fantasy World, Guild, Wardrobe, Shops & Demon King Climax State
  private realm: RealmMode = 'citadel';
  private guildRank: GuildRank = 'F';
  private bRankEscortsCompleted = 0;
  private dungeonDepth = 1;
  private dungeonChoicePending: DungeonChoicePending | null = null;
  private unlockedWardrobe: string[] = ['outfit_knight_plate', 'hat_helm'];
  private foughtIsekaiEnemies: EnemyArchetype[] = [];
  private crownUnlocked = false;
  private gyroDefeated = false;
  private isekaiCompleted = false;
  private isekaiPortalOpen = false;
  private activeMissionId: GuildMissionId | null = null;
  private isekaiNpcs: IsekaiNpc[] = [];
  private isekaiPlatforms: Platform[] = [];
  private isekaiInteractables: InteractableProp[] = [];
  private isekaiEnemies: EnemyState[] = [];
  private isekaiKillsDone = 0;
  private isekaiKillsRequired = 0;
  private isekaiWaveIndex = 0;
  private carriageEscort: CarriageEscortState | null = null;
  private demonKings: DemonKingEntity[] = [];
  private purpleFlameZones: PurpleFlameZone[] = [];
  private activeCastBanner: string | null = null;
  private activeCastBannerTimer = 0;
  private coronationCutscene: {
    timer: number;
    duration: number;
  } | null = null;
  private onlineAdventurers: OnlineAdventurer[] = [];
  private pendingGuildInvites: GuildInvite[] = [];
  private lastSlashInputTime = -10;
  private lastDashInputTime = -10;
  private meleeHitIds = new Set<string>();
  private uiCallbacks: {
    onOpenGuild?: (floor: 1 | 2) => void;
    onOpenWardrobe?: () => void;
    onOpenPotionShop?: () => void;
    onOpenWeaponsShop?: () => void;
  } = {};

  // Multiplayer Co-op World Rooms & Saving
  private worldId = 'LOCAL';
  private ownWorldId = 'LOCAL';
  private worldRole: WorldRole = 'host';
  private worldHostName: string | null = null;
  private isWorldPublic = true;
  private onlineWorlds: OnlineWorldSummary[] = [];
  private worldPlayerCount = 1;
  private hostDefeatedBosses = new Set<number>();
  private guestBossWarnCooldown = 0;
  private lastSavedAt: string | null = null;

  // Dash, Star Platinum ORA Barrage, 5-Boss 60s Cooldown & Frame Chunk Caches
  private starPlatinumTimer = 0;
  private starPlatinumTickTimer = 0;
  private bossesFoughtStreak = 0;
  private bossCooldownSeconds = 0;
  private cachedActiveChunks: GeneratedChunk[] = [];
  private cachedActivePlatforms: Platform[] = [];
  private chunksDirty = true;

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
    if (paused) this.clearAllInputs(false);
  }

  public setUiCallbacks(cbs: {
    onOpenGuild?: (floor: 1 | 2) => void;
    onOpenWardrobe?: () => void;
    onOpenPotionShop?: () => void;
    onOpenWeaponsShop?: () => void;
  }): void {
    this.uiCallbacks = cbs;
  }

  private clearAllInputs(stopHorizontal = true): void {
    this.heldKeys.clear();
    this.justPressed.clear();
    this.virtualInput.left = false;
    this.virtualInput.right = false;
    this.virtualInput.jumpHeld = false;
    if (stopHorizontal) {
      this.player.vx = 0;
    }
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
    const bodyState = next === 'victory' ? 'gameover' : next;
    document.body.dataset.state = bodyState;
    if (next === 'paused' || next === 'gameover' || next === 'victory' || next === 'title') {
      gameAudio.stopMusic();
      this.clearAllInputs(true);
    } else if (next === 'playing') {
      gameAudio.unlock();
      this.clearAllInputs(true);
      const activeBoss = this.realm === 'citadel' ? this.getActiveNearbyBoss() : null;
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
    this.secretCaption = null;
    this.secretCaptionTimer = 0;
    this.darkSanctumDiscovered = false;
    this.pendingSanctuaryCallback = null;
    this.megaCutscene = null;
    this.volcanoBridgeFallTriggered = false;
    this.volcanoBridgeFallTimer = 0;
    this.postBossInputLockTimer = 0;
    this.starPlatinumTimer = 0;
    this.starPlatinumTickTimer = 0;
    this.bossesFoughtStreak = 0;
    this.bossCooldownSeconds = 0;

    // Reset Isekai progression
    this.realm = 'citadel';
    this.guildRank = 'F';
    this.bRankEscortsCompleted = 0;
    this.dungeonDepth = 1;
    this.dungeonChoicePending = null;
    this.lastSlashInputTime = -10;
    this.lastDashInputTime = -10;
    this.meleeHitIds.clear();
    this.unlockedWardrobe = ['outfit_knight_plate', 'hat_helm'];
    this.foughtIsekaiEnemies = [];
    this.crownUnlocked = false;
    this.gyroDefeated = false;
    this.isekaiCompleted = false;
    this.isekaiPortalOpen = false;
    this.activeMissionId = null;
    this.isekaiNpcs = [];
    this.isekaiPlatforms = [];
    this.isekaiInteractables = [];
    this.isekaiEnemies = [];
    this.isekaiKillsDone = 0;
    this.isekaiKillsRequired = 0;
    this.isekaiWaveIndex = 0;
    this.carriageEscort = null;
    this.demonKings = [];
    this.purpleFlameZones = [];
    this.activeCastBanner = null;
    this.activeCastBannerTimer = 0;
    this.coronationCutscene = null;

    this.chunksDirty = true;
    this.ensureChunksAround(0);
    this.camX = 0;

    this.setStatus('playing');
    this.syncHostWorldMeta();
    this.openDialogue(
      'Warrior',
      'warrior',
      '#fbbf24',
      [
        'Well, the royal dungeon locked the front door again. Time to climb toward Boss #100 & Gyro Zeppeli!',
        'Inspect thrones [F], smash cracked bricks [J], press [Shift] to Dash, and unleash Star Platinum ORA ORA [3]!',
      ],
    );
  }

  public getSavePayload(saveId = 'autosave'): BasteraSaveData {
    return createSavePayload({
      saveId,
      playerName: this.playerName,
      biome: this.getCurrentBiome(),
      player: this.player,
      inventory: this.inventory,
      defeatedBosses: this.defeatedBosses,
      discoveredSecrets: this.discoveredSecrets,
      openedChests: this.openedChests,
      volcanoBridgeFallTriggered: this.volcanoBridgeFallTriggered,
      darkSanctumDiscovered: this.darkSanctumDiscovered,
      bossFoughtStreak: this.bossesFoughtStreak,
      bossCooldownSeconds: Math.ceil(this.bossCooldownSeconds),
      realm: this.realm,
      guildRank: this.guildRank,
      bRankEscortsCompleted: this.bRankEscortsCompleted,
      unlockedWardrobe: this.unlockedWardrobe,
      foughtIsekaiEnemies: this.foughtIsekaiEnemies,
      crownUnlocked: this.crownUnlocked,
      gyroDefeated: this.gyroDefeated,
      isekaiCompleted: this.isekaiCompleted,
    });
  }

  public async saveCurrentGame(saveId = 'autosave', silent = false): Promise<{ ok: boolean; savedAt: string }> {
    const payload = this.getSavePayload(saveId);
    saveToLocalStorage(payload);
    this.lastSavedAt = payload.savedAt;
    try {
      const resp = await fetch('/api/saves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok && !silent) {
        this.showAnnouncement('Saved locally (offline backup).');
      }
    } catch {
      // localStorage backup still persisted!
    }
    if (!silent) {
      gameAudio.playSecretFound();
      this.showAnnouncement(`Game saved (${payload.playerName} · Boss ${payload.player.bossesDefeated}/120)!`);
    }
    this.emitHud(true);
    return { ok: true, savedAt: payload.savedAt };
  }

  public loadFromSave(rawSave: BasteraSaveData): boolean {
    const clean = normalizeLoadedSave(rawSave);
    if (!clean) return false;
    this.playerName = clean.playerName;
    this.player = clean.player;
    this.inventory = clean.inventory;
    this.defeatedBosses = new Set(clean.defeatedBosses);
    this.discoveredSecrets = new Set(clean.discoveredSecrets);
    this.openedChests = new Set(clean.openedChests);
    this.volcanoBridgeFallTriggered = clean.volcanoBridgeFallTriggered;
    this.darkSanctumDiscovered = clean.darkSanctumDiscovered;
    this.bossesFoughtStreak = clean.bossFoughtStreak ?? 0;
    this.bossCooldownSeconds = clean.bossCooldownSeconds ?? 0;
    this.realm = clean.realm ?? 'citadel';
    this.guildRank = clean.guildRank ?? 'F';
    this.bRankEscortsCompleted = clean.bRankEscortsCompleted ?? 0;
    this.dungeonDepth = 1;
    this.dungeonChoicePending = null;
    this.unlockedWardrobe = clean.unlockedWardrobe ? [...clean.unlockedWardrobe] : ['outfit_knight_plate', 'hat_helm'];
    this.foughtIsekaiEnemies = clean.foughtIsekaiEnemies ? [...clean.foughtIsekaiEnemies] : [];
    this.crownUnlocked = Boolean(clean.crownUnlocked);
    this.gyroDefeated = Boolean(clean.gyroDefeated);
    this.isekaiCompleted = Boolean(clean.isekaiCompleted);
    this.isekaiPortalOpen = this.gyroDefeated || this.realm !== 'citadel';
    this.starPlatinumTimer = 0;
    this.starPlatinumTickTimer = 0;
    this.lastSavedAt = clean.savedAt;

    this.chunks.clear();
    this.chunksDirty = true;
    this.projectiles = [];
    this.bossBattle = null;
    this.megaCutscene = null;
    this.coronationCutscene = null;
    this.volcanoBridgeFallTimer = 0;
    this.postBossInputLockTimer = 0.25;
    this.bossEncounterCooldown = 1.5;

    if (this.realm !== 'citadel') {
      const targetHub: RealmMode =
        this.realm === 'isekai_guild' ||
        this.realm === 'isekai_wardrobe' ||
        this.realm === 'isekai_potion_shop' ||
        this.realm === 'isekai_weapons_shop'
          ? this.realm
          : 'isekai_town';
      this.enterIsekaiRoom(targetHub, targetHub === 'isekai_town' ? clean.player.x : 96);
    } else {
      this.isekaiEnemies = [];
      this.carriageEscort = null;
      this.demonKings = [];
      this.purpleFlameZones = [];
      this.activeMissionId = null;
      this.ensureChunksAround(this.player.x);
      this.camX = Math.max(-640, this.player.x - PIXEL_W * 0.34);
    }

    if (this.worldRole === 'guest') {
      this.leaveJoinedWorld();
    } else {
      this.syncHostWorldMeta();
    }
    this.setStatus('playing');
    gameAudio.playSecretFound();
    this.showAnnouncement(`Loaded ${clean.playerName}'s saved world!`);
    this.emitHud(true);
    return true;
  }

  public joinWorld(targetWorldId: string): void {
    const clean = targetWorldId.trim().toUpperCase();
    if (!clean) return;
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.showAnnouncement('Multiplayer server offline — cannot join world.');
      return;
    }
    this.ws.send(JSON.stringify({ type: 'world:join', worldId: clean }));
  }

  public leaveJoinedWorld(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.worldRole = 'host';
      this.worldHostName = null;
      this.worldId = this.ownWorldId;
      this.emitHud(true);
      return;
    }
    this.ws.send(JSON.stringify({ type: 'world:leave' }));
  }

  public setWorldPublic(isPublic: boolean): void {
    this.isWorldPublic = isPublic;
    this.syncHostWorldMeta();
    this.emitHud(true);
  }

  public refreshOnlineWorlds(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'world:list' }));
    }
  }

  private syncHostWorldMeta(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        type: 'world:host',
        hostName: this.playerName,
        isPublic: this.isWorldPublic,
        biome: this.getCurrentBiome(),
        bossesDefeated: this.defeatedBosses.size,
        defeatedBosses: Array.from(this.defeatedBosses),
      }),
    );
  }

  public restartFromCheckpoint(): void {
    this.bossBattle = null;
    this.megaCutscene = null;
    this.coronationCutscene = null;
    this.bossEncounterCooldown = 1.5;
    this.postBossInputLockTimer = 0.35;
    this.clearAllInputs(true);
    this.player.hp = this.player.maxHp;
    this.player.stamina = this.player.maxStamina;
    this.player.vx = 0;
    this.player.vy = 0;
    this.projectiles = [];
    if (this.realm !== 'citadel') {
      this.enterIsekaiRoom('isekai_guild', 120);
      this.setStatus('playing');
      this.showAnnouncement('Returned safely to Solaris Adventure Guild!');
      return;
    }
    this.player.x = this.player.highestCheckpointX;
    this.player.y = FLOOR_Y - this.player.h - 4;
    this.ensureChunksAround(this.player.x);
    this.setStatus('playing');
  }

  public warpToCheckpoint(cpIndex: number): void {
    const cps = getBiomeCheckpointList(this.player.highestCheckpointIndex);
    const target = cps[cpIndex];
    if (!target || !target.reached) return;
    this.realm = 'citadel';
    this.activeMissionId = null;
    this.isekaiEnemies = [];
    this.carriageEscort = null;
    this.demonKings = [];
    this.purpleFlameZones = [];
    this.coronationCutscene = null;
    this.bossBattle = null;
    this.megaCutscene = null;
    this.bossEncounterCooldown = 1.5;
    this.postBossInputLockTimer = 0.35;
    this.clearAllInputs(true);
    this.player.x = target.x;
    this.player.y = FLOOR_Y - this.player.h - 4;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.hp = this.player.maxHp;
    this.projectiles = [];
    this.ensureChunksAround(this.player.x);
    this.camX = Math.max(-640, this.player.x - PIXEL_W * 0.32);
    this.setStatus('playing');
    this.emitHud();
  }

  public buyOrEquipWardrobeItemById(itemId: string): { ok: boolean; message: string } {
    const res = buyOrEquipWardrobeItem(this.player, this.unlockedWardrobe, itemId, this.crownUnlocked);
    if (res.ok) {
      gameAudio.playSecretFound();
    }
    this.showAnnouncement(res.message);
    this.emitHud(true);
    return res;
  }

  public buyPotionItem(itemId: string, drinkNow = false): { ok: boolean; message: string } {
    const res = buyPotionShopItem(this.player, this.inventory, itemId);
    if (!res.ok) {
      this.showAnnouncement(res.message);
      this.emitHud(true);
      return res;
    }
    if (drinkNow) {
      const used = useInventoryItem(this.player, this.inventory, itemId);
      gameAudio.playSecretFound();
      const msg = used.ok ? `Purchased & Drank! ${used.message}` : res.message;
      this.showAnnouncement(msg);
      this.emitHud(true);
      return { ok: true, message: msg };
    }
    gameAudio.playSecretFound();
    this.showAnnouncement(res.message);
    this.emitHud(true);
    return res;
  }

  public buyOrEquipShopWeapon(weaponId: WeaponId): { ok: boolean; message: string } {
    const res = buyOrEquipWeaponShopItem(this.player, weaponId);
    if (res.ok) {
      gameAudio.playSecretFound();
    }
    this.showAnnouncement(res.message);
    this.emitHud(true);
    return res;
  }

  public chooseReturnToGuildFromDungeon(): void {
    const pending = this.dungeonChoicePending;
    this.dungeonChoicePending = null;
    this.dungeonDepth = 1;
    this.activeMissionId = null;
    this.isekaiEnemies = [];
    this.purpleFlameZones = [];
    this.projectiles = [];
    this.enterIsekaiRoom('isekai_guild', 160);
    gameAudio.playSecretFound();
    if (pending) {
      this.showSecretCaption(
        pending.promotedRank ? `PROMOTED TO ${pending.promotedRank}-RANK!` : `QUEST CLEARED: ${pending.missionTitle}`,
        `+${pending.rewardGold}G & +6 Stat Points earned! Speak to Receptionist Luna for your next Rank Mission!`,
      );
      this.openDialogue('Receptionist Luna', 'npc', '#38bdf8', [
        `Splendid work! "${pending.missionTitle}" is officially stamped COMPLETE!`,
        pending.promotedRank
          ? pending.promotedRank === 'B'
            ? 'You reached B-Rank! The Grand Staircase to the 2nd Floor Command Hall is now OPEN!'
            : `Here is your gleaming ${pending.promotedRank}-Rank Guild Badge! New missions await!`
          : `Reward +${pending.rewardGold}G delivered! Ready whenever you wish to venture out again.`,
      ]);
    }
    void this.saveCurrentGame('autosave', true);
    this.emitHud(true);
  }

  public chooseStayDeeperInDungeon(): void {
    const pending = this.dungeonChoicePending;
    if (!pending) return;
    this.dungeonChoicePending = null;
    this.dungeonDepth = pending.nextDepth;
    this.realm = pending.realm;
    this.activeMissionId = pending.missionId;
    this.isekaiEnemies =
      pending.realm === 'demon_realm'
        ? createDemonRealmWave(this.dungeonDepth)
        : createGoblinDungeonWave(pending.missionId, this.dungeonDepth - 1, this.dungeonDepth);
    this.isekaiKillsDone = 0;
    this.isekaiKillsRequired = this.isekaiEnemies.length;
    this.player.x = 76;
    this.player.y = FLOOR_Y - this.player.h;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.stamina = this.player.maxStamina;
    this.camX = 0;
    gameAudio.playBattleEncounterStinger();
    this.showSecretCaption(
      `DESCENDING TO DEPTH ${this.dungeonDepth}`,
      `Darkness thickens! A powerful Depth-${this.dungeonDepth} Dungeon Boss awaits inside!`,
    );
    this.emitHud(true);
  }

  public sendGuildInvite(targetPeerId: string, missionId: GuildMissionId): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.showAnnouncement('Adventurer Guild online relay is offline — start Solo Mission instead!');
      return;
    }
    this.ws.send(JSON.stringify({ type: 'guild:invite', targetPeerId, missionId }));
    const adv = this.onlineAdventurers.find((a) => a.id === targetPeerId);
    this.showAnnouncement(`Sent co-op Guild Quest invite to ${adv?.name ?? 'Adventurer'}!`);
  }

  public respondToGuildInvite(inviteId: string, accept: boolean): void {
    const inv = this.pendingGuildInvites.find((i) => i.inviteId === inviteId);
    this.pendingGuildInvites = this.pendingGuildInvites.filter((i) => i.inviteId !== inviteId);
    if (this.ws && this.ws.readyState === WebSocket.OPEN && inv) {
      this.ws.send(JSON.stringify({ type: 'guild:invite_response', inviteId, accept }));
    }
    if (accept && inv) {
      this.startGuildMission(inv.missionId, false);
    }
    this.emitHud(true);
  }

  public enterIsekaiTown(reason: 'gyro' | 'idle' = 'gyro'): void {
    this.bossBattle = null;
    this.megaCutscene = null;
    this.coronationCutscene = null;
    this.projectiles = [];
    this.dialogue = null;
    resetPlayerForIsekai(this.player, this.inventory);
    this.guildRank = 'F';
    this.bRankEscortsCompleted = 0;
    this.dungeonDepth = 1;
    this.dungeonChoicePending = null;
    this.isekaiPortalOpen = true;
    this.enterIsekaiRoom('isekai_town', 110);
    gameAudio.playSecretFound();
    this.showSecretCaption(
      'TRANSFERRED TO SOLARIS ISEKAI REALM',
      reason === 'idle'
        ? 'You stood still for 2 minutes — a Dimensional Gate whisked you into Axel-Solaris Town! All stats reset; F-Rank Badge issued.'
        : 'After besting Gyro Zeppeli, the Dimensional Gate carried you to Axel-Solaris Town! All stats reset; F-Rank Badge issued.',
    );
    this.openDialogue('Guild Herald Aria', 'npc', '#38bdf8', [
      'Welcome, Reincarnated Knight, to sunny Solaris Town! Here is your porcelain F-Rank Adventurer Badge.',
      'All your Citadel stats have reset, though your weapons & 3 combat skills remain. Visit the Guild, Potion Shop, Wardrobe, or Wide Armory!',
    ]);
    void this.saveCurrentGame('autosave', true);
    this.emitHud(true);
  }

  public enterIsekaiRoom(room: RealmMode, spawnX = 96): void {
    if (room === 'citadel') {
      this.returnToCitadel();
      return;
    }
    this.realm = room;
    this.bossBattle = null;
    this.megaCutscene = null;
    this.activeMissionId = null;
    this.dungeonDepth = 1;
    this.dungeonChoicePending = null;
    this.isekaiEnemies = [];
    this.carriageEscort = null;
    this.demonKings = [];
    this.purpleFlameZones = [];
    this.activeCastBanner = null;
    this.projectiles = [];
    this.isekaiPlatforms = buildIsekaiRoomPlatforms(room);
    this.isekaiInteractables = buildIsekaiRoomInteractables(room);
    this.isekaiNpcs =
      room === 'isekai_town'
        ? createTownNpcs(this.crownUnlocked)
        : room === 'isekai_guild'
          ? createGuildNpcs(this.crownUnlocked)
          : room === 'isekai_wardrobe'
            ? createWardrobeNpcs()
            : room === 'isekai_potion_shop'
              ? createPotionShopNpcs()
              : room === 'isekai_weapons_shop'
                ? createWeaponsShopNpcs()
                : [];

    const bounds = ISEKAI_ROOM_BOUNDS[room];
    this.player.x = Math.max(bounds.minX + 12, Math.min(bounds.maxX - 32, spawnX));
    this.player.y = FLOOR_Y - this.player.h;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.hp = this.player.maxHp;
    this.player.stamina = this.player.maxStamina;
    this.camX = Math.max(0, this.player.x - PIXEL_W * 0.34);
    this.syncHostWorldMeta();
    this.emitHud(true);
  }

  public startGuildMission(missionId: GuildMissionId, broadcastToParty = false): { ok: boolean; reason?: string } {
    const mission = GUILD_MISSIONS.find((m) => m.id === missionId);
    if (!mission) return { ok: false, reason: 'Unknown guild mission.' };
    if (!canStartGuildMission(this.guildRank, missionId)) {
      const msg =
        mission.floorReq === 2 && !canAccessGuildFloor2(this.guildRank)
          ? `2nd Floor Locked! Reach B-Rank first (current: ${this.guildRank}-Rank).`
          : `Requires ${mission.rankReq}-Rank Badge (current: ${this.guildRank}-Rank).`;
      this.showAnnouncement(msg);
      return { ok: false, reason: msg };
    }

    this.realm = mission.realm;
    this.activeMissionId = mission.id;
    this.dungeonDepth = 1;
    this.dungeonChoicePending = null;
    this.meleeHitIds.clear();
    this.bossBattle = null;
    this.megaCutscene = null;
    this.coronationCutscene = null;
    this.dialogue = null;
    this.projectiles = [];
    this.purpleFlameZones = [];
    this.activeCastBanner = null;
    this.activeCastBannerTimer = 0;
    this.isekaiNpcs = [];
    this.isekaiInteractables = [];
    this.isekaiPlatforms = buildIsekaiRoomPlatforms(mission.realm);
    this.isekaiKillsDone = 0;
    this.isekaiKillsRequired = mission.killsRequired;
    this.isekaiWaveIndex = 0;

    if (mission.realm === 'goblin_dungeon') {
      this.carriageEscort = null;
      this.demonKings = [];
      this.isekaiEnemies = createGoblinDungeonWave(mission.id, 0, this.dungeonDepth);
      this.isekaiKillsRequired = this.isekaiEnemies.length;
    } else if (mission.realm === 'carriage_escort') {
      const variant = this.bRankEscortsCompleted;
      this.carriageEscort = createCarriageEscortInit(variant);
      this.demonKings = [];
      this.isekaiEnemies = createBanditWave(this.carriageEscort.x, 0, variant);
      this.carriageEscort.wavesSpawned = 1;
    } else if (mission.realm === 'demon_realm') {
      this.carriageEscort = null;
      this.demonKings = [];
      this.isekaiEnemies = createDemonRealmWave(this.dungeonDepth);
      this.isekaiKillsRequired = this.isekaiEnemies.length;
    } else if (mission.realm === 'demon_king_arena') {
      this.carriageEscort = null;
      const init = createThreeDemonKingsInit(this.foughtIsekaiEnemies);
      this.demonKings = init.demonKings;
      this.isekaiEnemies = init.minions;
      this.isekaiKillsRequired = this.demonKings.length;
    }

    this.player.x = 76;
    this.player.y = FLOOR_Y - this.player.h;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.hp = this.player.maxHp;
    this.player.stamina = this.player.maxStamina;
    this.camX = 0;

    if (broadcastToParty && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'guild:mission_start', missionId }));
    }

    gameAudio.playBattleEncounterStinger();
    this.showAnnouncement(`QUEST STARTED: [${mission.rankReq}-RANK] ${mission.title}!`);
    this.syncHostWorldMeta();
    this.emitHud(true);
    return { ok: true };
  }

  public returnToCitadel(): void {
    this.realm = 'citadel';
    this.activeMissionId = null;
    this.isekaiNpcs = [];
    this.isekaiPlatforms = [];
    this.isekaiInteractables = [];
    this.isekaiEnemies = [];
    this.carriageEscort = null;
    this.demonKings = [];
    this.purpleFlameZones = [];
    this.activeCastBanner = null;
    this.coronationCutscene = null;
    this.projectiles = [];
    this.player.x = this.player.highestCheckpointX;
    this.player.y = FLOOR_Y - this.player.h;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.idleTimer = 0;
    this.chunks.clear();
    this.chunksDirty = true;
    this.ensureChunksAround(this.player.x);
    this.camX = Math.max(-640, this.player.x - PIXEL_W * 0.34);
    this.syncHostWorldMeta();
    this.showAnnouncement('Returned to Bastera Endless Citadel!');
    this.emitHud(true);
  }

  public setPlayerName(name: string): void {
    const clean = name.trim().slice(0, 18);
    if (clean) {
      this.playerName = clean;
      this.syncHostWorldMeta();
    }
  }

  public triggerVirtualKey(
    action: 'left' | 'right' | 'jump' | 'dash' | 'attack' | 'interact' | 'skill0' | 'skill1' | 'skill2',
    pressed: boolean,
  ): void {
    if (action === 'left') this.virtualInput.left = pressed;
    else if (action === 'right') this.virtualInput.right = pressed;
    else if (action === 'jump') {
      if (pressed && !this.virtualInput.jumpHeld) this.justPressed.add('Space');
      this.virtualInput.jumpHeld = pressed;
    } else if (pressed) {
      if (action === 'dash') this.justPressed.add('ShiftLeft');
      if (action === 'attack') this.justPressed.add('KeyJ');
      if (action === 'interact') this.justPressed.add('KeyF');
      if (action === 'skill0') this.justPressed.add('Digit1');
      if (action === 'skill1') this.justPressed.add('Digit2');
      if (action === 'skill2') this.justPressed.add('Digit3');
    }
  }

  public performDash(): void {
    if (
      this.status !== 'playing' ||
      this.modalPaused ||
      this.bossBattle ||
      this.megaCutscene ||
      this.coronationCutscene ||
      this.dungeonChoicePending ||
      this.volcanoBridgeFallTimer > 0
    ) {
      return;
    }
    this.player.idleTimer = 0;
    if (this.heldKeys.has('ArrowLeft') || this.heldKeys.has('KeyA') || this.virtualInput.left) {
      this.player.facing = -1;
    } else if (this.heldKeys.has('ArrowRight') || this.heldKeys.has('KeyD') || this.virtualInput.right) {
      this.player.facing = 1;
    }
    if (this.simTime - this.lastSlashInputTime <= 0.28) {
      this.executeSpinPokeDash();
      return;
    }
    this.lastDashInputTime = this.simTime;
    if (triggerPlayerDash(this.player)) {
      gameAudio.playSkill('blade_dash');
      this.spawnAfterimage('#fbbf24');
      this.spawnBurst(this.player.x + 8, this.player.y + 14, 10, '#fbbf24');
      this.speedLineTimer = 0.28;
      this.emitHud();
    }
  }

  private executeSpinPokeDash(): void {
    if (this.dungeonChoicePending) return;
    if (triggerSpinPokeDash(this.player)) {
      this.lastSlashInputTime = -10;
      this.lastDashInputTime = -10;
      this.meleeHitIds.clear();
      gameAudio.playSkill('blade_dash');
      gameAudio.playSwordSlash(this.player.equippedWeapon, 2);
      this.spawnAfterimage('#34d399');
      this.spawnBurst(this.player.x + 8, this.player.y + 14, 18, '#6ee7b7');
      this.spawnFloatingText(this.player.x + 8, this.player.y - 12, 'WIND SPIN POKE!', '#34d399');
      this.speedLineTimer = 0.36;
      const chunks = this.realm === 'citadel' ? this.getActiveChunks() : [];
      this.resolveMeleeHits(chunks, 1.35);
      this.emitHud();
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
    } else if (res.reason) {
      this.showAnnouncement(res.reason);
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

  public setWarriorCustomization(patch: Partial<WarriorCustomization>): void {
    updateWarriorCustomization(this.player, patch);
    this.emitHud(true);
  }

  public triggerSkillButton(slotIndex: 0 | 1 | 2): void {
    if (this.status !== 'playing') return;
    if (this.bossBattle) {
      this.battleUseSkill(slotIndex);
      return;
    }
    this.executeSkill(slotIndex);
  }

  public battleAttackWeapon(): void {
    if (!this.bossBattle || this.status !== 'playing') return;
    const res = resolvePlayerBattleSword(this.bossBattle, this.player);
    if (res.ok) {
      gameAudio.playSwordSlash(this.player.equippedWeapon, 1);
      gameAudio.playHit(false);
      this.trauma = Math.min(1, this.trauma + 0.35);
      this.emitHud(true);
    }
  }

  public battleUseSkill(slotIndex: 0 | 1 | 2): void {
    if (!this.bossBattle || this.status !== 'playing') return;
    const res = resolvePlayerBattleSkill(this.bossBattle, this.player, slotIndex);
    if (res.ok) {
      gameAudio.playSkill(res.skillId);
      gameAudio.playSlashClaw(true);
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

  public battleUseOrb(orbId: OrbId): void {
    if (this.status !== 'playing') return;
    if (this.bossBattle) {
      const res = resolveBattleOrb(this.bossBattle, this.inventory, orbId);
      if (res.ok) {
        gameAudio.playSkill(
          orbId === 'orb_flame'
            ? 'candlefire_wave'
            : orbId === 'orb_electric'
              ? 'chrono_freeze'
              : 'blade_dash',
        );
        this.trauma = Math.min(1, this.trauma + 0.45);
      } else {
        this.showAnnouncement(res.message);
      }
      this.emitHud(true);
      return;
    }

    // Real-time Demon King Arena bossfight orb support
    if (this.realm === 'demon_king_arena' && this.demonKings.length > 0) {
      const orbItem = this.inventory.find((i) => i.id === orbId);
      if (!orbItem || orbItem.count <= 0) {
        this.showAnnouncement('No orbs of that element left!');
        return;
      }
      const aliveKings = this.demonKings.filter((dk) => !dk.defeated && dk.hp > 0);
      if (aliveKings.length === 0) return;

      orbItem.count -= 1;
      const targetKing = [...aliveKings].sort(
        (a, b) => Math.abs(a.x - this.player.x) - Math.abs(b.x - this.player.x),
      )[0];

      if (orbId === 'orb_flame') {
        const dmg = Math.max(1, Math.round(targetKing.maxHp * FLAME_ORB_HP_RATIO));
        targetKing.hp = Math.max(0, targetKing.hp - dmg);
        targetKing.hitFlash = 0.25;
        this.spawnFloatingText(targetKing.x + targetKing.w / 2, targetKing.y - 14, `-${dmg} (25% HP)`, '#f97316');
        this.spawnBurst(targetKing.x + targetKing.w / 2, targetKing.y + 18, 20, '#f97316');
        this.showAnnouncement(`Flame Orb scorched ${targetKing.name} for ${dmg} DMG!`);
        gameAudio.playSkill('candlefire_wave');
        if (targetKing.hp <= 0) {
          targetKing.defeated = true;
          this.onDemonKingDefeated(targetKing);
        }
      } else if (orbId === 'orb_wind') {
        for (const dk of aliveKings) {
          dk.windVulnerable = true;
          this.spawnBurst(dk.x + dk.w / 2, dk.y + 16, 12, '#2dd4bf');
        }
        this.showAnnouncement('Wind Orb: Demon Kings now take +30% EXTRA DMG!');
        gameAudio.playSkill('blade_dash');
      } else {
        for (const dk of aliveKings) {
          dk.stunTimer = 2.6;
          this.spawnBurst(dk.x + dk.w / 2, dk.y + 16, 12, '#facc15');
        }
        this.showAnnouncement('Electrical Orb: Demon Kings STUNNED!');
        gameAudio.playSkill('chrono_freeze');
      }
      this.trauma = Math.min(1, this.trauma + 0.35);
      this.emitHud(true);
    }
  }

  public battleRun(): void {
    if (!this.bossBattle || this.status !== 'playing') return;
    if (startBattleRun(this.bossBattle)) {
      gameAudio.playJump();
      this.emitHud(true);
    }
  }

  public battleRetreatToSanctuary(onOpened?: () => void): void {
    if (!this.bossBattle || this.status !== 'playing') return;
    this.pendingSanctuaryCallback = onOpened ?? null;
    if (startBattleRun(this.bossBattle)) {
      gameAudio.playJump();
      this.emitHud(true);
    } else if (this.bossBattle.phase === 'run_anim') {
      // Already retreating — callback will trigger at end of run_anim
      this.emitHud(true);
    } else {
      const bossX = this.bossBattle.boss.x;
      this.bossBattle = null;
      this.bossEncounterCooldown = 4.0;
      this.postBossInputLockTimer = 0.45;
      this.clearAllInputs(true);
      this.player.x = Math.max(24, bossX - 210);
      this.player.y = FLOOR_Y - this.player.h - 4;
      this.camX = Math.max(-640, this.player.x - PIXEL_W * 0.34);
      this.completeBossEncounterProgress();
      gameAudio.startMusic(this.getCurrentBiome(), null);
      this.emitHud(true);
      const cb = this.pendingSanctuaryCallback;
      this.pendingSanctuaryCallback = null;
      cb?.();
    }
  }

  public battleEscape(): void {
    if (!this.bossBattle || this.status !== 'playing') return;
    if (startBattleEscape(this.bossBattle)) {
      gameAudio.playSecretFound();
      this.emitHud(true);
    }
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
    this.clearAllInputs(true);
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
    this.emitHud();
  }

  private showAnnouncement(text: string): void {
    this.announcement = text;
    this.announcementTimer = 2.8;
    this.emitHud();
  }

  private showSecretCaption(title: string, detail: string): void {
    this.secretCaption = { title, detail };
    this.secretCaptionTimer = 4.6;
    this.emitHud(true);
  }

  private getCurrentChunkIndex(): number {
    return Math.floor(this.player.x / CHUNK_WIDTH);
  }

  private getCurrentBiome(): BiomeId {
    return getBiomeForChunk(this.getCurrentChunkIndex());
  }

  private getEffectiveDefeatedBosses(): Set<number> {
    return this.worldRole === 'guest' ? this.hostDefeatedBosses : this.defeatedBosses;
  }

  private ensureChunksAround(worldX: number): void {
    const center = Math.floor(worldX / CHUNK_WIDTH);
    const minC = Math.max(-1, center - 1);
    const maxC = center + 2;
    const defeatedSet = this.getEffectiveDefeatedBosses();
    const monsterMult = getMonsterLevelMultiplier(this.player.level);
    let changed = false;

    for (let c = minC; c <= maxC; c++) {
      if (!this.chunks.has(c)) {
        const chunk = generateChunk(c);
        if (chunk.boss && chunk.boss.def.isGyroBoss) {
          const gyroDef = createGyroZeppeliBossDef(
            this.player.maxHp,
            calculateAttackDamage(this.player, 1, false),
          );
          chunk.boss.def = gyroDef;
          chunk.boss.maxHp = gyroDef.maxHp;
          chunk.boss.hp = gyroDef.maxHp;
        }
        for (const en of chunk.enemies) {
          en.maxHp = Math.round(en.maxHp * monsterMult);
          en.hp = en.maxHp;
        }
        if (chunk.boss && defeatedSet.has(chunk.boss.def.index)) {
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
        if (
          this.isekaiPortalOpen &&
          c === Math.floor(this.player.x / CHUNK_WIDTH) &&
          !chunk.interactables.some((p) => p.kind === 'isekai_portal')
        ) {
          chunk.interactables.push({
            id: `isekai_portal_c${c}`,
            x: chunk.startX + 440,
            y: FLOOR_Y - 56,
            w: 34,
            h: 56,
            kind: 'isekai_portal',
            label: 'Dimensional Portal -> Isekai Solaris Town',
            dialogue: ['A swirling Dimensional Gate linking Bastera Citadel to Solaris Isekai Town!'],
            speaker: 'Dimensional Gate',
            activated: false,
          });
        }
        this.chunks.set(c, chunk);
        changed = true;
      }
    }
    for (const key of this.chunks.keys()) {
      if (key < minC - 1 || key > maxC + 1) {
        this.chunks.delete(key);
        changed = true;
      }
    }
    if (changed) {
      this.chunksDirty = true;
    }
  }

  private rebuildChunkCachesIfNeeded(): void {
    if (!this.chunksDirty) return;
    this.chunksDirty = false;
    this.cachedActiveChunks = Array.from(this.chunks.values());
    const plats: Platform[] = [];
    for (const ch of this.cachedActiveChunks) {
      for (const p of ch.platforms) {
        plats.push(p);
      }
    }
    this.cachedActivePlatforms = plats;
  }

  private getActiveChunks(): GeneratedChunk[] {
    this.rebuildChunkCachesIfNeeded();
    return this.cachedActiveChunks;
  }

  private getActivePlatforms(): Platform[] {
    this.rebuildChunkCachesIfNeeded();
    return this.cachedActivePlatforms;
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

  private completeBossEncounterProgress(): void {
    const res = recordBossFightProgress(this.bossesFoughtStreak);
    this.bossesFoughtStreak = res.nextStreak;
    if (res.triggeredCooldown) {
      this.bossCooldownSeconds = res.cooldownSeconds;
      this.showAnnouncement(
        `5 Bosses Fought! ${res.cooldownSeconds}s Boss Cooldown Active — No bosses for 1 minute!`,
      );
    }
  }

  private scaleLiveEnemiesOnLevelUp(prevLevel: number, nextLevel: number): void {
    if (nextLevel <= prevLevel) return;
    const prevMult = getMonsterLevelMultiplier(prevLevel);
    const nextMult = getMonsterLevelMultiplier(nextLevel);
    const ratio = nextMult / Math.max(0.1, prevMult);
    for (const ch of this.chunks.values()) {
      for (const en of ch.enemies) {
        if (en.state === 'ko') continue;
        en.maxHp = Math.max(en.maxHp + 1, Math.round(en.maxHp * ratio));
        en.hp = Math.min(en.maxHp, Math.max(en.hp + 1, Math.round(en.hp * ratio)));
      }
    }
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

    if (this.secretCaptionTimer > 0) {
      this.secretCaptionTimer = Math.max(0, this.secretCaptionTimer - dt);
      if (this.secretCaptionTimer === 0) {
        this.secretCaption = null;
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
    const prevBossCdCeil = Math.ceil(this.bossCooldownSeconds);
    this.bossCooldownSeconds = Math.max(0, this.bossCooldownSeconds - dt);
    if (prevBossCdCeil > 0 && Math.ceil(this.bossCooldownSeconds) === 0) {
      this.showAnnouncement('Boss Cooldown Expired — Bosses may challenge you again!');
    }
    this.encounterFlashTimer = Math.max(0, this.encounterFlashTimer - dt);
    this.guestBossWarnCooldown = Math.max(0, this.guestBossWarnCooldown - dt);
    this.updateAmbientMotes(dt);

    // Trauma shake decay in real dt
    this.trauma = Math.max(0, this.trauma - dt * 2.4);

    if (this.activeCastBannerTimer > 0) {
      this.activeCastBannerTimer = Math.max(0, this.activeCastBannerTimer - dt);
      if (this.activeCastBannerTimer === 0) {
        this.activeCastBanner = null;
      }
    }

    // Royal S-Rank Coronation Cutscene overrides world movement until complete
    if (this.coronationCutscene) {
      this.clearAllInputs(true);
      this.coronationCutscene.timer = Math.max(0, this.coronationCutscene.timer - dt);
      if (this.coronationCutscene.timer <= 0) {
        this.coronationCutscene = null;
        this.crownUnlocked = true;
        this.player.customization.crownEquipped = true;
        this.guildRank = 'S';
        this.isekaiCompleted = true;
        this.enterIsekaiRoom('isekai_town', 310);
        gameAudio.playSecretFound();
        this.showSecretCaption(
          'CROWNED ROYALTY · S-RANK SOVEREIGN!',
          'You defeated all 3 Demon Kings and ascended to Royalty! All of Solaris Town celebrates your name!',
        );
        this.openDialogue('King Solaris & Princess Aurelia', 'throne', '#fbbf24', [
          'Kneel no longer, Hero! By the Golden Sovereign Crown, you are now S-Rank Royalty of our Kingdom!',
          'The townsfolk cheer across every cobblestone street! You may wear or store your Royal Crown anytime in the Wardrobe Shop!',
        ]);
        void this.saveCurrentGame('autosave', true);
      } else {
        this.emitHud();
      }
      this.justPressed.clear();
      return;
    }

    // Mega Boss / Gyro Zeppeli Glitch-Crash Cutscene overrides exploration while active
    if (this.megaCutscene) {
      this.clearAllInputs(true);
      this.megaCutscene.timer = Math.max(0, this.megaCutscene.timer - dt);
      if (this.megaCutscene.timer <= 0) {
        const pending = this.megaCutscene.pendingBoss;
        this.megaCutscene = null;
        this.enterBossBattle(pending);
      } else {
        this.emitHud();
      }
      this.justPressed.clear();
      return;
    }

    // Pokemon-style Boss Battle Mode overrides exploration when engaged
    if (this.bossBattle) {
      this.stepBossBattle(dt);
      this.justPressed.clear();
      return;
    }

    // Freeze action while below-B dungeon cleared choice modal is open
    if (this.dungeonChoicePending) {
      this.clearAllInputs(true);
      this.updateParticles(dt);
      this.justPressed.clear();
      return;
    }

    // Chunk 41 Bridge Slip & Fall into Volcano Pit sequence (Citadel only)
    const bridgeEntryX = 41 * CHUNK_WIDTH + 54;
    if (
      this.realm === 'citadel' &&
      !this.volcanoBridgeFallTriggered &&
      this.player.x >= bridgeEntryX &&
      this.player.y >= FLOOR_Y - 64
    ) {
      this.volcanoBridgeFallTriggered = true;
      this.volcanoBridgeFallTimer = 1.75;
      this.clearAllInputs(true);
      this.player.vx = 24;
      this.player.vy = 110;
      const c41 = this.chunks.get(41);
      if (c41) {
        c41.platforms = c41.platforms.filter((p) => p.id !== 'bridge_41_slip');
        this.chunksDirty = true;
      }
      this.trauma = 0.65;
      this.spawnBurst(this.player.x + 8, this.player.y + 18, 20, '#fb923c');
      this.showAnnouncement('THE BRIDGE CRUMBLED! Slipping into the Volcano Pit!');
    }

    if (this.volcanoBridgeFallTimer > 0) {
      this.clearAllInputs(false);
      this.volcanoBridgeFallTimer = Math.max(0, this.volcanoBridgeFallTimer - dt);
      this.player.x += 24 * dt;
      this.player.y = Math.min(FLOOR_Y + 6, this.player.y + 72 * dt);
      if (Math.floor(this.simTime * 20) % 2 === 0) {
        this.spawnBurst(this.player.x + 8, this.player.y + 16, 4, '#f97316');
      }
      this.camX += (this.player.x - PIXEL_W * 0.34 - this.camX) * Math.min(1, 9 * dt);
      this.updateParticles(dt);
      if (this.volcanoBridgeFallTimer === 0) {
        this.player.x = 41 * CHUNK_WIDTH + 215;
        this.player.y = FLOOR_Y - this.player.h;
        this.clearAllInputs(true);
        this.player.hp = Math.max(1, this.player.hp - 10);
        this.trauma = 0.7;
        gameAudio.playHit(true);
        this.showSecretCaption(
          'VOLCANO HELL CITADEL',
          'You slipped off the bridge and plunged into the molten volcanic abyss! Survive 40 Volcanic Bosses!',
        );
        this.openDialogue(
          'Warrior',
          'warrior',
          '#fb923c',
          [
            'Of course the castle bridge dropped me straight into a boiling volcano pit. My armor boots are smoking!',
            'Brace yourself — 40 Volcanic Bosses rule these basalt halls!',
          ],
        );
      }
      this.justPressed.clear();
      return;
    }

    // Dialogue typewriter progression (no TTS/voice anywhere; subtle chip blips for non-boss)
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
      this.player.idleTimer = 0;
      if (this.dialogue) {
        this.advanceDialogue();
      } else {
        this.tryInteract();
      }
    }
    if (this.justPressed.has('KeyJ') || this.justPressed.has('KeyZ')) {
      this.player.idleTimer = 0;
      if (this.simTime - this.lastDashInputTime <= 0.28) {
        this.executeSpinPokeDash();
      } else {
        this.lastSlashInputTime = this.simTime;
        if (startWeaponAttack(this.player)) {
          this.meleeHitIds.clear();
          gameAudio.playSwordSlash(this.player.equippedWeapon, this.player.comboStep);
        }
      }
    }
    if (this.justPressed.has('Digit1') || this.justPressed.has('KeyQ')) {
      this.player.idleTimer = 0;
      this.executeSkill(0);
    }
    if (this.justPressed.has('Digit2')) {
      this.player.idleTimer = 0;
      this.executeSkill(1);
    }
    if (this.justPressed.has('Digit3') || this.justPressed.has('KeyR')) {
      this.player.idleTimer = 0;
      this.executeSkill(2);
    }
    if (this.justPressed.has('KeyH')) {
      this.player.idleTimer = 0;
      this.useItem('crimson_vial');
    }

    // Bulletproof post-bossfight lock window prevents stray carried velocity or stale key presses
    if (this.postBossInputLockTimer > 0) {
      this.postBossInputLockTimer = Math.max(0, this.postBossInputLockTimer - dt);
      this.clearAllInputs(true);
    } else if (this.justPressed.has('ShiftLeft') || this.justPressed.has('ShiftRight')) {
      this.performDash();
    }

    const left =
      this.postBossInputLockTimer <= 0 &&
      (this.heldKeys.has('ArrowLeft') || this.heldKeys.has('KeyA') || this.virtualInput.left);
    const right =
      this.postBossInputLockTimer <= 0 &&
      (this.heldKeys.has('ArrowRight') || this.heldKeys.has('KeyD') || this.virtualInput.right);
    const jumpHeld =
      this.postBossInputLockTimer <= 0 &&
      (this.heldKeys.has('Space') ||
        this.heldKeys.has('ArrowUp') ||
        this.heldKeys.has('KeyW') ||
        this.virtualInput.jumpHeld);
    const jumpJustPressed =
      this.postBossInputLockTimer <= 0 &&
      (this.justPressed.has('Space') ||
        this.justPressed.has('ArrowUp') ||
        this.justPressed.has('KeyW'));

    const isIsekai = this.realm !== 'citadel';
    const activeChunks = isIsekai ? [] : this.getActiveChunks();
    const roomBounds = ISEKAI_ROOM_BOUNDS[this.realm];
    const allPlatforms = isIsekai
      ? this.realm === 'isekai_guild' && !canAccessGuildFloor2(this.guildRank)
        ? this.isekaiPlatforms.filter(
            (p) => !p.id.startsWith('guild_stair_') && p.id !== 'guild_floor2_deck',
          )
        : this.isekaiPlatforms
      : this.getActivePlatforms();

    const prevWalkCycle = this.player.walkCycle;
    const phys = stepPlayerPhysics(
      this.player,
      { left, right, jumpJustPressed, jumpHeld },
      allPlatforms,
      dt,
      roomBounds.minX,
    );
    if (isIsekai && this.player.x > roomBounds.maxX - this.player.w) {
      this.player.x = roomBounds.maxX - this.player.w;
      this.player.vx = 0;
    }
    if (
      this.player.onGround &&
      Math.abs(this.player.vx) > 14 &&
      Math.floor(prevWalkCycle / Math.PI) !== Math.floor(this.player.walkCycle / Math.PI)
    ) {
      const stepNum = Math.floor(this.player.walkCycle / Math.PI);
      gameAudio.playFootstep(this.getCurrentBiome(), stepNum);
      this.spawnBurst(this.player.x + 8, this.player.y + this.player.h, 2, isIsekai ? '#fef08a' : '#a3e635');
    }
    if (phys.jumped) {
      this.player.idleTimer = 0;
      gameAudio.playJump();
      this.spawnBurst(this.player.x + 8, this.player.y + this.player.h, 5, '#d97706');
    }
    if (phys.landed) {
      gameAudio.playFootstep(this.getCurrentBiome(), 0);
      this.spawnBurst(this.player.x + 8, this.player.y + this.player.h, 4, '#94a3b8');
    }

    // 2-minute Idle Portal transport check in Citadel!
    if (
      shouldIdleTriggerIsekai(
        this.realm,
        this.player.idleTimer,
        this.status === 'playing',
        Boolean(this.bossBattle || this.megaCutscene || this.coronationCutscene || this.volcanoBridgeFallTimer > 0),
      )
    ) {
      this.enterIsekaiTown('idle');
      this.justPressed.clear();
      return;
    }

    // Update sword attack phases & Star Platinum ORA ORA guardian barrage
    this.stepAttackPhase(dt, activeChunks);
    if (this.starPlatinumTimer > 0) {
      this.starPlatinumTimer = Math.max(0, this.starPlatinumTimer - dt);
      this.starPlatinumTickTimer -= dt;
      if (this.starPlatinumTickTimer <= 0) {
        this.starPlatinumTickTimer = 0.18;
        this.resolveStarPlatinumTick(activeChunks);
      }
      if (this.starPlatinumTimer === 0) {
        this.emitHud();
      }
    }

    const frozen = this.player.chronoFreezeTimer > 0;

    if (isIsekai) {
      const maxCam = Math.max(0, roomBounds.maxX - PIXEL_W);
      const targetCamX = Math.max(0, Math.min(maxCam, this.player.x - PIXEL_W * 0.34));
      this.camX += (targetCamX - this.camX) * Math.min(1, 9 * dt);

      stepIsekaiNpcs(this.isekaiNpcs, dt);
      this.stepIsekaiCombat(dt, frozen);
      this.stepProjectiles(activeChunks, dt, frozen);
      this.updateParticles(dt);

      this.netSyncTimer += dt;
      if (this.netSyncTimer >= 0.085) {
        this.netSyncTimer = 0;
        this.sendMultiplayerState();
      }

      this.hudEmitTimer += dt;
      if (this.hudEmitTimer >= 0.1) {
        this.hudEmitTimer = 0;
        this.emitHud();
      }

      this.justPressed.clear();
      return;
    }

    // Check automatic triggers (floor pressure plates & checkpoints & Citadel Isekai Portal)
    this.checkPassiveTriggers(activeChunks);

    // Secret Dark Sanctum discovery behind Checkpoint 1
    if (this.player.x <= -32 && !this.darkSanctumDiscovered) {
      this.darkSanctumDiscovered = true;
      gameAudio.playSecretFound();
      this.spawnBurst(this.player.x + 8, this.player.y + 10, 18, '#fb923c');
      this.showSecretCaption(
        'SECRET DISCOVERED: DARK ABYSSAL SANCTUM',
        'You slipped behind Checkpoint 1 into the forgotten shadow vault!',
      );
    }

    // Stream chunks & update camera smoothly (allows panning into chunk -1 at x < 0)
    this.ensureChunksAround(this.player.x);
    const targetCamX = Math.max(-640, this.player.x - PIXEL_W * 0.34);
    this.camX += (targetCamX - this.camX) * Math.min(1, 9 * dt);

    // Update enemies & boss AI (bosses stand down during 60s 5-boss cooldown)
    this.stepEnemies(activeChunks, dt, frozen);
    if (this.bossCooldownSeconds <= 0) {
      this.stepBosses(activeChunks, dt, frozen);
    }
    this.stepProjectiles(activeChunks, dt, frozen);
    this.updateParticles(dt);

    // Trigger Pokemon-style Boss Encounter ONLY when World Host and no 60s boss cooldown active
    const nearbyBoss = this.getActiveNearbyBoss();
    if (
      nearbyBoss &&
      !nearbyBoss.defeated &&
      this.bossEncounterCooldown <= 0 &&
      this.bossCooldownSeconds <= 0 &&
      Math.abs(this.player.x - nearbyBoss.x) < 165
    ) {
      if (canPlayerEngageBoss(this.worldRole)) {
        this.enterBossBattle(nearbyBoss);
        this.justPressed.clear();
        return;
      } else if (this.guestBossWarnCooldown <= 0) {
        this.guestBossWarnCooldown = 3.5;
        this.showAnnouncement('Co-op Guest: Only the World Host can fight bosses!');
      }
    }

    gameAudio.startMusic(
      this.getCurrentBiome(),
      this.bossCooldownSeconds > 0 ? null : (nearbyBoss?.def ?? null),
    );
    if (nearbyBoss && this.bossCooldownSeconds <= 0 && this.lastBossVoiceTriggered !== nearbyBoss.def.index) {
      this.lastBossVoiceTriggered = nearbyBoss.def.index;
      this.speedLineTimer = 0.55;
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
    this.clearAllInputs(true);
    this.player.attackPhase = 'none';
    this.player.walkCycle = 0;
    if (boss.def.isGyroBoss) {
      const exactPlayerAtk = calculateAttackDamage(this.player, 1, false);
      const exactGyroHp = Math.max(300, Math.round(this.player.maxHp * 3));
      const updated = createGyroZeppeliBossDef(this.player.maxHp, exactPlayerAtk);
      boss.def = updated;
      if (boss.hp === boss.maxHp || boss.maxHp < exactGyroHp) {
        boss.maxHp = exactGyroHp;
        boss.hp = exactGyroHp;
      }
    }
    this.encounterFlashTimer = 0.35;
    this.speedLineTimer = 0.65;
    this.bossBattle = createBossBattleState(boss);
    this.lastBossVoiceTriggered = boss.def.index;
    gameAudio.playBattleEncounterStinger();
    gameAudio.startMusic(this.getCurrentBiome(), boss.def);
    this.emitHud(true);
  }

  private stepBossBattle(dt: number): void {
    const b = this.bossBattle;
    if (!b) return;

    this.clearAllInputs(true);

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
        this.emitHud(true);
      } else {
        const turn = triggerBossCounterTurn(b, this.player);
        if (!turn.skippedByFreeze) {
          this.trauma = b.boss.def.isMegaBoss ? 0.8 : 0.55;
          const activeFx = (b as { slashFx: { style?: string } | null }).slashFx;
          if (b.boss.def.isMegaBoss && activeFx?.style) {
            gameAudio.playMegaSkillSfx(activeFx.style as MegaSkillAnimStyle);
          } else {
            gameAudio.playSlashClaw(true);
          }
          gameAudio.playHit(true);
        }
        this.emitHud(true);
      }
    } else if (b.phase === 'enemy_anim') {
      b.slashFx = null;
      if (b.pendingOutcome === 'defeat' || this.player.hp <= 0) {
        this.bossBattle = null;
        this.postBossInputLockTimer = 0.45;
        this.clearAllInputs(true);
        this.setStatus('gameover');
        return;
      }
      b.turnCount += 1;
      b.phase = 'menu';
      b.speaker = 'Battle';
      b.message = `Choose your action! (Fight, Potions, Retreat, or Escape)`;
      this.emitHud(true);
    } else if (b.phase === 'run_anim') {
      const bossX = b.boss.x;
      this.bossBattle = null;
      this.bossEncounterCooldown = 4.0;
      this.postBossInputLockTimer = 0.45;
      this.clearAllInputs(true);
      this.player.walkCycle = 0;
      this.player.x = Math.max(24, bossX - 210);
      this.player.y = FLOOR_Y - this.player.h - 4;
      this.camX = Math.max(-640, this.player.x - PIXEL_W * 0.34);
      this.completeBossEncounterProgress();
      gameAudio.startMusic(this.getCurrentBiome(), null);
      if (this.bossCooldownSeconds <= 0) {
        this.showAnnouncement('Retreated safely to your Main Sanctuary Interface.');
      }
      this.emitHud(true);
      const cb = this.pendingSanctuaryCallback;
      this.pendingSanctuaryCallback = null;
      cb?.();
    } else if (b.phase === 'escape_anim') {
      this.bossBattle = null;
      this.postBossInputLockTimer = 0.45;
      this.clearAllInputs(true);
      this.player.walkCycle = 0;
      this.restartFromCheckpoint();
      this.completeBossEncounterProgress();
      if (this.bossCooldownSeconds <= 0) {
        this.showAnnouncement('Escaped safely back to last Checkpoint!');
      }
      this.emitHud(true);
    } else if (b.phase === 'victory') {
      const defeatedBoss = b.boss;
      this.bossBattle = null;
      this.postBossInputLockTimer = 0.45;
      this.clearAllInputs(true);
      this.player.attackPhase = 'none';
      this.player.walkCycle = 0;
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
      const activeDur =
        this.player.comboStep === 3
          ? 0.21
          : this.player.comboStep === 2
            ? 0.18
            : Math.max(0.15, weapon.active);
      this.player.attackTimer = activeDur;
      this.player.comboSubStep = 0;
      this.player.comboSubTimer = this.player.comboStep === 2 ? 0.09 : activeDur / 3;
      this.meleeHitIds.clear();
      this.resolveMeleeHits(chunks, this.player.comboStep === 3 ? 0.82 : 1);

      // Weapons with ranged wave special fire crescent/beam projectiles!
      if (
        weapon.id === 'runeblade' ||
        weapon.id === 'katana' ||
        weapon.id === 'fire_sword' ||
        weapon.id === 'emerald_zephyr' ||
        weapon.id === 'solar_excalibur'
      ) {
        const isFireSword = weapon.id === 'fire_sword';
        this.projectiles.push({
          id: `sw_${this.simTime}`,
          x: this.player.x + (this.player.facing === 1 ? 20 : -4),
          y: this.player.y + 12,
          vx: this.player.facing * (isFireSword ? 265 : 250),
          vy: 0,
          radius: isFireSword || weapon.id === 'solar_excalibur' ? 10 : 8,
          damage: Math.round(calculateAttackDamage(this.player, isFireSword ? 0.85 : 0.72)),
          fromPlayer: true,
          color: isFireSword ? '#fb923c' : weapon.accentColor,
          life: isFireSword ? 0.65 : 0.58,
          kind: isFireSword ? 'fireball' : 'slash_wave',
        });
      }
    } else if (this.player.attackPhase === 'active') {
      this.player.comboSubTimer -= dt;
      if (this.player.isSpinDashAttack) {
        if (this.player.comboSubTimer <= 0) {
          this.player.comboSubTimer = 0.085;
          this.player.comboSubStep = (this.player.comboSubStep + 1) % 3;
          this.meleeHitIds.clear();
          this.spawnBurst(
            this.player.x + 8 + this.player.facing * 20,
            this.player.y + 12,
            6,
            '#6ee7b7',
          );
          this.resolveMeleeHits(chunks, 0.72);
        }
      } else {
        const maxSub = this.player.comboStep === 2 ? 1 : 2;
        if (this.player.comboSubTimer <= 0 && this.player.comboSubStep < maxSub) {
          this.player.comboSubStep += 1;
          this.player.comboSubTimer = this.player.comboStep === 2 ? 0.085 : 0.068;
          if (this.player.comboStep === 2 || this.player.comboStep === 3) {
            this.meleeHitIds.clear();
            gameAudio.playSwordSlash(this.player.equippedWeapon, this.player.comboStep);
            this.resolveMeleeHits(chunks, this.player.comboStep === 3 ? 0.78 : 0.9);
          }
        }
      }

      if (this.player.attackTimer <= 0) {
        this.player.isSpinDashAttack = false;
        this.player.attackPhase = 'recovery';
        this.player.attackTimer =
          this.player.comboStep === 3 ? weapon.recovery * 0.7 : weapon.recovery;
      }
    } else if (this.player.attackPhase === 'recovery' && this.player.attackTimer <= 0) {
      this.player.attackPhase = 'none';
      this.player.comboSubStep = 0;
    }
  }

  private applyWeaponSpecialEffectOnEnemy(
    en: EnemyState,
    dmg: number,
    isIsekai: boolean,
  ): void {
    const fx = WEAPONS[this.player.equippedWeapon].specialEffect;
    if (fx === 'none') return;
    if (fx === 'burn') {
      en.statusBurnTimer = 2.6;
      this.spawnBurst(en.x + en.w / 2, en.y + 8, 6, '#fb923c');
    } else if (fx === 'frost') {
      en.statusFrostTimer = 2.8;
      this.spawnBurst(en.x + en.w / 2, en.y + 8, 6, '#38bdf8');
    } else if (fx === 'venom') {
      en.statusVenomTimer = 3.2;
      this.spawnBurst(en.x + en.w / 2, en.y + 8, 6, '#84cc16');
    } else if (fx === 'lifesteal') {
      const heal = Math.max(2, Math.round(dmg * 0.15));
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
      this.spawnFloatingText(this.player.x + 8, this.player.y - 10, `+${heal} HP`, '#fb7185');
    } else if (fx === 'void_pull') {
      en.vx = -this.player.facing * 95;
      this.spawnBurst(en.x + en.w / 2, en.y + 10, 6, '#a78bfa');
    } else if (fx === 'lightning') {
      const pool = isIsekai
        ? this.isekaiEnemies
        : this.getActiveChunks().flatMap((c) => c.enemies);
      const chain = pool.find(
        (o) => o.id !== en.id && o.state !== 'ko' && Math.abs(o.x - en.x) <= 110,
      );
      if (chain) {
        const arcDmg = Math.max(4, Math.round(dmg * 0.45));
        const res = applyDamageToEnemy(chain, arcDmg, this.player.facing * 40);
        this.spawnFloatingText(chain.x + chain.w / 2, chain.y - 10, `⚡${arcDmg}`, '#facc15');
        this.spawnBurst(chain.x + chain.w / 2, chain.y + 10, 8, '#facc15');
        if (res.killed) {
          if (isIsekai) this.onIsekaiEnemyKilled(chain);
          else this.onEnemyKilled(chain);
        }
      }
    } else if (fx === 'seismic') {
      this.trauma = Math.min(1, this.trauma + 0.15);
      this.spawnBurst(en.x + en.w / 2, en.y + en.h, 8, '#dc2626');
    }
  }

  private resolveMeleeHits(
    chunks: GeneratedChunk[],
    skillMult: number,
    isSkill = false,
  ): void {
    const hb = computeWeaponHitbox(this.player);
    const dmg = calculateAttackDamage(this.player, skillMult, isSkill);
    const weapon = WEAPONS[this.player.equippedWeapon];
    const kb = weapon.knockback * this.player.facing;
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
        if (en.state === 'ko' || (!isSkill && this.meleeHitIds.has(en.id))) continue;
        if (rectsOverlap(hb.x, hb.y, hb.w, hb.h, en.x, en.y, en.w, en.h)) {
          if (!isSkill) this.meleeHitIds.add(en.id);
          const res = applyDamageToEnemy(en, dmg, kb);
          this.spawnFloatingText(en.x + en.w / 2, en.y - 4, `${dmg}`, '#fde047');
          this.spawnBurst(en.x + en.w / 2, en.y + 10, 10, weapon.accentColor);
          landedHit = true;
          if (!res.killed && !isSkill) {
            this.applyWeaponSpecialEffectOnEnemy(en, dmg, false);
          } else if (res.killed) {
            this.onEnemyKilled(en);
          }
        }
      }

      if (ch.boss && !ch.boss.defeated) {
        const b = ch.boss;
        const bKey = `boss_${b.def.index}`;
        if ((isSkill || !this.meleeHitIds.has(bKey)) && rectsOverlap(hb.x, hb.y, hb.w, hb.h, b.x, b.y, b.w, b.h)) {
          if (!canPlayerEngageBoss(this.worldRole)) {
            if (this.guestBossWarnCooldown <= 0) {
              this.guestBossWarnCooldown = 3.0;
              this.showAnnouncement('Co-op Guest: Only the World Host can fight bosses!');
            }
          } else {
            if (!isSkill) this.meleeHitIds.add(bKey);
            const res = applyDamageToBoss(b, dmg, kb);
            this.spawnFloatingText(b.x + b.w / 2, b.y - 6, `${dmg}`, '#fde047');
            this.spawnBurst(b.x + b.w / 2, b.y + 16, 14, b.def.auraColor);
            landedHit = true;
            if (weapon.specialEffect === 'lifesteal' && !isSkill) {
              const heal = Math.max(2, Math.round(dmg * 0.15));
              this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
            }
            if (res.defeatedNow) {
              this.onBossDefeated(b);
            }
          }
        }
      }
    }

    // Isekai real-time dungeon enemies & A-Rank Demon Kings
    for (const en of this.isekaiEnemies) {
      if (en.state === 'ko' || (!isSkill && this.meleeHitIds.has(en.id))) continue;
      if (rectsOverlap(hb.x, hb.y, hb.w, hb.h, en.x, en.y, en.w, en.h)) {
        if (!isSkill) this.meleeHitIds.add(en.id);
        const res = applyDamageToEnemy(en, dmg, kb);
        this.spawnFloatingText(en.x + en.w / 2, en.y - 4, `${dmg}`, '#fde047');
        this.spawnBurst(en.x + en.w / 2, en.y + 10, 10, weapon.accentColor);
        landedHit = true;
        if (!res.killed && !isSkill) {
          this.applyWeaponSpecialEffectOnEnemy(en, dmg, true);
        } else if (res.killed) {
          this.onIsekaiEnemyKilled(en);
        }
      }
    }

    for (const dk of this.demonKings) {
      if (dk.defeated || dk.hp <= 0 || (!isSkill && this.meleeHitIds.has(dk.id))) continue;
      if (rectsOverlap(hb.x, hb.y, hb.w, hb.h, dk.x, dk.y, dk.w, dk.h)) {
        if (!isSkill) this.meleeHitIds.add(dk.id);
        const dkDmg = dk.windVulnerable ? Math.round(dmg * (1 + WIND_ORB_DAMAGE_BONUS)) : dmg;
        dk.hp = Math.max(0, dk.hp - dkDmg);
        dk.hitFlash = 0.16;
        dk.vx = kb * 0.45;
        this.spawnFloatingText(dk.x + dk.w / 2, dk.y - 6, `${dkDmg}`, '#f0abfc');
        this.spawnBurst(dk.x + dk.w / 2, dk.y + 18, 14, '#c084fc');
        if (weapon.specialEffect === 'lifesteal' && !isSkill) {
          const heal = Math.max(2, Math.round(dkDmg * 0.15));
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
          this.spawnFloatingText(this.player.x + 8, this.player.y - 10, `+${heal} HP`, '#fb7185');
        }
        landedHit = true;
        if (dk.hp <= 0) {
          dk.defeated = true;
          this.onDemonKingDefeated(dk);
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

    const chunks = this.realm === 'citadel' ? this.getActiveChunks() : [];

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
      this.starPlatinumTimer = 2.5;
      this.starPlatinumTickTimer = 0;
      this.trauma = Math.min(1, this.trauma + 0.45);
      this.speedLineTimer = 0.65;
      this.spawnAfterimage('#a78bfa');
      this.spawnBurst(this.player.x + 8, this.player.y + 12, 18, '#a78bfa');
      this.spawnFloatingText(this.player.x + 8, this.player.y - 14, 'STAR PLATINUM: ORA!', '#c4b5fd');
      this.resolveStarPlatinumTick(chunks);
    } else if (res.skillId === 'sunburst_cleave') {
      this.trauma = Math.min(1, this.trauma + 0.45);
      this.speedLineTimer = 0.35;
      this.spawnBurst(this.player.x + 8, this.player.y + 12, 24, '#fde047');
      this.resolveMeleeHits(chunks, skill.damageMultiplier, true);
    }
    this.emitHud();
  }

  private resolveStarPlatinumTick(chunks: GeneratedChunk[]): void {
    const zoneW = 68;
    const zoneH = 44;
    const zoneX =
      this.player.facing === 1 ? this.player.x + 4 : this.player.x - zoneW + this.player.w - 4;
    const zoneY = this.player.y - 10;
    const dmg = Math.max(4, Math.round(calculateAttackDamage(this.player, 0.38, true)));
    const kb = 38 * this.player.facing;
    let landedHit = false;

    const punchX = this.player.x + 8 + this.player.facing * 26;
    const punchY = this.player.y + 8 + (Math.random() - 0.5) * 14;
    this.spawnBurst(punchX, punchY, 4, '#c084fc');

    for (const ch of chunks) {
      for (const prop of ch.interactables) {
        if (
          prop.kind === 'broken_brick' &&
          !prop.activated &&
          prop.secretId &&
          rectsOverlap(zoneX, zoneY, zoneW, zoneH, prop.x, prop.y, prop.w, prop.h)
        ) {
          this.activateInteractable(prop, ch);
          landedHit = true;
        }
      }

      for (const en of ch.enemies) {
        if (en.state === 'ko') continue;
        if (rectsOverlap(zoneX, zoneY, zoneW, zoneH, en.x, en.y, en.w, en.h)) {
          const res = applyDamageToEnemy(en, dmg, kb);
          this.spawnFloatingText(en.x + en.w / 2, en.y - 6, `ORA! ${dmg}`, '#d8b4fe');
          this.spawnBurst(en.x + en.w / 2, en.y + 10, 6, '#fbbf24');
          landedHit = true;
          if (res.killed) {
            this.onEnemyKilled(en);
          }
        }
      }

      if (ch.boss && !ch.boss.defeated && this.bossCooldownSeconds <= 0 && canPlayerEngageBoss(this.worldRole)) {
        const b = ch.boss;
        if (rectsOverlap(zoneX, zoneY, zoneW, zoneH, b.x, b.y, b.w, b.h)) {
          const res = applyDamageToBoss(b, dmg, kb * 0.5);
          this.spawnFloatingText(b.x + b.w / 2, b.y - 8, `ORA! ${dmg}`, '#d8b4fe');
          this.spawnBurst(b.x + b.w / 2, b.y + 16, 8, '#fbbf24');
          landedHit = true;
          if (res.defeatedNow) {
            this.onBossDefeated(b);
          }
        }
      }
    }

    for (const en of this.isekaiEnemies) {
      if (en.state === 'ko') continue;
      if (rectsOverlap(zoneX, zoneY, zoneW, zoneH, en.x, en.y, en.w, en.h)) {
        const res = applyDamageToEnemy(en, dmg, kb);
        this.spawnFloatingText(en.x + en.w / 2, en.y - 6, `ORA! ${dmg}`, '#d8b4fe');
        this.spawnBurst(en.x + en.w / 2, en.y + 10, 6, '#fbbf24');
        landedHit = true;
        if (res.killed) {
          this.onIsekaiEnemyKilled(en);
        }
      }
    }

    for (const dk of this.demonKings) {
      if (dk.defeated || dk.hp <= 0) continue;
      if (rectsOverlap(zoneX, zoneY, zoneW, zoneH, dk.x, dk.y, dk.w, dk.h)) {
        const dkDmg = dk.windVulnerable ? Math.round(dmg * (1 + WIND_ORB_DAMAGE_BONUS)) : dmg;
        dk.hp = Math.max(0, dk.hp - dkDmg);
        dk.hitFlash = 0.14;
        dk.vx = kb * 0.35;
        this.spawnFloatingText(dk.x + dk.w / 2, dk.y - 8, `ORA! ${dkDmg}`, '#d8b4fe');
        this.spawnBurst(dk.x + dk.w / 2, dk.y + 18, 8, '#fbbf24');
        landedHit = true;
        if (dk.hp <= 0) {
          dk.defeated = true;
          this.onDemonKingDefeated(dk);
        }
      }
    }

    if (landedHit) {
      this.trauma = Math.min(1, this.trauma + 0.16);
      gameAudio.playHit(true);
      this.emitHud();
    }
  }

  private tryInteract(): void {
    if (this.realm !== 'citadel') {
      for (const prop of this.isekaiInteractables) {
        if (
          rectsOverlap(
            this.player.x - 14,
            this.player.y - 8,
            this.player.w + 28,
            this.player.h + 16,
            prop.x,
            prop.y,
            prop.w,
            prop.h,
          )
        ) {
          this.activateIsekaiInteractable(prop);
          return;
        }
      }
      for (const npc of this.isekaiNpcs) {
        if (Math.abs(this.player.x - npc.x) < 34) {
          const lines = this.crownUnlocked && npc.crownedDialogue ? npc.crownedDialogue : npc.dialogue;
          this.openDialogue(npc.name, 'npc', npc.coatColor, lines);
          return;
        }
      }
      return;
    }

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

  private activateIsekaiInteractable(prop: InteractableProp): void {
    if (prop.kind === 'guild_door') {
      gameAudio.playSecretFound();
      this.enterIsekaiRoom('isekai_guild', 72);
    } else if (prop.kind === 'potion_door') {
      gameAudio.playSecretFound();
      this.enterIsekaiRoom('isekai_potion_shop', 72);
    } else if (prop.kind === 'wardrobe_door') {
      gameAudio.playSecretFound();
      this.enterIsekaiRoom('isekai_wardrobe', 72);
    } else if (prop.kind === 'weapons_door') {
      gameAudio.playSecretFound();
      this.enterIsekaiRoom('isekai_weapons_shop', 72);
    } else if (prop.kind === 'town_exit_door') {
      gameAudio.playSecretFound();
      const targetX =
        this.realm === 'isekai_wardrobe'
          ? 886
          : this.realm === 'isekai_potion_shop'
            ? 622
            : this.realm === 'isekai_weapons_shop'
              ? 1180
              : 340;
      this.enterIsekaiRoom('isekai_town', targetX);
    } else if (prop.kind === 'guild_reception') {
      gameAudio.playSecretFound();
      this.uiCallbacks.onOpenGuild?.(1);
    } else if (prop.kind === 'guild_stairs') {
      if (!canAccessGuildFloor2(this.guildRank)) {
        this.openDialogue('Guild Gatekeeper', 'npc', '#f43f5e', [
          `2nd Floor Access Restricted! Your current rank is ${this.guildRank}-Rank.`,
          'Complete Floor 1 Goblin & Demon Border missions until you reach B-Rank to unlock the Grand Staircase!',
        ]);
        return;
      }
      gameAudio.playSecretFound();
      if (this.player.y + this.player.h <= GUILD_FLOOR2_Y + 10) {
        this.player.x = 445;
        this.player.y = FLOOR_Y - this.player.h;
        this.showAnnouncement('Descended to Adventure Guild 1st Floor');
      } else {
        this.player.x = 556;
        this.player.y = GUILD_FLOOR2_Y - this.player.h;
        this.showAnnouncement('Ascended to Adventure Guild 2nd Floor Command!');
      }
      this.player.vx = 0;
      this.player.vy = 0;
      this.emitHud(true);
    } else if (prop.kind === 'guild_floor2_reception') {
      if (!canAccessGuildFloor2(this.guildRank)) {
        this.showAnnouncement('Requires B-Rank or higher for 2nd Floor Command!');
        return;
      }
      gameAudio.playSecretFound();
      this.uiCallbacks.onOpenGuild?.(2);
    } else if (prop.kind === 'wardrobe_counter') {
      gameAudio.playSecretFound();
      this.uiCallbacks.onOpenWardrobe?.();
    } else if (prop.kind === 'potion_counter') {
      gameAudio.playSecretFound();
      this.uiCallbacks.onOpenPotionShop?.();
    } else if (prop.kind === 'weapons_counter') {
      gameAudio.playSecretFound();
      this.uiCallbacks.onOpenWeaponsShop?.();
    } else if (prop.kind === 'guild_bar') {
      this.player.hp = this.player.maxHp;
      this.player.stamina = this.player.maxStamina;
      this.openDialogue(prop.speaker, 'npc', '#d97706', prop.dialogue);
      this.emitHud();
    } else {
      this.openDialogue(prop.label, 'npc', '#fbbf24', prop.dialogue);
    }
  }

  private checkPassiveTriggers(chunks: GeneratedChunk[]): void {
    for (const ch of chunks) {
      for (const prop of ch.interactables) {
        if (prop.kind === 'isekai_portal') {
          if (
            rectsOverlap(
              this.player.x,
              this.player.y,
              this.player.w,
              this.player.h,
              prop.x + 6,
              prop.y,
              Math.max(12, prop.w - 12),
              prop.h,
            )
          ) {
            this.enterIsekaiTown('gyro');
            return;
          }
          continue;
        }
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
    if (prop.kind === 'isekai_portal') {
      this.enterIsekaiTown('gyro');
      return;
    }

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
      if (prop.rewardWeaponId === 'fire_sword') {
        equipWeapon(this.player, 'fire_sword');
        this.spawnBurst(prop.x + 12, prop.y + 8, 28, '#fb923c');
        this.showSecretCaption(
          'OP SECRET WEAPON UNLOCKED: FIRE SWORD!',
          'Blazing crimson-orange greatsword auto-equipped — deals 2x TOTAL DAMAGE!',
        );
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
        this.showSecretCaption(
          `SECRET #${chunk.hiddenPassage.index} DISCOVERED!`,
          chunk.hiddenPassage.discoveryText,
        );
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

  private tryRollOrbDrop(x: number, y: number): void {
    const orbId = rollMonsterOrbDrop();
    if (!orbId) return;
    addInventoryResource(this.inventory, orbId, 1);
    const orbItem = this.inventory.find((i) => i.id === orbId);
    const orbColor = orbItem?.color ?? '#38bdf8';
    const orbLabel = orbItem ? orbItem.name.toUpperCase() : 'ELEMENTAL ORB';
    this.spawnBurst(x, y, 14, orbColor);
    this.spawnFloatingText(x, y - 32, `+1 ${orbLabel}!`, orbColor);
    this.showAnnouncement(`Orb Drop! Found ${orbItem?.name ?? orbId} (Use in Bossfights)!`);
    gameAudio.playSecretFound();
  }

  private onEnemyKilled(enemy: EnemyState): void {
    this.player.gold += enemy.rewardGold;
    const prevLevel = this.player.level;
    const pts = grantKillStatPoints(this.player, 'monster');
    this.scaleLiveEnemiesOnLevelUp(prevLevel, this.player.level);
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
    this.tryRollOrbDrop(enemy.x + enemy.w / 2, enemy.y);
    this.spawnFloatingText(enemy.x + enemy.w / 2, enemy.y - 12, `+${enemy.rewardGold}G`, '#fbbf24');
    this.spawnFloatingText(enemy.x + enemy.w / 2, enemy.y - 22, `+${pts} STAT PT`, '#38bdf8');
    this.emitHud();
  }

  private onIsekaiEnemyKilled(enemy: EnemyState): void {
    if (!this.foughtIsekaiEnemies.includes(enemy.archetype)) {
      this.foughtIsekaiEnemies.push(enemy.archetype);
    }
    this.player.gold += enemy.rewardGold;
    grantKillStatPoints(this.player, 'monster');
    this.isekaiKillsDone += 1;
    this.tryRollOrbDrop(enemy.x + enemy.w / 2, enemy.y);
    this.spawnFloatingText(enemy.x + enemy.w / 2, enemy.y - 12, `+${enemy.rewardGold}G`, '#fbbf24');
    this.emitHud();
  }

  private onDemonKingDefeated(dk: DemonKingEntity): void {
    this.player.gold += 250;
    grantKillStatPoints(this.player, 'boss');
    this.isekaiKillsDone += 1;
    this.spawnBurst(dk.x + dk.w / 2, dk.y + dk.h / 2, 26, '#e879f9');
    this.showAnnouncement(`${dk.name} Vanquished!`);
    this.emitHud(true);
  }

  private onBossDefeated(boss: ActiveBoss): void {
    const isMega = Boolean(boss.def.isMegaBoss);
    const isGyro = Boolean(boss.def.isGyroBoss);

    if (isGyro) {
      this.gyroDefeated = true;
      this.isekaiPortalOpen = true;
      this.defeatedBosses.add(boss.def.index);
      this.player.bossesDefeated = Math.max(this.player.bossesDefeated, this.defeatedBosses.size);
      this.player.gold += 900;
      this.player.statPoints += 30;
      this.hitstopTimer = 0.12;
      this.trauma = 0.95;
      this.clearAllInputs(true);
      this.postBossInputLockTimer = 0.45;
      gameAudio.playSecretFound();

      const ch = this.chunks.get(this.getCurrentChunkIndex());
      if (ch && !ch.interactables.some((p) => p.kind === 'isekai_portal')) {
        ch.interactables.push({
          id: `isekai_portal_gyro_${Math.round(this.simTime)}`,
          x: Math.max(ch.startX + 120, Math.min(ch.endX - 64, Math.round(this.player.x + 82))),
          y: FLOOR_Y - 56,
          w: 34,
          h: 56,
          kind: 'isekai_portal',
          label: 'Enter Isekai Dimensional Portal',
          dialogue: ['A glowing Azure-Gold Dimensional Portal! Step inside or press [F] to travel to the Isekai Town!'],
          speaker: 'Dimensional Portal',
          activated: false,
        });
      }

      this.showSecretCaption(
        'FINAL CITADEL BOSS DEFEATED: GYRO ZEPPELI!',
        'A Dimensional Portal tore open ahead! Step inside or press [F] to enter the Isekai Realm!',
      );
      this.openDialogue('Gyro Zeppeli', 'boss', '#22c55e', [
        'Nyo-ho...! Not bad at all! Lesson 5 complete—that golden spin opened a Dimensional Portal right beside you!',
        'Step into the swirling Isekai Gate ahead to awaken in the sunny Medieval Fantasy Town!',
      ]);
      gameAudio.startMusic(this.getCurrentBiome(), null);
      void this.saveCurrentGame('autosave', true);
      this.emitHud(true);
      return;
    }

    if (isMega) {
      this.player.gold += 450;
      const bonusPts = 25;
      this.player.statPoints += bonusPts;
      const prevLevel = this.player.level;
      this.player.level = 1 + Math.floor((this.player.monstersSlain + this.player.bossesDefeated * 5) / 10);
      this.scaleLiveEnemiesOnLevelUp(prevLevel, this.player.level);
      addInventoryResource(this.inventory, 'crimson_vial', 2);
      addInventoryResource(this.inventory, 'magma_core', 3);
      this.hitstopTimer = 0.1;
      this.trauma = 0.95;
      this.clearAllInputs(true);
      this.postBossInputLockTimer = 0.45;
      gameAudio.playSecretFound();
      this.showSecretCaption(
        `MEGA BOSS SLAIN: ${boss.def.name}`,
        `Dimensional rift sealed! +450G, +25 Stat Points & rare relics!`,
      );
      this.openDialogue(boss.def.name, 'boss', boss.def.primaryColor, [
        boss.def.defeatLine,
        `[SYSTEM] MEGA BOSS BOUNTY: +${bonusPts} Ability Stat Points, +450G & +2 Crimson Vials!`,
      ]);
      gameAudio.startMusic(this.getCurrentBiome(), null);
      void this.saveCurrentGame('autosave', true);
      this.emitHud(true);
      return;
    }

    this.defeatedBosses.add(boss.def.index);
    this.player.bossesDefeated = Math.max(this.player.bossesDefeated, this.defeatedBosses.size);
    this.player.gold += 100 + boss.def.index * 5;
    const prevLevel = this.player.level;
    const pts = grantKillStatPoints(this.player, 'boss');
    this.scaleLiveEnemiesOnLevelUp(prevLevel, this.player.level);
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
    this.clearAllInputs(true);
    this.postBossInputLockTimer = 0.45;
    gameAudio.playSecretFound();
    this.sendMilestone('boss', `${boss.def.name} (#${boss.def.index})`);
    this.syncHostWorldMeta();
    this.completeBossEncounterProgress();
    void this.saveCurrentGame('autosave', true);

    // After the 100th boss, Final Boss GYRO ZEPPELI crashes in with a dramatic cutscene!
    if (boss.def.index === 100 && !this.defeatedBosses.has(101) && canPlayerEngageBoss(this.worldRole)) {
      const gyroDef = createGyroZeppeliBossDef(
        this.player.maxHp,
        calculateAttackDamage(this.player, 1, false),
      );
      const gyroBoss: ActiveBoss = {
        def: gyroDef,
        x: this.player.x + 150,
        y: FLOOR_Y - 52,
        vx: 0,
        vy: 0,
        w: 36,
        h: 52,
        hp: gyroDef.maxHp,
        maxHp: gyroDef.maxHp,
        facing: -1,
        state: 'intro',
        stateTimer: 1.0,
        hitFlash: 0,
        posePhase: 0,
        arenaMinX: this.player.x - 120,
        arenaMaxX: this.player.x + 280,
        defeated: false,
      };
      this.megaCutscene = {
        archetype: 'gyro_zeppeli',
        pendingBoss: gyroBoss,
        timer: 3.3,
        duration: 3.3,
      };
      this.trauma = 1.0;
      gameAudio.playMegaGlitchCrash();
      this.showAnnouncement('!! 100TH BOSS CLEARED: FINAL BOSS GYRO ZEPPELI APPEARS !!');
      this.emitHud(true);
      return;
    }

    // 10% chance a Dimensional Glitch-Crash spawns a colossal Mega Boss (suppressed during 60s 5-boss cooldown)
    if (this.bossCooldownSeconds <= 0 && canPlayerEngageBoss(this.worldRole) && shouldTriggerMegaBossGlitch()) {
      const arch = pickMegaBossArchetype();
      const pendingBoss = createMegaBossInstance(
        arch,
        boss.def.index,
        this.getCurrentBiome(),
        this.player.x + 150,
        FLOOR_Y,
      );
      this.megaCutscene = {
        archetype: arch,
        pendingBoss,
        timer: 3.1,
        duration: 3.1,
      };
      this.trauma = 1.0;
      gameAudio.playMegaGlitchCrash();
      this.showAnnouncement(`!! REALITY GLITCHED: ${pendingBoss.def.name} INBOUND !!`);
      this.emitHud(true);
      return;
    }

    if (this.bossCooldownSeconds <= 0) {
      this.showAnnouncement(`Defeated ${boss.def.name}! +${pts} Stat Points!`);
    }
    const lines = [
      boss.def.defeatLine,
      `[SYSTEM] +${pts} Ability Stat Points granted! Press [K] to open Status Window.`,
    ];
    if (boss.def.index === 40) {
      lines.push('40 Castle Bosses felled! Cross the ruined bridge ahead into the Volcano Hell Citadel!');
    } else if (boss.def.index === 80) {
      lines.push('80 Bosses felled! Ahead lies the Dark Enchanted Forest of Ancient Ruins!');
    } else if (boss.def.index === TOTAL_BOSSES) {
      lines.push('All 120 Citadel Bosses defeated! Step through the Escape Gate ahead!');
    }
    this.openDialogue(boss.def.name, 'boss', boss.def.primaryColor, lines);
    gameAudio.startMusic(this.getCurrentBiome(), null);
    this.emitHud(true);
  }

  private stepEnemies(chunks: GeneratedChunk[], dt: number, frozen: boolean): void {
    const enemyDmgMult = getMonsterLevelMultiplier(this.player.level);
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
        const speedMult = this.stepEnemyStatusEffects(en, dt, false);
        if (en.hp <= 0) continue;

        const dx = this.player.x - en.x;
        const dist = Math.abs(dx);
        en.stateTimer -= dt;

        if (en.archetype === 'skeleton_guard') {
          if (en.state === 'patrol') {
            en.facing = dx >= 0 ? 1 : -1;
            if (dist < 140 && dist > 26) {
              en.vx = en.facing * 48 * speedMult;
            } else if (dist <= 26) {
              en.vx = 0;
              en.state = 'windup';
              en.stateTimer = 0.42;
            } else {
              en.vx = Math.sin(this.simTime * 1.5 + en.patrolOriginX) * 24 * speedMult;
            }
          } else if (en.state === 'windup' && en.stateTimer <= 0) {
            en.state = 'attack';
            en.stateTimer = 0.2;
            if (dist < 32 && Math.abs(this.player.y - en.y) < 28) {
              this.damagePlayer(Math.round(12 * enemyDmgMult), en.facing * 120);
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
              this.damagePlayer(Math.round(10 * enemyDmgMult), en.facing * 90);
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
              damage: Math.round(11 * enemyDmgMult),
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
        } else if (en.archetype === 'cursed_armor') {
          // Towering Living Armor shield-march & Zweihander cleave
          en.facing = dx >= 0 ? 1 : -1;
          if (en.state === 'patrol') {
            if (dist < 160 && dist > 30) {
              en.vx = en.facing * 44;
            } else if (dist <= 30) {
              en.vx = 0;
              en.state = 'windup';
              en.stateTimer = 0.52;
            } else {
              en.vx = Math.sin(this.simTime * 1.1 + en.patrolOriginX) * 18;
            }
          } else if (en.state === 'windup' && en.stateTimer <= 0) {
            en.state = 'attack';
            en.stateTimer = 0.28;
            en.vx = en.facing * 95;
            if (dist < 38 && Math.abs(this.player.y - en.y) < 32) {
              this.damagePlayer(Math.round(16 * enemyDmgMult), en.facing * 140);
            }
          } else if (en.state === 'attack' && en.stateTimer <= 0) {
            en.state = 'recover';
            en.stateTimer = 0.85;
          } else if (en.state === 'recover' && en.stateTimer <= 0) {
            en.state = 'patrol';
          }
          en.x += en.vx * dt;
          en.vx *= 0.85;
        } else if (en.archetype === 'phantom_wisp') {
          // Floating spirit wraith that drifts and casts arcane bolts
          en.facing = dx >= 0 ? 1 : -1;
          const floatY = FLOOR_Y - 56 + Math.sin(this.simTime * 2.6 + en.patrolOriginX) * 12;
          en.y += (floatY - en.y) * 4 * dt;
          if (en.state === 'patrol') {
            if (dist < 75) en.x -= en.facing * 34 * dt;
            else if (dist > 140 && dist < 240) en.x += en.facing * 28 * dt;
            if (dist < 210 && en.stateTimer <= 0) {
              en.state = 'windup';
              en.stateTimer = 0.45;
            }
          } else if (en.state === 'windup' && en.stateTimer <= 0) {
            en.state = 'attack';
            en.stateTimer = 0.25;
            this.projectiles.push({
              id: `pw_${this.simTime}_${en.id}`,
              x: en.x + en.w / 2,
              y: en.y + 8,
              vx: en.facing * 145,
              vy: Math.sin(this.simTime * 3) * 12,
              radius: 4,
              damage: Math.round(12 * enemyDmgMult),
              fromPlayer: false,
              color: '#38bdf8',
              life: 2.1,
              kind: 'rune',
            });
          } else if (en.state === 'attack' && en.stateTimer <= 0) {
            en.state = 'recover';
            en.stateTimer = 1.3;
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
              this.damagePlayer(Math.round(15 * enemyDmgMult), en.facing * 150);
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

  private stepEnemyStatusEffects(en: EnemyState, dt: number, isIsekai: boolean): number {
    if (en.statusBurnTimer && en.statusBurnTimer > 0) {
      const prev = Math.floor(en.statusBurnTimer * 2);
      en.statusBurnTimer = Math.max(0, en.statusBurnTimer - dt);
      if (Math.floor(en.statusBurnTimer * 2) !== prev) {
        const tick = Math.max(3, Math.round(en.maxHp * 0.05));
        const res = applyDamageToEnemy(en, tick, 0);
        this.spawnFloatingText(en.x + en.w / 2, en.y - 10, `${tick}`, '#fb923c');
        this.spawnBurst(en.x + en.w / 2, en.y + 6, 4, '#fb923c');
        if (res.killed) {
          if (isIsekai) this.onIsekaiEnemyKilled(en);
          else this.onEnemyKilled(en);
        }
      }
    }
    if (en.statusVenomTimer && en.statusVenomTimer > 0 && en.state !== 'ko') {
      const prev = Math.floor(en.statusVenomTimer * 2);
      en.statusVenomTimer = Math.max(0, en.statusVenomTimer - dt);
      if (Math.floor(en.statusVenomTimer * 2) !== prev) {
        const tick = Math.max(2, Math.round(en.maxHp * 0.04));
        const res = applyDamageToEnemy(en, tick, 0);
        this.spawnFloatingText(en.x + en.w / 2, en.y - 12, `${tick}`, '#84cc16');
        if (res.killed) {
          if (isIsekai) this.onIsekaiEnemyKilled(en);
          else this.onEnemyKilled(en);
        }
      }
    }
    if (en.statusFrostTimer && en.statusFrostTimer > 0) {
      en.statusFrostTimer = Math.max(0, en.statusFrostTimer - dt);
      return 0.5;
    }
    return 1;
  }

  private stepIsekaiCombat(dt: number, frozen: boolean): void {
    const mission = this.activeMissionId
      ? GUILD_MISSIONS.find((m) => m.id === this.activeMissionId)
      : null;
    if (!mission) return;

    // 1. Update Carriage Escort progress & bandit waves (B-Rank 3x Escorts)
    if (this.realm === 'carriage_escort' && this.carriageEscort) {
      const car = this.carriageEscort;
      const escortVariant = car.variant ?? this.bRankEscortsCompleted;
      car.hitFlash = Math.max(0, car.hitFlash - dt);
      const blockingBandits = this.isekaiEnemies.filter(
        (e) => e.state !== 'ko' && Math.abs(e.x - car.x) < 120,
      );
      if (!frozen && blockingBandits.length === 0) {
        car.x = Math.min(1040, car.x + car.speed * dt);
        car.wheelPhase += dt * 7;
        car.progress = Math.min(100, Math.round(((car.x - 150) / 890) * 100));
      }
      if (car.progress >= 30 && car.wavesSpawned < 2) {
        car.wavesSpawned = 2;
        this.isekaiEnemies.push(...createBanditWave(car.x, 1, escortVariant));
        this.showAnnouncement('Bandit Ambush! Protect Princess Aurelia’s Carriage!');
      } else if (car.progress >= 65 && car.wavesSpawned < 3) {
        car.wavesSpawned = 3;
        this.isekaiEnemies.push(...createBanditWave(car.x, 2, escortVariant));
        this.showAnnouncement('Final Highway Brigand Wave Ahead!');
      }
      if (car.hp <= 0) {
        this.showAnnouncement('Royal Carriage wrecked! Returning to Solaris Guild...');
        this.enterIsekaiRoom('isekai_guild', 560);
        return;
      }
    }

    // 2. Step Isekai Enemies (Goblins, Hobgoblins, Bandits, Succubi, Demon Tanks, Lightning Fighters & Depth Bosses)
    for (const en of this.isekaiEnemies) {
      en.hitFlash = Math.max(0, en.hitFlash - dt);
      if (en.state === 'ko') {
        en.koTimer -= dt;
        en.x += en.vx * dt;
        en.y += en.vy * dt;
        en.vy += 320 * dt;
        continue;
      }
      if (frozen) continue;
      const speedMult = this.stepEnemyStatusEffects(en, dt, true);
      if (en.hp <= 0) continue;

      const targetCar = this.realm === 'carriage_escort' && this.carriageEscort ? this.carriageEscort : null;
      const targetX =
        targetCar && Math.abs(targetCar.x + 28 - en.x) < Math.abs(this.player.x - en.x)
          ? targetCar.x + 28
          : this.player.x;
      const targetIsCarriage = targetCar && targetX === targetCar.x + 28;
      const dx = targetX - en.x;
      const dist = Math.abs(dx);
      const dmg = en.attackDamage ?? 11;
      en.stateTimer -= dt * speedMult;
      en.facing = dx >= 0 ? 1 : -1;

      if (en.archetype === 'bandit_archer' || en.archetype === 'demon_succubus') {
        const isSuccubus = en.archetype === 'demon_succubus';
        if (isSuccubus) {
          const hoverY = FLOOR_Y - 68 + Math.sin(this.simTime * 3 + en.patrolOriginX) * 10;
          en.y += (hoverY - en.y) * 4 * dt;
        }
        if (en.state === 'patrol') {
          if (dist < 75) en.x -= en.facing * 42 * dt;
          else if (dist > 165) en.x += en.facing * 38 * dt;
          if (dist < 260 && en.stateTimer <= 0) {
            en.state = 'windup';
            en.stateTimer = 0.45;
          }
        } else if (en.state === 'windup' && en.stateTimer <= 0) {
          en.state = 'attack';
          en.stateTimer = 0.25;
          this.projectiles.push({
            id: `ispr_${this.simTime}_${en.id}`,
            x: en.x + en.w / 2,
            y: en.y + 10,
            vx: en.facing * (isSuccubus ? 165 : 185),
            vy: 0,
            radius: isSuccubus ? 5 : 4,
            damage: dmg,
            fromPlayer: false,
            color: isSuccubus ? '#ec4899' : '#fde047',
            life: 2.2,
            kind: isSuccubus ? 'succubus_orb' : 'arrow',
          });
        } else if (en.state === 'attack' && en.stateTimer <= 0) {
          en.state = 'recover';
          en.stateTimer = isSuccubus ? 1.15 : 1.35;
        } else if (en.state === 'recover' && en.stateTimer <= 0) {
          en.state = 'patrol';
        }
      } else {
        const spd =
          en.archetype === 'demon_lightning'
            ? 84
            : en.archetype === 'demon_tank'
              ? 38
              : en.archetype === 'hobgoblin'
                ? 48
                : 58;
        if (en.state === 'patrol') {
          if (dist > 26 && dist < 340) en.vx = en.facing * spd;
          else if (dist <= 26) {
            en.vx = 0;
            en.state = 'windup';
            en.stateTimer = en.archetype === 'demon_lightning' ? 0.26 : 0.42;
          }
        } else if (en.state === 'windup' && en.stateTimer <= 0) {
          en.state = 'attack';
          en.stateTimer = 0.24;
          en.vx = en.facing * (en.archetype === 'demon_lightning' ? 175 : 70);
          if (targetIsCarriage && targetCar && dist < 38) {
            targetCar.hp = Math.max(0, targetCar.hp - dmg);
            targetCar.hitFlash = 0.2;
            this.spawnFloatingText(targetCar.x + 28, targetCar.y - 6, `-${dmg}`, '#f87171');
          } else if (Math.abs(this.player.x - en.x) < 34 && Math.abs(this.player.y - en.y) < 30) {
            this.damagePlayer(dmg, en.facing * 120);
          }
        } else if (en.state === 'attack' && en.stateTimer <= 0) {
          en.state = 'recover';
          en.stateTimer = en.archetype === 'demon_lightning' ? 0.55 : 0.78;
        } else if (en.state === 'recover' && en.stateTimer <= 0) {
          en.state = 'patrol';
        }
        en.x += en.vx * dt;
        en.vx *= 0.86;
      }
      const rb = ISEKAI_ROOM_BOUNDS[this.realm];
      en.x = Math.max(rb.minX, Math.min(rb.maxX - en.w, en.x));
    }
    this.isekaiEnemies = this.isekaiEnemies.filter((e) => !(e.state === 'ko' && e.koTimer <= 0));

    // 3. Step 3 Demon Kings (A-Rank normal real-time canvas combat, casting diverse purple flame skills every 2s!)
    if (this.realm === 'demon_king_arena') {
      for (const dk of this.demonKings) {
        dk.hitFlash = Math.max(0, dk.hitFlash - dt);
        if (dk.activeSkillTimer > 0) {
          dk.activeSkillTimer = Math.max(0, dk.activeSkillTimer - dt);
          if (dk.activeSkillTimer === 0) dk.activeSkillBanner = null;
        }
        if ((dk.stunTimer ?? 0) > 0) {
          dk.stunTimer = Math.max(0, (dk.stunTimer ?? 0) - dt);
        }
        if (dk.defeated || dk.hp <= 0 || frozen || (dk.stunTimer ?? 0) > 0) continue;

        const dx = this.player.x - dk.x;
        const dist = Math.abs(dx);
        dk.facing = dx >= 0 ? 1 : -1;
        if (dist > 64) {
          dk.vx += dk.facing * 52 * dt;
        }
        dk.x = Math.max(36, Math.min(590, dk.x + dk.vx * dt));
        dk.vx *= 0.88;

        dk.purpleFlameTimer -= dt;
        if (dk.purpleFlameTimer <= 0) {
          dk.purpleFlameTimer = 2.0; // Every 2 seconds!
          dk.castIndex += 1;
          const cast = createDemonKingPurpleFlameCast(dk, dk.castIndex, this.player.x, FLOOR_Y);
          dk.activeSkillBanner = cast.skillName;
          dk.activeSkillTimer = 1.4;
          this.activeCastBanner = `${dk.name}: ${cast.skillName}!`;
          this.activeCastBannerTimer = 1.6;
          this.purpleFlameZones.push(...cast.zones);
          this.projectiles.push(...cast.projectiles);
          this.spawnBurst(dk.x + dk.w / 2, dk.y + 18, 12, '#c084fc');
          gameAudio.playSkill('candlefire_wave');
        }
      }

      for (let i = this.purpleFlameZones.length - 1; i >= 0; i--) {
        const z = this.purpleFlameZones[i];
        if (!frozen) {
          z.life -= dt;
        }
        if (
          !z.hasHit &&
          rectsOverlap(z.x + 2, z.y + 10, z.w - 4, z.h - 10, this.player.x, this.player.y, this.player.w, this.player.h)
        ) {
          z.hasHit = true;
          this.damagePlayer(z.damage, this.player.facing * -90);
        }
        if (z.life <= 0) {
          this.purpleFlameZones.splice(i, 1);
        }
      }
    }

    // 4. Mission Completion Check!
    let completed = false;
    if (this.realm === 'goblin_dungeon' || this.realm === 'demon_realm') {
      completed = this.isekaiEnemies.length === 0;
    } else if (this.realm === 'carriage_escort' && this.carriageEscort) {
      completed = this.carriageEscort.progress >= 100 && this.isekaiEnemies.length === 0;
    } else if (this.realm === 'demon_king_arena') {
      completed = this.demonKings.length > 0 && this.demonKings.every((dk) => dk.defeated || dk.hp <= 0);
    }

    if (completed) {
      this.onIsekaiMissionComplete(mission.id);
    }
  }

  private onIsekaiMissionComplete(missionId: GuildMissionId): void {
    const mission = GUILD_MISSIONS.find((m) => m.id === missionId);
    if (!mission) return;
    const prevRank = this.guildRank;
    this.activeMissionId = null;
    this.isekaiEnemies = [];
    this.purpleFlameZones = [];
    this.projectiles = [];
    this.activeCastBanner = null;
    this.player.gold += mission.rewardGold;
    this.player.statPoints += 6;
    const promo = promoteGuildRankAfterMission(
      this.guildRank,
      mission.id,
      this.inventory,
      this.bRankEscortsCompleted,
    );
    this.guildRank = promo.nextRank;
    this.bRankEscortsCompleted = promo.nextBRankEscorts;
    addInventoryResource(this.inventory, 'crimson_vial', 1);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'guild:mission_complete', missionId, newRank: this.guildRank }));
    }

    if (mission.id === 'a_three_demon_kings') {
      this.coronationCutscene = {
        timer: 4.5,
        duration: 4.5,
      };
      gameAudio.playSecretFound();
      this.emitHud(true);
      return;
    }

    // Below B-Rank in Goblin or Demon dungeons: offer Return to Guild OR Stay & Go Deeper!
    if (
      rankIndex(prevRank) < rankIndex('B') &&
      (mission.realm === 'goblin_dungeon' || mission.realm === 'demon_realm')
    ) {
      this.dungeonChoicePending = {
        missionId: mission.id,
        missionTitle: mission.title,
        realm: mission.realm,
        nextDepth: this.dungeonDepth + 1,
        promotedRank: promo.promoted ? promo.nextRank : null,
        rewardGold: mission.rewardGold,
      };
      gameAudio.playSecretFound();
      this.showAnnouncement(
        promo.promoted
          ? `Depth ${this.dungeonDepth} Cleared! Promoted to ${promo.nextRank}-Rank!`
          : `Depth ${this.dungeonDepth} Cleared! Return to Guild or Go Deeper!`,
      );
      void this.saveCurrentGame('autosave', true);
      this.emitHud(true);
      return;
    }

    this.enterIsekaiRoom('isekai_guild', mission.floorReq === 2 ? 560 : 160);
    if (mission.floorReq === 2 && canAccessGuildFloor2(this.guildRank)) {
      this.player.y = GUILD_FLOOR2_Y - this.player.h;
    }
    gameAudio.playSecretFound();
    const isEscortProgress = mission.id === 'b_princess_carriage' && !promo.promoted;
    this.showSecretCaption(
      promo.promoted
        ? `PROMOTED TO ${promo.nextRank}-RANK ADVENTURER!`
        : isEscortProgress
          ? `PRINCESS ESCORT ${this.bRankEscortsCompleted}/3 COMPLETE!`
          : `QUEST CLEARED: ${mission.title}`,
      isEscortProgress
        ? `Guard ${3 - this.bRankEscortsCompleted} more different bandit convoy(s) to advance from B to A Rank!`
        : `+${mission.rewardGold}G & +6 Stat Points earned! Speak to the Guild Commander!`,
    );
    this.openDialogue(mission.floorReq === 2 ? 'Commander Aerin' : 'Receptionist Luna', 'npc', '#38bdf8', [
      `Splendid work! "${mission.title}" is officially stamped COMPLETE!`,
      promo.promoted
        ? `Here is your gleaming ${promo.nextRank}-Rank Guild Badge! New expeditions are unlocked!`
        : isEscortProgress
          ? `Princess Aurelia arrived safely! (${this.bRankEscortsCompleted}/3 Escorts finished — ${3 - this.bRankEscortsCompleted} left to earn A-Rank!)`
          : `Reward +${mission.rewardGold}G delivered! Ready for your next quest whenever you are.`,
    ]);
    void this.saveCurrentGame('autosave', true);
    this.emitHud(true);
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
          if (!hit && ch.boss && !ch.boss.defeated && canPlayerEngageBoss(this.worldRole)) {
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
        if (!hit) {
          for (const en of this.isekaiEnemies) {
            if (en.state === 'ko') continue;
            if (rectsOverlap(pr.x - pr.radius, pr.y - pr.radius, pr.radius * 2, pr.radius * 2, en.x, en.y, en.w, en.h)) {
              const res = applyDamageToEnemy(en, pr.damage, Math.sign(pr.vx) * 90);
              this.spawnFloatingText(en.x + 8, en.y - 4, `${pr.damage}`, '#fb923c');
              this.spawnBurst(pr.x, pr.y, 8, pr.color);
              if (res.killed) this.onIsekaiEnemyKilled(en);
              hit = true;
              break;
            }
          }
        }
        if (!hit) {
          for (const dk of this.demonKings) {
            if (dk.defeated || dk.hp <= 0) continue;
            if (rectsOverlap(pr.x - pr.radius, pr.y - pr.radius, pr.radius * 2, pr.radius * 2, dk.x, dk.y, dk.w, dk.h)) {
              const dkDmg = dk.windVulnerable ? Math.round(pr.damage * (1 + WIND_ORB_DAMAGE_BONUS)) : pr.damage;
              dk.hp = Math.max(0, dk.hp - dkDmg);
              dk.hitFlash = 0.14;
              this.spawnFloatingText(dk.x + dk.w / 2, dk.y - 6, `${dkDmg}`, '#f0abfc');
              this.spawnBurst(pr.x, pr.y, 10, '#c084fc');
              if (dk.hp <= 0) {
                dk.defeated = true;
                this.onDemonKingDefeated(dk);
              }
              hit = true;
              break;
            }
          }
        }
        if (hit) {
          gameAudio.playHit(false);
          this.projectiles.splice(i, 1);
        }
      } else {
        if (
          this.realm === 'carriage_escort' &&
          this.carriageEscort &&
          rectsOverlap(
            pr.x - pr.radius,
            pr.y - pr.radius,
            pr.radius * 2,
            pr.radius * 2,
            this.carriageEscort.x,
            this.carriageEscort.y,
            56,
            46,
          )
        ) {
          this.carriageEscort.hp = Math.max(0, this.carriageEscort.hp - pr.damage);
          this.carriageEscort.hitFlash = 0.2;
          this.spawnFloatingText(this.carriageEscort.x + 28, this.carriageEscort.y - 6, `-${pr.damage}`, '#f87171');
          this.projectiles.splice(i, 1);
          continue;
        }
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

    // Royal S-Rank Coronation Cutscene Layer
    if (this.coronationCutscene && this.status === 'playing') {
      const cc = this.coronationCutscene;
      const elapsed = cc.duration - cc.timer;
      const prog = Math.max(0, Math.min(1, elapsed / cc.duration));
      const phase: CoronationCutsceneHud['phase'] =
        prog < 0.35 ? 'approach' : prog < 0.72 ? 'crowning' : 'cheering';
      const subtitle =
        phase === 'approach'
          ? 'All 3 Demon Kings have fallen — Solaris Cathedral opens!'
          : phase === 'crowning'
            ? 'The Sovereign Crown descends upon the Hero of Solaris!'
            : 'Long live our new S-Rank Royalty! The whole town rejoices!';
      drawCoronationCutscene(
        ctx,
        { phase, progress: prog, subtitle },
        this.player.customization,
        this.simTime,
      );
      ctx.restore();
      return;
    }

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
        b.windVulnerable,
      );
      if (this.encounterFlashTimer > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.75, this.encounterFlashTimer * 2.2)})`;
        ctx.fillRect(0, 0, PIXEL_W, PIXEL_H);
      }
      ctx.restore();
      return;
    }

    const frozen = this.player.chronoFreezeTimer > 0;
    const isIsekai = this.status === 'playing' && this.realm !== 'citadel';

    if (isIsekai) {
      if (this.realm === 'isekai_town') {
        drawIsekaiTownBackdrop(ctx, renderCamX, this.simTime, this.crownUnlocked);
      } else if (this.realm === 'isekai_guild') {
        drawIsekaiGuildInterior(ctx, renderCamX, this.simTime, this.guildRank);
      } else if (this.realm === 'isekai_wardrobe') {
        drawIsekaiWardrobeInterior(ctx, renderCamX);
      } else if (this.realm === 'isekai_potion_shop') {
        drawIsekaiPotionShopInterior(ctx, renderCamX, this.simTime);
      } else if (this.realm === 'isekai_weapons_shop') {
        drawIsekaiWeaponsShopInterior(ctx, renderCamX, this.simTime);
      } else if (this.realm === 'goblin_dungeon') {
        drawGoblinDungeonBackdrop(ctx, renderCamX, this.simTime);
      } else if (this.realm === 'carriage_escort') {
        drawCarriageEscortBackdrop(ctx, renderCamX, this.simTime);
      } else if (this.realm === 'demon_realm' || this.realm === 'demon_king_arena') {
        drawDemonRealmBackdrop(ctx, renderCamX, this.simTime);
      }

      const platBiome: BiomeId =
        this.realm === 'demon_realm' || this.realm === 'demon_king_arena'
          ? 'volcano'
          : this.realm === 'carriage_escort'
            ? 'forest'
            : 'castle';
      drawIsekaiFloors(ctx, this.realm, renderCamX, this.simTime);
      drawPlatforms(
        ctx,
        this.isekaiPlatforms.filter((p) => p.kind !== 'floor'),
        platBiome,
        renderCamX,
        this.simTime,
      );
      drawInteractables(ctx, this.isekaiInteractables, [], renderCamX, this.simTime);

      for (const peer of this.peers.values()) {
        drawPeer(ctx, peer, renderCamX, this.simTime);
      }

      if (this.isekaiNpcs.length > 0) {
        drawIsekaiNpcs(ctx, this.isekaiNpcs, renderCamX, this.simTime, this.crownUnlocked);
      }
      if (this.carriageEscort) {
        drawRoyalCarriage(ctx, this.carriageEscort, renderCamX, this.simTime);
      }
      for (const en of this.isekaiEnemies) {
        drawEnemy(ctx, en, renderCamX, this.simTime, frozen);
      }
      if (this.demonKings.length > 0) {
        drawDemonKings(ctx, this.demonKings, renderCamX, this.simTime, frozen);
        drawPurpleFlameZones(ctx, this.purpleFlameZones, renderCamX, this.simTime);
      }
    } else {
      drawBiomeBackdrop(ctx, biome, renderCamX, this.simTime);

      const chunks = this.getActiveChunks();

      for (const ch of chunks) {
        drawPlatforms(ctx, ch.platforms, ch.biome, renderCamX, this.simTime);
        if (ch.index === 41) {
          drawVolcanoPitChasm(ctx, ch.startX, 190, renderCamX, this.simTime);
        }
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
    }

    // Ambient floating candle embers / forest fireflies / sunlit motes
    const moteColor = isIsekai
      ? this.realm === 'demon_realm' || this.realm === 'demon_king_arena'
        ? '#c084fc'
        : '#fef08a'
      : biome === 'castle'
        ? '#fbbf24'
        : biome === 'forest'
          ? '#6ee7b7'
          : '#fb923c';
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
      false,
      '#60a5fa',
      undefined,
      this.player.customization,
      this.player.comboSubStep,
      this.player.isSpinDashAttack,
      this.simTime,
    );

    if (this.starPlatinumTimer > 0) {
      drawStarPlatinumGuardian(
        ctx,
        this.player.x,
        this.player.y,
        this.player.facing,
        renderCamX,
        this.simTime,
        this.starPlatinumTimer,
      );
    }

    drawProjectiles(ctx, this.projectiles, renderCamX);

    if (!isIsekai && renderCamX < 40) {
      drawDarkSanctumLighting(ctx, renderCamX, this.player.x, this.player.y, this.simTime);
    }

    if ((this.realm === 'goblin_dungeon' || this.realm === 'demon_realm') && this.dungeonDepth >= 2) {
      drawDungeonDepthOverlay(
        ctx,
        this.dungeonDepth,
        this.player.x - renderCamX + 8,
        this.player.y + 12,
        this.simTime,
      );
    }

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

    // Subtle candle-lit perimeter vignette only inside Citadel / Demon Dungeons (keep sunny Isekai town crisp & bright!)
    if (!isIsekai || this.realm === 'goblin_dungeon' || this.realm === 'demon_realm' || this.realm === 'demon_king_arena') {
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
    }

    // Mega Boss / Gyro Zeppeli Glitch-Crash & Intro Cutscene Layer
    if (this.megaCutscene && this.status === 'playing') {
      const mc = this.megaCutscene;
      const elapsed = mc.duration - mc.timer;
      const phase: 'glitch' | 'reveal' = elapsed < 0.95 ? 'glitch' : 'reveal';
      const progress = phase === 'glitch' ? elapsed / 0.95 : (elapsed - 0.95) / Math.max(0.1, mc.duration - 0.95);
      const hudCutscene: MegaCutsceneHud = {
        archetype: mc.archetype,
        name: mc.pendingBoss.def.name,
        title: mc.pendingBoss.def.title,
        standName: mc.pendingBoss.def.standName,
        subtitle: mc.pendingBoss.def.voiceLine,
        phase,
        progress: Math.max(0, Math.min(1, progress)),
      };
      drawMegaBossCutscene(ctx, hudCutscene, mc.pendingBoss, this.simTime);
    }

    ctx.restore();
  }

  private getNearbyInteractableLabel(): string | null {
    if (this.realm !== 'citadel') {
      for (const prop of this.isekaiInteractables) {
        if (
          rectsOverlap(
            this.player.x - 14,
            this.player.y - 8,
            this.player.w + 28,
            this.player.h + 16,
            prop.x,
            prop.y,
            prop.w,
            prop.h,
          )
        ) {
          return `[F] ${prop.label}`;
        }
      }
      for (const npc of this.isekaiNpcs) {
        if (Math.abs(this.player.x - npc.x) < 34) {
          return `[F] Talk to ${npc.name}`;
        }
      }
      return null;
    }

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

  private buildIsekaiMissionHud(): IsekaiMissionHud | null {
    if (!this.activeMissionId) return null;
    const m = GUILD_MISSIONS.find((x) => x.id === this.activeMissionId);
    if (!m) return null;
    let objectiveText = m.summary;
    if (this.realm === 'goblin_dungeon') {
      objectiveText = `Clear Goblins & Hobgoblins (${this.isekaiEnemies.length} remaining)`;
    } else if (this.realm === 'carriage_escort' && this.carriageEscort) {
      objectiveText = `Escort Princess Carriage (${this.carriageEscort.progress}%) · ${this.isekaiEnemies.length} Bandits`;
    } else if (this.realm === 'demon_realm') {
      objectiveText = `Clear Demon Realm Vanguard (${this.isekaiEnemies.length} demons left)`;
    } else if (this.realm === 'demon_king_arena') {
      const aliveKings = this.demonKings.filter((k) => !k.defeated && k.hp > 0).length;
      objectiveText = `Slay the 3 Demon Kings (${aliveKings} Kings remaining)`;
    }
    return {
      missionId: m.id,
      title: m.title,
      rank: m.rankReq,
      objectiveText,
      killsDone: this.isekaiKillsDone,
      killsRequired: Math.max(1, this.isekaiKillsRequired),
      carriageHp: this.carriageEscort ? Math.round(this.carriageEscort.hp) : undefined,
      carriageMaxHp: this.carriageEscort ? this.carriageEscort.maxHp : undefined,
      carriageProgress: this.carriageEscort ? this.carriageEscort.progress : undefined,
      demonKings:
        this.realm === 'demon_king_arena'
          ? this.demonKings.map((k) => ({
              id: k.id,
              name: k.name,
              hp: Math.round(k.hp),
              maxHp: k.maxHp,
              defeated: k.defeated,
              windVulnerable: Boolean(k.windVulnerable),
              stunned: (k.stunTimer ?? 0) > 0,
            }))
          : undefined,
      activeCastBanner: this.activeCastBanner,
      completed: false,
    };
  }

  private emitHud(force = false): void {
    const biome = this.getCurrentBiome();
    const nearbyBoss = this.realm === 'citadel' ? this.getActiveNearbyBoss() : null;
    const nearbyPrompt = this.getNearbyInteractableLabel();
    const custSig = `${this.player.customization.cloakColor},${this.player.customization.armorColor},${this.player.customization.visorColor},${this.player.customization.plumeColor},${this.player.customization.outfitStyle ?? ''},${this.player.customization.headgearStyle ?? ''},${this.player.customization.crownEquipped ? '1' : '0'}`;
    const secCapSig = this.secretCaption ? `${this.secretCaption.title}:${this.secretCaption.detail}` : 'none';
    const megaCutSig = this.megaCutscene
      ? `${this.megaCutscene.archetype}:${this.megaCutscene.timer.toFixed(1)}`
      : 'none';
    const corSig = this.coronationCutscene ? this.coronationCutscene.timer.toFixed(1) : 'none';
    const missionHud = this.buildIsekaiMissionHud();
    const missionSig = missionHud
      ? `${missionHud.missionId}:${missionHud.killsDone}:${missionHud.carriageProgress ?? 0}:${missionHud.carriageHp ?? 0}:${missionHud.activeCastBanner ?? ''}:${missionHud.demonKings?.map((k) => `${k.hp}:${k.windVulnerable ? 1 : 0}:${k.stunned ? 1 : 0}`).join(',') ?? ''}`
      : 'none';
    const orbSig = this.inventory
      .filter((it) => it.category === 'orb')
      .map((it) => `${it.id}:${it.count}`)
      .join(',');
    const idleLeft = Math.max(0, Math.ceil(ISEKAI_IDLE_TRANSPORT_SECONDS - this.player.idleTimer));

    const activeGuildFloor: 1 | 2 =
      this.realm === 'isekai_guild' && this.player.y + this.player.h <= GUILD_FLOOR2_Y + 10 ? 2 : 1;

    const sig = [
      this.status,
      this.realm,
      this.guildRank,
      this.bRankEscortsCompleted,
      this.dungeonDepth,
      this.dungeonChoicePending ? `${this.dungeonChoicePending.missionId}:${this.dungeonChoicePending.nextDepth}` : 'none',
      activeGuildFloor,
      this.player.damageBoostTimer > 0 ? `${this.player.damageBoostMultiplier.toFixed(2)}:${Math.ceil(this.player.damageBoostTimer)}` : '0',
      orbSig,
      this.unlockedWardrobe.join(','),
      this.crownUnlocked ? '1' : '0',
      this.gyroDefeated ? '1' : '0',
      this.isekaiPortalOpen ? '1' : '0',
      idleLeft,
      missionSig,
      corSig,
      this.onlineAdventurers.length,
      this.pendingGuildInvites.length,
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
      custSig,
      biome,
      Math.round((this.player.x - 68) / 16),
      this.player.bossesDefeated,
      this.player.secretsFound,
      this.player.equippedWeapon,
      this.player.skillSlots.join(','),
      this.player.skillCooldowns.map((c) => c.toFixed(1)).join(','),
      this.player.dashCooldown.toFixed(1),
      this.starPlatinumTimer > 0 ? '1' : '0',
      Math.ceil(this.bossCooldownSeconds),
      this.bossesFoughtStreak,
      this.dialogue ? `${this.dialogue.lineIndex}:${this.dialogue.charIndex}` : 'none',
      nearbyBoss ? `${nearbyBoss.def.index}:${Math.round(nearbyBoss.hp)}` : 'none',
      this.bossBattle
        ? `${this.bossBattle.phase}:${Math.round(this.bossBattle.boss.hp)}:${this.bossBattle.message}`
        : 'none',
      megaCutSig,
      this.onlineCount,
      this.worldId,
      this.worldRole,
      this.worldPlayerCount,
      this.onlineWorlds.length,
      this.lastSavedAt ?? '',
      this.announcement ?? '',
      secCapSig,
      nearbyPrompt ?? '',
      gameAudio.isMuted() ? '1' : '0',
    ].join('|');

    if (!force && sig === this.lastHudSignature) return;
    this.lastHudSignature = sig;

    let megaCutsceneHud: MegaCutsceneHud | null = null;
    if (this.megaCutscene) {
      const mc = this.megaCutscene;
      const elapsed = mc.duration - mc.timer;
      const phase: 'glitch' | 'reveal' = elapsed < 0.95 ? 'glitch' : 'reveal';
      const progress = phase === 'glitch' ? elapsed / 0.95 : (elapsed - 0.95) / Math.max(0.1, mc.duration - 0.95);
      megaCutsceneHud = {
        archetype: mc.archetype,
        name: mc.pendingBoss.def.name,
        title: mc.pendingBoss.def.title,
        standName: mc.pendingBoss.def.standName,
        subtitle: mc.pendingBoss.def.voiceLine,
        phase,
        progress: Math.max(0, Math.min(1, progress)),
      };
    }

    let coronationHud: CoronationCutsceneHud | null = null;
    if (this.coronationCutscene) {
      const prog = Math.max(
        0,
        Math.min(1, (this.coronationCutscene.duration - this.coronationCutscene.timer) / this.coronationCutscene.duration),
      );
      const phase: CoronationCutsceneHud['phase'] =
        prog < 0.35 ? 'approach' : prog < 0.72 ? 'crowning' : 'cheering';
      coronationHud = {
        phase,
        progress: prog,
        subtitle:
          phase === 'approach'
            ? 'All 3 Demon Kings have fallen!'
            : phase === 'crowning'
              ? 'The Golden Sovereign Crown descends!'
              : 'All of Solaris Town celebrates your Royal S-Rank Coronation!',
      };
    }

    const realmLabelMap: Record<RealmMode, string> = {
      citadel: getBiomeDisplayName(biome),
      isekai_town: 'Solaris Isekai Town',
      isekai_guild: activeGuildFloor === 2 ? 'Adventure Guild · 2nd Floor Command' : 'Solaris Adventure Guild',
      isekai_wardrobe: 'Royal Boutique & Wardrobe',
      isekai_potion_shop: 'Glowing Potion Apothecary',
      isekai_weapons_shop: 'Grand Solaris Armory',
      goblin_dungeon: `Rocky Goblin Cavern (Depth ${this.dungeonDepth})`,
      carriage_escort: 'Kingdom Highway Escort',
      demon_realm: `Demon Realm Caldera (Depth ${this.dungeonDepth})`,
      demon_king_arena: 'Three Demon Kings Citadel',
    };

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
      customization: { ...this.player.customization },
      biome,
      biomeLabel: realmLabelMap[this.realm],
      distanceMeters: Math.round((this.player.x - 68) / 16),
      bossesDefeated: this.player.bossesDefeated,
      totalBosses: TOTAL_BOSSES,
      secretsFound: this.player.secretsFound,
      totalSecrets: TOTAL_HIDDEN_PASSAGES,
      equippedWeapon: this.player.equippedWeapon,
      unlockedWeapons: [...this.player.unlockedWeapons],
      skillSlots: [...this.player.skillSlots],
      skillCooldowns: [...this.player.skillCooldowns],
      dashCooldown: Number(this.player.dashCooldown.toFixed(2)),
      starPlatinumActive: this.starPlatinumTimer > 0,
      bossCooldownSeconds: Math.ceil(this.bossCooldownSeconds),
      bossFoughtStreak: this.bossesFoughtStreak,
      idleSecondsToIsekai: idleLeft,
      realm: this.realm,
      guildRank: this.guildRank,
      bRankEscortsCompleted: this.bRankEscortsCompleted,
      dungeonDepth: this.dungeonDepth,
      dungeonChoicePending: this.dungeonChoicePending ? { ...this.dungeonChoicePending } : null,
      activeGuildFloor,
      damageBoostMultiplier: this.player.damageBoostTimer > 0 ? this.player.damageBoostMultiplier : 1,
      damageBoostSeconds: Math.ceil(this.player.damageBoostTimer),
      unlockedWardrobe: [...this.unlockedWardrobe],
      crownUnlocked: this.crownUnlocked,
      gyroDefeated: this.gyroDefeated,
      isekaiPortalOpen: this.isekaiPortalOpen,
      isekaiMission: missionHud,
      coronationCutscene: coronationHud,
      onlineAdventurers: [...this.onlineAdventurers],
      pendingGuildInvites: [...this.pendingGuildInvites],
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
      megaCutscene: megaCutsceneHud,
      checkpoints: getBiomeCheckpointList(this.player.highestCheckpointIndex),
      onlineCount: this.onlineCount,
      worldId: this.worldId,
      worldRole: this.worldRole,
      worldHostName: this.worldHostName,
      isWorldPublic: this.isWorldPublic,
      onlineWorlds: [...this.onlineWorlds],
      worldPlayerCount: this.worldPlayerCount,
      lastSavedAt: this.lastSavedAt,
      announcement: this.announcement,
      secretCaption: this.secretCaption ? { ...this.secretCaption } : null,
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

      ws.onopen = () => {
        this.syncHostWorldMeta();
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(String(ev.data));
          if (msg.type === 'world:init') {
            this.selfPeerId = msg.selfId;
            this.ownWorldId = msg.ownWorldId || msg.worldId || 'LOCAL';
            this.worldId = msg.worldId || this.ownWorldId;
            this.worldRole = msg.role === 'guest' ? 'guest' : 'host';
            this.worldHostName = msg.hostName || null;
            this.peers.clear();
            for (const p of msg.peers || []) {
              if (p.id !== this.selfPeerId) this.peers.set(p.id, p);
            }
            if (Array.isArray(msg.worlds)) this.onlineWorlds = msg.worlds;
            if (Array.isArray(msg.adventurers)) {
              this.onlineAdventurers = msg.adventurers.filter((a: OnlineAdventurer) => a.id !== this.selfPeerId);
            }
            this.onlineCount = msg.stats?.onlineCount ?? 1;
            this.worldPlayerCount = msg.stats?.worldPlayerCount ?? this.peers.size + 1;
            this.emitHud(true);
          } else if (msg.type === 'world:joined') {
            this.worldId = msg.worldId || this.ownWorldId;
            this.worldRole = msg.role === 'guest' ? 'guest' : 'host';
            this.worldHostName = this.worldRole === 'guest' ? msg.hostName || 'Host' : null;
            this.peers.clear();
            for (const p of msg.peers || []) {
              if (p.id !== this.selfPeerId) this.peers.set(p.id, p);
            }
            this.hostDefeatedBosses = new Set(Array.isArray(msg.defeatedBosses) ? msg.defeatedBosses : []);
            this.worldPlayerCount = msg.worldPlayerCount ?? this.peers.size + 1;
            this.onlineCount = msg.onlineCount ?? this.onlineCount;
            this.bossBattle = null;
            this.megaCutscene = null;
            this.chunks.clear();
            this.chunksDirty = true;
            this.ensureChunksAround(this.player.x);
            if (this.worldRole === 'guest') {
              this.showAnnouncement(
                `Joined ${this.worldHostName}'s Bastera world! Co-op Guest: bosses are locked to Host.`,
              );
            } else {
              this.showAnnouncement('Returned to your own Bastera world.');
            }
            this.emitHud(true);
          } else if (msg.type === 'worlds:list') {
            if (Array.isArray(msg.worlds)) this.onlineWorlds = msg.worlds;
            if (Array.isArray(msg.adventurers)) {
              this.onlineAdventurers = msg.adventurers.filter((a: OnlineAdventurer) => a.id !== this.selfPeerId);
            }
            if (Number.isFinite(msg.onlineCount)) this.onlineCount = msg.onlineCount;
            this.emitHud();
          } else if (msg.type === 'guild:invite_received' && msg.invite) {
            this.pendingGuildInvites = [
              ...this.pendingGuildInvites.filter((i) => i.inviteId !== msg.invite.inviteId),
              msg.invite,
            ];
            this.showAnnouncement(
              `Guild Invite from ${msg.invite.fromName}: ${msg.invite.missionTitle}!`,
            );
            this.emitHud(true);
          } else if (msg.type === 'guild:party_start' && msg.missionId) {
            this.startGuildMission(msg.missionId, false);
          } else if (msg.type === 'world:boss_state' && this.worldRole === 'guest') {
            this.hostDefeatedBosses = new Set(Array.isArray(msg.defeatedBosses) ? msg.defeatedBosses : []);
            this.chunks.clear();
            this.chunksDirty = true;
            this.ensureChunksAround(this.player.x);
            this.emitHud();
          } else if (msg.type === 'world:error' && typeof msg.message === 'string') {
            this.showAnnouncement(msg.message);
          } else if (msg.type === 'peer:join' && msg.peer) {
            if (msg.peer.id !== this.selfPeerId) {
              this.peers.set(msg.peer.id, msg.peer);
              this.showAnnouncement(`${msg.peer.name} joined your Bastera world!`);
            }
            this.worldPlayerCount = msg.worldPlayerCount ?? this.peers.size + 1;
            this.onlineCount = msg.onlineCount ?? this.onlineCount;
            this.emitHud();
          } else if (msg.type === 'peer:update' && msg.peer) {
            if (msg.peer.id !== this.selfPeerId) {
              this.peers.set(msg.peer.id, msg.peer);
            }
          } else if (msg.type === 'peer:leave') {
            this.peers.delete(msg.id);
            this.worldPlayerCount = msg.worldPlayerCount ?? this.peers.size + 1;
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
        realm: this.realm,
        guildRank: this.guildRank,
        customization: this.player.customization,
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
    if (
      this.status !== 'playing' ||
      this.modalPaused ||
      this.bossBattle ||
      this.megaCutscene ||
      this.coronationCutscene ||
      this.volcanoBridgeFallTimer > 0
    ) {
      return;
    }
    if (this.postBossInputLockTimer > 0 && ['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(e.code)) {
      return;
    }
    if (e.repeat && !this.heldKeys.has(e.code)) {
      return;
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
    this.clearAllInputs(true);
  };

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.clearAllInputs(true);
    }
  };

  private attachInputListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private detachInputListeners(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }
}
