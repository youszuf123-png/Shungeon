import { POTION_SHOP_IDS, WEAPONS } from './data';
import { addInventoryResource, equipWeapon } from './rules';
import type {
  ActiveArenaDuel,
  AlliedNpc,
  ArenaChallengerDef,
  ArenaChallengerId,
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
    price: 45,
    description: 'Traditional airy emerald-trimmed fantasy adventurer tunic & leather vest.',
    outfitStyle: 'adventurer_tunic',
    armorColor: '#15803d',
    cloakColor: '#1e3a8a',
  },
  {
    id: 'outfit_guild_coat',
    name: 'Crimson Guild Trenchcoat',
    slot: 'outfit',
    price: 90,
    description: 'Belted Japanese-isekai guild commander coat with gold shoulder frogs.',
    outfitStyle: 'guild_coat',
    armorColor: '#7f1d1d',
    cloakColor: '#b45309',
  },
  {
    id: 'outfit_demon_slayer',
    name: 'Violet Demon-Bane Mantle',
    slot: 'outfit',
    price: 150,
    description: 'Obsidian & amethyst weave tailored for Demon Realm vanguard raids.',
    outfitStyle: 'demon_slayer',
    armorColor: '#312e81',
    cloakColor: '#7e22ce',
  },
  {
    id: 'outfit_royal_regalia',
    name: 'Sovereign Velvet Regalia',
    slot: 'outfit',
    price: 220,
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
    price: 35,
    description: 'Jaunty feather-pinned isekai town beret worn by veteran scouts.',
    headgearStyle: 'beret',
  },
  {
    id: 'hat_bandana',
    name: 'Shadow Shinobi Scarf',
    slot: 'headgear',
    price: 60,
    description: 'Wind-swept eastern traveler headband with flowing twin tails.',
    headgearStyle: 'bandana',
  },
  {
    id: 'hat_circlet',
    name: 'Mythril Star Circlet',
    slot: 'headgear',
    price: 110,
    description: 'Light sapphire diadem worn by high-ranking court champions.',
    headgearStyle: 'circlet',
  },
];

export const ISEKAI_ROOM_BOUNDS: Record<RealmMode, { minX: number; maxX: number }> = {
  citadel: { minX: -640, maxX: 80000 },
  isekai_town: { minX: 20, maxX: 4380 },
  isekai_guild: { minX: 24, maxX: 860 },
  isekai_wardrobe: { minX: 24, maxX: 460 },
  isekai_potion_shop: { minX: 24, maxX: 520 },
  isekai_weapons_shop: { minX: 24, maxX: 1220 },
  dungeon_exterior: { minX: 20, maxX: 1240 },
  goblin_dungeon: { minX: 20, maxX: 999999 },
  carriage_escort: { minX: 20, maxX: 1120 },
  demon_realm: { minX: 20, maxX: 999999 },
  demon_king_arena: { minX: 24, maxX: 1480 },
  dueling_arena: { minX: 24, maxX: 680 },
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

  // Expanded East Solaris Town residential districts (3x town size!) skipping Hot Spring zone (2510..2865)
  let cursor = 1385;
  let i = 0;
  while (cursor < 3990) {
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
  const price = item.shopPrice ?? 30;
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
  const price = def.shopPrice ?? 150;
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
      { id: 'arena_dais_l', x: 148, y: FLOOR_Y - 46, w: 86, h: 10, kind: 'bridge' },
      { id: 'arena_dais_r', x: 448, y: FLOOR_Y - 46, w: 86, h: 10, kind: 'bridge' },
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
        x: 4185,
        y: FLOOR_Y - 64,
        w: 58,
        h: 64,
        kind: 'arena_door',
        label: 'Enter Solaris Grand Dueling Arena',
        speaker: 'Arena Master',
        dialogue: ['Stepping beneath the cheering stands of Solaris Grand Colosseum!'],
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
        x: 110,
        y: FLOOR_Y - 48,
        w: 44,
        h: 48,
        kind: 'arena_board',
        label: 'Select Dueling Arena Challenger',
        speaker: 'Colosseum Herald',
        dialogue: ['Opening Grand Arena Challenger Roster...'],
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
            Math.round((74 + tier * 24) * strengthMult),
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
            Math.round((38 + tier * 12) * strengthMult),
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
          Math.round(s.hp * strengthMult),
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
    list.push(createDungeonDeepBoss(realm, Math.max(depth, sectorIdx + 1), bossX));
  }
  return list;
}

export function createGoblinDungeonWave(
  missionId: GuildMissionId,
  waveIdx = 0,
  depth = 1,
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
          Math.round((72 + tier * 24) * strengthMult),
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
          Math.round((36 + tier * 12) * strengthMult),
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
    list.push(createDungeonDeepBoss('goblin_dungeon', depth, 2550));
  }
  return list;
}

export function createDungeonDeepBoss(realm: RealmMode, depth: number, spawnX = 2550): EnemyState {
  const { sizeScale, strengthMult, darkness } = getEndlessDistanceScaling(spawnX, depth);
  const bossScale = Math.max(1.38, sizeScale * 1.18);
  const bossDark = Math.min(0.9, Math.max(0.32, darkness + 0.18));
  if (realm === 'demon_realm') {
    return makeEnemy(
      `deep_boss_dem_${depth}_${spawnX}`,
      'demon_tank',
      `Depth ${depth} Caldera Demon Overlord`,
      spawnX,
      FLOOR_Y - 32,
      Math.round(380 * strengthMult),
      26,
      32,
      'volcano',
      Math.round(120 * strengthMult),
      Math.round(28 * strengthMult),
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
    Math.round(260 * strengthMult),
    24,
    30,
    'castle',
    Math.round(85 * strengthMult),
    Math.round(22 * strengthMult),
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
    fighterHp: 85,
    archerHp: 58,
    fighterDmg: 15,
    archerDmg: 12,
  },
  {
    fighterName: 'Shadow-Cloak Cutthroat',
    archerName: 'Venom Longbow Sniper',
    fighterHp: 102,
    archerHp: 72,
    fighterDmg: 18,
    archerDmg: 15,
  },
  {
    fighterName: 'Ironclad Marauder Captain',
    archerName: 'Blaze-Arrow Siege Archer',
    fighterHp: 124,
    archerHp: 84,
    fighterDmg: 21,
    archerDmg: 17,
  },
];

export function createBanditWave(
  carriageX: number,
  waveIdx: number,
  escortVariant = 0,
): EnemyState[] {
  const faction = BANDIT_FACTIONS[Math.abs(escortVariant) % BANDIT_FACTIONS.length];
  const list: EnemyState[] = [];
  const spawnPositions = [carriageX + 190, carriageX + 255, Math.max(40, carriageX - 135), carriageX + 310];
  spawnPositions.forEach((sx, i) => {
    const isArcher = i % 2 === 1;
    list.push(
      makeEnemy(
        `bandit_${escortVariant}_${waveIdx}_${i}`,
        isArcher ? 'bandit_archer' : 'bandit_fighter',
        isArcher ? faction.archerName : faction.fighterName,
        sx,
        FLOOR_Y - 26,
        isArcher ? faction.archerHp : faction.fighterHp,
        18,
        26,
        'forest',
        20 + escortVariant * 6,
        isArcher ? faction.archerDmg : faction.fighterDmg,
      ),
    );
  });
  return list;
}

export function createDemonRealmWave(depth = 1): EnemyState[] {
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
        Math.round(s.hp * strengthMult),
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
    list.push(createDungeonDeepBoss('demon_realm', depth, 2550));
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
      makeEnemy('dk1_m0', 'demon_tank', 'Crimson Ash Bone-Goliath', 240, FLOOR_Y - 32, 145, 24, 32, 'volcano', 36, 17, false, 1.12, 0.14, 'crimson_ash'),
      makeEnemy('dk1_m1', 'gargoyle_charger', 'Hellbound Obsidian Gargoyle', 330, FLOOR_Y - 26, 98, 20, 26, 'volcano', 28, 15, false, 1.08, 0.12, 'crimson_ash'),
      makeEnemy('dk1_m2', 'cultist_mage', 'Ashen Blood-Chant Warlock', 410, FLOOR_Y - 26, 86, 20, 26, 'volcano', 26, 14, false, 1.04, 0.12, 'crimson_ash'),
    ];
  }
  if (stage === 2) {
    // Stage 2: Vaelgor, Arch-Seraph of Abyssal Frost — Fallen Seraph & Cursed Wraith Legion
    return [
      makeEnemy('dk2_m0', 'demon_succubus', 'Abyssal Frost-Hex Seraph', 250, FLOOR_Y - 68, 128, 20, 28, 'volcano', 42, 18, false, 1.12, 0.22, 'frost_seraph'),
      makeEnemy('dk2_m1', 'cursed_armor', 'Frostbound Fallen Paladin', 350, FLOOR_Y - 28, 165, 22, 28, 'volcano', 45, 20, false, 1.18, 0.25, 'frost_seraph'),
      makeEnemy('dk2_m2', 'phantom_wisp', 'Glacial Soul-Banshee', 440, FLOOR_Y - 56, 96, 20, 26, 'volcano', 34, 16, false, 1.08, 0.2, 'frost_seraph'),
    ];
  }
  // Stage 3: Zarakiel, Sovereign of the Void Eclipse — Black-Gold Shadow Monarch Guard
  return [
    makeEnemy('dk3_m0', 'demon_lightning', 'Void-Eclipse Thunder Assassin', 240, FLOOR_Y - 28, 142, 20, 28, 'volcano', 50, 21, false, 1.16, 0.36, 'void_eclipse'),
    makeEnemy('dk3_m1', 'demon_tank', 'Eclipse Shadow-Monarch Sentinel', 340, FLOOR_Y - 32, 210, 24, 32, 'volcano', 60, 23, false, 1.26, 0.42, 'void_eclipse'),
    makeEnemy('dk3_m2', 'demon_succubus', 'Astral Void-Rift Enchantress', 435, FLOOR_Y - 68, 134, 20, 28, 'volcano', 48, 19, false, 1.14, 0.34, 'void_eclipse'),
  ];
}

export function createThreeDemonKingsInit(
  _foughtIsekaiEnemies: EnemyArchetype[],
): { demonKings: DemonKingEntity[]; minions: EnemyState[]; allies: AlliedNpc[] } {
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
      hp: 380,
      maxHp: 380,
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
      hp: 430,
      maxHp: 430,
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
      hp: 490,
      maxHp: 490,
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
        damage: 14,
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
        damage: 15,
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
        damage: 16,
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
      damage: 14,
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
        damage: 14,
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

export const ARENA_CHALLENGERS: ArenaChallengerDef[] = [
  {
    id: 'sung_jin_ryu',
    name: 'Sung Jin-Ryu',
    title: 'Shadow Monarch of the Abyss Gate',
    worldOrigin: 'Manhwa · Shadow Gate',
    weaponName: 'Kasaka Twin Abyssal Daggers',
    maxHp: 380,
    attackDamage: 16,
    moveSpeed: 96,
    primaryColor: '#1e1b4b',
    secondaryColor: '#6d28d9',
    auraColor: '#a855f7',
    hairColor: '#09090b',
    capeColor: '#312e81',
    weaponColor: '#c084fc',
    description: 'High-speed dual-dagger Shadow Sovereign inspired by Korean hunter manhwas.',
    skills: [
      { id: 'rulers_authority', name: "Ruler's Authority", damage: 17, kind: 'dash_cleave', color: '#8b5cf6', shout: 'ARISE — RULER’S AUTHORITY!' },
      { id: 'mutilate_barrage', name: 'Mutilate Barrage', damage: 20, kind: 'slash_barrage', color: '#c084fc', shout: 'MUTILATE BARRAGE!' },
      { id: 'shadow_exchange', name: 'Shadow Exchange Flash', damage: 19, kind: 'atomic_nova', color: '#6366f1', shout: 'SHADOW EXCHANGE!' },
    ],
  },
  {
    id: 'lin_tianming',
    name: 'Lin Tianming',
    title: 'Nine-Heavens Sword Immortal',
    worldOrigin: 'Cultivation · Xianxia Sword Sect',
    weaponName: 'Celestial Jade Spirit Sword',
    maxHp: 410,
    attackDamage: 17,
    moveSpeed: 82,
    primaryColor: '#ecfeff',
    secondaryColor: '#0d9488',
    auraColor: '#2dd4bf',
    hairColor: '#f8fafc',
    capeColor: '#0f766e',
    weaponColor: '#5eead4',
    description: 'Floating sword formation cultivator who commands orbiting jade qi blades.',
    skills: [
      { id: 'myriad_swords', name: 'Myriad Flying Swords', damage: 18, kind: 'flying_swords', color: '#2dd4bf', shout: 'WAN JIAN GUI ZONG — FLYING SWORDS!' },
      { id: 'nine_heavens_qi', name: 'Nine-Heavens Sword Qi', damage: 21, kind: 'crimson_wave', color: '#5eead4', shout: 'NINE-HEAVENS SWORD QI!' },
      { id: 'taiji_cleave', name: 'Lotus Taiji Cleave', damage: 19, kind: 'dash_cleave', color: '#99f6e4', shout: 'CELESTIAL LOTUS CLEAVE!' },
    ],
  },
  {
    id: 'kurogane_kirito',
    name: 'Kurogane Kirito',
    title: 'Black Dual-Blade Sprinter',
    worldOrigin: 'Isekai Anime · Twin-Blade Aincrad',
    weaponName: 'Elucidator & Dark Repulser',
    maxHp: 395,
    attackDamage: 18,
    moveSpeed: 98,
    primaryColor: '#18181b',
    secondaryColor: '#38bdf8',
    auraColor: '#38bdf8',
    hairColor: '#18181b',
    capeColor: '#27272a',
    weaponColor: '#7dd3fc',
    description: 'Dual-wielding black swordsman famous for blinding 16-hit sword skill chains.',
    skills: [
      { id: 'starburst_stream', name: 'Starburst Stream', damage: 22, kind: 'slash_barrage', color: '#38bdf8', shout: 'SWITCH — STARBURST STREAM!' },
      { id: 'vorpal_strike', name: 'Vorpal Strike', damage: 19, kind: 'dash_cleave', color: '#e11d48', shout: 'VORPAL STRIKE!' },
      { id: 'horizontal_square', name: 'Horizontal Square', damage: 18, kind: 'crimson_wave', color: '#60a5fa', shout: 'HORIZONTAL SQUARE!' },
    ],
  },
  {
    id: 'yan_wuji',
    name: 'Yan Wuji',
    title: 'Scarlet Qilin Martial Sovereign',
    worldOrigin: 'Manhua · Crimson Martial Palace',
    weaponName: 'Crimson Dragon-Cleaver Guandao',
    maxHp: 460,
    attackDamage: 21,
    moveSpeed: 74,
    primaryColor: '#7f1d1d',
    secondaryColor: '#fbbf24',
    auraColor: '#f97316',
    hairColor: '#991b1b',
    capeColor: '#b91c1c',
    weaponColor: '#fb923c',
    description: 'Domineering martial manhua polearm master radiating blazing Qilin meridian fire.',
    skills: [
      { id: 'blazing_qilin', name: 'Blazing Qilin Sweep', damage: 22, kind: 'crimson_wave', color: '#f97316', shout: 'BLAZING QILIN SWEEP!' },
      { id: 'shattering_palm', name: 'Shattering Sky Palm', damage: 24, kind: 'atomic_nova', color: '#fbbf24', shout: 'HEAVEN-SHATTERING PALM!' },
      { id: 'asura_spear', name: 'Asura Blood Spear', damage: 21, kind: 'dash_cleave', color: '#ef4444', shout: 'ASURA BLOOD SPEAR!' },
    ],
  },
  {
    id: 'lord_shadow',
    name: 'Lord Shadow',
    title: 'Eminence of Moonlight',
    worldOrigin: 'Isekai Manga · Shadow Garden',
    weaponName: 'Obsidian Slime Claymore',
    maxHp: 440,
    attackDamage: 20,
    moveSpeed: 92,
    primaryColor: '#09090b',
    secondaryColor: '#9333ea',
    auraColor: '#d946ef',
    hairColor: '#171717',
    capeColor: '#1e1b4b',
    weaponColor: '#a855f7',
    description: 'Theatrical hooded isekai mastermind cloaked in shifting obsidian slime steel.',
    skills: [
      { id: 'atomic_crescent', name: 'I Am Atomic Crescent', damage: 25, kind: 'atomic_nova', color: '#d946ef', shout: 'I... AM... ATOMIC!' },
      { id: 'phantom_mirage', name: 'Phantom Mirage Step', damage: 19, kind: 'dash_cleave', color: '#a855f7', shout: 'PHANTOM MIRAGE STEP!' },
      { id: 'moonlight_severance', name: 'Moonlight Severance', damage: 21, kind: 'crimson_wave', color: '#e879f9', shout: 'MOONLIGHT SEVERANCE!' },
    ],
  },
  {
    id: 'bai_qingxue',
    name: 'Bai Qingxue',
    title: 'Frozen Nirvana Sword Saintess',
    worldOrigin: 'Wuxia · Glacial Nirvana Peak',
    weaponName: 'Nine-Petaled Glacial Ribbon-Spear',
    maxHp: 425,
    attackDamage: 18,
    moveSpeed: 88,
    primaryColor: '#f0f9ff',
    secondaryColor: '#0284c7',
    auraColor: '#7dd3fc',
    hairColor: '#dbeafe',
    capeColor: '#1d4ed8',
    weaponColor: '#bae6fd',
    description: 'Graceful wuxia mountaintop saintess weaving freezing lotus petals and ice needles.',
    skills: [
      { id: 'frozen_nirvana', name: 'Frozen Nirvana Blossom', damage: 20, kind: 'frost_lotus', color: '#38bdf8', shout: 'FROZEN NIRVANA BLOSSOM!' },
      { id: 'frost_needles', name: 'Thousand-Li Frost Needle', damage: 18, kind: 'flying_swords', color: '#bae6fd', shout: 'THOUSAND-LI FROST NEEDLES!' },
      { id: 'celestial_ribbon', name: 'Celestial Ribbon Tempest', damage: 21, kind: 'slash_barrage', color: '#60a5fa', shout: 'CELESTIAL RIBBON TEMPEST!' },
    ],
  },
];

export function createArenaDuelInit(challengerId: ArenaChallengerId): ActiveArenaDuel {
  const def = ARENA_CHALLENGERS.find((c) => c.id === challengerId) ?? ARENA_CHALLENGERS[0];
  return {
    challengerId: def.id,
    def,
    x: 500,
    y: FLOOR_Y - 34,
    vx: 0,
    vy: 0,
    w: 24,
    h: 34,
    hp: def.maxHp,
    maxHp: def.maxHp,
    facing: -1,
    state: 'idle',
    stateTimer: 0.65,
    skillCooldown: 2.2,
    skillIndex: 0,
    hitFlash: 0,
    walkCycle: 0,
    activeSkillBanner: null,
    activeSkillTimer: 0,
    stunTimer: 0,
    windVulnerable: false,
  };
}

export function createArenaSkillAttack(
  duel: ActiveArenaDuel,
  skillIdx: number,
  _playerX: number,
  floorY = FLOOR_Y,
): {
  skill: ArenaSkillDef;
  projectiles: Projectile[];
  dashVelocityX: number;
} {
  const skill = duel.def.skills[Math.abs(skillIdx) % duel.def.skills.length];
  const projectiles: Projectile[] = [];
  let dashVelocityX = 0;

  if (skill.kind === 'flying_swords') {
    [-16, -2, 12].forEach((yOff, i) => {
      projectiles.push({
        id: `arena_fs_${duel.challengerId}_${i}_${Date.now()}`,
        x: duel.x + (duel.facing === 1 ? duel.w + 4 : -4),
        y: duel.y + 12 + yOff * 0.5,
        vx: duel.facing * (185 + i * 20),
        vy: yOff * 0.4,
        radius: 6,
        damage: Math.round(skill.damage * 0.72),
        fromPlayer: false,
        color: skill.color,
        life: 1.9,
        kind: 'slash_wave',
      });
    });
  } else if (skill.kind === 'crimson_wave' || skill.kind === 'frost_lotus') {
    projectiles.push({
      id: `arena_wv_${duel.challengerId}_${Date.now()}`,
      x: duel.x + (duel.facing === 1 ? duel.w : 0),
      y: Math.min(floorY - 12, duel.y + 16),
      vx: duel.facing * 215,
      vy: 0,
      radius: 9,
      damage: skill.damage,
      fromPlayer: false,
      color: skill.color,
      life: 1.8,
      kind: skill.kind === 'frost_lotus' ? 'rune' : 'fireball',
    });
  } else if (skill.kind === 'atomic_nova') {
    [-1, 1].forEach((dir, i) => {
      projectiles.push({
        id: `arena_nv_${duel.challengerId}_${i}_${Date.now()}`,
        x: duel.x + duel.w / 2,
        y: duel.y + 18,
        vx: dir * 165,
        vy: 0,
        radius: 9,
        damage: skill.damage,
        fromPlayer: false,
        color: skill.color,
        life: 1.5,
        kind: 'purple_flame',
      });
    });
  } else {
    dashVelocityX = duel.facing * 240;
    projectiles.push({
      id: `arena_sl_${duel.challengerId}_${Date.now()}`,
      x: duel.x + duel.w / 2 + duel.facing * 12,
      y: duel.y + 14,
      vx: duel.facing * 195,
      vy: 0,
      radius: 7,
      damage: skill.damage,
      fromPlayer: false,
      color: skill.color,
      life: 0.75,
      kind: 'slash_wave',
    });
  }

  return { skill, projectiles, dashVelocityX };
}

