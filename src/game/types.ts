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
  | 'phantom_wisp'
  | 'goblin_normal'
  | 'hobgoblin'
  | 'bandit_fighter'
  | 'bandit_archer'
  | 'demon_succubus'
  | 'demon_tank'
  | 'demon_lightning';

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

export type OrbId = 'orb_flame' | 'orb_wind' | 'orb_electric';

export interface InventoryItem {
  id: string;
  name: string;
  category: 'potion' | 'relic' | 'resource' | 'key' | 'orb';
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

export type RealmMode =
  | 'citadel'
  | 'isekai_town'
  | 'isekai_guild'
  | 'isekai_wardrobe'
  | 'goblin_dungeon'
  | 'carriage_escort'
  | 'demon_realm'
  | 'demon_king_arena';

export type GuildRank = 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

export type GuildMissionId =
  | 'f_goblin_warren'
  | 'e_hobgoblin_caves'
  | 'd_deep_goblin_keep'
  | 'c_princess_carriage'
  | 'b_demon_invasion'
  | 'a_three_demon_kings';

export type OutfitStyle =
  | 'knight_plate'
  | 'adventurer_tunic'
  | 'guild_coat'
  | 'demon_slayer'
  | 'royal_regalia';

export type HeadgearStyle = 'helm' | 'beret' | 'bandana' | 'circlet';

export interface WarriorCustomization {
  cloakColor: string;
  armorColor: string;
  visorColor: string;
  plumeColor: string;
  outfitStyle?: OutfitStyle;
  headgearStyle?: HeadgearStyle;
  crownEquipped?: boolean;
}

export type MegaBossArchetype = 'mega_dio' | 'mega_undead_knight';

export type MegaSkillAnimStyle =
  | 'mega_cross_swords'
  | 'mega_prism_knives'
  | 'mega_clock_shatter'
  | 'mega_rainbow_barrage'
  | 'mega_guillotine'
  | 'mega_sword_vortex'
  | 'mega_soulfire_pillars'
  | 'mega_cross_execution'
  | 'gyro_green_ball';

export interface MegaBossSkillDef {
  id: string;
  name: string;
  animStyle: MegaSkillAnimStyle;
  palette: [string, string, string];
  damageMult: number;
  shout: string;
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
  difficultyMultiplier?: number;
  primaryColor: string;
  secondaryColor: string;
  auraColor: string;
  skinColor: string;
  isMegaBoss?: boolean;
  isGyroBoss?: boolean;
  gyroAttackDamage?: number;
  emotes?: string[];
  megaArchetype?: MegaBossArchetype;
  megaSkills?: MegaBossSkillDef[];
  hatStyle:
    | 'crown'
    | 'pompadour'
    | 'tophat'
    | 'visor'
    | 'hood'
    | 'horns'
    | 'halo_spikes'
    | 'samurai_crest'
    | 'gyro_hat';
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
    | 'chrono_shear'
    | 'gyro_spin';
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
  kind:
    | 'throne'
    | 'broken_brick'
    | 'lever'
    | 'pressure_plate'
    | 'chest'
    | 'checkpoint'
    | 'tapestry'
    | 'escape_gate'
    | 'isekai_portal'
    | 'guild_door'
    | 'wardrobe_door'
    | 'town_exit_door'
    | 'guild_reception'
    | 'guild_bar'
    | 'wardrobe_counter'
    | 'bulletin_board'
    | 'mission_gate';
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
  attackDamage?: number;
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
  kind:
    | 'knife'
    | 'rune'
    | 'fireball'
    | 'slash_wave'
    | 'gravity_orb'
    | 'gyro_ball'
    | 'arrow'
    | 'succubus_orb'
    | 'purple_flame'
    | 'purple_meteor';
  spinPhase?: number;
  targetsCarriage?: boolean;
}

export interface DialogueState {
  speaker: string;
  portraitKind: 'warrior' | 'throne' | 'candle' | 'secret' | 'boss' | 'system' | 'npc' | 'princess';
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
  dashCooldown: number;
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
  customization: WarriorCustomization;
  highestCheckpointX: number;
  highestCheckpointIndex: number;
}

export type WorldRole = 'host' | 'guest';

export interface OnlineWorldSummary {
  worldId: string;
  hostPeerId: string;
  hostName: string;
  biome: BiomeId;
  bossesDefeated: number;
  playerCount: number;
  isPublic: boolean;
}

export interface OnlineAdventurer {
  id: string;
  name: string;
  realm: RealmMode;
  guildRank: GuildRank;
  worldId: string;
}

export interface GuildInvite {
  inviteId: string;
  fromPeerId: string;
  fromName: string;
  fromRank: GuildRank;
  missionId: GuildMissionId;
  missionTitle: string;
  worldId: string;
}

export interface GuildBulletinRankingEntry {
  name: string;
  rank: GuildRank;
  score: number;
  title: string;
}

export interface GuildBulletinMissionEntry {
  missionId: GuildMissionId;
  title: string;
  rankReq: GuildRank;
  activeParties: number;
  completions: number;
}

export interface GuildBulletinSnapshot {
  rankings: GuildBulletinRankingEntry[];
  popularMissions: GuildBulletinMissionEntry[];
  tickerText: string;
}

export interface BasteraSaveSummary {
  saveId: string;
  playerName: string;
  savedAt: string;
  biome: BiomeId;
  level: number;
  bossesDefeated: number;
  distanceMeters: number;
  gold: number;
  equippedWeapon: WeaponId;
  guildRank?: GuildRank;
  realm?: RealmMode;
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
  realm?: RealmMode;
  guildRank?: GuildRank;
  bossesDefeated: number;
  color: string;
  customization?: WarriorCustomization;
  worldId?: string;
  role?: WorldRole;
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
    | 'lightning'
    | 'ora_barrage'
    | 'orb_flame'
    | 'orb_wind'
    | 'orb_electric'
    | MegaSkillAnimStyle;
  color: string;
  accentColor: string;
  palette?: [string, string, string];
  skillName?: string;
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
  bossStunReason?: 'freeze' | 'electric' | null;
  windVulnerable?: boolean;
  primaryColor: string;
  secondaryColor: string;
  auraColor: string;
  isMegaBoss?: boolean;
  isGyroBoss?: boolean;
  gyroEmote?: string | null;
  megaArchetype?: MegaBossArchetype;
  activeSkillName?: string | null;
  activeSkillPalette?: [string, string, string] | null;
}

export interface MegaCutsceneHud {
  archetype: MegaBossArchetype | 'gyro_zeppeli';
  name: string;
  title: string;
  standName: string;
  subtitle: string;
  phase: 'glitch' | 'reveal';
  progress: number;
}

export interface IsekaiNpc {
  id: string;
  name: string;
  role: 'townfolk' | 'merchant' | 'guard' | 'adventurer' | 'drinker' | 'receptionist' | 'tailor';
  x: number;
  y: number;
  minX: number;
  maxX: number;
  speed: number;
  facing: 1 | -1;
  walkCycle: number;
  coatColor: string;
  hairColor: string;
  shirtColor: string;
  sitting?: boolean;
  drinkingPhase?: number;
  dialogue: string[];
  crownedDialogue?: string[];
}

export interface DemonKingEntity {
  id: string;
  index: 1 | 2 | 3;
  name: string;
  title: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  facing: 1 | -1;
  hitFlash: number;
  purpleFlameTimer: number;
  castIndex: number;
  activeSkillBanner: string | null;
  activeSkillTimer: number;
  primaryColor: string;
  hornColor: string;
  auraColor: string;
  defeated: boolean;
  stunTimer?: number;
  windVulnerable?: boolean;
}

export type PurpleFlameKind =
  | 'violet_pillars'
  | 'purple_meteors'
  | 'abyssal_nova'
  | 'shadow_crescent';

export interface PurpleFlameZone {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  life: number;
  maxLife: number;
  damage: number;
  kind: PurpleFlameKind;
  hasHit: boolean;
}

export interface CarriageEscortState {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  progress: number; // 0 .. 100
  speed: number;
  wheelPhase: number;
  hitFlash: number;
  wavesSpawned: number;
}

export interface IsekaiMissionHud {
  missionId: GuildMissionId;
  title: string;
  rank: GuildRank;
  objectiveText: string;
  killsDone: number;
  killsRequired: number;
  carriageHp?: number;
  carriageMaxHp?: number;
  carriageProgress?: number;
  demonKings?: {
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    defeated: boolean;
    windVulnerable?: boolean;
    stunned?: boolean;
  }[];
  activeCastBanner?: string | null;
  completed: boolean;
}

export interface CoronationCutsceneHud {
  phase: 'approach' | 'crowning' | 'cheering';
  progress: number;
  subtitle: string;
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
  customization: WarriorCustomization;
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
  dashCooldown: number;
  starPlatinumActive: boolean;
  bossCooldownSeconds: number;
  bossFoughtStreak: number;
  idleSecondsToIsekai: number;
  realm: RealmMode;
  guildRank: GuildRank;
  unlockedWardrobe: string[];
  crownUnlocked: boolean;
  gyroDefeated: boolean;
  isekaiPortalOpen: boolean;
  isekaiMission: IsekaiMissionHud | null;
  coronationCutscene: CoronationCutsceneHud | null;
  onlineAdventurers: OnlineAdventurer[];
  pendingGuildInvites: GuildInvite[];
  guildBulletin: GuildBulletinSnapshot;
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
  megaCutscene: MegaCutsceneHud | null;
  checkpoints: { index: number; x: number; biome: BiomeId; label: string; reached: boolean }[];
  onlineCount: number;
  worldId: string;
  worldRole: WorldRole;
  worldHostName: string | null;
  isWorldPublic: boolean;
  onlineWorlds: OnlineWorldSummary[];
  worldPlayerCount: number;
  lastSavedAt: string | null;
  announcement: string | null;
  secretCaption: { title: string; detail: string } | null;
  nearbyPrompt: string | null;
  muted: boolean;
}


