import { POTION_SHOP_IDS, WEAPONS } from './data';
import { GRAVITY, MOVE_SPEED, addInventoryResource, calculateAttackDamage, equipWeapon } from './rules';
import type {
  ActiveArenaDuel,
  ActiveTownRaid,
  AlliedNpc,
  ArenaChallengerDef,
  ArenaChallengerId,
  ArenaSkillDef,
  BiomeId,
  CarriageEscortState,
  DemonKingEntity,
  EnemyArchetype,
  EnemyState,
  GuildMissionId,
  GuildRank,
  HeadgearStyle,
  InteractableProp,
  InventoryItem,
  IsekaiNpc,
  OutfitStyle,
  Platform,
  PlayerState,
  Projectile,
  PurpleFlameKind,
  PurpleFlameZone,
  RealmMode,
  TownHouseDamage,
  TownRaiderId,
  WeaponId,
} from './types';
import { FLOOR_Y } from './worldGen';

export const RANK_ORDER: GuildRank[] = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];
export const MISSIONS_REQUIRED_PER_RANK = 5;
export const GUILD_FLOOR2_Y = FLOOR_Y - 82;

export const RANK_TITLES: Record<GuildRank, string> = {
  F: 'Porcelain Initiate',
  E: 'Bronze Scout',
  D: 'Iron Vanguard',
  C: 'Silver Vanguard',
  B: 'Mythril Protector',
  A: 'Crimson Champion',
  S: 'Crowned Royal Sovereign',
};

export interface GuildMissionDef {
  id: GuildMissionId;
  title: string;
  rankReq: GuildRank;
  promoteToRank: GuildRank;
  floorReq: 1 | 2;
  realm: RealmMode;
  regionLabel: string;
  summary: string;
  rewardGold: number;
  killsRequired: number;
  accentColor: string;
}

export const GUILD_MISSIONS: GuildMissionDef[] = [
  {
    id: 'f_goblin_warren',
    title: 'Goblin Warren Clearing',
    rankReq: 'F',
    promoteToRank: 'E',
    floorReq: 1,
    realm: 'goblin_dungeon',
    regionLabel: 'Graystone Cavern · Floor 1 Contract',
    summary: 'Clear raiding Normal Goblins & brute Hobgoblins inside the rocky cavern.',
    rewardGold: 85,
    killsRequired: 6,
    accentColor: '#94a3b8',
  },
  {
    id: 'e_hobgoblin_caves',
    title: 'Hobgoblin Quarry Purge',
    rankReq: 'E',
    promoteToRank: 'D',
    floorReq: 1,
    realm: 'goblin_dungeon',
    regionLabel: 'Graystone Cavern · Floor 1 Contract',
    summary: 'Hunt armored Hobgoblin packs and Normal Goblin skirmishers.',
    rewardGold: 130,
    killsRequired: 8,
    accentColor: '#64748b',
  },
  {
    id: 'd_deep_goblin_keep',
    title: 'Deep Rocky Goblin Stronghold',
    rankReq: 'D',
    promoteToRank: 'C',
    floorReq: 1,
    realm: 'goblin_dungeon',
    regionLabel: 'Graystone Abyss · Floor 1 Contract',
    summary: 'Crush the subterranean Goblin Dungeon warband to earn Silver C-Rank status.',
    rewardGold: 185,
    killsRequired: 10,
    accentColor: '#38bdf8',
  },
  {
    id: 'c_demon_vanguard',
    title: 'Demon Border Vanguard Breach',
    rankReq: 'C',
    promoteToRank: 'B',
    floorReq: 1,
    realm: 'demon_realm',
    regionLabel: 'Volcanic Frontier · Floor 1 Promotion',
    summary: 'Invade the crimson-purple Demon Border to earn B-Rank and unlock the Guild 2nd Floor!',
    rewardGold: 260,
    killsRequired: 8,
    accentColor: '#f43f5e',
  },
  {
    id: 'b_princess_carriage',
    title: 'Royal Princess Carriage Escort',
    rankReq: 'B',
    promoteToRank: 'A',
    floorReq: 2,
    realm: 'carriage_escort',
    regionLabel: 'Kingdom Royal Highway · 2nd Floor Command',
    summary: 'Protect Princess Aurelia from shifting bandit factions across the Kingdom Highway toward higher ranks.',
    rewardGold: 320,
    killsRequired: 8,
    accentColor: '#fbbf24',
  },
  {
    id: 'b_demon_invasion',
    title: 'Demon Realm Volcano Raid',
    rankReq: 'B',
    promoteToRank: 'B',
    floorReq: 2,
    realm: 'demon_realm',
    regionLabel: 'Crimson-Violet Caldera · 2nd Floor Command',
    summary: 'High-bounty raid against Long-Range Succubi, Demon Tanks & Lightning Strikers.',
    rewardGold: 360,
    killsRequired: 9,
    accentColor: '#fb7185',
  },
  {
    id: 'a_three_demon_kings',
    title: 'Three Demon Kings Expedition',
    rankReq: 'A',
    promoteToRank: 'S',
    floorReq: 2,
    realm: 'demon_king_arena',
    regionLabel: 'Obsidian Imperial Citadel · 2nd Floor Supreme',
    summary: 'Defeat all 3 Demon Kings & past Isekai foes in real-time combat to claim the Royal Crown!',
    rewardGold: 850,
    killsRequired: 3,
    accentColor: '#c084fc',
  },
];

export interface WardrobeCatalogItem {
  id: string;
  name: string;
  slot: 'outfit' | 'headgear' | 'cloak_dye' | 'crown';
  price: number;
  description: string;
  outfitStyle?: OutfitStyle;
  headgearStyle?: HeadgearStyle;
  cloakColor?: string;
  armorColor?: string;
  plumeColor?: string;
  visorColor?: string;
}

export const WARDROBE_CATALOG: WardrobeCatalogItem[] = [
  {
    id: 'outfit_knight_plate',
    name: 'Citadel Knight Plate',
    slot: 'outfit',
    price: 0,
    description: 'Your original steel dungeon armor from the Bastera Citadel.',
    outfitStyle: 'knight_plate',
    armorColor: '#94a3b8',
    cloakColor: '#be123c',
  },
  {
    id: 'outfit_adventurer_tunic',
    name: 'Axel Linen Tunic & Haori',
    slot: 'outfit',
    price: 180,
    description: 'Traditional airy emerald-trimmed fantasy adventurer tunic & leather vest.',
    outfitStyle: 'adventurer_tunic',
    armorColor: '#15803d',
    cloakColor: '#1e3a8a',
  },
  {
    id: 'outfit_guild_coat',
    name: 'Crimson Guild Trenchcoat',
    slot: 'outfit',
    price: 360,
    description: 'Belted Japanese-isekai guild commander coat with gold shoulder frogs.',
    outfitStyle: 'guild_coat',
    armorColor: '#7f1d1d',
    cloakColor: '#b45309',
  },
  {
    id: 'outfit_demon_slayer',
    name: 'Violet Demon-Bane Mantle',
    slot: 'outfit',
    price: 600,
    description: 'Obsidian & amethyst weave tailored for Demon Realm vanguard raids.',
    outfitStyle: 'demon_slayer',
    armorColor: '#312e81',
    cloakColor: '#7e22ce',
  },
  {
    id: 'outfit_royal_regalia',
    name: 'Sovereign Velvet Regalia',
    slot: 'outfit',
    price: 880,
    description: 'Ermine-trimmed white & gold imperial cape fit for crowned royalty.',
    outfitStyle: 'royal_regalia',
    armorColor: '#e2e8f0',
    cloakColor: '#9f1239',
  },
  {
    id: 'hat_helm',
    name: 'Steel Armet Helm',
    slot: 'headgear',
    price: 0,
    description: 'Classic visored knight helmet with flowing crest plume.',
    headgearStyle: 'helm',
  },
  {
    id: 'hat_beret',
    name: 'Crimson Guild Beret',
    slot: 'headgear',
    price: 140,
    description: 'Jaunty feather-pinned isekai town beret worn by veteran scouts.',
    headgearStyle: 'beret',
  },
  {
    id: 'hat_bandana',
    name: 'Shadow Shinobi Scarf',
    slot: 'headgear',
    price: 240,
    description: 'Wind-swept eastern traveler headband with flowing twin tails.',
    headgearStyle: 'bandana',
  },
  {
    id: 'hat_circlet',
    name: 'Mythril Star Circlet',
    slot: 'headgear',
    price: 440,
    description: 'Light sapphire diadem worn by high-ranking court champions.',
    headgearStyle: 'circlet',
  },
];

export const ISEKAI_ROOM_BOUNDS: Record<RealmMode, { minX: number; maxX: number }> = {
  citadel: { minX: -640, maxX: 80000 },
  isekai_town: { minX: 20, maxX: 3680 },
  isekai_guild: { minX: 24, maxX: 860 },
  isekai_wardrobe: { minX: 24, maxX: 460 },
  isekai_potion_shop: { minX: 24, maxX: 520 },
  isekai_weapons_shop: { minX: 24, maxX: 1220 },
  dungeon_exterior: { minX: 20, maxX: 1240 },
  goblin_dungeon: { minX: 20, maxX: 999999 },
  carriage_escort: { minX: 20, maxX: 1120 },
  demon_realm: { minX: 20, maxX: 999999 },
  demon_king_arena: { minX: 24, maxX: 1480 },
  dueling_arena: { minX: 24, maxX: 1240 },
};

export const DUNGEON_SECTOR_WIDTH = 960;

export const ISEKAI_DAY_SECONDS = 300; // Turns night every 5 minutes (300s)
export const ISEKAI_NIGHT_SECONDS = 120; // 2 minutes of cozy lit night
export const ISEKAI_DAY_NIGHT_PERIOD = ISEKAI_DAY_SECONDS + ISEKAI_NIGHT_SECONDS;

export interface IsekaiDayNightState {
  nightFactor: number; // 0 = bright day, 1 = cozy midnight
  isNight: boolean;
  phaseLabel: 'Day' | 'Dusk' | 'Night' | 'Dawn';
  secondsToToggle: number;
}

export function getIsekaiDayNightState(clockSeconds: number): IsekaiDayNightState {
  const safe = Math.max(0, clockSeconds);
  const t = safe % ISEKAI_DAY_NIGHT_PERIOD;
  const duskStart = ISEKAI_DAY_SECONDS - 18;
  const dawnStart = ISEKAI_DAY_NIGHT_PERIOD - 18;

  if (t < duskStart) {
    return {
      nightFactor: 0,
      isNight: false,
      phaseLabel: 'Day',
      secondsToToggle: Math.ceil(ISEKAI_DAY_SECONDS - t),
    };
  }
  if (t < ISEKAI_DAY_SECONDS) {
    const f = (t - duskStart) / 18;
    return {
      nightFactor: Number(f.toFixed(3)),
      isNight: f >= 0.65,
      phaseLabel: 'Dusk',
      secondsToToggle: Math.max(1, Math.ceil(ISEKAI_DAY_SECONDS - t)),
    };
  }
  if (t < dawnStart) {
    return {
      nightFactor: 1,
      isNight: true,
      phaseLabel: 'Night',
      secondsToToggle: Math.max(1, Math.ceil(ISEKAI_DAY_NIGHT_PERIOD - t)),
    };
  }
  const f = 1 - (t - dawnStart) / 18;
  return {
    nightFactor: Number(Math.max(0, f).toFixed(3)),
    isNight: f > 0.35,
    phaseLabel: 'Dawn',
    secondsToToggle: Math.max(1, Math.ceil(ISEKAI_DAY_NIGHT_PERIOD - t)),
  };
}

export interface TownHouseSpec {
  x: number;
  w: number;
  h: number;
  roofColor: string;
  roofDark: string;
  wallColor: string;
  beamColor: string;
  hasChimney: boolean;
  hasLaundry: boolean;
}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 91.345 + 17.13) * 43758.5453;
  return x - Math.floor(x);
}

const HOUSE_PALETTES: { roof: string; dark: string; wall: string; beam: string }[] = [
  { roof: '#dc2626', dark: '#991b1b', wall: '#fef9c3', beam: '#78350f' },
  { roof: '#d97706', dark: '#92400e', wall: '#ffedd5', beam: '#5c2810' },
  { roof: '#2563eb', dark: '#1e3a8a', wall: '#f8fafc', beam: '#475569' },
  { roof: '#059669', dark: '#065f46', wall: '#ecfdf5', beam: '#451a03' },
  { roof: '#9333ea', dark: '#581c87', wall: '#fdf4ff', beam: '#3b0764' },
  { roof: '#ea580c', dark: '#9a3412', wall: '#fef3c7', beam: '#431407' },
];

export const TOWN_RANDOM_HOUSES: TownHouseSpec[] = (() => {
  const list: TownHouseSpec[] = [];
  // West plaza homes woven around Guild / Fountain / Shops
  const westSlots = [44, 764, 1018];
  westSlots.forEach((x, idx) => {
    const pal = HOUSE_PALETTES[idx % HOUSE_PALETTES.length];
    list.push({
      x,
      w: idx === 0 ? 84 : 74,
      h: idx === 0 ? 92 : 84,
      roofColor: pal.roof,
      roofDark: pal.dark,
      wallColor: pal.wall,
      beamColor: pal.beam,
      hasChimney: idx % 2 === 0,
      hasLaundry: idx === 1,
    });
  });

  // Expanded East Solaris Town residential districts (3x town size!) skipping Hot Spring zone (2510..2865) and Colosseum (3140+)
  let cursor = 1385;
  let i = 0;
  while (cursor < 3040) {
    if (cursor > 2430 && cursor < 2875) {
      cursor = 2885;
      continue;
    }
    const r1 = seededRand(i * 3 + 1);
    const r2 = seededRand(i * 3 + 2);
    const r3 = seededRand(i * 3 + 3);
    const w = 74 + Math.floor(r1 * 32);
    const h = 76 + Math.floor(r2 * 28);
    const pal = HOUSE_PALETTES[Math.floor(r3 * HOUSE_PALETTES.length) % HOUSE_PALETTES.length];
    list.push({
      x: cursor,
      w,
      h,
      roofColor: pal.roof,
      roofDark: pal.dark,
      wallColor: pal.wall,
      beamColor: pal.beam,
      hasChimney: r1 > 0.35,
      hasLaundry: r2 > 0.55,
    });
    cursor += w + 26 + Math.floor(r3 * 36);
    i += 1;
  }
  return list;
})();

export type CaravanTarget =
  | 'isekai_town'
  | 'goblin_dungeon'
  | 'demon_realm'
  | 'carriage_escort'
  | 'demon_king_arena';

export interface CaravanParseResult {
  ok: boolean;
  target?: CaravanTarget;
  label?: string;
  message: string;
}

export function parseCaravanDestination(
  rawInput: string,
  currentRealm: RealmMode,
  guildRank: GuildRank,
  acceptedMissionId: GuildMissionId | null,
): CaravanParseResult {
  const q = rawInput.trim().toLowerCase();
  if (!q) {
    return {
      ok: false,
      message:
        'Type a destination first! (e.g., Goblin Dungeon, Demon Realm, Princess Escort, Demon King Citadel, or Solaris Town)',
    };
  }

  if (
    q.includes('town') ||
    q.includes('solaris') ||
    q.includes('axel') ||
    q.includes('guild') ||
    q.includes('home') ||
    q.includes('back') ||
    q.includes('city') ||
    q.includes('village') ||
    q.includes('spring') ||
    q.includes('onsen')
  ) {
    return {
      ok: true,
      target: 'isekai_town',
      label: 'Solaris Isekai Town',
      message: 'Hop in! Riding the caravan back to Solaris Town Plaza!',
    };
  }

  if (
    q.includes('king') ||
    q.includes('citadel') ||
    q.includes('arena') ||
    q === 'a rank' ||
    q === 'a-rank'
  ) {
    if (rankIndex(guildRank) < rankIndex('A')) {
      return {
        ok: false,
        message: `Too dangerous for ${guildRank}-Rank! Reach A-Rank at the Guild 2nd Floor before riding to the Three Demon Kings Citadel.`,
      };
    }
    return {
      ok: true,
      target: 'demon_king_arena',
      label: 'Three Demon Kings Abyssal Forest',
      message: 'Hold tight! Driving the armored caravan to the Three Demon Kings Abyssal Forest!',
    };
  }

  if (
    q.includes('princess') ||
    q.includes('carriage') ||
    q.includes('escort') ||
    q.includes('highway') ||
    q.includes('bandit')
  ) {
    if (rankIndex(guildRank) < rankIndex('B')) {
      return {
        ok: false,
        message: `Restricted Royal Highway! Earn B-Rank at the Guild before escorting Princess Aurelia.`,
      };
    }
    return {
      ok: true,
      target: 'carriage_escort',
      label: 'Kingdom Royal Highway',
      message: 'Caravan escort rolling out to the Kingdom Royal Highway!',
    };
  }

  if (
    q.includes('demon') ||
    q.includes('volcano') ||
    q.includes('caldera') ||
    q.includes('vanguard') ||
    q.includes('border') ||
    q.includes('hell')
  ) {
    if (rankIndex(guildRank) < rankIndex('C')) {
      return {
        ok: false,
        message: `The Demon Realm border is sealed to ${guildRank}-Rank! Earn C-Rank first (or type Goblin Dungeon).`,
      };
    }
    return {
      ok: true,
      target: 'demon_realm',
      label: 'Demon Realm Forest Outskirts',
      message: 'Caravan departing for the green forest outside the Demon Realm Caldera Hole!',
    };
  }

  if (
    q.includes('goblin') ||
    q.includes('warren') ||
    q.includes('hobgoblin') ||
    q.includes('cavern') ||
    q.includes('cave') ||
    q.includes('rocky') ||
    q.includes('hole') ||
    q.includes('dungeon') ||
    q.includes('forest')
  ) {
    // If they just typed "dungeon" and hold an accepted C/B/A dungeon contract, route to its matching exterior!
    if (q === 'dungeon' && acceptedMissionId) {
      const m = GUILD_MISSIONS.find((x) => x.id === acceptedMissionId);
      if (m && (m.realm === 'demon_realm' || m.realm === 'demon_king_arena')) {
        return {
          ok: true,
          target: m.realm,
          label: m.realm === 'demon_realm' ? 'Demon Realm Forest Outskirts' : 'Demon King Forest Outskirts',
          message: `Following your active Guild Contract to the forest outside ${m.title}!`,
        };
      }
    }
    return {
      ok: true,
      target: 'goblin_dungeon',
      label: 'Goblin Dungeon Forest Outskirts',
      message: 'Giddyup! Taking you to the green grassy forest outside the Rocky Goblin Dungeon Hole!',
    };
  }

  const hintBack = currentRealm === 'dungeon_exterior' ? ' or Solaris Town' : '';
  return {
    ok: false,
    message: `Never heard of "${rawInput.trim()}" on the Kingdom roads. Try typing: Goblin Dungeon, Demon Realm, Princess Escort, Demon King Citadel${hintBack}.`,
  };
}

export function applyHotSpringRest(player: PlayerState): { healedHp: number; boostSeconds: number } {
  const healedHp = Math.max(0, Math.round(player.maxHp - player.hp));
  player.hp = player.maxHp;
  player.stamina = player.maxStamina;
  const boostSeconds = 60;
  player.hotSpringTimer = boostSeconds;
  player.damageBoostMultiplier = Math.max(player.damageBoostMultiplier, 1.25);
  player.damageBoostTimer = Math.max(player.damageBoostTimer, boostSeconds);
  return { healedHp, boostSeconds };
}

export const ISEKAI_IDLE_TRANSPORT_SECONDS = 120; // 2 minutes standing still in Citadel

export function shouldIdleTriggerIsekai(
  realm: RealmMode,
  idleTimer: number,
  isPlaying: boolean,
  hasActiveBattleOrCutscene: boolean,
): boolean {
  return realm === 'citadel' && isPlaying && !hasActiveBattleOrCutscene && idleTimer >= ISEKAI_IDLE_TRANSPORT_SECONDS;
}

export function resetPlayerForIsekai(
  player: PlayerState,
  inventory: InventoryItem[],
): { rank: GuildRank } {
  player.level = 1;
  player.statPoints = 0;
  player.stats = {
    skillDmg: 0,
    attack: 0,
    hp: 0,
    speed: 0,
  };
  player.maxHp = 115;
  player.hp = 115;
  player.maxStamina = 100;
  player.stamina = 100;
  player.vx = 0;
  player.vy = 0;
  player.idleTimer = 0;
  player.attackPhase = 'none';
  player.attackTimer = 0;
  player.comboStep = 0;
  player.comboSubStep = 0;
  player.isSpinDashAttack = false;
  player.spinDashTimer = 0;
  player.damageBoostMultiplier = 1;
  player.damageBoostTimer = 0;
  player.dashCooldown = 0;
  player.skillCooldowns = [0, 0, 0];
  player.chronoFreezeTimer = 0;
  player.invulnTimer = 0;
  player.parryTimer = 0;

  const existing = inventory.find((it) => it.id === 'rank_badge_f');
  if (existing) {
    existing.count = Math.max(1, existing.count);
  } else {
    inventory.push({
      id: 'rank_badge_f',
      name: 'F-Rank Guild Badge',
      category: 'key',
      description: 'Porcelain tag proving your fresh registration at the Kingdom Adventurer Guild.',
      sarcasticQuote: 'From 100-boss slayer back to fetching goblin ears. Classic isekai paperwork.',
      count: 1,
      color: '#cbd5e1',
    });
  }
  addInventoryResource(inventory, 'crimson_vial', 1);

  return { rank: 'F' };
}

export function rankIndex(rank: GuildRank): number {
  return RANK_ORDER.indexOf(rank);
}

export function canAccessGuildFloor2(rank: GuildRank): boolean {
  return rankIndex(rank) >= rankIndex('B');
}

export function canStartGuildMission(currentRank: GuildRank, missionId: GuildMissionId): boolean {
  const mission = GUILD_MISSIONS.find((m) => m.id === missionId);
  if (!mission) return false;
  if (mission.floorReq === 2 && !canAccessGuildFloor2(currentRank)) return false;
  return rankIndex(currentRank) >= rankIndex(mission.rankReq);
}

export function getNextGuildRank(rank: GuildRank): GuildRank {
  const idx = rankIndex(rank);
  if (idx < 0 || idx >= RANK_ORDER.length - 1) return rank;
  return RANK_ORDER[idx + 1];
}

export function promoteGuildRankAfterMission(
  currentRank: GuildRank,
  missionId: GuildMissionId,
  inventory: InventoryItem[],
  bRankEscortsCompleted = 0,
  rankMissionsCompleted = 0,
): {
  nextRank: GuildRank;
  promoted: boolean;
  nextBRankEscorts: number;
  nextRankMissionsCompleted: number;
} {
  const mission = GUILD_MISSIONS.find((m) => m.id === missionId);
  if (!mission) {
    return {
      nextRank: currentRank,
      promoted: false,
      nextBRankEscorts: bRankEscortsCompleted,
      nextRankMissionsCompleted: rankMissionsCompleted,
    };
  }

  let nextBRankEscorts = bRankEscortsCompleted;
  if (missionId === 'b_princess_carriage') {
    nextBRankEscorts = bRankEscortsCompleted + 1;
  }

  if (currentRank === 'S') {
    return {
      nextRank: 'S',
      promoted: false,
      nextBRankEscorts,
      nextRankMissionsCompleted: MISSIONS_REQUIRED_PER_RANK,
    };
  }

  const incremented = rankMissionsCompleted + 1;
  if (incremented < MISSIONS_REQUIRED_PER_RANK) {
    return {
      nextRank: currentRank,
      promoted: false,
      nextBRankEscorts,
      nextRankMissionsCompleted: incremented,
    };
  }

  const nextRank = getNextGuildRank(currentRank);
  const badge = inventory.find((it) => it.id.startsWith('rank_badge_'));
  if (badge) {
    badge.id = `rank_badge_${nextRank.toLowerCase()}`;
    badge.name = `${nextRank}-Rank Guild Badge`;
    badge.description = `${RANK_TITLES[nextRank]} badge issued by the Royal Adventurer Guild.`;
    badge.color =
      nextRank === 'S'
        ? '#fbbf24'
        : nextRank === 'A'
          ? '#e11d48'
          : nextRank === 'B'
            ? '#38bdf8'
            : '#a7f3d0';
  }
  return {
    nextRank,
    promoted: nextRank !== currentRank,
    nextBRankEscorts,
    nextRankMissionsCompleted: 0,
  };
}

export function buyPotionShopItem(
  player: PlayerState,
  inventory: InventoryItem[],
  itemId: string,
): { ok: boolean; message: string } {
  if (!POTION_SHOP_IDS.includes(itemId as (typeof POTION_SHOP_IDS)[number])) {
    return { ok: false, message: 'Potion not carried in the Alchemist Apothecary.' };
  }
  const item = inventory.find((i) => i.id === itemId);
  if (!item) return { ok: false, message: 'Potion formula unavailable.' };
  const price = item.shopPrice ?? 120;
  if (player.gold < price) {
    return { ok: false, message: `Need ${price}G for ${item.name} (you have ${Math.round(player.gold)}G).` };
  }
  player.gold -= price;
  item.count += 1;
  return { ok: true, message: `Purchased ${item.name} (-${price}G)!` };
}

export function buyOrEquipWeaponShopItem(
  player: PlayerState,
  weaponId: WeaponId,
): { ok: boolean; message: string } {
  const def = WEAPONS[weaponId];
  if (!def) return { ok: false, message: 'Weapon not stocked on display.' };
  if (player.unlockedWeapons.includes(weaponId)) {
    equipWeapon(player, weaponId);
    return { ok: true, message: `Equipped ${def.name} (${def.specialLabel})!` };
  }
  const price = def.shopPrice ?? 600;
  if (player.gold < price) {
    return { ok: false, message: `Need ${price}G for ${def.name} (have ${Math.round(player.gold)}G).` };
  }
  player.gold -= price;
  player.unlockedWeapons.push(weaponId);
  equipWeapon(player, weaponId);
  return { ok: true, message: `Forged & Equipped ${def.name}! Special: ${def.specialLabel}` };
}

export function buyOrEquipWardrobeItem(
  player: PlayerState,
  unlockedIds: string[],
  itemId: string,
  crownUnlocked: boolean,
): { ok: boolean; message: string } {
  if (itemId === 'toggle_crown') {
    if (!crownUnlocked) {
      return { ok: false, message: 'Defeat the 3 Demon Kings (A-Rank) to earn the Royal Crown!' };
    }
    player.customization.crownEquipped = !player.customization.crownEquipped;
    return {
      ok: true,
      message: player.customization.crownEquipped ? 'Royal Crown equipped!' : 'Royal Crown stored safely.',
    };
  }

  const item = WARDROBE_CATALOG.find((w) => w.id === itemId);
  if (!item) return { ok: false, message: 'Item not stocked in Wardrobe Shop.' };

  if (!unlockedIds.includes(item.id)) {
    if (player.gold < item.price) {
      return { ok: false, message: `Need ${item.price}G (have ${Math.round(player.gold)}G).` };
    }
    player.gold -= item.price;
    unlockedIds.push(item.id);
  }

  if (item.outfitStyle) player.customization.outfitStyle = item.outfitStyle;
  if (item.headgearStyle) player.customization.headgearStyle = item.headgearStyle;
  if (item.armorColor) player.customization.armorColor = item.armorColor;
  if (item.cloakColor) player.customization.cloakColor = item.cloakColor;

  return { ok: true, message: `Equipped ${item.name}!` };
}

export function createTownNpcs(isCrowned: boolean): IsekaiNpc[] {
  return [
    {
      id: 'npc_merchant_lena',
      name: 'Merchant Lena',
      role: 'merchant',
      x: 165,
      y: FLOOR_Y - 26,
      minX: 105,
      maxX: 280,
      speed: 22,
      facing: 1,
      walkCycle: 0,
      coatColor: '#b45309',
      hairColor: '#f59e0b',
      shirtColor: '#fef3c7',
      dialogue: [
        'Welcome to Solaris Town! Admire our gleaming white marble fountain & three-district grand avenue!',
        'Accept a Guild quest, then speak to Caravan Master Vance right outside the Guild Hall to ride out!',
      ],
      crownedDialogue: [
        'All hail Your Majesty! Every stall in the royal capital is cheering your victory!',
        'The Three Demon Kings are no more—the golden crown suits you wonderfully!',
      ],
    },
    {
      id: 'npc_guard_harold',
      name: 'Gate Captain Harold',
      role: 'guard',
      x: 470,
      y: FLOOR_Y - 26,
      minX: 380,
      maxX: 595,
      speed: 19,
      facing: -1,
      walkCycle: 1.4,
      coatColor: '#334155',
      hairColor: '#475569',
      shirtColor: '#cbd5e1',
      dialogue: [
        'Caravan Rider Vance waits right outside the Guild! Tell him where you want to ride!',
        'Head east past the Weapons Armory for the Solaris Hot Spring—restores full HP & grants a steam boost!',
      ],
      crownedDialogue: [
        'Salutes! Solaris Kingdom bows before our newly crowned Royal Champion!',
      ],
    },
    {
      id: 'npc_adventurer_kazuma',
      name: 'Scout Renji',
      role: 'adventurer',
      x: 760,
      y: FLOOR_Y - 26,
      minX: 675,
      maxX: 865,
      speed: 28,
      facing: 1,
      walkCycle: 2.2,
      coatColor: '#15803d',
      hairColor: '#1e1b4b',
      shirtColor: '#fde68a',
      dialogue: [
        'At nightfall every 5 minutes, all the lanterns & windows across Solaris glow warmly!',
        'Remember: you can go endlessly deep in any dungeon or climb the West Exit Rope whenever you want!',
      ],
      crownedDialogue: [
        'No way! You went from F-Rank rookie to Crowned Royalty?! Let me buy you a mug at the Guild!',
      ],
    },
    {
      id: 'npc_villager_mira',
      name: 'Artisan Mira',
      role: 'townfolk',
      x: 1055,
      y: FLOOR_Y - 26,
      minX: 940,
      maxX: 1170,
      speed: -24,
      facing: -1,
      walkCycle: 0.7,
      coatColor: '#be123c',
      hairColor: '#92400e',
      shirtColor: '#fff1f2',
      dialogue: [
        'That huge timber hall is the Grand Armory Weapons Shop—dozens of colorful blades on display!',
        'Keep heading east into the Residential Quarter to reach the steaming Solaris Hot Spring!',
      ],
      crownedDialogue: [
        'Hooray for our Royal Sovereign! Confetti is falling across all of Solaris Plaza!',
      ],
    },
    {
      id: 'npc_smith_apprentice',
      name: 'Courier Bell',
      role: 'townfolk',
      x: 1580,
      y: FLOOR_Y - 26,
      minX: 1410,
      maxX: 1860,
      speed: 26,
      facing: 1,
      walkCycle: 1.9,
      coatColor: '#0284c7',
      hairColor: '#fde047',
      shirtColor: '#f8fafc',
      dialogue: [
        'Solaris Town grew three times larger! So many cozy timber homes beneath the jungle canopy!',
      ],
      crownedDialogue: [
        'Your Majesty’s sword shines brighter than the noonday sun over Solaris!',
      ],
    },
    {
      id: 'npc_east_baker_leo',
      name: 'Baker Leo',
      role: 'merchant',
      x: 2120,
      y: FLOOR_Y - 26,
      minX: 1920,
      maxX: 2380,
      speed: -22,
      facing: -1,
      walkCycle: 0.5,
      coatColor: '#d97706',
      hairColor: '#451a03',
      shirtColor: '#fef9c3',
      dialogue: [
        'The Solaris Hot Spring is right up ahead to the east! Soaking heals your wounds and boosts attack!',
      ],
      crownedDialogue: [
        'Fresh honey-bread baked in honor of Your Royal Highness!',
      ],
    },
    {
      id: 'npc_onsen_hana',
      name: 'Onsen Hostess Hana',
      role: 'onsen_attendant',
      x: 2740,
      y: FLOOR_Y - 26,
      minX: 2560,
      maxX: 2840,
      speed: 18,
      facing: -1,
      walkCycle: 1.1,
      coatColor: '#db2777',
      hairColor: '#1e1b4b',
      shirtColor: '#fce7f3',
      dialogue: [
        'Welcome to the Solaris Mineral Hot Spring! Step into the steaming waters with [F] to recover 100% HP + ATK Boost!',
        'Soaking beneath the night stars and paper lanterns is peak isekai bliss!',
      ],
      crownedDialogue: [
        'Your Majesty! Our royal thermal spring is always steaming warm for you!',
      ],
    },
    {
      id: 'npc_east_ranger_kai',
      name: 'Ranger Kai',
      role: 'adventurer',
      x: 3320,
      y: FLOOR_Y - 26,
      minX: 3020,
      maxX: 3640,
      speed: 28,
      facing: 1,
      walkCycle: 2.0,
      coatColor: '#065f46',
      hairColor: '#e2e8f0',
      shirtColor: '#d1fae5',
      dialogue: [
        'Every 5 minutes evening falls and cozy lanterns light up the entire 3-mile town avenue!',
      ],
      crownedDialogue: [
        'The East Quarter cheers loudly for our S-Rank Sovereign!',
      ],
    },
    {
      id: 'npc_east_watch_aria',
      name: 'Watcher Lin',
      role: 'townfolk',
      x: 3840,
      y: FLOOR_Y - 26,
      minX: 3680,
      maxX: 4040,
      speed: -21,
      facing: -1,
      walkCycle: 0.9,
      coatColor: '#4338ca',
      hairColor: '#f472b6',
      shirtColor: '#e0e7ff',
      dialogue: [
        'Beyond these eastern cottages lies the lush emerald jungle framing Solaris Kingdom.',
      ],
      crownedDialogue: [
        'Even out on the eastern terrace, we heard of the Three Demon Kings falling!',
      ],
    },
  ];
}

export function createGuildNpcs(isCrowned: boolean): IsekaiNpc[] {
  return [
    {
      id: 'guild_drinker_1',
      name: 'Barkeep Goro',
      role: 'drinker',
      x: 102,
      y: FLOOR_Y - 24,
      minX: 102,
      maxX: 102,
      speed: 0,
      facing: 1,
      walkCycle: 0,
      coatColor: '#78350f',
      hairColor: '#e2e8f0',
      shirtColor: '#fef3c7',
      sitting: true,
      drinkingPhase: 0.2,
      dialogue: [
        '*Slams frosty oak tankard* Drink up! Nothing beats guild ale after farming rocky Goblin Dungeons!',
        'Once you earn B-Rank on Floor 1, climb the Grand Staircase to the 2nd Floor for Royal Escorts!',
      ],
      crownedDialogue: [
        '*Raises overflowing golden mug* Drinks on the house for the new Crowned Royalty!',
      ],
    },
    {
      id: 'guild_drinker_2',
      name: 'Veteran Borg',
      role: 'drinker',
      x: 162,
      y: FLOOR_Y - 24,
      minX: 162,
      maxX: 162,
      speed: 0,
      facing: -1,
      walkCycle: 0,
      coatColor: '#1e3a8a',
      hairColor: '#9a3412',
      shirtColor: '#94a3b8',
      sitting: true,
      drinkingPhase: 2.1,
      dialogue: [
        '*Gulps ale* Going deeper inside any dungeon drops into pitch-black abysses guarded by Giant Dungeon Bosses!',
        'Wait till you reach the 2nd Floor—you gotta defend 3 different princess convoys from bandits to hit A-Rank!',
      ],
      crownedDialogue: [
        'You actually beat all three Demon Kings?! *spits ale in amazement* Long live Royalty!',
      ],
    },
    {
      id: 'guild_drinker_3',
      name: 'Lancer Elise',
      role: 'drinker',
      x: 222,
      y: FLOOR_Y - 24,
      minX: 222,
      maxX: 222,
      speed: 0,
      facing: 1,
      walkCycle: 0,
      coatColor: '#7e22ce',
      hairColor: '#fde047',
      shirtColor: '#f8fafc',
      sitting: true,
      drinkingPhase: 3.9,
      dialogue: [
        '*Clinks mug* Three clicks on Slash does a crazy fast Up-Down / Left-Right / Right-Left triple combo!',
      ],
      crownedDialogue: [
        isCrowned ? 'Our S-Rank Crowned Sovereign graces the guild tavern! Cheers!' : 'Cheers!',
      ],
    },
    {
      id: 'guild_walker_scout',
      name: 'Courier Toma',
      role: 'adventurer',
      x: 280,
      y: FLOOR_Y - 26,
      minX: 252,
      maxX: 430,
      speed: 24,
      facing: 1,
      walkCycle: 0.4,
      coatColor: '#0f766e',
      hairColor: '#09090b',
      shirtColor: '#ccfbf1',
      dialogue: [
        'Floor 1 Reception handles F through C Rank promotions. Reach B-Rank to unlock the Grand Staircase on the right!',
      ],
      crownedDialogue: [
        'Every adventurer in the guild hall speaks of your legendary Demon King triumph!',
      ],
    },
    {
      id: 'guild_receptionist_luna',
      name: 'Receptionist Luna',
      role: 'receptionist',
      x: 365,
      y: FLOOR_Y - 26,
      minX: 365,
      maxX: 365,
      speed: 0,
      facing: -1,
      walkCycle: 0,
      coatColor: '#1e40af',
      hairColor: '#fbbf24',
      shirtColor: '#ffffff',
      dialogue: [
        'Welcome to Floor 1 Reception! Take F-D Goblin Dungeon quests or C-Rank Demon Border Vanguard here!',
      ],
      crownedDialogue: [
        'Your Royal Highness! The entire Kingdom celebrates your S-Rank Coronation!',
      ],
    },
    {
      id: 'guild_floor2_commander',
      name: 'Commander Aerin',
      role: 'receptionist',
      x: 760,
      y: GUILD_FLOOR2_Y - 26,
      minX: 760,
      maxX: 760,
      speed: 0,
      facing: -1,
      walkCycle: 0,
      coatColor: '#7c2d12',
      hairColor: '#f43f5e',
      shirtColor: '#fef3c7',
      dialogue: [
        'Welcome to the High-Rank 2nd Floor! Receive Princess Guarding (3×) & Demon King Expeditions here!',
      ],
      crownedDialogue: [
        'Your Majesty! The 2nd Floor Command Hall salutes our Crowned Sovereign!',
      ],
    },
  ];
}

export function createWardrobeNpcs(): IsekaiNpc[] {
  return [
    {
      id: 'wardrobe_tailor_sylvie',
      name: 'Tailor Sylvie',
      role: 'tailor',
      x: 340,
      y: FLOOR_Y - 26,
      minX: 310,
      maxX: 390,
      speed: 14,
      facing: -1,
      walkCycle: 0,
      coatColor: '#9f1239',
      hairColor: '#f472b6',
      shirtColor: '#fff1f2',
      dialogue: [
        'Ara, welcome to Atelier Sylvie! Browse Axel Adventurer Tunics, Crimson Guild Coats & Royal Regalia!',
      ],
      crownedDialogue: [
        'Your Royal Crown glistens magnificently against our finest Velvet Regalia!',
      ],
    },
    {
      id: 'wardrobe_patron_kuro',
      name: 'Noble Patron',
      role: 'townfolk',
      x: 170,
      y: FLOOR_Y - 26,
      minX: 115,
      maxX: 245,
      speed: 20,
      facing: 1,
      walkCycle: 0.9,
      coatColor: '#4338ca',
      hairColor: '#e2e8f0',
      shirtColor: '#fef08a',
      dialogue: [
        'The gilded mirror here shows every seam! A sharp Crimson Beret raises party morale by 200%.',
      ],
    },
  ];
}

export function createPotionShopNpcs(): IsekaiNpc[] {
  return [
    {
      id: 'potion_alchemist_nyx',
      name: 'Alchemist Nyx',
      role: 'alchemist',
      x: 395,
      y: FLOOR_Y - 26,
      minX: 365,
      maxX: 430,
      speed: 12,
      facing: -1,
      walkCycle: 0,
      coatColor: '#6d28d9',
      hairColor: '#34d399',
      shirtColor: '#ecfdf5',
      dialogue: [
        'Step carefully around the glowing vats! We brew ruby HP elixirs AND amethyst Fury Damage-Boost potions!',
      ],
      crownedDialogue: [
        'Royal Sovereign! May these glowing elixirs fuel a thousand more victories!',
      ],
    },
    {
      id: 'potion_patron_pip',
      name: 'Apprentice Pip',
      role: 'adventurer',
      x: 185,
      y: FLOOR_Y - 26,
      minX: 125,
      maxX: 280,
      speed: 18,
      facing: 1,
      walkCycle: 0.5,
      coatColor: '#0f766e',
      hairColor: '#fbbf24',
      shirtColor: '#e0f2fe',
      dialogue: [
        'Downing a Titan Overdrive Tonic gives +60% slash & skill damage for 45 seconds straight!',
      ],
    },
  ];
}

export function createWeaponsShopNpcs(): IsekaiNpc[] {
  return [
    {
      id: 'weapons_smith_borin',
      name: 'Master Smith Borin',
      role: 'blacksmith',
      x: 1035,
      y: FLOOR_Y - 26,
      minX: 990,
      maxX: 1110,
      speed: 14,
      facing: -1,
      walkCycle: 0,
      coatColor: '#7c2d12',
      hairColor: '#e2e8f0',
      shirtColor: '#fdba74',
      dialogue: [
        'Welcome to the Grand Solaris Armory! Look at all ten enchanted weapons gleaming along the wall racks!',
        'Every blade has its own color, custom reach, and Special Effect—Frost, Lightning, Lifesteal, Wind, or Inferno!',
      ],
      crownedDialogue: [
        'Forging blades for the Crowned Champion of Solaris—my hammer sings with pride!',
      ],
    },
    {
      id: 'weapons_patron_kain',
      name: 'Blade Collector Kain',
      role: 'adventurer',
      x: 340,
      y: FLOOR_Y - 26,
      minX: 190,
      maxX: 620,
      speed: 26,
      facing: 1,
      walkCycle: 0.3,
      coatColor: '#1e3a8a',
      hairColor: '#94a3b8',
      shirtColor: '#f8fafc',
      dialogue: [
        'Look at the size difference between the compact Viperfang Twinblade and the colossal Raijin Thunder Odachi!',
      ],
    },
    {
      id: 'weapons_patron_sera',
      name: 'Knight Sera',
      role: 'guard',
      x: 770,
      y: FLOOR_Y - 26,
      minX: 650,
      maxX: 920,
      speed: -22,
      facing: -1,
      walkCycle: 1.6,
      coatColor: '#9f1239',
      hairColor: '#fde047',
      shirtColor: '#fff1f2',
      dialogue: [
        'The Bloodmoon Heavy Scythe heals you with every swing—lifesaver in deeper darkened dungeons!',
      ],
    },
  ];
}

export function stepIsekaiNpcs(npcs: IsekaiNpc[], dt: number): void {
  for (const npc of npcs) {
    if (npc.sitting) {
      npc.drinkingPhase = (npc.drinkingPhase ?? 0) + dt * 2.2;
      continue;
    }
    if (npc.speed === 0 || npc.minX >= npc.maxX) continue;
    const step = npc.speed * dt;
    npc.x += step;
    npc.walkCycle += Math.abs(step) * 0.25;
    npc.facing = npc.speed >= 0 ? 1 : -1;
    if (npc.x >= npc.maxX) {
      npc.x = npc.maxX;
      npc.speed = -Math.abs(npc.speed);
      npc.facing = -1;
    } else if (npc.x <= npc.minX) {
      npc.x = npc.minX;
      npc.speed = Math.abs(npc.speed);
      npc.facing = 1;
    }
  }
}

export function createDungeonSectorPlatforms(realm: 'goblin_dungeon' | 'demon_realm', sectorIdx: number): Platform[] {
  const startX = sectorIdx * DUNGEON_SECTOR_WIDTH;
  const plats: Platform[] = [
    {
      id: `${realm}_floor_s${sectorIdx}`,
      x: startX,
      y: FLOOR_Y,
      w: DUNGEON_SECTOR_WIDTH + 60,
      h: 46,
      kind: 'floor',
    },
  ];
  for (let offset = 160; offset < DUNGEON_SECTOR_WIDTH - 120; offset += 320) {
    const cx = startX + offset;
    plats.push(
      {
        id: `${realm}_ledge_low_s${sectorIdx}_${offset}`,
        x: cx,
        y: FLOOR_Y - (realm === 'demon_realm' ? 48 : 44),
        w: 98,
        h: 12,
        kind: 'brick',
      },
      {
        id: `${realm}_ledge_high_s${sectorIdx}_${offset}`,
        x: cx + 150,
        y: FLOOR_Y - (realm === 'demon_realm' ? 82 : 78),
        w: 112,
        h: 12,
        kind: realm === 'demon_realm' ? 'bridge' : 'brick',
      },
    );
  }
  return plats;
}

export function buildIsekaiRoomPlatforms(realm: RealmMode): Platform[] {
  if (realm === 'goblin_dungeon' || realm === 'demon_realm') {
    return [
      ...createDungeonSectorPlatforms(realm, 0),
      ...createDungeonSectorPlatforms(realm, 1),
      ...createDungeonSectorPlatforms(realm, 2),
    ];
  }
  const bounds = ISEKAI_ROOM_BOUNDS[realm];
  const w = Math.min(8000, bounds.maxX + 60);
  const plats: Platform[] = [
    {
      id: `isekai_floor_${realm}`,
      x: 0,
      y: FLOOR_Y,
      w,
      h: 46,
      kind: 'floor',
    },
  ];
  if (realm === 'isekai_town') {
    plats.push(
      { id: 'town_balcony_1', x: 315, y: FLOOR_Y - 56, w: 96, h: 10, kind: 'bridge' },
      { id: 'town_balcony_2', x: 870, y: FLOOR_Y - 56, w: 96, h: 10, kind: 'bridge' },
      { id: 'town_balcony_3', x: 1620, y: FLOOR_Y - 52, w: 110, h: 10, kind: 'bridge' },
      { id: 'town_balcony_4', x: 2240, y: FLOOR_Y - 54, w: 104, h: 10, kind: 'bridge' },
      { id: 'town_balcony_5', x: 3160, y: FLOOR_Y - 52, w: 110, h: 10, kind: 'bridge' },
      { id: 'town_balcony_6', x: 3680, y: FLOOR_Y - 56, w: 108, h: 10, kind: 'bridge' },
    );
  } else if (realm === 'isekai_guild') {
    // 2nd Floor Mezzanine Gallery + Grand Staircase steps visible from Floor 1 Hall
    plats.push(
      { id: 'guild_stair_1', x: 424, y: FLOOR_Y - 26, w: 38, h: 8, kind: 'bridge' },
      { id: 'guild_stair_2', x: 454, y: FLOOR_Y - 54, w: 38, h: 8, kind: 'bridge' },
      { id: 'guild_floor2_deck', x: 486, y: GUILD_FLOOR2_Y, w: 382, h: 12, kind: 'bridge' },
    );
  } else if (realm === 'isekai_weapons_shop') {
    plats.push(
      { id: 'armory_catwalk_l', x: 380, y: FLOOR_Y - 54, w: 180, h: 10, kind: 'bridge' },
      { id: 'armory_catwalk_r', x: 650, y: FLOOR_Y - 54, w: 180, h: 10, kind: 'bridge' },
    );
  } else if (realm === 'dungeon_exterior') {
    plats.push(
      { id: 'ext_log_1', x: 340, y: FLOOR_Y - 40, w: 96, h: 10, kind: 'bridge' },
      { id: 'ext_rock_2', x: 630, y: FLOOR_Y - 58, w: 104, h: 12, kind: 'brick' },
      { id: 'ext_ledge_hole', x: 840, y: FLOOR_Y - 42, w: 86, h: 12, kind: 'brick' },
    );
  } else if (realm === 'demon_king_arena') {
    plats.push(
      { id: 'dk_dais_l', x: 140, y: FLOOR_Y - 48, w: 104, h: 10, kind: 'bridge' },
      { id: 'dk_dais_m', x: 560, y: FLOOR_Y - 68, w: 120, h: 10, kind: 'bridge' },
      { id: 'dk_dais_r', x: 960, y: FLOOR_Y - 48, w: 104, h: 10, kind: 'bridge' },
    );
  } else if (realm === 'dueling_arena') {
    plats.push(
      { id: 'arena_dais_l', x: 185, y: FLOOR_Y - 48, w: 120, h: 12, kind: 'bridge' },
      { id: 'arena_dais_m', x: 540, y: FLOOR_Y - 72, w: 160, h: 12, kind: 'bridge' },
      { id: 'arena_dais_r', x: 910, y: FLOOR_Y - 48, w: 120, h: 12, kind: 'bridge' },
    );
  }
  return plats;
}

export function buildIsekaiRoomInteractables(realm: RealmMode): InteractableProp[] {
  if (realm === 'isekai_town') {
    return [
      {
        id: 'prop_town_citadel_portal',
        x: 24,
        y: FLOOR_Y - 56,
        w: 34,
        h: 56,
        kind: 'citadel_portal',
        label: 'Dimensional Gate · Return to Bastera Citadel',
        speaker: 'Dimensional Return Gate',
        dialogue: ['Stepping back through the Azure-Gold Rift to Bastera Citadel...'],
        activated: false,
      },
      {
        id: 'prop_town_fountain',
        x: 215,
        y: FLOOR_Y - 44,
        w: 76,
        h: 44,
        kind: 'fountain',
        label: 'Solaris White Marble Fountain',
        speaker: 'Town Fountain',
        dialogue: [
          'Crystal-clear spring water arcs gracefully over cool white carved marble!',
          'You splash your face with fresh fountain spray (+15 Stamina restored)!',
        ],
        activated: false,
      },
      {
        id: 'door_adventure_guild',
        x: 342,
        y: FLOOR_Y - 52,
        w: 38,
        h: 52,
        kind: 'guild_door',
        label: 'Enter Adventure Guild Hall',
        speaker: 'Adventure Guild',
        dialogue: ['Stepping into the Two-Story Solaris Adventure Guild Hall...'],
        activated: false,
      },
      {
        id: 'prop_caravan_rider',
        x: 482,
        y: FLOOR_Y - 48,
        w: 92,
        h: 48,
        kind: 'caravan_rider',
        label: 'Caravan Rider Vance · Travel Anywhere',
        speaker: 'Caravan Rider Vance',
        dialogue: ['Where are we riding today, adventurer?'],
        activated: false,
      },
      {
        id: 'door_potion_shop',
        x: 648,
        y: FLOOR_Y - 52,
        w: 36,
        h: 52,
        kind: 'potion_door',
        label: 'Enter Potion Shop',
        speaker: 'Alchemist Apothecary',
        dialogue: ['Stepping into the Glowing Potion Apothecary...'],
        activated: false,
      },
      {
        id: 'door_wardrobe_shop',
        x: 905,
        y: FLOOR_Y - 52,
        w: 36,
        h: 52,
        kind: 'wardrobe_door',
        label: 'Enter Wardrobe Shop',
        speaker: 'Atelier Sylvie',
        dialogue: ['Stepping into the Wardrobe Boutique...'],
        activated: false,
      },
      {
        id: 'door_weapons_shop',
        x: 1185,
        y: FLOOR_Y - 54,
        w: 44,
        h: 54,
        kind: 'weapons_door',
        label: 'Enter Grand Weapons Shop',
        speaker: 'Grand Solaris Armory',
        dialogue: ['Stepping inside the Grand Weapons Armory...'],
        activated: false,
      },
      {
        id: 'prop_hot_spring',
        x: 2630,
        y: FLOOR_Y - 46,
        w: 132,
        h: 46,
        kind: 'hot_spring',
        label: 'Soak in Solaris Hot Spring (Full HP + Boost)',
        speaker: 'Solaris Onsen',
        dialogue: ['Steaming mineral waters restore full vitality and power!'],
        activated: false,
      },
      {
        id: 'door_dueling_arena',
        x: 3285,
        y: FLOOR_Y - 92,
        w: 118,
        h: 92,
        kind: 'arena_door',
        label: 'Enter Solaris Grand Colosseum (Dueling Arena)',
        speaker: 'Colosseum Master',
        dialogue: ['Stepping inside the massive tiered Solaris Grand Colosseum!'],
        activated: false,
      },
    ];
  }
  if (realm === 'dungeon_exterior') {
    return [
      {
        id: 'prop_exterior_caravan',
        x: 78,
        y: FLOOR_Y - 48,
        w: 92,
        h: 48,
        kind: 'caravan_rider',
        label: 'Caravan Rider Vance · Return / Travel',
        speaker: 'Caravan Rider Vance',
        dialogue: ['Ready to ride back to Solaris Town or elsewhere? Type your destination!'],
        activated: false,
      },
      {
        id: 'prop_dungeon_hole',
        x: 970,
        y: FLOOR_Y - 94,
        w: 132,
        h: 94,
        kind: 'dungeon_hole',
        label: 'Enter Massive Dark Rocky Dungeon Hole',
        speaker: 'Dungeon Abyss Mouth',
        dialogue: ['Descending into the endless dark rocky cavern...'],
        activated: false,
      },
    ];
  }
  if (realm === 'goblin_dungeon' || realm === 'demon_realm') {
    return [
      {
        id: `prop_exit_${realm}`,
        x: 34,
        y: FLOOR_Y - 72,
        w: 36,
        h: 72,
        kind: 'dungeon_exit_rope',
        label: 'Climb Outside to Forest & Caravan',
        speaker: 'Dungeon Exit Rope',
        dialogue: ['Climbing back out into the green grassy forest...'],
        activated: false,
      },
      {
        id: `prop_descend_${realm}`,
        x: 3630,
        y: FLOOR_Y - 78,
        w: 58,
        h: 78,
        kind: 'dungeon_descend_gate',
        label: 'Descend Endless Deeper Chamber',
        speaker: 'Abyssal Descent Gate',
        dialogue: ['Descending deeper into endless subterranean darkness...'],
        activated: false,
      },
    ];
  }
  if (realm === 'demon_king_arena') {
    return [
      {
        id: 'prop_exit_dk_arena',
        x: 34,
        y: FLOOR_Y - 72,
        w: 36,
        h: 72,
        kind: 'dungeon_exit_rope',
        label: 'Retreat Outside to Forest & Caravan',
        speaker: 'Abyssal Exit Rope',
        dialogue: ['Retreating outside to the grassy forest camp...'],
        activated: false,
      },
    ];
  }
  if (realm === 'isekai_guild') {
    return [
      {
        id: 'door_guild_exit',
        x: 34,
        y: FLOOR_Y - 52,
        w: 32,
        h: 52,
        kind: 'town_exit_door',
        label: 'Exit to Solaris Town',
        speaker: 'Town Door',
        dialogue: ['Returning to sunny Solaris Town...'],
        activated: false,
      },
      {
        id: 'prop_guild_bar',
        x: 92,
        y: FLOOR_Y - 30,
        w: 146,
        h: 30,
        kind: 'guild_bar',
        label: 'Guild Tavern Bar',
        speaker: 'Barkeep Goro',
        dialogue: ['Fresh oak-cask ale keeps every F-Rank adventurer swinging strong! Cheers!'],
        activated: false,
      },
      {
        id: 'prop_guild_reception',
        x: 332,
        y: FLOOR_Y - 36,
        w: 62,
        h: 36,
        kind: 'guild_reception',
        label: 'Floor 1 Reception Desk (F–C)',
        speaker: 'Receptionist Luna',
        dialogue: ['Opening Floor 1 Guild Contracts & Party Invites...'],
        activated: false,
      },
      {
        id: 'prop_guild_stairs',
        x: 432,
        y: FLOOR_Y - 78,
        w: 58,
        h: 78,
        kind: 'guild_stairs',
        label: '2nd Floor Grand Staircase (B+ Rank)',
        speaker: 'Guild Gatekeeper',
        dialogue: ['Ascending to the High-Rank 2nd Floor...'],
        activated: false,
      },
      {
        id: 'prop_guild_floor2_reception',
        x: 724,
        y: GUILD_FLOOR2_Y - 36,
        w: 64,
        h: 36,
        kind: 'guild_floor2_reception',
        label: '2nd Floor Command Desk (B–S)',
        speaker: 'Commander Aerin',
        dialogue: ['Opening High-Rank Escort & Demon King Expeditions...'],
        activated: false,
      },
    ];
  }
  if (realm === 'isekai_wardrobe') {
    return [
      {
        id: 'door_wardrobe_exit',
        x: 34,
        y: FLOOR_Y - 52,
        w: 32,
        h: 52,
        kind: 'town_exit_door',
        label: 'Exit to Solaris Town',
        speaker: 'Town Door',
        dialogue: ['Returning to sunny Solaris Town...'],
        activated: false,
      },
      {
        id: 'prop_wardrobe_counter',
        x: 320,
        y: FLOOR_Y - 36,
        w: 66,
        h: 36,
        kind: 'wardrobe_counter',
        label: 'Browse Wardrobe Outfits',
        speaker: 'Tailor Sylvie',
        dialogue: ['Opening Medieval Isekai Wardrobe Catalog...'],
        activated: false,
      },
    ];
  }
  if (realm === 'isekai_potion_shop') {
    return [
      {
        id: 'door_potion_exit',
        x: 34,
        y: FLOOR_Y - 52,
        w: 32,
        h: 52,
        kind: 'town_exit_door',
        label: 'Exit to Solaris Town',
        speaker: 'Town Door',
        dialogue: ['Returning to sunny Solaris Town...'],
        activated: false,
      },
      {
        id: 'prop_potion_counter',
        x: 372,
        y: FLOOR_Y - 36,
        w: 72,
        h: 36,
        kind: 'potion_counter',
        label: 'Buy HP & Damage-Boost Potions',
        speaker: 'Alchemist Nyx',
        dialogue: ['Opening Glowing Elixir Apothecary...'],
        activated: false,
      },
    ];
  }
  if (realm === 'isekai_weapons_shop') {
    return [
      {
        id: 'door_weapons_exit',
        x: 34,
        y: FLOOR_Y - 52,
        w: 32,
        h: 52,
        kind: 'town_exit_door',
        label: 'Exit to Solaris Town',
        speaker: 'Town Door',
        dialogue: ['Returning to sunny Solaris Town...'],
        activated: false,
      },
      {
        id: 'prop_weapons_counter',
        x: 1005,
        y: FLOOR_Y - 38,
        w: 84,
        h: 38,
        kind: 'weapons_counter',
        label: 'Browse & Forge Special Weapons',
        speaker: 'Master Smith Borin',
        dialogue: ['Opening Grand Armory Weapon Rack...'],
        activated: false,
      },
    ];
  }
  if (realm === 'dueling_arena') {
    return [
      {
        id: 'door_arena_exit',
        x: 32,
        y: FLOOR_Y - 54,
        w: 34,
        h: 54,
        kind: 'town_exit_door',
        label: 'Exit Colosseum to Solaris Town',
        speaker: 'Arena Gate',
        dialogue: ['Walking out of Solaris Grand Dueling Arena...'],
        activated: false,
      },
      {
        id: 'prop_arena_board',
        x: 155,
        y: FLOOR_Y - 52,
        w: 68,
        h: 52,
        kind: 'arena_board',
        label: 'Choose Jujutsu Kaisen Opponent (Matched Stats · OP AI)',
        speaker: 'Colosseum Matchmaker Herald',
        dialogue: ['Select a Jujutsu Kaisen sorcerer or curse user to duel at equal stats!'],
        activated: false,
      },
    ];
  }
  return [];
}

function makeEnemy(
  id: string,
  archetype: EnemyArchetype,
  name: string,
  x: number,
  y: number,
  hp: number,
  w: number,
  h: number,
  biome: BiomeId,
  rewardGold: number,
  attackDamage: number,
  isDungeonBoss = false,
  sizeScale = 1,
  darkness = 0,
  variantStyle?: EnemyState['variantStyle'],
): EnemyState {
  const scaledW = Math.round(w * sizeScale);
  const scaledH = Math.round(h * sizeScale);
  const adjustedY = y - (scaledH - h);
  return {
    id,
    archetype,
    name,
    x,
    y: adjustedY,
    vx: 0,
    vy: 0,
    w: scaledW,
    h: scaledH,
    hp,
    maxHp: hp,
    facing: -1,
    state: 'patrol',
    stateTimer: 0.45,
    patrolOriginX: x,
    hitFlash: 0,
    biome,
    rewardGold,
    koTimer: 0,
    attackDamage,
    isDungeonBoss,
    sizeScale: Number(sizeScale.toFixed(2)),
    darkness: Number(Math.min(0.92, Math.max(0, darkness)).toFixed(2)),
    variantStyle,
  };
}

export function getEndlessDistanceScaling(distanceOrSectorX: number, depth = 1): {
  sizeScale: number;
  strengthMult: number;
  darkness: number;
} {
  const sectorProgress = Math.max(0, distanceOrSectorX / DUNGEON_SECTOR_WIDTH);
  const depthProgress = Math.max(0, depth - 1);
  const sizeScale = Math.min(2.25, 1 + sectorProgress * 0.14 + depthProgress * 0.18);
  const strengthMult = (1 + sectorProgress * 0.36) * (1 + depthProgress * 0.45);
  const darkness = Math.min(0.88, sectorProgress * 0.15 + depthProgress * 0.18);
  return {
    sizeScale: Number(sizeScale.toFixed(2)),
    strengthMult: Number(strengthMult.toFixed(2)),
    darkness: Number(darkness.toFixed(2)),
  };
}

export function createDungeonSectorEnemies(
  realm: 'goblin_dungeon' | 'demon_realm',
  missionId: GuildMissionId,
  sectorIdx: number,
  depth = 1,
  bossesDefeated = 0,
): EnemyState[] {
  const startX = Math.max(220, sectorIdx * DUNGEON_SECTOR_WIDTH + 90);
  const endX = (sectorIdx + 1) * DUNGEON_SECTOR_WIDTH - 90;
  const span = Math.max(240, endX - startX);
  const count = realm === 'goblin_dungeon' ? 6 : 6;
  const list: EnemyState[] = [];
  const tier = missionId === 'f_goblin_warren' ? 1 : missionId === 'e_hobgoblin_caves' ? 2 : 3;

  for (let i = 0; i < count; i++) {
    const x = Math.round(startX + (i / Math.max(1, count - 1)) * span);
    const { sizeScale, strengthMult, darkness } = getEndlessDistanceScaling(x, depth);

    if (realm === 'goblin_dungeon') {
      const isHob = i % 2 === 1 || sectorIdx >= 2;
      if (isHob) {
        list.push(
          makeEnemy(
            `gob_s${sectorIdx}_d${depth}_${i}`,
            'hobgoblin',
            sectorIdx >= 2 || depth > 1 ? `Abyss Hobgoblin S${sectorIdx + 1}` : 'Rocky Cavern Hobgoblin',
            x,
            FLOOR_Y - 30,
            Math.round((74 + tier * 24) * strengthMult * 3),
            22,
            30,
            'castle',
            Math.round((16 + tier * 5) * strengthMult),
            Math.round((12 + tier * 3) * strengthMult),
            false,
            sizeScale,
            darkness,
          ),
        );
      } else {
        list.push(
          makeEnemy(
            `gob_s${sectorIdx}_d${depth}_${i}`,
            'goblin_normal',
            sectorIdx >= 2 || depth > 1 ? `Shadow Goblin S${sectorIdx + 1}` : 'Cavern Goblin',
            x,
            FLOOR_Y - 22,
            Math.round((38 + tier * 12) * strengthMult * 3),
            17,
            22,
            'castle',
            Math.round((10 + tier * 3) * strengthMult),
            Math.round((8 + tier * 2) * strengthMult),
            false,
            sizeScale,
            darkness,
          ),
        );
      }
    } else {
      const archetypes: { arch: EnemyArchetype; name: string; yOff: number; hp: number; w: number; h: number; dmg: number }[] = [
        { arch: 'demon_tank', name: 'Obsidian Demon Tank', yOff: 32, hp: 165, w: 24, h: 32, dmg: 22 },
        { arch: 'demon_lightning', name: 'Tempest Demon Striker', yOff: 28, hp: 110, w: 20, h: 28, dmg: 18 },
        { arch: 'demon_succubus', name: 'Crimson Abyss Succubus', yOff: 68, hp: 96, w: 20, h: 28, dmg: 16 },
      ];
      const s = archetypes[(i + sectorIdx) % archetypes.length];
      list.push(
        makeEnemy(
          `dem_s${sectorIdx}_d${depth}_${i}`,
          s.arch,
          sectorIdx >= 2 || depth > 1 ? `Abyssal ${s.name}` : s.name,
          x,
          FLOOR_Y - s.yOff,
          Math.round(s.hp * strengthMult * 3),
          s.w,
          s.h,
          'volcano',
          Math.round(34 * strengthMult),
          Math.round(s.dmg * strengthMult),
          false,
          sizeScale,
          darkness,
        ),
      );
    }
  }

  // Every 2nd endless sector (or Depth >= 2 sector 1+) spawns a huge Darkened Dungeon Warlord!
  if ((sectorIdx >= 1 && sectorIdx % 2 === 1) || (depth >= 2 && sectorIdx === 1)) {
    const bossX = startX + Math.round(span * 0.88);
    list.push(createDungeonDeepBoss(realm, Math.max(depth, sectorIdx + 1), bossX, bossesDefeated));
  }
  return list;
}

export function createGoblinDungeonWave(
  missionId: GuildMissionId,
  waveIdx = 0,
  depth = 1,
  bossesDefeated = 0,
): EnemyState[] {
  const tier = missionId === 'f_goblin_warren' ? 1 : missionId === 'e_hobgoblin_caves' ? 2 : 3;
  const count = (tier === 1 ? 16 : tier === 2 ? 19 : 22) + Math.min(8, (depth - 1) * 2);
  const list: EnemyState[] = [];
  for (let i = 0; i < count; i++) {
    const isHob = i % 3 === 1 || (tier >= 2 && i % 2 === 1);
    const x = 250 + Math.round((i / Math.max(1, count - 1)) * 2400) + ((waveIdx + i) % 2) * 18;
    const { sizeScale, strengthMult, darkness } = getEndlessDistanceScaling(x, depth);
    if (isHob) {
      list.push(
        makeEnemy(
          `gob_${tier}_${depth}_${waveIdx}_${i}`,
          'hobgoblin',
          depth > 1 || i > count * 0.65 ? `Abyssal Hobgoblin` : 'Rocky Cavern Hobgoblin',
          x,
          FLOOR_Y - 30,
          Math.round((72 + tier * 24) * strengthMult * 3),
          22,
          30,
          'castle',
          Math.round((16 + tier * 5) * strengthMult),
          Math.round((12 + tier * 3) * strengthMult),
          false,
          sizeScale,
          darkness,
        ),
      );
    } else {
      list.push(
        makeEnemy(
          `gob_${tier}_${depth}_${waveIdx}_${i}`,
          'goblin_normal',
          depth > 1 || i > count * 0.65 ? `Shadow Goblin` : 'Cavern Goblin',
          x,
          FLOOR_Y - 22,
          Math.round((36 + tier * 12) * strengthMult * 3),
          17,
          22,
          'castle',
          Math.round((9 + tier * 3) * strengthMult),
          Math.round((8 + tier * 2) * strengthMult),
          false,
          sizeScale,
          darkness,
        ),
      );
    }
  }
  if (depth >= 2) {
    list.push(createDungeonDeepBoss('goblin_dungeon', depth, 2550, bossesDefeated));
  }
  return list;
}

export function createDungeonDeepBoss(
  realm: RealmMode,
  depth: number,
  spawnX = 2550,
  bossesDefeated = 0,
): EnemyState {
  const { sizeScale, strengthMult, darkness } = getEndlessDistanceScaling(spawnX, depth);
  const defeatedMult = Math.pow(1.8, Math.max(0, bossesDefeated));
  const bossScale = Math.max(1.38, sizeScale * 1.18);
  const bossDark = Math.min(0.9, Math.max(0.32, darkness + 0.18));
  if (realm === 'demon_realm') {
    return makeEnemy(
      `deep_boss_dem_${depth}_${spawnX}`,
      'demon_tank',
      `Depth ${depth} Caldera Demon Overlord`,
      spawnX,
      FLOOR_Y - 32,
      Math.round(380 * strengthMult * defeatedMult),
      26,
      32,
      'volcano',
      Math.round(120 * strengthMult),
      Math.round(28 * strengthMult * defeatedMult),
      true,
      bossScale,
      bossDark,
    );
  }
  return makeEnemy(
    `deep_boss_gob_${depth}_${spawnX}`,
    'hobgoblin',
    `Depth ${depth} Granite Hobgoblin Warlord`,
    spawnX,
    FLOOR_Y - 30,
    Math.round(260 * strengthMult * defeatedMult),
    24,
    30,
    'castle',
    Math.round(85 * strengthMult),
    Math.round(22 * strengthMult * defeatedMult),
    true,
    bossScale,
    bossDark,
  );
}

export function createCarriageEscortInit(variant = 0): CarriageEscortState {
  return {
    x: 150,
    y: FLOOR_Y - 46,
    hp: 360,
    maxHp: 360,
    progress: 0,
    speed: 24,
    wheelPhase: 0,
    hitFlash: 0,
    wavesSpawned: 0,
    variant,
  };
}

const BANDIT_FACTIONS = [
  {
    fighterName: 'Crimson Brigand Fighter',
    archerName: 'Crimson Crossbow Raider',
    assassinName: 'Black-Cloak Cutthroat',
    pyroName: 'Cinder-Hood Pyromancer',
    bruteName: 'Iron-Buckler Highway Brute',
    fighterHp: 85,
    archerHp: 58,
    assassinHp: 64,
    pyroHp: 68,
    bruteHp: 138,
    fighterDmg: 15,
    archerDmg: 12,
    assassinDmg: 18,
    pyroDmg: 19,
    bruteDmg: 22,
  },
  {
    fighterName: 'Shadow-Cloak Marauder',
    archerName: 'Venom Longbow Sniper',
    assassinName: 'Nightblade Ambush Rogue',
    pyroName: 'Blaze-Sigil Warlock',
    bruteName: 'Juggernaut Shield Captain',
    fighterHp: 102,
    archerHp: 72,
    assassinHp: 78,
    pyroHp: 84,
    bruteHp: 168,
    fighterDmg: 18,
    archerDmg: 15,
    assassinDmg: 21,
    pyroDmg: 22,
    bruteDmg: 25,
  },
  {
    fighterName: 'Ironclad Vanguard Captain',
    archerName: 'Siege-Bolt Sharpshooter',
    assassinName: 'Mirage Fang Assassin',
    pyroName: 'Inferno Crimson Mage',
    bruteName: 'Colossal Brigand Enforcer',
    fighterHp: 124,
    archerHp: 84,
    assassinHp: 94,
    pyroHp: 98,
    bruteHp: 198,
    fighterDmg: 21,
    archerDmg: 17,
    assassinDmg: 24,
    pyroDmg: 25,
    bruteDmg: 29,
  },
];

export function createBanditWave(
  carriageX: number,
  waveIdx: number,
  escortVariant = 0,
): EnemyState[] {
  const faction = BANDIT_FACTIONS[Math.abs(escortVariant) % BANDIT_FACTIONS.length];
  const list: EnemyState[] = [];
  // Coordinated Pincer Bandit Ambush: Front Brute Tank, Flank Assassins, Ranged Crossbow Snipers & Fire-Bomb Pyromancer!
  const roster: { arch: EnemyArchetype; offset: number; name: string; hp: number; w: number; h: number; dmg: number }[] = [
    {
      arch: 'bandit_brute',
      offset: 175,
      name: faction.bruteName,
      hp: faction.bruteHp,
      w: 24,
      h: 32,
      dmg: faction.bruteDmg,
    },
    {
      arch: 'bandit_fighter',
      offset: 225,
      name: faction.fighterName,
      hp: faction.fighterHp,
      w: 18,
      h: 26,
      dmg: faction.fighterDmg,
    },
    {
      arch: 'bandit_assassin',
      offset: -145,
      name: faction.assassinName,
      hp: faction.assassinHp,
      w: 18,
      h: 25,
      dmg: faction.assassinDmg,
    },
    {
      arch: 'bandit_archer',
      offset: 285,
      name: faction.archerName,
      hp: faction.archerHp,
      w: 18,
      h: 26,
      dmg: faction.archerDmg,
    },
    {
      arch: 'bandit_pyromancer',
      offset: waveIdx >= 1 ? -190 : 340,
      name: faction.pyroName,
      hp: faction.pyroHp,
      w: 18,
      h: 27,
      dmg: faction.pyroDmg,
    },
  ];
  roster.forEach((spec, i) => {
    const sx = Math.max(36, Math.min(1080, carriageX + spec.offset));
    list.push(
      makeEnemy(
        `bandit_${escortVariant}_${waveIdx}_${i}`,
        spec.arch,
        spec.name,
        sx,
        FLOOR_Y - spec.h,
        spec.hp * 3,
        spec.w,
        spec.h,
        'forest',
        26 + escortVariant * 8 + (spec.arch === 'bandit_brute' ? 14 : 0),
        spec.dmg,
      ),
    );
  });
  return list;
}

export function createDemonRealmWave(depth = 1, bossesDefeated = 0): EnemyState[] {
  const archetypes: { arch: EnemyArchetype; name: string; yOff: number; hp: number; w: number; h: number; dmg: number }[] = [
    { arch: 'demon_tank', name: 'Obsidian Demon Tank', yOff: 32, hp: 165, w: 24, h: 32, dmg: 22 },
    { arch: 'demon_lightning', name: 'Tempest Demon Striker', yOff: 28, hp: 110, w: 20, h: 28, dmg: 18 },
    { arch: 'demon_succubus', name: 'Crimson Abyss Succubus', yOff: 68, hp: 96, w: 20, h: 28, dmg: 16 },
  ];
  const count = 18 + Math.min(6, (depth - 1) * 2);
  const list: EnemyState[] = [];
  for (let i = 0; i < count; i++) {
    const s = archetypes[i % archetypes.length];
    const x = 250 + Math.round((i / Math.max(1, count - 1)) * 2400);
    const { sizeScale, strengthMult, darkness } = getEndlessDistanceScaling(x, depth);
    list.push(
      makeEnemy(
        `dem_${depth}_${i}`,
        s.arch,
        depth > 1 || i > count * 0.65 ? `Abyss ${s.name}` : s.name,
        x,
        FLOOR_Y - s.yOff,
        Math.round(s.hp * strengthMult * 3),
        s.w,
        s.h,
        'volcano',
        Math.round(34 * strengthMult),
        Math.round(s.dmg * strengthMult),
        false,
        sizeScale,
        darkness,
      ),
    );
  }
  if (depth >= 2) {
    list.push(createDungeonDeepBoss('demon_realm', depth, 2550, bossesDefeated));
  }
  return list;
}

export function createDemonKingAllies(): AlliedNpc[] {
  return [
    {
      id: 'ally_harold',
      name: 'Vanguard Captain Harold',
      role: 'knight',
      x: 112,
      y: FLOOR_Y - 26,
      vx: 0,
      facing: 1,
      hp: 420,
      maxHp: 420,
      attackCooldown: 0.4,
      walkCycle: 0,
      hitFlash: 0,
      armorColor: '#e2e8f0',
      cloakColor: '#1d4ed8',
      weaponColor: '#fbbf24',
    },
    {
      id: 'ally_elise',
      name: 'Tempest Lancer Elise',
      role: 'lancer',
      x: 68,
      y: FLOOR_Y - 26,
      vx: 0,
      facing: 1,
      hp: 340,
      maxHp: 340,
      attackCooldown: 0.6,
      walkCycle: 1.4,
      hitFlash: 0,
      armorColor: '#bae6fd',
      cloakColor: '#059669',
      weaponColor: '#38bdf8',
    },
    {
      id: 'ally_aria',
      name: 'Arch-Cleric Aria',
      role: 'mage',
      x: 42,
      y: FLOOR_Y - 26,
      vx: 0,
      facing: 1,
      hp: 300,
      maxHp: 300,
      attackCooldown: 0.9,
      healCooldown: 3.5,
      walkCycle: 2.2,
      hitFlash: 0,
      armorColor: '#fef3c7',
      cloakColor: '#db2777',
      weaponColor: '#fde047',
    },
  ];
}

/**
 * Each of the 3 Demon Kings commands its own distinct Manhwa-inspired monster legion
 * rather than fighting simultaneously with duplicate enemies!
 */
export function createDemonKingStageMinions(stage: 1 | 2 | 3): EnemyState[] {
  if (stage === 1) {
    // Stage 1: Malakor, Grand Duke of Crimson Ash — Magma & Bone Hellfire Legion
    return [
      makeEnemy('dk1_m0', 'demon_tank', 'Crimson Ash Bone-Goliath', 240, FLOOR_Y - 32, 145 * 3, 24, 32, 'volcano', 36, 17, false, 1.12, 0.14, 'crimson_ash'),
      makeEnemy('dk1_m1', 'gargoyle_charger', 'Hellbound Obsidian Gargoyle', 330, FLOOR_Y - 26, 98 * 3, 20, 26, 'volcano', 28, 15, false, 1.08, 0.12, 'crimson_ash'),
      makeEnemy('dk1_m2', 'cultist_mage', 'Ashen Blood-Chant Warlock', 410, FLOOR_Y - 26, 86 * 3, 20, 26, 'volcano', 26, 14, false, 1.04, 0.12, 'crimson_ash'),
    ];
  }
  if (stage === 2) {
    // Stage 2: Vaelgor, Arch-Seraph of Abyssal Frost — Fallen Seraph & Cursed Wraith Legion
    return [
      makeEnemy('dk2_m0', 'demon_succubus', 'Abyssal Frost-Hex Seraph', 250, FLOOR_Y - 68, 128 * 3, 20, 28, 'volcano', 42, 18, false, 1.12, 0.22, 'frost_seraph'),
      makeEnemy('dk2_m1', 'cursed_armor', 'Frostbound Fallen Paladin', 350, FLOOR_Y - 28, 165 * 3, 22, 28, 'volcano', 45, 20, false, 1.18, 0.25, 'frost_seraph'),
      makeEnemy('dk2_m2', 'phantom_wisp', 'Glacial Soul-Banshee', 440, FLOOR_Y - 56, 96 * 3, 20, 26, 'volcano', 34, 16, false, 1.08, 0.2, 'frost_seraph'),
    ];
  }
  // Stage 3: Zarakiel, Sovereign of the Void Eclipse — Black-Gold Shadow Monarch Guard
  return [
    makeEnemy('dk3_m0', 'demon_lightning', 'Void-Eclipse Thunder Assassin', 240, FLOOR_Y - 28, 142 * 3, 20, 28, 'volcano', 50, 21, false, 1.16, 0.36, 'void_eclipse'),
    makeEnemy('dk3_m1', 'demon_tank', 'Eclipse Shadow-Monarch Sentinel', 340, FLOOR_Y - 32, 210 * 3, 24, 32, 'volcano', 60, 23, false, 1.26, 0.42, 'void_eclipse'),
    makeEnemy('dk3_m2', 'demon_succubus', 'Astral Void-Rift Enchantress', 435, FLOOR_Y - 68, 134 * 3, 20, 28, 'volcano', 48, 19, false, 1.14, 0.34, 'void_eclipse'),
  ];
}

export function createThreeDemonKingsInit(
  _foughtIsekaiEnemies: EnemyArchetype[],
  bossesDefeated = 0,
): { demonKings: DemonKingEntity[]; minions: EnemyState[]; allies: AlliedNpc[] } {
  const defeatedMult = Math.pow(1.8, Math.max(0, bossesDefeated));
  const demonKings: DemonKingEntity[] = [
    {
      id: 'dk_1',
      index: 1,
      name: 'Demon King Malakor',
      title: 'Grand Duke of Crimson Ash',
      x: 410,
      y: FLOOR_Y - 46,
      vx: 0,
      vy: 0,
      w: 32,
      h: 46,
      hp: Math.round(380 * defeatedMult),
      maxHp: Math.round(380 * defeatedMult),
      facing: -1,
      hitFlash: 0,
      purpleFlameTimer: 1.5,
      castIndex: 0,
      activeSkillBanner: null,
      activeSkillTimer: 0,
      primaryColor: '#dc2626',
      hornColor: '#f59e0b',
      auraColor: '#fb7185',
      defeated: false,
      damageMult: defeatedMult,
    },
    {
      id: 'dk_2',
      index: 2,
      name: 'Demon King Vaelgor',
      title: 'Arch-Seraph of Abyssal Frost',
      x: 430,
      y: FLOOR_Y - 48,
      vx: 0,
      vy: 0,
      w: 32,
      h: 48,
      hp: Math.round(430 * defeatedMult),
      maxHp: Math.round(430 * defeatedMult),
      facing: -1,
      hitFlash: 0,
      purpleFlameTimer: 1.65,
      castIndex: 1,
      activeSkillBanner: null,
      activeSkillTimer: 0,
      primaryColor: '#1d4ed8',
      hornColor: '#7dd3fc',
      auraColor: '#38bdf8',
      defeated: false,
      damageMult: defeatedMult,
    },
    {
      id: 'dk_3',
      index: 3,
      name: 'Demon King Zarakiel',
      title: 'Supreme Sovereign of the Void Eclipse',
      x: 445,
      y: FLOOR_Y - 52,
      vx: 0,
      vy: 0,
      w: 36,
      h: 52,
      hp: Math.round(490 * defeatedMult),
      maxHp: Math.round(490 * defeatedMult),
      facing: -1,
      hitFlash: 0,
      purpleFlameTimer: 1.8,
      castIndex: 2,
      activeSkillBanner: null,
      activeSkillTimer: 0,
      primaryColor: '#0f172a',
      hornColor: '#fbbf24',
      auraColor: '#c084fc',
      defeated: false,
      damageMult: defeatedMult,
    },
  ];

  // Start Stage 1 one-by-one with Malakor's Crimson Ash minions + Guild Allies!
  const minions = createDemonKingStageMinions(1);
  const allies = createDemonKingAllies();

  return { demonKings, minions, allies };
}

export const PURPLE_FLAME_SKILLS: {
  kind: PurpleFlameKind;
  name: string;
}[] = [
  { kind: 'violet_pillars', name: 'Abyssal Purple Flame Pillars' },
  { kind: 'purple_meteors', name: 'Hellfire Amethyst Meteor Rain' },
  { kind: 'abyssal_nova', name: 'Demonic Violet Flame Nova' },
  { kind: 'shadow_crescent', name: 'Cursed Purple Flame Crescent' },
];

export function createDemonKingPurpleFlameCast(
  king: DemonKingEntity,
  castSeq: number,
  playerX: number,
  floorY = FLOOR_Y,
): {
  skillName: string;
  zones: PurpleFlameZone[];
  projectiles: Projectile[];
} {
  const pick = PURPLE_FLAME_SKILLS[castSeq % PURPLE_FLAME_SKILLS.length];
  const dmgScale = king.damageMult ?? 1;
  const zones: PurpleFlameZone[] = [];
  const projectiles: Projectile[] = [];

  if (pick.kind === 'violet_pillars') {
    [-36, 0, 36].forEach((offset, idx) => {
      zones.push({
        id: `pfz_${king.id}_${castSeq}_${idx}`,
        x: Math.max(30, Math.min(580, playerX + offset - 12)),
        y: floorY - 76,
        w: 24,
        h: 76,
        life: 1.05,
        maxLife: 1.05,
        damage: Math.round(14 * dmgScale),
        kind: 'violet_pillars',
        hasHit: false,
      });
    });
  } else if (pick.kind === 'purple_meteors') {
    [-48, 0, 48].forEach((offset, idx) => {
      projectiles.push({
        id: `pfm_${king.id}_${castSeq}_${idx}`,
        x: Math.max(32, Math.min(590, playerX + offset)),
        y: 18 - idx * 14,
        vx: king.facing * 26,
        vy: 148,
        radius: 7,
        damage: Math.round(15 * dmgScale),
        fromPlayer: false,
        color: '#c084fc',
        life: 2.2,
        kind: 'purple_meteor',
      });
    });
  } else if (pick.kind === 'abyssal_nova') {
    [-1, 1].forEach((dir, idx) => {
      projectiles.push({
        id: `pfn_${king.id}_${castSeq}_${idx}`,
        x: king.x + king.w / 2,
        y: king.y + 18,
        vx: dir * 155,
        vy: 0,
        radius: 8,
        damage: Math.round(16 * dmgScale),
        fromPlayer: false,
        color: '#a855f7',
        life: 2.2,
        kind: 'purple_flame',
      });
    });
    zones.push({
      id: `pfz_nova_${king.id}_${castSeq}`,
      x: king.x - 18,
      y: floorY - 54,
      w: king.w + 36,
      h: 54,
      life: 0.9,
      maxLife: 0.9,
      damage: Math.round(14 * dmgScale),
      kind: 'abyssal_nova',
      hasHit: false,
    });
  } else {
    [-22, 0, 22].forEach((vyOff, idx) => {
      projectiles.push({
        id: `pfc_${king.id}_${castSeq}_${idx}`,
        x: king.x + (king.facing === 1 ? king.w : 0),
        y: king.y + 18,
        vx: king.facing * 185,
        vy: vyOff,
        radius: 6,
        damage: Math.round(14 * dmgScale),
        fromPlayer: false,
        color: '#e879f9',
        life: 2.2,
        kind: 'purple_flame',
      });
    });
  }

  return {
    skillName: pick.name,
    zones,
    projectiles,
  };
}

export const JJK_DOMAINS: Record<
  ArenaChallengerId,
  {
    name: string;
    shout: string;
    zoneKind: PurpleFlameKind;
    primaryColor: string;
    secondaryColor: string;
  }
> = {
  satoru_gojo: {
    name: 'Infinite Void',
    shout: 'DOMAIN EXPANSION: INFINITE VOID!',
    zoneKind: 'jjk_domain_void',
    primaryColor: '#38bdf8',
    secondaryColor: '#f8fafc',
  },
  ryomen_sukuna: {
    name: 'Malevolent Shrine',
    shout: 'DOMAIN EXPANSION: MALEVOLENT SHRINE!',
    zoneKind: 'jjk_domain_shrine',
    primaryColor: '#dc2626',
    secondaryColor: '#fbbf24',
  },
  toji_fushiguro: {
    name: '0 Cursed Energy: Zenin Abyss',
    shout: 'DOMAIN RUPTURE: ZENIN ARSENAL ABYSS!',
    zoneKind: 'jjk_domain_chains',
    primaryColor: '#a855f7',
    secondaryColor: '#e2e8f0',
  },
  yuta_okkotsu: {
    name: 'Authentic Mutual Love',
    shout: 'DOMAIN EXPANSION: AUTHENTIC MUTUAL LOVE!',
    zoneKind: 'jjk_domain_swords',
    primaryColor: '#e879f9',
    secondaryColor: '#7dd3fc',
  },
  megumi_fushiguro: {
    name: 'Chimera Shadow Garden',
    shout: 'DOMAIN EXPANSION: CHIMERA SHADOW GARDEN!',
    zoneKind: 'jjk_domain_shadow',
    primaryColor: '#6366f1',
    secondaryColor: '#38bdf8',
  },
  kento_nanami: {
    name: '7:3 Overtime Ratio Grid',
    shout: 'DOMAIN EXPANSION: 7:3 OVERTIME RATIO GRID!',
    zoneKind: 'jjk_domain_ratio',
    primaryColor: '#facc15',
    secondaryColor: '#10b981',
  },
  yuji_itadori: {
    name: 'Hometown Railway Soul Domain',
    shout: 'DOMAIN EXPANSION: HOMETOWN RAILWAY SOUL!',
    zoneKind: 'jjk_domain_station',
    primaryColor: '#ef4444',
    secondaryColor: '#fb7185',
  },
  suguru_geto: {
    name: 'Womb Profusion: Spiral Pillar',
    shout: 'DOMAIN EXPANSION: WOMB PROFUSION!',
    zoneKind: 'jjk_domain_womb',
    primaryColor: '#7e22ce',
    secondaryColor: '#d946ef',
  },
  maki_zenin: {
    name: 'Split Soul Arsenal Storm',
    shout: 'HEAVENLY REALM: SPLIT SOUL ARSENAL STORM!',
    zoneKind: 'jjk_domain_arsenal',
    primaryColor: '#10b981',
    secondaryColor: '#f43f5e',
  },
  kinji_hakari: {
    name: 'Idle Death Gamble: 777 Fever',
    shout: 'DOMAIN EXPANSION: IDLE DEATH GAMBLE!',
    zoneKind: 'jjk_domain_gamble',
    primaryColor: '#22c55e',
    secondaryColor: '#fde047',
  },
  hajime_kashimo: {
    name: 'Mythical Beast Amber: Thunderfield',
    shout: 'MYTHICAL BEAST AMBER: THUNDERFIELD!',
    zoneKind: 'jjk_domain_amber',
    primaryColor: '#06b6d4',
    secondaryColor: '#e0f2fe',
  },
  mahito: {
    name: 'Self-Embodiment of Perfection',
    shout: 'DOMAIN EXPANSION: SELF-EMBODIMENT OF PERFECTION!',
    zoneKind: 'jjk_domain_perfection',
    primaryColor: '#2dd4bf',
    secondaryColor: '#a855f7',
  },
  jogo: {
    name: 'Coffin of the Iron Mountain',
    shout: 'DOMAIN EXPANSION: COFFIN OF THE IRON MOUNTAIN!',
    zoneKind: 'jjk_domain_coffin',
    primaryColor: '#f97316',
    secondaryColor: '#dc2626',
  },
  choso: {
    name: 'Crimson Blood Moon Horizon',
    shout: 'CRIMSON HORIZON: CONVERGENCE BLOOD MOON!',
    zoneKind: 'jjk_domain_blood',
    primaryColor: '#be123c',
    secondaryColor: '#fb7185',
  },
  hiromi_higuruma: {
    name: 'Deadly Sentencing: Confiscation Court',
    shout: 'DOMAIN EXPANSION: DEADLY SENTENCING!',
    zoneKind: 'jjk_domain_court',
    primaryColor: '#fbbf24',
    secondaryColor: '#fef3c7',
  },
  nobara_kugisaki: {
    name: 'Straw Doll Resonance Shrine',
    shout: 'RESONANCE REALM: HAIRPIN SHRINE!',
    zoneKind: 'jjk_domain_straw',
    primaryColor: '#f43f5e',
    secondaryColor: '#38bdf8',
  },
};

export const ARENA_CHALLENGERS: ArenaChallengerDef[] = [
  {
    id: 'satoru_gojo',
    name: 'Satoru Gojo',
    title: 'The Strongest Modern Sorcerer',
    worldOrigin: 'Jujutsu Kaisen · Limitless',
    weaponName: 'Limitless & Six Eyes',
    maxHp: 115,
    attackDamage: 22,
    moveSpeed: 148,
    primaryColor: '#0f172a',
    secondaryColor: '#38bdf8',
    auraColor: '#38bdf8',
    hairColor: '#f8fafc',
    capeColor: '#1e293b',
    weaponColor: '#7dd3fc',
    description:
      'Blindfolded Special Grade master of Infinity. Pulls targets with Lapse Blue, blasts back with Reversal Red, and erases space with Hollow Purple.',
    skills: [
      {
        id: 'lapse_blue',
        name: 'Cursed Technique Lapse: Blue',
        damage: 24,
        kind: 'limitless_blue_red',
        color: '#38bdf8',
        shout: 'CURSED TECHNIQUE LAPSE: BLUE!',
      },
      {
        id: 'reversal_red',
        name: 'Cursed Technique Reversal: Red',
        damage: 28,
        kind: 'limitless_blue_red',
        color: '#ef4444',
        shout: 'CURSED TECHNIQUE REVERSAL: RED!',
      },
      {
        id: 'hollow_purple',
        name: 'Hollow Technique: Purple',
        damage: 34,
        kind: 'hollow_purple',
        color: '#a855f7',
        shout: 'HOLLOW TECHNIQUE: PURPLE!',
      },
    ],
  },
  {
    id: 'ryomen_sukuna',
    name: 'Ryomen Sukuna',
    title: 'King of Curses · Heian Era',
    worldOrigin: 'Jujutsu Kaisen · King of Curses',
    weaponName: 'Kamutoke Vajra & Shrine Cleave',
    maxHp: 115,
    attackDamage: 22,
    moveSpeed: 148,
    primaryColor: '#f8fafc',
    secondaryColor: '#dc2626',
    auraColor: '#ef4444',
    hairColor: '#fda4af',
    capeColor: '#18181b',
    weaponColor: '#fbbf24',
    description:
      'Tattooed Heian Curse Sovereign in ivory kimono. Fires invisible Dismantle slashes, spiderweb Cleave rushes, and Divine Flame Fuga pillars.',
    skills: [
      {
        id: 'dismantle_slash',
        name: 'Dismantle: Invisible Slash',
        damage: 24,
        kind: 'shrine_cleave',
        color: '#f43f5e',
        shout: 'DISMANTLE!',
      },
      {
        id: 'cleave_web',
        name: 'Cleave: Spiderweb Barrage',
        damage: 28,
        kind: 'shrine_cleave',
        color: '#e11d48',
        shout: 'MALEVOLENT SHRINE — CLEAVE!',
      },
      {
        id: 'divine_fuga',
        name: 'Divine Flame: Fuga',
        damage: 34,
        kind: 'divine_flame_fuga',
        color: '#f97316',
        shout: 'OPEN — DIVINE FLAME: FUGA!',
      },
    ],
  },
  {
    id: 'toji_fushiguro',
    name: 'Toji Fushiguro',
    title: 'The Sorcerer Killer',
    worldOrigin: 'Jujutsu Kaisen · Sorcerer Killer',
    weaponName: 'Inverted Spear of Heaven & Split Soul Katana',
    maxHp: 115,
    attackDamage: 22,
    moveSpeed: 148,
    primaryColor: '#18181b',
    secondaryColor: '#e2e8f0',
    auraColor: '#c084fc',
    hairColor: '#09090b',
    capeColor: '#581c87',
    weaponColor: '#cbd5e1',
    description:
      'Zero-cursed-energy Heavenly Restriction assassin with shoulder Inventory Curse. Chains flash-step blitzes and nullifies defenses with Inverted Spear.',
    skills: [
      {
        id: 'heavenly_blitz',
        name: 'Heavenly Restriction Blitz',
        damage: 25,
        kind: 'heavenly_blitz',
        color: '#cbd5e1',
        shout: 'HEAVENLY RESTRICTION BLITZ!',
      },
      {
        id: 'inverted_spear',
        name: 'Inverted Spear: Nullify',
        damage: 28,
        kind: 'inverted_spear',
        color: '#a855f7',
        shout: 'INVERTED SPEAR OF HEAVEN!',
      },
      {
        id: 'playful_cloud',
        name: 'Playful Cloud: Kinetic Crush',
        damage: 32,
        kind: 'heavenly_blitz',
        color: '#dc2626',
        shout: 'PLAYFUL CLOUD — CRUSH!',
      },
    ],
  },
  {
    id: 'yuta_okkotsu',
    name: 'Yuta Okkotsu',
    title: 'Special Grade Cursed Prodigy',
    worldOrigin: 'Jujutsu Kaisen · Special Grade',
    weaponName: 'Cursed Energy Katana & Rika',
    maxHp: 115,
    attackDamage: 22,
    moveSpeed: 148,
    primaryColor: '#f8fafc',
    secondaryColor: '#0f172a',
    auraColor: '#c084fc',
    hairColor: '#1e1b4b',
    capeColor: '#7e22ce',
    weaponColor: '#93c5fd',
    description:
      'White-uniform Special Grade Swordsman accompanied by Rika Orimoto. Commands Cursed Speech freezes and Pure Love cursed beams.',
    skills: [
      {
        id: 'cursed_speech',
        name: "Cursed Speech: Don't Move!",
        damage: 23,
        kind: 'cursed_speech',
        color: '#fde047',
        shout: "CURSED SPEECH — DON'T MOVE!",
      },
      {
        id: 'rika_manifest',
        name: 'Rika Manifest: Claw Barrage',
        damage: 28,
        kind: 'rika_manifest',
        color: '#c084fc',
        shout: 'COME FORTH, RIKA!',
      },
      {
        id: 'pure_love_beam',
        name: 'Pure Love: Cursed Beam',
        damage: 33,
        kind: 'hollow_purple',
        color: '#e879f9',
        shout: 'THIS IS PURE LOVE!',
      },
    ],
  },
  {
    id: 'megumi_fushiguro',
    name: 'Megumi Fushiguro',
    title: 'Ten Shadows Tactician',
    worldOrigin: 'Jujutsu Kaisen · Ten Shadows',
    weaponName: 'Jet-Black Shadow Sword',
    maxHp: 115,
    attackDamage: 22,
    moveSpeed: 148,
    primaryColor: '#1e293b',
    secondaryColor: '#0284c7',
    auraColor: '#38bdf8',
    hairColor: '#09090b',
    capeColor: '#0f172a',
    weaponColor: '#475569',
    description:
      'Zenin Ten Shadows heir summoning Divine Dog: Totality claws, Nue lightning dives, and Chimera Shadow Garden eruptions.',
    skills: [
      {
        id: 'divine_dog_totality',
        name: 'Ten Shadows: Divine Dog Totality',
        damage: 25,
        kind: 'ten_shadows_summon',
        color: '#e2e8f0',
        shout: 'TEN SHADOWS — DIVINE DOG: TOTALITY!',
      },
      {
        id: 'nue_lightning',
        name: 'Ten Shadows: Nue Lightning Dive',
        damage: 27,
        kind: 'ten_shadows_summon',
        color: '#facc15',
        shout: 'NUE — THUNDERSTRIKE!',
      },
      {
        id: 'chimera_garden',
        name: 'Chimera Shadow Garden',
        damage: 31,
        kind: 'divine_flame_fuga',
        color: '#312e81',
        shout: 'DOMAIN EXPANSION: CHIMERA SHADOW GARDEN!',
      },
    ],
  },
  {
    id: 'kento_nanami',
    name: 'Kento Nanami',
    title: 'Grade 1 Overtime Sorcerer',
    worldOrigin: 'Jujutsu Kaisen · Grade 1 Tactician',
    weaponName: 'Bandage-Wrapped Blunt Cleaver',
    maxHp: 115,
    attackDamage: 22,
    moveSpeed: 148,
    primaryColor: '#d6d3d1',
    secondaryColor: '#ca8a04',
    auraColor: '#facc15',
    hairColor: '#fde047',
    capeColor: '#78716c',
    weaponColor: '#e7e5e4',
    description:
      'Stoic suited Grade 1 sorcerer striking forced 7:3 critical weakpoints with his wrapped blunt cleaver and Collapse shockwaves.',
    skills: [
      {
        id: 'ratio_7_3',
        name: 'Ratio Technique: 7:3 Weakpoint',
        damage: 26,
        kind: 'ratio_collapse',
        color: '#facc15',
        shout: 'RATIO TECHNIQUE — 7:3 CRITICAL!',
      },
      {
        id: 'collapse_ruin',
        name: 'Collapse: Structural Ruin',
        damage: 29,
        kind: 'ratio_collapse',
        color: '#fb923c',
        shout: 'EXTENDED TECHNIQUE: COLLAPSE!',
      },
      {
        id: 'overtime_surge',
        name: 'Overtime: Cursed Surge',
        damage: 32,
        kind: 'heavenly_blitz',
        color: '#fde047',
        shout: "I'M GOING INTO OVERTIME!",
      },
    ],
  },
  {
    id: 'yuji_itadori',
    name: 'Yuji Itadori',
    title: 'King of Black Flash',
    worldOrigin: 'Jujutsu Kaisen · Black Flash Vessel',
    weaponName: 'Divergent Black Flash Gauntlets',
    maxHp: 115,
    attackDamage: 22,
    moveSpeed: 148,
    primaryColor: '#0f172a',
    secondaryColor: '#ef4444',
    auraColor: '#f43f5e',
    hairColor: '#fda4af',
    capeColor: '#dc2626',
    weaponColor: '#f43f5e',
    description:
      'Pink-haired Jujutsu High brawler in signature red-hooded uniform. Delivers double-impact Divergent Fists, Soul Dismantles, and crimson-black Black Flash shockwaves.',
    skills: [
      {
        id: 'divergent_fist',
        name: 'Divergent Fist: Double Impact',
        damage: 25,
        kind: 'black_flash_rush',
        color: '#38bdf8',
        shout: 'DIVERGENT FIST!',
      },
      {
        id: 'soul_dismantle',
        name: 'Awakened Shrine: Soul Dismantle',
        damage: 29,
        kind: 'black_flash_rush',
        color: '#fb7185',
        shout: 'SOUL DISMANTLE!',
      },
      {
        id: 'black_flash_chain',
        name: 'Black Flash: Sparks of Black',
        damage: 35,
        kind: 'black_flash_rush',
        color: '#ef4444',
        shout: 'KOKUSEN — BLACK FLASH!!',
      },
    ],
  },
  {
    id: 'suguru_geto',
    name: 'Suguru Geto',
    title: 'Special Grade Curse Manipulator',
    worldOrigin: 'Jujutsu Kaisen · Curse Manipulator',
    weaponName: 'Three-Section Playful Cloud & Curse Swarm',
    maxHp: 115,
    attackDamage: 22,
    moveSpeed: 148,
    primaryColor: '#4c1d95',
    secondaryColor: '#d946ef',
    auraColor: '#a855f7',
    hairColor: '#09090b',
    capeColor: '#eab308',
    weaponColor: '#dc2626',
    description:
      'Monk-robed Special Grade curse user wielding Playful Cloud. Commands swarms of abyssal curses and condenses thousands into Maximum: Uzumaki.',
    skills: [
      {
        id: 'curse_swarm_release',
        name: 'Cursed Spirit Swarm: Centipede Tide',
        damage: 25,
        kind: 'cursed_uzumaki',
        color: '#a855f7',
        shout: 'CURSED SPIRIT MANIPULATION!',
      },
      {
        id: 'playful_cloud_whirl',
        name: 'Playful Cloud: Kesa Gale',
        damage: 28,
        kind: 'cursed_uzumaki',
        color: '#f43f5e',
        shout: 'PLAYFUL CLOUD — THREE-SECTION REND!',
      },
      {
        id: 'maximum_uzumaki',
        name: 'Maximum: Uzumaki Vortex',
        damage: 36,
        kind: 'cursed_uzumaki',
        color: '#e879f9',
        shout: 'GOKUBAN: UZUMAKI!!',
      },
    ],
  },
  {
    id: 'maki_zenin',
    name: 'Maki Zenin',
    title: 'Awakened Demon of Zero Cursed Energy',
    worldOrigin: 'Jujutsu Kaisen · Heavenly Restriction',
    weaponName: 'Split Soul Katana & Dragon-Bone',
    maxHp: 115,
    attackDamage: 22,
    moveSpeed: 148,
    primaryColor: '#18181b',
    secondaryColor: '#10b981',
    auraColor: '#34d399',
    hairColor: '#059669',
    capeColor: '#be123c',
    weaponColor: '#6ee7b7',
    description:
      'Battle-scarred Heavenly Restriction fighter with sea-green hair. Slices souls cleanly with Split Soul Katana and blasts kinetic pressure via Dragon-Bone.',
    skills: [
      {
        id: 'air_step_rend',
        name: 'Air-Step Sonic Blitz',
        damage: 26,
        kind: 'split_soul_katana',
        color: '#34d399',
        shout: 'HEAVENLY BLITZ — SONIC STEP!',
      },
      {
        id: 'dragon_bone_release',
        name: 'Dragon-Bone: Kinetic Burst',
        damage: 30,
        kind: 'split_soul_katana',
        color: '#f97316',
        shout: 'DRAGON-BONE — OVERDRIVE!',
      },
      {
        id: 'split_soul_sever',
        name: 'Split Soul Katana: Soul Sever',
        damage: 35,
        kind: 'split_soul_katana',
        color: '#f43f5e',
        shout: 'SPLIT SOUL KATANA — SEVER!',
      },
    ],
  },
  {
    id: 'kinji_hakari',
    name: 'Kinji Hakari',
    title: 'Immortal Jackpot Fever Gambler',
    worldOrigin: 'Jujutsu Kaisen · Restless Gambler',
    weaponName: '777 Pachinko Shutter Doors & Rough Aura',
    maxHp: 115,
    attackDamage: 22,
    moveSpeed: 148,
    primaryColor: '#f8fafc',
    secondaryColor: '#22c55e',
    auraColor: '#4ade80',
    hairColor: '#fef08a',
    capeColor: '#9333ea',
    weaponColor: '#fde047',
    description:
      'Flamboyant Jujutsu High gambler cloaked in jagged neon-emerald energy. Slams steel Pachinko shutter doors, shoots reserve balls, and hits Immortal 777 Jackpot.',
    skills: [
      {
        id: 'pachinko_shutter',
        name: 'Train Shutter Doors Crush',
        damage: 25,
        kind: 'jackpot_pachinko',
        color: '#22c55e',
        shout: 'SHUTTER DOOR CRUSH!',
      },
      {
        id: 'reserve_balls_barrage',
        name: 'Pachinko Steel Reserve Volley',
        damage: 28,
        kind: 'jackpot_pachinko',
        color: '#38bdf8',
        shout: 'PROBABILITY CHANGE — FEVER BALLS!',
      },
      {
        id: 'jackpot_777_fever',
        name: '777 Jackpot: Infinite Energy Fever',
        damage: 34,
        kind: 'jackpot_pachinko',
        color: '#fde047',
        shout: 'JACKPOT 777 — 4 MINUTES 11 SECONDS!',
      },
    ],
  },
  {
    id: 'hajime_kashimo',
    name: 'Hajime Kashimo',
    title: 'The God of Lightning',
    worldOrigin: 'Jujutsu Kaisen · God of Lightning',
    weaponName: 'Electric Nyoi Staff',
    maxHp: 115,
    attackDamage: 22,
    moveSpeed: 148,
    primaryColor: '#f8fafc',
    secondaryColor: '#06b6d4',
    auraColor: '#22d3ee',
    hairColor: '#67e8f9',
    capeColor: '#0891b2',
    weaponColor: '#bae6fd',
    description:
      '400-year-old electric combatant in white robes with cyan lightning-scar eyes. Fires Sure-Hit electric bolts and vaporizes foes in Mythical Beast Amber.',
    skills: [
      {
        id: 'nyoi_discharge',
        name: 'Nyoi Staff: Return Lightning',
        damage: 26,
        kind: 'amber_lightning',
        color: '#22d3ee',
        shout: 'SURE-HIT RETURN LIGHTNING!',
      },
      {
        id: 'sound_wave_blast',
        name: 'EM Plasma Vaporization Wave',
        damage: 30,
        kind: 'amber_lightning',
        color: '#818cf8',
        shout: 'ELECTROMAGNETIC ANNIHILATION!',
      },
      {
        id: 'mythical_beast_amber',
        name: 'Mythical Beast Amber: Thunderstrike',
        damage: 36,
        kind: 'amber_lightning',
        color: '#e0f2fe',
        shout: 'MYTHICAL BEAST AMBER — TURN UP THE VOLUME!',
      },
    ],
  },
  {
    id: 'mahito',
    name: 'Mahito',
    title: 'Special Grade Patchwork Soul Curse',
    worldOrigin: 'Jujutsu Kaisen · Idle Transfiguration',
    weaponName: 'Transfigured Soul Blades & Polymorphic Isomers',
    maxHp: 115,
    attackDamage: 22,
    moveSpeed: 148,
    primaryColor: '#1e293b',
    secondaryColor: '#2dd4bf',
    auraColor: '#5eead4',
    hairColor: '#94a3b8',
    capeColor: '#581c87',
    weaponColor: '#a855f7',
    description:
      'Stitched patchwork curse born of human malice. Shapes limbs into giant spiked blades, fires Body Repel soul waves, and triggers Idle Transfiguration.',
    skills: [
      {
        id: 'soul_multiplicity',
        name: 'Soul Multiplicity: Body Repel',
        damage: 26,
        kind: 'idle_transfiguration',
        color: '#2dd4bf',
        shout: 'SOUL MULTIPLICITY — BODY REPEL!',
      },
      {
        id: 'blade_arm_shatter',
        name: 'Distorted Killing: Soul Edge',
        damage: 30,
        kind: 'idle_transfiguration',
        color: '#a855f7',
        shout: 'INSTANT SPIRIT BODY — SOUL EDGE!',
      },
      {
        id: 'idle_transfig_touch',
        name: 'Idle Transfiguration: Soul Crush',
        damage: 35,
        kind: 'idle_transfiguration',
        color: '#f43f5e',
        shout: 'IDLE TRANSFIGURATION!',
      },
    ],
  },
  {
    id: 'jogo',
    name: 'Jogo',
    title: 'Volcanic Disaster Flame Curse',
    worldOrigin: 'Jujutsu Kaisen · Disaster Flame',
    weaponName: 'Volcanic Crater Fists & Ember Insects',
    maxHp: 115,
    attackDamage: 22,
    moveSpeed: 148,
    primaryColor: '#1c1917',
    secondaryColor: '#f97316',
    auraColor: '#fb923c',
    hairColor: '#dc2626',
    capeColor: '#451a03',
    weaponColor: '#fde047',
    description:
      'Cyclops volcano-crowned Special Grade curse erupting magma geysers, sonic Ember Insects, and sky-crushing Maximum: Meteor.',
    skills: [
      {
        id: 'ember_insects',
        name: 'Ember Insects: Sonic Blast',
        damage: 25,
        kind: 'disaster_flames',
        color: '#fbbf24',
        shout: 'EMBER INSECTS — DETONATE!',
      },
      {
        id: 'disaster_magma_pillars',
        name: 'Disaster Flames: Volcano Geysers',
        damage: 30,
        kind: 'disaster_flames',
        color: '#f97316',
        shout: 'DISASTER FLAMES — ERUPTION!',
      },
      {
        id: 'maximum_meteor',
        name: 'Maximum: Meteor Cataclysm',
        damage: 37,
        kind: 'disaster_flames',
        color: '#dc2626',
        shout: 'GOKUBAN: IN — MAXIMUM METEOR!!',
      },
    ],
  },
  {
    id: 'choso',
    name: 'Choso',
    title: 'Eldest Death Painting Womb',
    worldOrigin: 'Jujutsu Kaisen · Death Painting',
    weaponName: 'Crimson Blood Orbs & Flowing Red Scale',
    maxHp: 115,
    attackDamage: 22,
    moveSpeed: 148,
    primaryColor: '#312e81',
    secondaryColor: '#e11d48',
    auraColor: '#f43f5e',
    hairColor: '#09090b',
    capeColor: '#881337',
    weaponColor: '#fb7185',
    description:
      'Stoic Death Painting brother firing supersonic Piercing Blood lasers, bursting Supernova blood mines, and Wing King crimson blades.',
    skills: [
      {
        id: 'crimson_binding',
        name: 'Crimson Blood Slicer',
        damage: 25,
        kind: 'blood_manipulation',
        color: '#e11d48',
        shout: 'EXORCISM — CRIMSON SLICER!',
      },
      {
        id: 'supernova_burst',
        name: 'Supernova: Blood Starburst',
        damage: 29,
        kind: 'blood_manipulation',
        color: '#fb7185',
        shout: 'SUPERNOVA — BURST!',
      },
      {
        id: 'piercing_blood_laser',
        name: 'Convergence: Piercing Blood',
        damage: 35,
        kind: 'blood_manipulation',
        color: '#be123c',
        shout: 'BYAKUREN — PIERCING BLOOD!!',
      },
    ],
  },
  {
    id: 'hiromi_higuruma',
    name: 'Hiromi Higuruma',
    title: 'Genius Sorcerer Attorney',
    worldOrigin: 'Jujutsu Kaisen · Deadly Sentencing',
    weaponName: "Judgeman Gavel & Executioner's Sword",
    maxHp: 115,
    attackDamage: 22,
    moveSpeed: 148,
    primaryColor: '#1e293b',
    secondaryColor: '#fbbf24',
    auraColor: '#fde047',
    hairColor: '#0f172a',
    capeColor: '#475569',
    weaponColor: '#fef08a',
    description:
      'Sharp-suited prodigy lawyer assisted by Judgeman. Shifts his golden gavel into giant crushing hammers and manifests the gleaming Executioner Sword.',
    skills: [
      {
        id: 'gavel_crusher',
        name: 'Giant Gavel Verdict Slam',
        damage: 25,
        kind: 'deadly_sentencing',
        color: '#fbbf24',
        shout: 'OBJECTION — GAVEL VERDICT!',
      },
      {
        id: 'confiscation_seal',
        name: 'Judgeman Scale Confiscation',
        damage: 29,
        kind: 'deadly_sentencing',
        color: '#cbd5e1',
        shout: 'GUILTY — CONFISCATION!',
      },
      {
        id: 'executioners_sword',
        name: "Death Penalty: Executioner's Sword",
        damage: 36,
        kind: 'deadly_sentencing',
        color: '#fef08a',
        shout: "DEATH PENALTY — EXECUTIONER'S SWORD!!",
      },
    ],
  },
  {
    id: 'nobara_kugisaki',
    name: 'Nobara Kugisaki',
    title: 'Fierce Straw Doll Sorceress',
    worldOrigin: 'Jujutsu Kaisen · Straw Doll',
    weaponName: 'Cursed Steel Hammer, Nails & Straw Doll',
    maxHp: 115,
    attackDamage: 22,
    moveSpeed: 148,
    primaryColor: '#1e1b4b',
    secondaryColor: '#f43f5e',
    auraColor: '#fb7185',
    hairColor: '#ea580c',
    capeColor: '#be185d',
    weaponColor: '#38bdf8',
    description:
      'Auburn-haired Tokyo First-Year wielding hammer and nails. Launches cursed nail volleys, detonates Hairpin shockwaves, and pierces souls via Resonance.',
    skills: [
      {
        id: 'nail_volley',
        name: 'Hammer Volley: Cursed Nails',
        damage: 24,
        kind: 'straw_doll_resonance',
        color: '#38bdf8',
        shout: 'CURSED NAIL VOLLEY!',
      },
      {
        id: 'hairpin_detonation',
        name: 'Straw Doll: Hairpin Explosion',
        damage: 29,
        kind: 'straw_doll_resonance',
        color: '#f43f5e',
        shout: 'HAIRPIN — DETONATE!',
      },
      {
        id: 'resonance_soul_spike',
        name: 'Straw Doll Technique: Resonance',
        damage: 35,
        kind: 'straw_doll_resonance',
        color: '#e879f9',
        shout: 'STRAW DOLL — RESONANCE!!',
      },
    ],
  },
];

export function createArenaDuelInit(
  challengerId: ArenaChallengerId,
  player?: PlayerState,
): ActiveArenaDuel {
  const def = ARENA_CHALLENGERS.find((c) => c.id === challengerId) ?? ARENA_CHALLENGERS[0];
  const baseHp = player ? Math.max(115, Math.round(player.maxHp)) : def.maxHp;
  const matchedHp = baseHp * 3; // 3x Colosseum match HP for opponent & player!
  const matchedAtk = player
    ? Math.max(14, Math.round(calculateAttackDamage(player, 1, false)))
    : def.attackDamage;
  const hotSpringMult = player && (player.hotSpringTimer ?? 0) > 0 ? 1.1 : 1;
  const matchedSpeed = player
    ? Math.round((MOVE_SPEED + player.stats.speed * 6) * hotSpringMult)
    : def.moveSpeed;

  const syncedDef: ArenaChallengerDef = {
    ...def,
    maxHp: matchedHp,
    attackDamage: matchedAtk,
    moveSpeed: matchedSpeed,
    skills: [
      { ...def.skills[0], damage: Math.round(matchedAtk * 1.15) },
      { ...def.skills[1], damage: Math.round(matchedAtk * 1.3) },
      { ...def.skills[2], damage: Math.round(matchedAtk * 1.55) },
    ],
  };

  return {
    challengerId: def.id,
    def: syncedDef,
    x: 820,
    y: FLOOR_Y - 34,
    vx: 0,
    vy: 0,
    w: 24,
    h: 34,
    hp: matchedHp,
    maxHp: matchedHp,
    matchedAtk,
    matchedSpeed,
    facing: -1,
    onGround: true,
    state: 'approach',
    stateTimer: 0.35,
    attackCooldown: 0.45,
    skillCooldown: 1.4,
    skillIndex: 0,
    comboStep: 0,
    guardTimer: 0,
    dodgeCooldown: 0,
    invulnTimer: 0,
    hitFlash: 0,
    walkCycle: 0,
    aiActionTag: null,
    activeSkillBanner: null,
    activeSkillTimer: 0,
    stunTimer: 0,
    windVulnerable: false,
    domainActive: false,
    domainTimer: 0,
    domainCooldown: 4.2,
    domainName: JJK_DOMAINS[def.id].name,
    domainCastCount: 0,
  };
}

export function createArenaSkillAttack(
  duel: ActiveArenaDuel,
  skillIdx: number,
  playerX: number,
  floorY = FLOOR_Y,
): {
  skill: ArenaSkillDef;
  projectiles: Projectile[];
  zones: PurpleFlameZone[];
  dashVelocityX: number;
  jumpVelocityY: number;
} {
  const skill = duel.def.skills[Math.abs(skillIdx) % duel.def.skills.length];
  const projectiles: Projectile[] = [];
  const zones: PurpleFlameZone[] = [];
  let dashVelocityX = 0;
  let jumpVelocityY = 0;
  const skillDmg = Math.max(10, Math.round(skill.damage));
  const clampZoneX = (cx: number, w: number) => Math.max(24, Math.min(1216 - w, Math.round(cx - w / 2)));

  if (skill.kind === 'hollow_purple') {
    zones.push({
      id: `jjk_hpz_${duel.challengerId}_${Date.now()}`,
      x: clampZoneX(playerX, 136),
      y: floorY - 118,
      w: 136,
      h: 118,
      life: 1.4,
      maxLife: 1.4,
      damage: Math.round(skillDmg * 0.9),
      kind: 'jjk_hollow_purple',
      hasHit: false,
    });
    projectiles.push({
      id: `jjk_hp_${duel.challengerId}_${Date.now()}`,
      x: duel.x + (duel.facing === 1 ? duel.w + 6 : -6),
      y: duel.y + 14,
      vx: duel.facing * 245,
      vy: 0,
      radius: 15,
      damage: skillDmg,
      fromPlayer: false,
      color: skill.color,
      life: 2.1,
      kind: 'purple_flame',
    });
  } else if (skill.kind === 'limitless_blue_red') {
    zones.push({
      id: `jjk_rbz_${duel.challengerId}_${Date.now()}`,
      x: clampZoneX(playerX, 120),
      y: floorY - 104,
      w: 120,
      h: 104,
      life: 1.3,
      maxLife: 1.3,
      damage: Math.round(skillDmg * 0.85),
      kind: 'jjk_red_blue',
      hasHit: false,
    });
    [-20, 0, 20].forEach((vyOff, i) => {
      projectiles.push({
        id: `jjk_lim_${duel.challengerId}_${i}_${Date.now()}`,
        x: duel.x + (duel.facing === 1 ? duel.w : 0),
        y: duel.y + 14,
        vx: duel.facing * (225 + i * 18),
        vy: vyOff,
        radius: 11,
        damage: Math.round(skillDmg * 0.8),
        fromPlayer: false,
        color: skill.color,
        life: 1.9,
        kind: skill.id === 'reversal_red' ? 'fireball' : 'gravity_orb',
      });
    });
  } else if (skill.kind === 'shrine_cleave') {
    zones.push({
      id: `jjk_clz_${duel.challengerId}_${Date.now()}`,
      x: clampZoneX(playerX, 132),
      y: floorY - 110,
      w: 132,
      h: 110,
      life: 1.25,
      maxLife: 1.25,
      damage: Math.round(skillDmg * 0.85),
      kind: 'jjk_cleave_storm',
      hasHit: false,
    });
    [-24, 0, 24].forEach((yOff, i) => {
      projectiles.push({
        id: `jjk_sl_${duel.challengerId}_${i}_${Date.now()}`,
        x: duel.x + (duel.facing === 1 ? duel.w + 4 : -4),
        y: Math.min(floorY - 12, duel.y + 16 + yOff * 0.45),
        vx: duel.facing * (260 + i * 20),
        vy: yOff * 0.35,
        radius: 10,
        damage: Math.round(skillDmg * 0.78),
        fromPlayer: false,
        color: skill.color,
        life: 1.7,
        kind: 'slash_wave',
      });
    });
    dashVelocityX = duel.facing * 245;
  } else if (skill.kind === 'divine_flame_fuga') {
    [-70, 70].forEach((off, idx) => {
      zones.push({
        id: `jjk_fuga_${duel.challengerId}_${idx}_${Date.now()}`,
        x: clampZoneX(playerX + off, 96),
        y: floorY - 124,
        w: 96,
        h: 124,
        life: 1.25,
        maxLife: 1.25,
        damage: Math.round(skillDmg * 0.88),
        kind: duel.challengerId === 'megumi_fushiguro' ? 'jjk_domain_shadow' : 'jjk_jogo_volcano',
        hasHit: false,
      });
    });
    projectiles.push({
      id: `jjk_fgp_${duel.challengerId}_${Date.now()}`,
      x: duel.x + duel.w / 2,
      y: duel.y + 14,
      vx: duel.facing * 225,
      vy: 0,
      radius: 12,
      damage: skillDmg,
      fromPlayer: false,
      color: skill.color,
      life: 1.75,
      kind: 'fireball',
    });
  } else if (skill.kind === 'heavenly_blitz' || skill.kind === 'inverted_spear') {
    dashVelocityX = duel.facing * 355;
    jumpVelocityY = -95;
    zones.push({
      id: `jjk_hbz_${duel.challengerId}_${Date.now()}`,
      x: clampZoneX(playerX, 112),
      y: floorY - 96,
      w: 112,
      h: 96,
      life: 1.1,
      maxLife: 1.1,
      damage: Math.round(skillDmg * 0.82),
      kind: duel.challengerId === 'kento_nanami' ? 'jjk_domain_ratio' : 'jjk_domain_chains',
      hasHit: false,
    });
    projectiles.push({
      id: `jjk_hb_${duel.challengerId}_${Date.now()}`,
      x: duel.x + duel.w / 2 + duel.facing * 12,
      y: duel.y + 15,
      vx: duel.facing * 255,
      vy: 0,
      radius: 11,
      damage: skillDmg,
      fromPlayer: false,
      color: skill.color,
      life: 1.05,
      kind: 'jjk_split_slash',
    });
  } else if (skill.kind === 'ten_shadows_summon') {
    zones.push({
      id: `jjk_tsz_${duel.challengerId}_${Date.now()}`,
      x: clampZoneX(playerX, 126),
      y: floorY - 106,
      w: 126,
      h: 106,
      life: 1.35,
      maxLife: 1.35,
      damage: Math.round(skillDmg * 0.85),
      kind: 'jjk_domain_shadow',
      hasHit: false,
    });
    [-1, 1].forEach((dir, idx) => {
      projectiles.push({
        id: `jjk_ts_${duel.challengerId}_${idx}_${Date.now()}`,
        x: duel.x + duel.w / 2,
        y: duel.y + 12,
        vx: dir === 1 ? duel.facing * 235 : duel.facing * 185,
        vy: idx === 1 ? -18 : 10,
        radius: 10,
        damage: Math.round(skillDmg * 0.84),
        fromPlayer: false,
        color: skill.color,
        life: 1.85,
        kind: 'rune',
      });
    });
    dashVelocityX = duel.facing * 215;
  } else if (skill.kind === 'rika_manifest' || skill.kind === 'cursed_speech' || skill.kind === 'ratio_collapse') {
    dashVelocityX = duel.facing * 265;
    zones.push({
      id: `jjk_rcz_${duel.challengerId}_${Date.now()}`,
      x: clampZoneX(playerX, 128),
      y: floorY - 110,
      w: 128,
      h: 110,
      life: 1.3,
      maxLife: 1.3,
      damage: Math.round(skillDmg * 0.88),
      kind: skill.kind === 'ratio_collapse' ? 'jjk_domain_ratio' : 'jjk_rika_beam',
      hasHit: false,
    });
    projectiles.push({
      id: `jjk_rc_${duel.challengerId}_${Date.now()}`,
      x: duel.x + duel.w / 2 + duel.facing * 10,
      y: duel.y + 14,
      vx: duel.facing * 240,
      vy: 0,
      radius: 12,
      damage: skillDmg,
      fromPlayer: false,
      color: skill.color,
      life: 1.45,
      kind: skill.kind === 'cursed_speech' ? 'gravity_orb' : 'slash_wave',
    });
  } else {
    // 10 New JJK Character Signature Large Colorful Fluid Attacks!
    const kindMap: Record<
      string,
      { zone: PurpleFlameKind; proj: Projectile['kind']; w: number; h: number; r: number; dash: number }
    > = {
      black_flash_rush: { zone: 'jjk_black_flash', proj: 'jjk_black_flash_orb', w: 128, h: 114, r: 13, dash: 310 },
      cursed_uzumaki: { zone: 'jjk_uzumaki_vortex', proj: 'jjk_uzumaki', w: 148, h: 122, r: 15, dash: 180 },
      split_soul_katana: { zone: 'jjk_split_soul_slash', proj: 'jjk_split_slash', w: 132, h: 106, r: 12, dash: 345 },
      jackpot_pachinko: { zone: 'jjk_jackpot_fever', proj: 'jjk_pachinko_ball', w: 136, h: 112, r: 12, dash: 255 },
      amber_lightning: { zone: 'jjk_kashimo_thunder', proj: 'jjk_lightning_bolt', w: 134, h: 128, r: 12, dash: 295 },
      idle_transfiguration: { zone: 'jjk_idle_transfig', proj: 'jjk_transfig_orb', w: 136, h: 116, r: 13, dash: 260 },
      disaster_flames: { zone: 'jjk_jogo_volcano', proj: 'jjk_magma_meteor', w: 152, h: 126, r: 15, dash: 165 },
      blood_manipulation: { zone: 'jjk_piercing_blood', proj: 'jjk_piercing_blood', w: 148, h: 98, r: 12, dash: 210 },
      deadly_sentencing: { zone: 'jjk_deadly_gavel', proj: 'jjk_exec_blade', w: 136, h: 118, r: 13, dash: 240 },
      straw_doll_resonance: { zone: 'jjk_straw_resonance', proj: 'jjk_cursed_nail', w: 126, h: 110, r: 11, dash: 195 },
    };
    const cfg = kindMap[skill.kind] ?? {
      zone: 'jjk_black_flash' as PurpleFlameKind,
      proj: 'jjk_black_flash_orb' as Projectile['kind'],
      w: 128,
      h: 110,
      r: 12,
      dash: 250,
    };
    dashVelocityX = duel.facing * cfg.dash;
    zones.push({
      id: `jjk_nz_${duel.challengerId}_${Date.now()}`,
      x: clampZoneX(playerX, cfg.w),
      y: floorY - cfg.h,
      w: cfg.w,
      h: cfg.h,
      life: 1.45,
      maxLife: 1.45,
      damage: Math.round(skillDmg * 0.9),
      kind: cfg.zone,
      hasHit: false,
    });
    [-16, 0, 16].forEach((vyOff, idx) => {
      projectiles.push({
        id: `jjk_np_${duel.challengerId}_${idx}_${Date.now()}`,
        x: duel.x + duel.w / 2 + duel.facing * 12,
        y: duel.y + 13,
        vx: duel.facing * (240 + idx * 18),
        vy: vyOff * 0.6,
        radius: cfg.r,
        damage: Math.round(skillDmg * (idx === 1 ? 1 : 0.76)),
        fromPlayer: false,
        color: skill.color,
        life: 1.85,
        kind: cfg.proj,
      });
    });
  }

  return { skill, projectiles, zones, dashVelocityX, jumpVelocityY };
}

export interface ArenaAiStepResult {
  meleeHitDamage: number;
  meleeKnockbackX: number;
  spawnedProjectiles: Projectile[];
  spawnedZones: PurpleFlameZone[];
  usedSkillName: string | null;
  hypeTrigger: boolean;
}

/**
 * Highly OP, reactive Jujutsu Kaisen Colosseum AI:
 * - 3x Match HP & equal ATK/MoveSpeed + Full Domain Expansion for ALL 16 JJK fighters!
 * - Flash-step dodges incoming player attacks & projectiles with brief i-frames + counter-angle lunge.
 * - Activates Cursed Energy Guard when player closes in aggressively.
 * - Chains fast melee combos & colorful fluid JJK Cursed Techniques relentlessly!
 */
export function stepArenaDuelAi(
  duel: ActiveArenaDuel,
  player: PlayerState,
  playerProjectiles: Projectile[],
  platforms: Platform[],
  dt: number,
  bounds: { minX: number; maxX: number },
  floorY = FLOOR_Y,
): ArenaAiStepResult {
  const result: ArenaAiStepResult = {
    meleeHitDamage: 0,
    meleeKnockbackX: 0,
    spawnedProjectiles: [],
    spawnedZones: [],
    usedSkillName: null,
    hypeTrigger: false,
  };

  duel.hitFlash = Math.max(0, duel.hitFlash - dt);
  duel.invulnTimer = Math.max(0, duel.invulnTimer - dt);
  duel.guardTimer = Math.max(0, duel.guardTimer - dt);
  duel.dodgeCooldown = Math.max(0, duel.dodgeCooldown - dt);
  duel.attackCooldown = Math.max(0, duel.attackCooldown - dt);
  duel.skillCooldown = Math.max(0, duel.skillCooldown - dt);
  duel.domainCooldown = Math.max(0, duel.domainCooldown - dt);
  if (duel.activeSkillTimer > 0) {
    duel.activeSkillTimer = Math.max(0, duel.activeSkillTimer - dt);
    if (duel.activeSkillTimer === 0) duel.activeSkillBanner = null;
  }

  const domainDef = JJK_DOMAINS[duel.challengerId];

  // Domain Expansion: Active separate dimension lifecycle & continuous world-ending strikes!
  if (duel.domainActive) {
    const prevTimer = duel.domainTimer;
    duel.domainTimer = Math.max(0, duel.domainTimer - dt);
    if (Math.floor(prevTimer / 1.15) !== Math.floor(duel.domainTimer / 1.15) && duel.domainTimer > 0.25) {
      const domainW = 148;
      const zx = Math.max(bounds.minX + 16, Math.min(bounds.maxX - domainW - 16, Math.round(player.x + player.w / 2 - domainW / 2)));
      result.spawnedZones.push({
        id: `jjk_dom_tick_${duel.challengerId}_${Date.now()}_${Math.random()}`,
        x: zx,
        y: floorY - 126,
        w: domainW,
        h: 126,
        life: 1.1,
        maxLife: 1.1,
        damage: Math.max(12, Math.round(duel.matchedAtk * 1.18)),
        kind: domainDef.zoneKind,
        hasHit: false,
      });
    }
    if (duel.domainTimer <= 0) {
      duel.domainActive = false;
    }
  } else if (duel.domainCooldown <= 0 && duel.stunTimer <= 0) {
    duel.domainActive = true;
    duel.domainTimer = 6.8;
    duel.domainCooldown = 14.0;
    duel.domainCastCount += 1;
    duel.activeSkillBanner = domainDef.shout;
    duel.activeSkillTimer = 2.6;
    duel.aiActionTag = 'DOMAIN EXPANSION';
    result.usedSkillName = `DOMAIN EXPANSION: ${domainDef.name}`;
    result.hypeTrigger = true;
    // Initial twin world-ending Domain blasts across the arena floor!
    const offsets = [-120, 120];
    for (const off of offsets) {
      const domainW = 142;
      const zx = Math.max(
        bounds.minX + 16,
        Math.min(bounds.maxX - domainW - 16, Math.round(player.x + off - domainW / 2)),
      );
      result.spawnedZones.push({
        id: `jjk_dom_init_${duel.challengerId}_${off}_${Date.now()}`,
        x: zx,
        y: floorY - 130,
        w: domainW,
        h: 130,
        life: 1.35,
        maxLife: 1.35,
        damage: Math.max(14, Math.round(duel.matchedAtk * 1.35)),
        kind: domainDef.zoneKind,
        hasHit: false,
      });
    }
  }

  if (duel.stunTimer > 0) {
    duel.stunTimer = Math.max(0, duel.stunTimer - dt);
    duel.aiActionTag = 'STUNNED';
    duel.vx *= 0.85;
    applyArenaDuelGravityAndPlatforms(duel, platforms, dt, bounds, floorY);
    return result;
  }

  const centerDuel = duel.x + duel.w / 2;
  const centerPlayer = player.x + player.w / 2;
  const dx = centerPlayer - centerDuel;
  const dist = Math.abs(dx);
  const dy = player.y - duel.y;
  duel.facing = dx >= 0 ? 1 : -1;

  // 1. Reactive OP AI Defense: Flash-Step Dodge incoming player projectiles or close-range windups/active swings!
  const incomingProj = playerProjectiles.some(
    (p) =>
      p.fromPlayer &&
      Math.abs(p.x - centerDuel) < 76 &&
      Math.abs(p.y - (duel.y + duel.h / 2)) < 34 &&
      Math.sign(p.vx) === Math.sign(centerDuel - p.x),
  );
  const playerSwingingClose =
    (player.attackPhase === 'windup' || player.attackPhase === 'active') && dist < 56 && Math.abs(dy) < 36;

  if (
    duel.state !== 'windup' &&
    duel.state !== 'attack' &&
    duel.dodgeCooldown <= 0 &&
    (incomingProj || playerSwingingClose)
  ) {
    duel.state = 'dodge';
    duel.stateTimer = 0.22;
    duel.dodgeCooldown = 1.15;
    duel.invulnTimer = 0.28;
    duel.vx = duel.facing * Math.max(240, duel.matchedSpeed * 1.85);
    if (incomingProj && duel.onGround) {
      duel.vy = -210;
      duel.onGround = false;
    }
    duel.aiActionTag = 'FLASH STEP DODGE';
    result.hypeTrigger = true;
    applyArenaDuelGravityAndPlatforms(duel, platforms, dt, bounds, floorY);
    return result;
  }

  // 2. Cursed Energy Guard if dodge is on cooldown and player is rushing close
  if (
    duel.state === 'approach' &&
    duel.guardTimer <= 0 &&
    duel.dodgeCooldown > 0.25 &&
    playerSwingingClose
  ) {
    duel.state = 'guard';
    duel.stateTimer = 0.42;
    duel.guardTimer = 0.46;
    duel.vx = -duel.facing * 45;
    duel.aiActionTag = 'CURSED GUARD';
  }

  duel.stateTimer -= dt;

  if (duel.state === 'dodge') {
    if (duel.stateTimer <= 0) {
      duel.state = 'windup';
      duel.stateTimer = 0.14;
      duel.aiActionTag = 'COUNTER BLITZ';
    }
  } else if (duel.state === 'guard') {
    duel.vx *= 0.85;
    if (duel.stateTimer <= 0) {
      duel.state = 'approach';
      duel.aiActionTag = null;
    }
  } else if (duel.state === 'windup') {
    duel.vx *= 0.82;
    if (duel.stateTimer <= 0) {
      duel.state = 'attack';
      duel.stateTimer = 0.16;
      duel.comboStep = (duel.comboStep + 1) % 3;
      duel.vx = duel.facing * Math.max(165, duel.matchedSpeed * 1.15);
      duel.attackCooldown = 0.34;
      duel.aiActionTag = duel.comboStep === 2 ? 'HEAVY FINISHER' : 'COMBO STRIKE';
      if (dist <= 52 && Math.abs(dy) <= 38) {
        const mult = duel.comboStep === 2 ? 1.22 : 1.0;
        result.meleeHitDamage = Math.max(10, Math.round(duel.matchedAtk * mult));
        result.meleeKnockbackX = duel.facing * (duel.comboStep === 2 ? 185 : 120);
      }
    }
  } else if (duel.state === 'attack') {
    if (duel.stateTimer <= 0) {
      if (duel.comboStep < 2 && dist <= 58) {
        duel.state = 'windup';
        duel.stateTimer = 0.14;
      } else {
        duel.state = 'recover';
        duel.stateTimer = 0.24;
      }
    }
  } else if (duel.state === 'recover') {
    duel.vx *= 0.82;
    if (duel.stateTimer <= 0) {
      duel.state = 'approach';
      duel.aiActionTag = null;
    }
  } else {
    const chaseSpeed = Math.max(130, duel.matchedSpeed * 1.06);
    if (dist > 34) {
      duel.vx = duel.facing * chaseSpeed;
      duel.walkCycle += dt * 11;
      duel.aiActionTag = duel.domainActive ? 'DOMAIN SURGE' : null;
    } else {
      duel.vx *= 0.7;
    }

    if (duel.onGround && dy < -32 && dist < 170) {
      duel.vy = -315;
      duel.onGround = false;
      duel.aiActionTag = 'AERIAL INTERCEPT';
    }

    if (duel.skillCooldown <= 0 && dist <= 360) {
      duel.skillCooldown = duel.domainActive ? 1.55 : 2.0;
      duel.skillIndex = (duel.skillIndex + 1) % duel.def.skills.length;
      const cast = createArenaSkillAttack(duel, duel.skillIndex, player.x, floorY);
      duel.activeSkillBanner = cast.skill.shout;
      duel.activeSkillTimer = 1.55;
      duel.aiActionTag = cast.skill.name.toUpperCase();
      if (cast.dashVelocityX !== 0) duel.vx = cast.dashVelocityX;
      if (cast.jumpVelocityY !== 0 && duel.onGround) {
        duel.vy = cast.jumpVelocityY;
        duel.onGround = false;
      }
      result.spawnedProjectiles.push(...cast.projectiles);
      result.spawnedZones.push(...cast.zones);
      result.usedSkillName = cast.skill.name;
      result.hypeTrigger = true;
      duel.state = 'recover';
      duel.stateTimer = 0.24;
    } else if (dist <= 46 && Math.abs(dy) <= 42 && duel.attackCooldown <= 0) {
      duel.state = 'windup';
      duel.stateTimer = 0.16;
      duel.aiActionTag = 'STRIKE WINDUP';
    }
  }

  applyArenaDuelGravityAndPlatforms(duel, platforms, dt, bounds, floorY);
  return result;
}

function applyArenaDuelGravityAndPlatforms(
  duel: ActiveArenaDuel,
  platforms: Platform[],
  dt: number,
  bounds: { minX: number; maxX: number },
  floorY: number,
): void {
  const prevBottom = duel.y + duel.h;
  duel.vy = Math.min(540, duel.vy + GRAVITY * dt);
  duel.x += duel.vx * dt;
  duel.y += duel.vy * dt;
  duel.x = Math.max(bounds.minX + 12, Math.min(bounds.maxX - duel.w - 12, duel.x));

  duel.onGround = false;
  if (duel.vy >= 0) {
    for (const p of platforms) {
      const horizontallyInside = duel.x + duel.w > p.x + 2 && duel.x < p.x + p.w - 2;
      if (horizontallyInside && prevBottom <= p.y + 8 && duel.y + duel.h >= p.y) {
        duel.y = p.y - duel.h;
        duel.vy = 0;
        duel.onGround = true;
        break;
      }
    }
  }
  if (!duel.onGround && duel.y + duel.h >= floorY) {
    duel.y = floorY - duel.h;
    duel.vy = 0;
    duel.onGround = true;
  }
}

export const TOWN_RAID_INTERVAL_SECONDS = 1200; // Every 20 minutes
export const TOWN_RAID_REWARD_GOLD = 1000;

export function createTownHouseStates(): TownHouseDamage[] {
  return TOWN_RANDOM_HOUSES.map((h, index) => ({
    index,
    x: h.x,
    w: h.w,
    h: h.h,
    hp: 180,
    maxHp: 180,
    broken: false,
    hitFlash: 0,
  }));
}

export function promoteGuildRankDirect(
  currentRank: GuildRank,
  inventory: InventoryItem[],
): { nextRank: GuildRank; promoted: boolean } {
  if (currentRank === 'S') {
    return { nextRank: 'S', promoted: false };
  }
  const nextRank = getNextGuildRank(currentRank);
  const badge = inventory.find((it) => it.id.startsWith('rank_badge_'));
  if (badge) {
    badge.id = `rank_badge_${nextRank.toLowerCase()}`;
    badge.name = `${nextRank}-Rank Guild Badge`;
    badge.description = `${RANK_TITLES[nextRank]} badge issued by the Royal Adventurer Guild.`;
    badge.color =
      nextRank === 'S'
        ? '#fbbf24'
        : nextRank === 'A'
          ? '#e11d48'
          : nextRank === 'B'
            ? '#38bdf8'
            : '#a7f3d0';
  }
  return {
    nextRank,
    promoted: nextRank !== currentRank,
  };
}

export function createTownRaidBoss(
  raiderId: TownRaiderId,
  playerMaxHp: number,
  playerAttack: number,
  spawnX?: number,
): ActiveTownRaid {
  const isRimuru = raiderId === 'rimuru_tempest';
  const hp = Math.max(120, Math.round(playerMaxHp * 3));
  const atk = Math.max(8, Math.round(playerAttack));
  const w = 38;
  const h = 52;
  const x = spawnX ?? (isRimuru ? 1480 : 1060);
  return {
    raiderId,
    name: isRimuru ? 'Rimuru Tempest' : 'Goblin Slayer',
    title: isRimuru ? 'True Demon Lord Slime · Town Raider' : 'Silver-Rank Exterminator · Town Raider',
    x,
    y: FLOOR_Y - h,
    vx: 0,
    vy: 0,
    w,
    h,
    hp,
    maxHp: hp,
    attackDamage: atk,
    facing: -1,
    onGround: true,
    state: 'march',
    stateTimer: 0.4,
    aoeCooldown: 1.4,
    attackCooldown: 0.6,
    castIndex: 0,
    targetHouseIdx: null,
    hitFlash: 0,
    walkCycle: 0,
    activeSkillBanner: null,
    activeSkillTimer: 0,
    stunTimer: 0,
    windVulnerable: false,
  };
}

export function stepTownRaidAi(
  raid: ActiveTownRaid,
  player: PlayerState,
  houses: TownHouseDamage[],
  dt: number,
  bounds: { minX: number; maxX: number },
  floorY: number,
): {
  spawnedZones: PurpleFlameZone[];
  spawnedProjectiles: Projectile[];
  meleeHitDamage: number;
  meleeKnockbackX: number;
  usedSkillName: string | null;
  damagedHouseIndices: number[];
  brokenHouseIndices: number[];
} {
  // Always keep raider attack synchronized with player's own damage!
  const playerBaseDmg = Math.max(8, Math.round(calculateAttackDamage(player, 1, false)));
  raid.attackDamage = playerBaseDmg;
  raid.hitFlash = Math.max(0, raid.hitFlash - dt);
  raid.aoeCooldown = Math.max(0, raid.aoeCooldown - dt);
  raid.attackCooldown = Math.max(0, raid.attackCooldown - dt);
  raid.activeSkillTimer = Math.max(0, raid.activeSkillTimer - dt);
  if (raid.activeSkillTimer <= 0) raid.activeSkillBanner = null;

  const result: {
    spawnedZones: PurpleFlameZone[];
    spawnedProjectiles: Projectile[];
    meleeHitDamage: number;
    meleeKnockbackX: number;
    usedSkillName: string | null;
    damagedHouseIndices: number[];
    brokenHouseIndices: number[];
  } = {
    spawnedZones: [],
    spawnedProjectiles: [],
    meleeHitDamage: 0,
    meleeKnockbackX: 0,
    usedSkillName: null,
    damagedHouseIndices: [],
    brokenHouseIndices: [],
  };

  if ((raid.stunTimer ?? 0) > 0) {
    raid.stunTimer = Math.max(0, (raid.stunTimer ?? 0) - dt);
    raid.vx *= 0.8;
    return result;
  }

  const raidCenter = raid.x + raid.w / 2;
  const playerCenter = player.x + player.w / 2;
  const distToPlayer = Math.abs(playerCenter - raidCenter);

  // Pick nearest unbroken house to smash if player isn't right next to raider
  let targetHouse: TownHouseDamage | null = null;
  let bestHouseDist = 999999;
  for (const h of houses) {
    if (h.broken) continue;
    const d = Math.abs(h.x + h.w / 2 - raidCenter);
    if (d < bestHouseDist) {
      bestHouseDist = d;
      targetHouse = h;
    }
  }
  raid.targetHouseIdx = targetHouse ? targetHouse.index : null;

  // Target selection: prioritize fighting player within 230px, otherwise rampage toward nearest intact town house!
  const engagePlayer = distToPlayer <= 230 || !targetHouse;
  const targetX = engagePlayer ? playerCenter : targetHouse!.x + targetHouse!.w / 2;
  const dx = targetX - raidCenter;
  const dist = Math.abs(dx);
  raid.facing = dx >= 0 ? 1 : -1;
  raid.stateTimer -= dt;

  const damageHousesInRange = (cx: number, halfSpan: number, dmgAmount: number) => {
    for (const h of houses) {
      if (h.broken) continue;
      const hx1 = h.x;
      const hx2 = h.x + h.w;
      if (hx2 >= cx - halfSpan && hx1 <= cx + halfSpan) {
        h.hp = Math.max(0, h.hp - dmgAmount);
        h.hitFlash = 0.35;
        result.damagedHouseIndices.push(h.index);
        if (h.hp <= 0) {
          h.broken = true;
          result.brokenHouseIndices.push(h.index);
        }
      }
    }
  };

  if (raid.aoeCooldown <= 0 && (dist <= 300 || targetHouse)) {
    raid.aoeCooldown = 2.65;
    raid.castIndex = (raid.castIndex + 1) % 3;
    const isRimuru = raid.raiderId === 'rimuru_tempest';
    const aoeDmg = Math.max(10, Math.round(raid.attackDamage * 1.15));
    const houseAoEDmg = 95;

    if (isRimuru) {
      if (raid.castIndex === 0) {
        result.usedSkillName = 'MEGIDDO · GOD\'S WRATH';
        for (const ox of [-90, 0, 90]) {
          const zx = Math.max(bounds.minX + 10, Math.min(bounds.maxX - 96, targetX + ox - 44));
          result.spawnedZones.push({
            id: `rim_meg_${Date.now()}_${Math.random()}`,
            x: zx,
            y: floorY - 110,
            w: 88,
            h: 110,
            life: 1.55,
            maxLife: 1.55,
            damage: aoeDmg,
            kind: 'rimuru_megiddo',
            hasHit: false,
          });
          damageHousesInRange(zx + 44, 52, houseAoEDmg);
        }
      } else if (raid.castIndex === 1) {
        result.usedSkillName = 'BLACK LIGHTNING · KUROI INAZUMA';
        for (const ox of [-56, 56]) {
          const zx = Math.max(bounds.minX + 10, Math.min(bounds.maxX - 110, raidCenter + ox - 50));
          result.spawnedZones.push({
            id: `rim_lit_${Date.now()}_${Math.random()}`,
            x: zx,
            y: floorY - 122,
            w: 100,
            h: 122,
            life: 1.4,
            maxLife: 1.4,
            damage: aoeDmg,
            kind: 'rimuru_black_lightning',
            hasHit: false,
          });
          damageHousesInRange(zx + 50, 62, houseAoEDmg);
        }
        result.spawnedProjectiles.push(
          {
            id: `rim_orb1_${Math.random()}`,
            x: raidCenter,
            y: raid.y + 20,
            vx: -230,
            vy: 0,
            radius: 7,
            damage: raid.attackDamage,
            fromPlayer: false,
            color: '#a855f7',
            life: 2.2,
            kind: 'demon_orb',
          },
          {
            id: `rim_orb2_${Math.random()}`,
            x: raidCenter,
            y: raid.y + 20,
            vx: 230,
            vy: 0,
            radius: 7,
            damage: raid.attackDamage,
            fromPlayer: false,
            color: '#38bdf8',
            life: 2.2,
            kind: 'demon_orb',
          },
        );
      } else {
        result.usedSkillName = 'BEELZEBUTH · GLUTTONY VORTEX';
        const zx = Math.max(bounds.minX + 10, Math.min(bounds.maxX - 140, targetX - 68));
        result.spawnedZones.push({
          id: `rim_gl_${Date.now()}_${Math.random()}`,
          x: zx,
          y: floorY - 96,
          w: 136,
          h: 96,
          life: 1.75,
          maxLife: 1.75,
          damage: aoeDmg,
          kind: 'rimuru_beelzebuth',
          hasHit: false,
        });
        damageHousesInRange(zx + 68, 80, houseAoEDmg + 25);
      }
    } else {
      // Goblin Slayer Signature Full-Power AoEs!
      if (raid.castIndex === 0) {
        result.usedSkillName = 'GATE SCROLL · DEEP-SEA TORRENT';
        const zx = Math.max(bounds.minX + 10, Math.min(bounds.maxX - 135, targetX - 64));
        result.spawnedZones.push({
          id: `gs_gate_${Date.now()}_${Math.random()}`,
          x: zx,
          y: floorY - 102,
          w: 128,
          h: 102,
          life: 1.5,
          maxLife: 1.5,
          damage: aoeDmg,
          kind: 'gs_gate_scroll',
          hasHit: false,
        });
        damageHousesInRange(zx + 64, 78, houseAoEDmg + 30);
      } else if (raid.castIndex === 1) {
        result.usedSkillName = 'SILVER BUCKLER · TREMOR SHOCK';
        const zx = Math.max(bounds.minX + 10, Math.min(bounds.maxX - 130, raidCenter - 62));
        result.spawnedZones.push({
          id: `gs_sh_${Date.now()}_${Math.random()}`,
          x: zx,
          y: floorY - 76,
          w: 124,
          h: 76,
          life: 1.35,
          maxLife: 1.35,
          damage: aoeDmg,
          kind: 'gs_shield_shock',
          hasHit: false,
        });
        damageHousesInRange(zx + 62, 74, houseAoEDmg);
      } else {
        result.usedSkillName = 'INCENDIARY FLOUR & TORCH BLAST';
        for (const ox of [-58, 58]) {
          const zx = Math.max(bounds.minX + 10, Math.min(bounds.maxX - 104, targetX + ox - 48));
          result.spawnedZones.push({
            id: `gs_oil_${Date.now()}_${Math.random()}`,
            x: zx,
            y: floorY - 90,
            w: 96,
            h: 90,
            life: 1.6,
            maxLife: 1.6,
            damage: aoeDmg,
            kind: 'gs_oil_bomb',
            hasHit: false,
          });
          damageHousesInRange(zx + 48, 56, houseAoEDmg);
        }
        result.spawnedProjectiles.push({
          id: `gs_knife_${Math.random()}`,
          x: raidCenter,
          y: raid.y + 22,
          vx: raid.facing * 245,
          vy: 0,
          radius: 5,
          damage: raid.attackDamage,
          fromPlayer: false,
          color: '#f97316',
          life: 1.8,
          kind: 'arrow',
        });
      }
    }
    raid.activeSkillBanner = result.usedSkillName;
    raid.activeSkillTimer = 1.65;
    raid.state = 'recover';
    raid.stateTimer = 0.35;
  } else if (raid.state === 'windup') {
    raid.vx *= 0.8;
    if (raid.stateTimer <= 0) {
      raid.state = 'attack';
      raid.stateTimer = 0.2;
      raid.vx = raid.facing * 155;
      raid.attackCooldown = 0.85;
      if (distToPlayer <= 66 && Math.abs(player.y + player.h - (raid.y + raid.h)) <= 48) {
        result.meleeHitDamage = raid.attackDamage;
        result.meleeKnockbackX = raid.facing * 175;
      }
      damageHousesInRange(raidCenter + raid.facing * 26, 48, 65);
    }
  } else if (raid.state === 'attack') {
    if (raid.stateTimer <= 0) {
      raid.state = 'recover';
      raid.stateTimer = 0.3;
    }
  } else if (raid.state === 'recover') {
    raid.vx *= 0.82;
    if (raid.stateTimer <= 0) {
      raid.state = 'march';
    }
  } else {
    const moveSpd = raid.raiderId === 'rimuru_tempest' ? 112 : 104;
    if (dist > 44) {
      raid.vx = raid.facing * moveSpd;
      raid.walkCycle += dt * 9;
    } else {
      raid.vx *= 0.7;
      if (raid.attackCooldown <= 0) {
        raid.state = 'windup';
        raid.stateTimer = 0.24;
      }
    }
  }

  raid.vy = Math.min(540, raid.vy + GRAVITY * dt);
  raid.x += raid.vx * dt;
  raid.y += raid.vy * dt;
  raid.x = Math.max(bounds.minX + 12, Math.min(bounds.maxX - raid.w - 12, raid.x));
  if (raid.y + raid.h >= floorY) {
    raid.y = floorY - raid.h;
    raid.vy = 0;
    raid.onGround = true;
  }
  return result;
}


