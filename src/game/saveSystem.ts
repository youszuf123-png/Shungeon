import { SKILLS, WEAPONS } from './data';
import {
  DEFAULT_WARRIOR_CUSTOMIZATION,
  createInitialInventory,
  createInitialPlayer,
} from './rules';
import type {
  BasteraSaveSummary,
  BiomeId,
  EnemyArchetype,
  GuildRank,
  InventoryItem,
  PlayerState,
  RealmMode,
  SkillId,
  WeaponId,
  WorldRole,
} from './types';

export const SAVE_VERSION = 1;
export const LOCAL_SAVES_STORAGE_KEY = 'bastera_saves_v1';

export interface BasteraSaveData {
  version: number;
  saveId: string;
  playerName: string;
  savedAt: string;
  biome: BiomeId;
  player: PlayerState;
  inventory: InventoryItem[];
  defeatedBosses: number[];
  discoveredSecrets: string[];
  openedChests: string[];
  volcanoBridgeFallTriggered: boolean;
  darkSanctumDiscovered: boolean;
  bossFoughtStreak?: number;
  bossCooldownSeconds?: number;
  realm?: RealmMode;
  guildRank?: GuildRank;
  rankMissionsCompleted?: number;
  bRankEscortsCompleted?: number;
  acceptedMissionId?: import('./types').GuildMissionId | null;
  isekaiClockSeconds?: number;
  arenaWins?: number;
  unlockedWardrobe?: string[];
  foughtIsekaiEnemies?: EnemyArchetype[];
  crownUnlocked?: boolean;
  gyroDefeated?: boolean;
  isekaiCompleted?: boolean;
  townRaidTimer?: number;
}

export function canPlayerEngageBoss(role: WorldRole): boolean {
  return role === 'host';
}

export function createSavePayload(params: {
  saveId: string;
  playerName: string;
  biome: BiomeId;
  player: PlayerState;
  inventory: InventoryItem[];
  defeatedBosses: Set<number>;
  discoveredSecrets: Set<string>;
  openedChests: Set<string>;
  volcanoBridgeFallTriggered: boolean;
  darkSanctumDiscovered: boolean;
  bossFoughtStreak?: number;
  bossCooldownSeconds?: number;
  realm?: RealmMode;
  guildRank?: GuildRank;
  rankMissionsCompleted?: number;
  bRankEscortsCompleted?: number;
  acceptedMissionId?: import('./types').GuildMissionId | null;
  isekaiClockSeconds?: number;
  arenaWins?: number;
  unlockedWardrobe?: string[];
  foughtIsekaiEnemies?: EnemyArchetype[];
  crownUnlocked?: boolean;
  gyroDefeated?: boolean;
  isekaiCompleted?: boolean;
  townRaidTimer?: number;
}): BasteraSaveData {
  const cleanId = params.saveId.trim().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40) || 'default_slot';
  return {
    version: SAVE_VERSION,
    saveId: cleanId,
    playerName: params.playerName.trim().slice(0, 18) || 'BasteraKnight',
    savedAt: new Date().toISOString(),
    biome: params.biome,
    player: {
      ...params.player,
      vx: 0,
      vy: 0,
      dashCooldown: 0,
      attackPhase: 'none',
      attackTimer: 0,
      unlockedWeapons: [...params.player.unlockedWeapons],
      skillSlots: [...params.player.skillSlots],
      skillCooldowns: [0, 0, 0],
      stats: { ...params.player.stats },
      customization: { ...params.player.customization },
    },
    inventory: params.inventory.map((it) => ({ ...it })),
    defeatedBosses: Array.from(params.defeatedBosses).sort((a, b) => a - b),
    discoveredSecrets: Array.from(params.discoveredSecrets),
    openedChests: Array.from(params.openedChests),
    volcanoBridgeFallTriggered: params.volcanoBridgeFallTriggered,
    darkSanctumDiscovered: params.darkSanctumDiscovered,
    bossFoughtStreak: params.bossFoughtStreak ?? 0,
    bossCooldownSeconds: params.bossCooldownSeconds ?? 0,
    realm: params.realm ?? 'citadel',
    guildRank: params.guildRank ?? 'F',
    rankMissionsCompleted: params.rankMissionsCompleted ?? 0,
    bRankEscortsCompleted: params.bRankEscortsCompleted ?? 0,
    acceptedMissionId: params.acceptedMissionId ?? null,
    isekaiClockSeconds: params.isekaiClockSeconds ?? 0,
    arenaWins: params.arenaWins ?? 0,
    unlockedWardrobe: params.unlockedWardrobe ? [...params.unlockedWardrobe] : ['outfit_knight_plate', 'hat_helm'],
    foughtIsekaiEnemies: params.foughtIsekaiEnemies ? [...params.foughtIsekaiEnemies] : [],
    crownUnlocked: Boolean(params.crownUnlocked),
    gyroDefeated: Boolean(params.gyroDefeated),
    isekaiCompleted: Boolean(params.isekaiCompleted),
    townRaidTimer: params.townRaidTimer ?? 1200,
  };
}

export function toSaveSummary(save: BasteraSaveData): BasteraSaveSummary {
  return {
    saveId: save.saveId,
    playerName: save.playerName,
    savedAt: save.savedAt,
    biome: save.biome,
    level: save.player.level,
    bossesDefeated: save.player.bossesDefeated,
    distanceMeters: Math.round((save.player.x - 68) / 16),
    gold: Math.round(save.player.gold),
    equippedWeapon: save.player.equippedWeapon,
    realm: save.realm ?? 'citadel',
    guildRank: save.guildRank ?? 'F',
  };
}

export function normalizeLoadedSave(raw: unknown): BasteraSaveData | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.saveId !== 'string' || !obj.player || typeof obj.player !== 'object') {
    return null;
  }

  const basePlayer = createInitialPlayer();
  const rp = obj.player as Partial<PlayerState>;
  const validWeapon: WeaponId =
    rp.equippedWeapon && rp.equippedWeapon in WEAPONS
      ? rp.equippedWeapon
      : basePlayer.equippedWeapon;

  const unlocked = Array.isArray(rp.unlockedWeapons)
    ? (rp.unlockedWeapons.filter((w): w is WeaponId => typeof w === 'string' && w in WEAPONS) as WeaponId[])
    : basePlayer.unlockedWeapons;
  if (!unlocked.includes(validWeapon)) unlocked.push(validWeapon);
  if (!unlocked.includes('claymore')) unlocked.unshift('claymore');

  const slots: [SkillId, SkillId, SkillId] = [
    rp.skillSlots?.[0] && rp.skillSlots[0] in SKILLS ? rp.skillSlots[0] : basePlayer.skillSlots[0],
    rp.skillSlots?.[1] && rp.skillSlots[1] in SKILLS ? rp.skillSlots[1] : basePlayer.skillSlots[1],
    rp.skillSlots?.[2] && rp.skillSlots[2] in SKILLS ? rp.skillSlots[2] : basePlayer.skillSlots[2],
  ];

  const mergedPlayer: PlayerState = {
    ...basePlayer,
    x: Number.isFinite(rp.x) ? Number(rp.x) : basePlayer.x,
    y: Number.isFinite(rp.y) ? Number(rp.y) : basePlayer.y,
    vx: 0,
    vy: 0,
    facing: rp.facing === -1 ? -1 : 1,
    maxHp: Number.isFinite(rp.maxHp) ? Math.max(50, Number(rp.maxHp)) : basePlayer.maxHp,
    hp: Number.isFinite(rp.hp) ? Math.max(1, Number(rp.hp)) : basePlayer.hp,
    maxStamina: Number.isFinite(rp.maxStamina) ? Math.max(50, Number(rp.maxStamina)) : basePlayer.maxStamina,
    stamina: Number.isFinite(rp.stamina) ? Math.max(0, Number(rp.stamina)) : basePlayer.stamina,
    gold: Number.isFinite(rp.gold) ? Math.max(0, Number(rp.gold)) : basePlayer.gold,
    equippedWeapon: validWeapon,
    unlockedWeapons: unlocked,
    skillSlots: slots,
    skillCooldowns: [0, 0, 0],
    dashCooldown: 0,
    bossesDefeated: Number.isFinite(rp.bossesDefeated) ? Math.max(0, Number(rp.bossesDefeated)) : 0,
    monstersSlain: Number.isFinite(rp.monstersSlain) ? Math.max(0, Number(rp.monstersSlain)) : 0,
    secretsFound: Number.isFinite(rp.secretsFound) ? Math.max(0, Number(rp.secretsFound)) : 0,
    level: Number.isFinite(rp.level) ? Math.max(1, Number(rp.level)) : 1,
    statPoints: Number.isFinite(rp.statPoints) ? Math.max(0, Number(rp.statPoints)) : 0,
    stats: {
      attack: Number.isFinite(rp.stats?.attack) ? Math.max(0, Number(rp.stats!.attack)) : 0,
      skillDmg: Number.isFinite(rp.stats?.skillDmg) ? Math.max(0, Number(rp.stats!.skillDmg)) : 0,
      hp: Number.isFinite(rp.stats?.hp) ? Math.max(0, Number(rp.stats!.hp)) : 0,
      speed: Number.isFinite(rp.stats?.speed) ? Math.max(0, Number(rp.stats!.speed)) : 0,
    },
    customization: {
      cloakColor: rp.customization?.cloakColor || DEFAULT_WARRIOR_CUSTOMIZATION.cloakColor,
      armorColor: rp.customization?.armorColor || DEFAULT_WARRIOR_CUSTOMIZATION.armorColor,
      visorColor: rp.customization?.visorColor || DEFAULT_WARRIOR_CUSTOMIZATION.visorColor,
      plumeColor: rp.customization?.plumeColor || DEFAULT_WARRIOR_CUSTOMIZATION.plumeColor,
      outfitStyle: rp.customization?.outfitStyle || DEFAULT_WARRIOR_CUSTOMIZATION.outfitStyle,
      headgearStyle: rp.customization?.headgearStyle || DEFAULT_WARRIOR_CUSTOMIZATION.headgearStyle,
      crownEquipped: Boolean(rp.customization?.crownEquipped),
    },
    highestCheckpointX: Number.isFinite(rp.highestCheckpointX)
      ? Number(rp.highestCheckpointX)
      : basePlayer.highestCheckpointX,
    highestCheckpointIndex: Number.isFinite(rp.highestCheckpointIndex)
      ? Math.max(1, Number(rp.highestCheckpointIndex))
      : 1,
  };
  mergedPlayer.hp = Math.min(mergedPlayer.hp, mergedPlayer.maxHp);

  const defaultInv = createInitialInventory();
  const rawInv = Array.isArray(obj.inventory) ? (obj.inventory as InventoryItem[]) : [];
  const mergedInv = defaultInv.map((baseItem) => {
    const found = rawInv.find((ri) => ri && ri.id === baseItem.id);
    return found && Number.isFinite(found.count)
      ? { ...baseItem, count: Math.max(0, Math.floor(found.count)) }
      : { ...baseItem };
  });

  const validRealms: RealmMode[] = [
    'citadel',
    'isekai_town',
    'isekai_guild',
    'isekai_wardrobe',
    'isekai_potion_shop',
    'isekai_weapons_shop',
    'dungeon_exterior',
    'goblin_dungeon',
    'carriage_escort',
    'demon_realm',
    'demon_king_arena',
    'dueling_arena',
  ];
  const realm: RealmMode =
    typeof obj.realm === 'string' && validRealms.includes(obj.realm as RealmMode)
      ? (obj.realm as RealmMode)
      : 'citadel';

  const validRanks: GuildRank[] = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];
  const guildRank: GuildRank =
    typeof obj.guildRank === 'string' && validRanks.includes(obj.guildRank as GuildRank)
      ? (obj.guildRank as GuildRank)
      : 'F';

  const savedBadge = rawInv.find(
    (ri) => ri && typeof ri.id === 'string' && ri.id.startsWith('rank_badge_') && Number.isFinite(ri.count),
  );
  if (savedBadge) {
    mergedInv.push({ ...savedBadge, count: Math.max(1, Math.floor(savedBadge.count)) });
  } else if (realm !== 'citadel' || guildRank !== 'F') {
    mergedInv.push({
      id: `rank_badge_${guildRank.toLowerCase()}`,
      name: `${guildRank}-Rank Guild Badge`,
      category: 'key',
      description: `${guildRank}-Rank Adventurer Guild seal issued by Solaris Kingdom.`,
      sarcasticQuote: 'Officially laminated against slime, goblin blood, and demon fire.',
      count: 1,
      color: guildRank === 'S' ? '#fbbf24' : '#cbd5e1',
    });
  }

  const biome: BiomeId =
    obj.biome === 'castle' || obj.biome === 'volcano' || obj.biome === 'forest'
      ? obj.biome
      : 'castle';

  return {
    version: SAVE_VERSION,
    saveId: String(obj.saveId).slice(0, 40),
    playerName:
      typeof obj.playerName === 'string' && obj.playerName.trim()
        ? obj.playerName.trim().slice(0, 18)
        : 'BasteraKnight',
    savedAt: typeof obj.savedAt === 'string' ? obj.savedAt : new Date().toISOString(),
    biome,
    player: mergedPlayer,
    inventory: mergedInv,
    defeatedBosses: Array.isArray(obj.defeatedBosses)
      ? obj.defeatedBosses.filter((n): n is number => typeof n === 'number' && Number.isFinite(n))
      : [],
    discoveredSecrets: Array.isArray(obj.discoveredSecrets)
      ? obj.discoveredSecrets.filter((s): s is string => typeof s === 'string')
      : [],
    openedChests: Array.isArray(obj.openedChests)
      ? obj.openedChests.filter((s): s is string => typeof s === 'string')
      : [],
    volcanoBridgeFallTriggered: Boolean(obj.volcanoBridgeFallTriggered),
    darkSanctumDiscovered: Boolean(obj.darkSanctumDiscovered),
    bossFoughtStreak: Number.isFinite(obj.bossFoughtStreak) ? Math.max(0, Number(obj.bossFoughtStreak)) : 0,
    bossCooldownSeconds: Number.isFinite(obj.bossCooldownSeconds) ? Math.max(0, Number(obj.bossCooldownSeconds)) : 0,
    realm,
    guildRank,
    rankMissionsCompleted: Number.isFinite(obj.rankMissionsCompleted)
      ? Math.max(0, Math.floor(Number(obj.rankMissionsCompleted)))
      : 0,
    bRankEscortsCompleted: Number.isFinite(obj.bRankEscortsCompleted)
      ? Math.max(0, Math.floor(Number(obj.bRankEscortsCompleted)))
      : 0,
    acceptedMissionId:
      typeof obj.acceptedMissionId === 'string'
        ? (obj.acceptedMissionId as import('./types').GuildMissionId)
        : null,
    isekaiClockSeconds: Number.isFinite(obj.isekaiClockSeconds)
      ? Math.max(0, Number(obj.isekaiClockSeconds))
      : 0,
    arenaWins: Number.isFinite(obj.arenaWins) ? Math.max(0, Math.floor(Number(obj.arenaWins))) : 0,
    unlockedWardrobe: Array.isArray(obj.unlockedWardrobe)
      ? obj.unlockedWardrobe.filter((s): s is string => typeof s === 'string')
      : ['outfit_knight_plate', 'hat_helm'],
    foughtIsekaiEnemies: Array.isArray(obj.foughtIsekaiEnemies)
      ? (obj.foughtIsekaiEnemies.filter((s): s is EnemyArchetype => typeof s === 'string') as EnemyArchetype[])
      : [],
    crownUnlocked: Boolean(obj.crownUnlocked),
    gyroDefeated: Boolean(obj.gyroDefeated),
    isekaiCompleted: Boolean(obj.isekaiCompleted),
    townRaidTimer: Number.isFinite(obj.townRaidTimer) ? Math.max(10, Number(obj.townRaidTimer)) : 1200,
  };
}

function readLocalStore(): Record<string, BasteraSaveData> {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_SAVES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, BasteraSaveData> = {};
    for (const [k, v] of Object.entries(parsed)) {
      const clean = normalizeLoadedSave(v);
      if (clean) out[k] = clean;
    }
    return out;
  } catch {
    return {};
  }
}

function writeLocalStore(map: Record<string, BasteraSaveData>): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(LOCAL_SAVES_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore quota errors
  }
}

export function saveToLocalStorage(save: BasteraSaveData): BasteraSaveSummary[] {
  const store = readLocalStore();
  store[save.saveId] = save;
  writeLocalStore(store);
  return Object.values(store)
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    .map(toSaveSummary);
}

export function listLocalSaves(): BasteraSaveSummary[] {
  const store = readLocalStore();
  return Object.values(store)
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    .map(toSaveSummary);
}

export function loadLocalSave(saveId: string): BasteraSaveData | null {
  const store = readLocalStore();
  return store[saveId] ?? null;
}

export function deleteLocalSave(saveId: string): BasteraSaveSummary[] {
  const store = readLocalStore();
  delete store[saveId];
  writeLocalStore(store);
  return Object.values(store)
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    .map(toSaveSummary);
}
