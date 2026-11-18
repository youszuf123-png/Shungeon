export type BiomeId = 'castle' | 'forest' | 'volcano';

export type WeaponId =
  | 'claymore'
  | 'rapier'
  | 'crescent'
  | 'runeblade'
  | 'katana'
  | 'fire_sword';

export type SkillId =
  | 'blade_dash'
  | 'parry_guard'
  | 'candlefire_wave'
  | 'chrono_freeze'
  | 'stand_rush'
  | 'sunburst_cleave';

export type GameStatus = 'title' | 'playing' | 'paused' | 'gameover' | 'victory';

export type EnemyArchetype =
  | 'skeleton_guard'
  | 'shadow_bat'
  | 'cultist_mage'
  | 'gargoyle_charger'
  | 'cursed_armor'
  | 'phantom_wisp';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  styleName: string;
  description: string;
  sarcasticNote: string;
  damage: number;
  damageMultiplier?: number;
  range: number;
  arcHeight: number;
  windup: number;
  active: number;
  recovery: number;
  comboHits: number;
  knockback: number;
  color: string;
  accentColor: string;
  unlockedByDefault: boolean;
  craftCost?: { resourceId: string; amount: number };
}

export interface SkillDef {
  id: SkillId;
  name: string;
  shortTag: string;
  description: string;
  cooldown: number;
  staminaCost: number;
  damageMultiplier: number;
  color: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'potion' | 'relic' | 'resource' | 'key';
  description: string;
  sarcasticQuote: string;
  count: number;
  color: string;
  healAmount?: number;
  attackBonus?: number;
  maxHpBonus?: number;
}

export interface BossMusicConfig {
  bpm: number;
  rootHz: number;
  scale: number[];
  leadWave: 'square' | 'sawtooth' | 'triangle';
  bassPattern: number[];
  motifSeed: number;
}

export type BossClimateId =
  | 'blood_moon_ash'
  | 'crimson_thunder'
  | 'blizzard_frost'
  | 'arcane_eclipse'
  | 'acid_spore_mist'
  | 'emerald_monsoon'
  | 'magma_emberstorm'
  | 'void_time_fracture'
  | 'solar_mirage'
  | 'obsidian_sandstorm'
  | 'phantom_fog'
  | 'starlight_aurora';

export type StatKey = 'skillDmg' | 'attack' | 'hp' | 'speed';

export interface PlayerStats {
  skillDmg: number;
  attack: number;
  hp: number;
  speed: number;
}

export interface BossDef {
  index: number; // 1 .. 120+
  name: string;
  title: string;
  standName: string;
  biome: BiomeId;
  climate: BossClimateId;
  climateLabel: string;
  climateSkyTop: string;
  climateSkyBottom: string;
  climateParticleColor: string;
  maxHp: number;
  primaryColor: string;
  secondaryColor: string;
  auraColor: string;
  skinColor: string;
  hatStyle:
    | 'crown'
    | 'pompadour'
    | 'tophat'
    | 'visor'
    | 'hood'
    | 'horns'
    | 'halo_spikes'
    | 'samurai_crest';
  coatStyle: 'cape' | 'trench' | 'armor' | 'vest' | 'robes' | 'spiked_mantle';
  standShape: 'brawler' | 'reaper' | 'knight' | 'clockwork' | 'serpent' | 'sovereign';
  emblem: 'star' | 'clock' | 'skull' | 'diamond' | 'eye' | 'flame';
  scaleFactor: number;
  voiceLine: string;
  battleShout: string;
  defeatLine: string;
  attackPattern:
    | 'time_knives'
    | 'stand_barrage'
    | 'pillar_slam'
    | 'gravity_orb'
    | 'blood_scythe'
    | 'lightning_overdrive'
    | 'magma_eruption'
    | 'chrono_shear';
  attackName: string;
  music: BossMusicConfig;
}

export interface Platform {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'floor' | 'brick' | 'carpet_ledge' | 'secret_bridge' | 'bridge';
  breakable?: boolean;
}

export interface CandleProp {
  id: string;
  x: number;
  y: number;
  kind: 'wall_sconce' | 'candelabra' | 'brazier' | 'rune_lantern';
  phase: number;
}

export interface InteractableProp {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'throne' | 'broken_brick' | 'lever' | 'pressure_plate' | 'chest' | 'checkpoint' | 'tapestry' | 'escape_gate';
  label: string;
  dialogue: string[];
  speaker: string;
  activated: boolean;
  secretId?: string;
  rewardItemId?: string;
  rewardWeaponId?: WeaponId;
  checkpointIndex?: number;
}

export interface HiddenPassage {
  id: string;
  index: number; // 1 .. 108+
  x: number;
  y: number;
  w: number;
  h: number;
  biome: BiomeId;
  puzzleType: 'cracked_wall' | 'royal_lever' | 'torch_plate' | 'illusory_tapestry';
  discovered: boolean;
  hintText: string;
  discoveryText: string;
  rewardText: string;
}

export interface EnemyState {
  id: string;
  archetype: EnemyArchetype;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  facing: 1 | -1;
  state: 'patrol' | 'windup' | 'attack' | 'recover' | 'ko';
  stateTimer: number;
  patrolOriginX: number;
  hitFlash: number;
  biome: BiomeId;
  rewardGold: number;
  koTimer: number;
}

export interface ActiveBoss {
  def: BossDef;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  facing: 1 | -1;
  state: 'intro' | 'idle' | 'windup' | 'attack' | 'recover' | 'ko';
  stateTimer: number;
  hitFlash: number;
  posePhase: number;
  arenaMinX: number;
  arenaMaxX: number;
  defeated: boolean;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  fromPlayer: boolean;
  color: string;
  life: number;
  kind: 'knife' | 'rune' | 'fireball' | 'slash_wave' | 'gravity_orb';
}

export interface DialogueState {
  speaker: string;
  portraitKind: 'warrior' | 'throne' | 'candle' | 'secret' | 'boss' | 'system';
  portraitColor: string;
  lines: string[];
  lineIndex: number;
  charIndex: number;
  charTimer: number;
  active: boolean;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  facing: 1 | -1;
  onGround: boolean;
  coyoteTimer: number;
  jumpBufferTimer: number;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  gold: number;
  equippedWeapon: WeaponId;
  unlockedWeapons: WeaponId[];
  skillSlots: [SkillId, SkillId, SkillId];
  skillCooldowns: [number, number, number];
  attackPhase: 'none' | 'windup' | 'active' | 'recovery';
  attackTimer: number;
  comboStep: number;
  comboWindowTimer: number;
  invulnTimer: number;
  parryTimer: number;
  chronoFreezeTimer: number;
  hitFlash: number;
  squashX: number;
  squashY: number;
  walkCycle: number;
  idleTimer: number;
  bossesDefeated: number;
  monstersSlain: number;
  secretsFound: number;
  level: number;
  statPoints: number;
  stats: PlayerStats;
  highestCheckpointX: number;
  highestCheckpointIndex: number;
}

export interface MultiplayerPeer {
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
}

export type BossBattlePhase =
  | 'intro'
  | 'menu'
  | 'player_anim'
  | 'potion_anim'
  | 'enemy_anim'
  | 'run_anim'
  | 'escape_anim'
  | 'victory'
  | 'defeat';

export interface BossBattleSlashFx {
  target: 'boss' | 'player';
  style:
    | 'sword'
    | 'cross'
    | 'barrage'
    | 'fire'
    | 'solar'
    | 'stand_claw'
    | 'knife_volley'
    | 'seismic'
    | 'void_crush'
    | 'lightning';
  color: string;
  accentColor: string;
  progress: number; // 0..1
}

export interface BossBattleSnapshot {
  bossIndex: number;
  bossName: string;
  bossTitle: string;
  standName: string;
  biome: BiomeId;
  climateLabel: string;
  attackName: string;
  bossHp: number;
  bossMaxHp: number;
  phase: BossBattlePhase;
  message: string;
  speaker: string;
  lastPlayerDamage: number | null;
  lastBossDamage: number | null;
  guardActive: boolean;
  bossFrozenTurns: number;
  primaryColor: string;
  secondaryColor: string;
  auraColor: string;
  jotaroLine: string | null;
  jotaroVoiceStatus: 'idle' | 'generating' | 'ready' | 'error';
  jotaroVoiceError: string | null;
}

export interface HudSnapshot {
  status: GameStatus;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  gold: number;
  level: number;
  statPoints: number;
  stats: PlayerStats;
  monstersSlain: number;
  biome: BiomeId;
  biomeLabel: string;
  distanceMeters: number;
  bossesDefeated: number;
  totalBosses: number;
  secretsFound: number;
  totalSecrets: number;
  equippedWeapon: WeaponId;
  unlockedWeapons: WeaponId[];
  skillSlots: [SkillId, SkillId, SkillId];
  skillCooldowns: [number, number, number];
  inventory: InventoryItem[];
  dialogue: DialogueState | null;
  activeBoss: {
    index: number;
    name: string;
    title: string;
    standName: string;
    hp: number;
    maxHp: number;
    voiceLine: string;
  } | null;
  bossBattle: BossBattleSnapshot | null;
  checkpoints: { index: number; x: number; biome: BiomeId; label: string; reached: boolean }[];
  onlineCount: number;
  announcement: string | null;
  nearbyPrompt: string | null;
  muted: boolean;
}

