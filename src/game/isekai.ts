import { addInventoryResource } from './rules';
import type {
  BiomeId,
  CarriageEscortState,
  DemonKingEntity,
  EnemyArchetype,
  EnemyState,
  GuildBulletinRankingEntry,
  GuildBulletinSnapshot,
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
} from './types';
import { FLOOR_Y } from './worldGen';

export const RANK_ORDER: GuildRank[] = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];

export const RANK_TITLES: Record<GuildRank, string> = {
  F: 'Porcelain Initiate',
  E: 'Bronze Scout',
  D: 'Iron Vanguard',
  C: 'Silver Escort',
  B: 'Mythril Slayer',
  A: 'Crimson Champion',
  S: 'Crowned Royal Sovereign',
};

export interface GuildMissionDef {
  id: GuildMissionId;
  title: string;
  rankReq: GuildRank;
  promoteToRank: GuildRank;
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
    realm: 'goblin_dungeon',
    regionLabel: 'Graystone Cavern · Tier I',
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
    realm: 'goblin_dungeon',
    regionLabel: 'Graystone Cavern · Tier II',
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
    realm: 'goblin_dungeon',
    regionLabel: 'Graystone Abyss · Tier III',
    summary: 'Crush the final Goblin Dungeon warband to earn Silver C-Rank Escort papers.',
    rewardGold: 185,
    killsRequired: 10,
    accentColor: '#38bdf8',
  },
  {
    id: 'c_princess_carriage',
    title: 'Royal Princess Carriage Escort',
    rankReq: 'C',
    promoteToRank: 'B',
    realm: 'carriage_escort',
    regionLabel: 'Kingdom Sunlit Highway',
    summary: 'Guard Princess Aurelia in her moving carriage against Bandit Fighters & Archers.',
    rewardGold: 260,
    killsRequired: 8,
    accentColor: '#fbbf24',
  },
  {
    id: 'b_demon_invasion',
    title: 'Demon Realm Volcano Vanguard',
    rankReq: 'B',
    promoteToRank: 'A',
    realm: 'demon_realm',
    regionLabel: 'Crimson-Violet Caldera',
    summary: 'Invade under erupting volcanoes against Long-Range Succubi, Demon Tanks & Lightning Fighters.',
    rewardGold: 380,
    killsRequired: 9,
    accentColor: '#f43f5e',
  },
  {
    id: 'a_three_demon_kings',
    title: 'Three Demon Kings Judgment',
    rankReq: 'A',
    promoteToRank: 'S',
    realm: 'demon_king_arena',
    regionLabel: 'Obsidian Imperial Citadel',
    summary: 'Defeat all 3 Demon Kings & past Isekai foes in real-time combat to claim the Royal Crown!',
    rewardGold: 800,
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
  isekai_town: { minX: 20, maxX: 980 },
  isekai_guild: { minX: 24, maxX: 500 },
  isekai_wardrobe: { minX: 24, maxX: 460 },
  goblin_dungeon: { minX: 20, maxX: 980 },
  carriage_escort: { minX: 20, maxX: 1120 },
  demon_realm: { minX: 20, maxX: 980 },
  demon_king_arena: { minX: 24, maxX: 620 },
};

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
  // Preserve combat style, weapons, skill slots & gold, but reset all level/stats back to fresh Isekai adventurer
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
  player.dashCooldown = 0;
  player.skillCooldowns = [0, 0, 0];
  player.chronoFreezeTimer = 0;
  player.invulnTimer = 0;
  player.parryTimer = 0;

  // Issue F-Rank Guild Badge in inventory if not already present
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

export function canStartGuildMission(currentRank: GuildRank, missionId: GuildMissionId): boolean {
  const mission = GUILD_MISSIONS.find((m) => m.id === missionId);
  if (!mission) return false;
  return rankIndex(currentRank) >= rankIndex(mission.rankReq);
}

export function promoteGuildRankAfterMission(
  currentRank: GuildRank,
  missionId: GuildMissionId,
  inventory: InventoryItem[],
): { nextRank: GuildRank; promoted: boolean } {
  const mission = GUILD_MISSIONS.find((m) => m.id === missionId);
  if (!mission) return { nextRank: currentRank, promoted: false };
  if (rankIndex(mission.promoteToRank) <= rankIndex(currentRank)) {
    return { nextRank: currentRank, promoted: false };
  }
  const nextRank = mission.promoteToRank;
  const badge = inventory.find((it) => it.id.startsWith('rank_badge_'));
  if (badge) {
    badge.id = `rank_badge_${nextRank.toLowerCase()}`;
    badge.name = `${nextRank}-Rank Guild Badge`;
    badge.description = `${RANK_TITLES[nextRank]} badge issued by the Royal Adventurer Guild.`;
    badge.color = nextRank === 'S' ? '#fbbf24' : nextRank === 'A' ? '#e11d48' : nextRank === 'B' ? '#38bdf8' : '#a7f3d0';
  }
  return { nextRank, promoted: true };
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
      x: 170,
      y: FLOOR_Y - 26,
      minX: 105,
      maxX: 295,
      speed: 22,
      facing: 1,
      walkCycle: 0,
      coatColor: '#b45309',
      hairColor: '#f59e0b',
      shirtColor: '#fef3c7',
      dialogue: [
        'Fresh honey-glazed skewer buns and Axel healing herbs! Welcome to Solaris Town!',
        'The Adventure Guild hall is just ahead with the azure pennant—start at F-Rank!',
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
      x: 340,
      y: FLOOR_Y - 26,
      minX: 260,
      maxX: 480,
      speed: 19,
      facing: -1,
      walkCycle: 1.4,
      coatColor: '#334155',
      hairColor: '#475569',
      shirtColor: '#cbd5e1',
      dialogue: [
        'Keep your blade sharp, F-Rank rookie! Goblin caves outside town are teeming with Hobgoblins.',
        'Check the Adventure Guild Reception—you can invite fellow online knights on missions!',
      ],
      crownedDialogue: [
        'Salutes! Solaris Kingdom bows before our newly crowned Royal Champion!',
      ],
    },
    {
      id: 'npc_adventurer_kazuma',
      name: 'Scout Renji',
      role: 'adventurer',
      x: 590,
      y: FLOOR_Y - 26,
      minX: 500,
      maxX: 740,
      speed: 28,
      facing: 1,
      walkCycle: 2.2,
      coatColor: '#15803d',
      hairColor: '#1e1b4b',
      shirtColor: '#fde68a',
      dialogue: [
        'Whoa, did you just tumble out of a dimensional portal? Everyone starts at F-Rank here!',
        'I blew my first quest gold on a fancy crimson coat at Sylvie’s Wardrobe Shop down the plaza.',
      ],
      crownedDialogue: [
        'No way! You went from F-Rank rookie to Crowned Royalty?! Let me buy you a mug at the Guild!',
      ],
    },
    {
      id: 'npc_villager_mira',
      name: 'Baker Mira',
      role: 'townfolk',
      x: 820,
      y: FLOOR_Y - 26,
      minX: 730,
      maxX: 930,
      speed: -24,
      facing: -1,
      walkCycle: 0.7,
      coatColor: '#be123c',
      hairColor: '#92400e',
      shirtColor: '#fff1f2',
      dialogue: [
        'Such bright sunny weather today! Head into the Wardrobe Shop on the right if you want traditional medieval fashion.',
        'Or head into the Adventure Guild to check the live Guild Bulletin rankings!',
      ],
      crownedDialogue: [
        'Hooray for our Royal Sovereign! Confetti is falling across all of Solaris Plaza!',
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
        'Watch out for C-Rank Bandit Archers on the carriage road—keep your parry ready.',
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
        '*Gulps ale* Hic—those B-Rank Demon Realm volcanoes nearly singed my eyebrows clean off!',
        'Wait till you see the 3 Demon Kings... purple flames every two seconds, I tell ya!',
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
        '*Clinks mug* Check the animated Guild Bulletin right above us to see top adventurers & hot missions!',
      ],
      crownedDialogue: [
        isCrowned ? 'Our S-Rank Crowned Sovereign graces the guild tavern! Cheers!' : 'Cheers!',
      ],
    },
    {
      id: 'guild_walker_scout',
      name: 'Courier Toma',
      role: 'adventurer',
      x: 295,
      y: FLOOR_Y - 26,
      minX: 262,
      maxX: 372,
      speed: 24,
      facing: 1,
      walkCycle: 0.4,
      coatColor: '#0f766e',
      hairColor: '#09090b',
      shirtColor: '#ccfbf1',
      dialogue: [
        'Step up to Guild Receptionist Luna at the counter on the right to start missions or invite online players!',
      ],
      crownedDialogue: [
        'Your name is at the very top of the Global Guild Bulletin! Legendary S-Rank!',
      ],
    },
    {
      id: 'guild_receptionist_luna',
      name: 'Receptionist Luna',
      role: 'receptionist',
      x: 416,
      y: FLOOR_Y - 26,
      minX: 416,
      maxX: 416,
      speed: 0,
      facing: -1,
      walkCycle: 0,
      coatColor: '#1e40af',
      hairColor: '#fbbf24',
      shirtColor: '#ffffff',
      dialogue: [
        'Welcome to the Solaris Adventure Guild Reception! Ready to take a Rank Mission or invite allies?',
      ],
      crownedDialogue: [
        'Your Royal Highness! The entire Kingdom celebrates your S-Rank Coronation!',
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

export function buildIsekaiRoomPlatforms(realm: RealmMode): Platform[] {
  const bounds = ISEKAI_ROOM_BOUNDS[realm];
  const w = bounds.maxX + 60;
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
      { id: 'town_balcony_1', x: 380, y: FLOOR_Y - 56, w: 96, h: 10, kind: 'bridge' },
      { id: 'town_balcony_2', x: 675, y: FLOOR_Y - 56, w: 96, h: 10, kind: 'bridge' },
    );
  } else if (realm === 'goblin_dungeon') {
    plats.push(
      { id: 'gob_rock_1', x: 185, y: FLOOR_Y - 44, w: 94, h: 12, kind: 'brick' },
      { id: 'gob_rock_2', x: 410, y: FLOOR_Y - 72, w: 110, h: 12, kind: 'brick' },
      { id: 'gob_rock_3', x: 650, y: FLOOR_Y - 46, w: 98, h: 12, kind: 'brick' },
    );
  } else if (realm === 'demon_realm') {
    plats.push(
      { id: 'dem_ledge_1', x: 205, y: FLOOR_Y - 48, w: 92, h: 12, kind: 'brick' },
      { id: 'dem_ledge_2', x: 460, y: FLOOR_Y - 76, w: 108, h: 12, kind: 'bridge' },
      { id: 'dem_ledge_3', x: 705, y: FLOOR_Y - 48, w: 92, h: 12, kind: 'brick' },
    );
  } else if (realm === 'demon_king_arena') {
    plats.push(
      { id: 'dk_dais_l', x: 96, y: FLOOR_Y - 48, w: 92, h: 10, kind: 'bridge' },
      { id: 'dk_dais_r', x: 416, y: FLOOR_Y - 48, w: 92, h: 10, kind: 'bridge' },
    );
  }
  return plats;
}

export function buildIsekaiRoomInteractables(realm: RealmMode): InteractableProp[] {
  if (realm === 'isekai_town') {
    return [
      {
        id: 'door_adventure_guild',
        x: 412,
        y: FLOOR_Y - 52,
        w: 36,
        h: 52,
        kind: 'guild_door',
        label: 'Enter Adventure Guild',
        speaker: 'Adventure Guild',
        dialogue: ['Stepping into the Solaris Adventure Guild Hall...'],
        activated: false,
      },
      {
        id: 'door_wardrobe_shop',
        x: 704,
        y: FLOOR_Y - 52,
        w: 36,
        h: 52,
        kind: 'wardrobe_door',
        label: 'Enter Wardrobe Shop',
        speaker: 'Atelier Sylvie',
        dialogue: ['Stepping into the Wardrobe Boutique...'],
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
        x: 94,
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
        x: 392,
        y: FLOOR_Y - 36,
        w: 58,
        h: 36,
        kind: 'guild_reception',
        label: 'Guild Reception Desk',
        speaker: 'Receptionist Luna',
        dialogue: ['Opening Guild Missions & Party Invites...'],
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
): EnemyState {
  return {
    id,
    archetype,
    name,
    x,
    y,
    vx: 0,
    vy: 0,
    w,
    h,
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
  };
}

export function createGoblinDungeonWave(missionId: GuildMissionId, waveIdx = 0): EnemyState[] {
  const tier = missionId === 'f_goblin_warren' ? 1 : missionId === 'e_hobgoblin_caves' ? 2 : 3;
  const count = tier === 1 ? 6 : tier === 2 ? 8 : 10;
  const list: EnemyState[] = [];
  for (let i = 0; i < count; i++) {
    const isHob = i % 3 === 1 || (tier >= 2 && i % 2 === 1);
    const x = 230 + i * 74 + (waveIdx % 2) * 16;
    if (isHob) {
      list.push(
        makeEnemy(
          `gob_${tier}_${waveIdx}_${i}`,
          'hobgoblin',
          'Rocky Cavern Hobgoblin',
          x,
          FLOOR_Y - 30,
          72 + tier * 24,
          22,
          30,
          'castle',
          16 + tier * 5,
          12 + tier * 3,
        ),
      );
    } else {
      list.push(
        makeEnemy(
          `gob_${tier}_${waveIdx}_${i}`,
          'goblin_normal',
          'Cavern Goblin',
          x,
          FLOOR_Y - 22,
          36 + tier * 12,
          17,
          22,
          'castle',
          9 + tier * 3,
          8 + tier * 2,
        ),
      );
    }
  }
  return list;
}

export function createCarriageEscortInit(): CarriageEscortState {
  return {
    x: 150,
    y: FLOOR_Y - 46,
    hp: 340,
    maxHp: 340,
    progress: 0,
    speed: 24,
    wheelPhase: 0,
    hitFlash: 0,
    wavesSpawned: 0,
  };
}

export function createBanditWave(carriageX: number, waveIdx: number): EnemyState[] {
  const list: EnemyState[] = [];
  const spawnPositions = [carriageX + 190, carriageX + 255, Math.max(40, carriageX - 135), carriageX + 310];
  spawnPositions.forEach((sx, i) => {
    const isArcher = i % 2 === 1;
    list.push(
      makeEnemy(
        `bandit_${waveIdx}_${i}`,
        isArcher ? 'bandit_archer' : 'bandit_fighter',
        isArcher ? 'Highway Bandit Archer' : 'Brigand Fighter',
        sx,
        FLOOR_Y - 26,
        isArcher ? 56 : 82,
        18,
        26,
        'forest',
        18,
        isArcher ? 12 : 15,
      ),
    );
  });
  return list;
}

export function createDemonRealmWave(): EnemyState[] {
  const specs: { arch: EnemyArchetype; name: string; x: number; y: number; hp: number; w: number; h: number; dmg: number }[] = [
    { arch: 'demon_tank', name: 'Obsidian Demon Tank', x: 250, y: FLOOR_Y - 32, hp: 165, w: 24, h: 32, dmg: 22 },
    { arch: 'demon_lightning', name: 'Tempest Demon Striker', x: 350, y: FLOOR_Y - 28, hp: 110, w: 20, h: 28, dmg: 18 },
    { arch: 'demon_succubus', name: 'Crimson Abyss Succubus', x: 455, y: FLOOR_Y - 68, hp: 96, w: 20, h: 28, dmg: 16 },
    { arch: 'demon_tank', name: 'Magma Vanguard Tank', x: 560, y: FLOOR_Y - 32, hp: 170, w: 24, h: 32, dmg: 22 },
    { arch: 'demon_lightning', name: 'Volt-Claw Demon Fighter', x: 640, y: FLOOR_Y - 28, hp: 115, w: 20, h: 28, dmg: 19 },
    { arch: 'demon_succubus', name: 'Nightmare Range Succubus', x: 730, y: FLOOR_Y - 68, hp: 100, w: 20, h: 28, dmg: 16 },
    { arch: 'demon_tank', name: 'Hellgate Juggernaut', x: 810, y: FLOOR_Y - 32, hp: 180, w: 24, h: 32, dmg: 23 },
    { arch: 'demon_lightning', name: 'Plasma Demon Duelist', x: 870, y: FLOOR_Y - 28, hp: 120, w: 20, h: 28, dmg: 20 },
    { arch: 'demon_succubus', name: 'Caldera Arch-Succubus', x: 920, y: FLOOR_Y - 68, hp: 110, w: 20, h: 28, dmg: 18 },
  ];
  return specs.map((s, i) =>
    makeEnemy(`dem_${i}`, s.arch, s.name, s.x, s.y, s.hp, s.w, s.h, 'volcano', 34, s.dmg),
  );
}

export function createThreeDemonKingsInit(
  foughtIsekaiEnemies: EnemyArchetype[],
): { demonKings: DemonKingEntity[]; minions: EnemyState[] } {
  const demonKings: DemonKingEntity[] = [
    {
      id: 'dk_1',
      index: 1,
      name: 'Demon King Malakor',
      title: 'First Sovereign of Violet Ash',
      x: 340,
      y: FLOOR_Y - 44,
      vx: 0,
      vy: 0,
      w: 30,
      h: 44,
      hp: 360,
      maxHp: 360,
      facing: -1,
      hitFlash: 0,
      purpleFlameTimer: 1.2,
      castIndex: 0,
      activeSkillBanner: null,
      activeSkillTimer: 0,
      primaryColor: '#7e22ce',
      hornColor: '#fef08a',
      auraColor: '#c084fc',
      defeated: false,
    },
    {
      id: 'dk_2',
      index: 2,
      name: 'Demon King Vaelgor',
      title: 'Second Sovereign of Abyssal Flame',
      x: 455,
      y: FLOOR_Y - 44,
      vx: 0,
      vy: 0,
      w: 30,
      h: 44,
      hp: 400,
      maxHp: 400,
      facing: -1,
      hitFlash: 0,
      purpleFlameTimer: 1.85,
      castIndex: 1,
      activeSkillBanner: null,
      activeSkillTimer: 0,
      primaryColor: '#581c87',
      hornColor: '#f43f5e',
      auraColor: '#e879f9',
      defeated: false,
    },
    {
      id: 'dk_3',
      index: 3,
      name: 'Demon King Zarakiel',
      title: 'Supreme Sovereign of Violet Ruin',
      x: 555,
      y: FLOOR_Y - 46,
      vx: 0,
      vy: 0,
      w: 32,
      h: 46,
      hp: 450,
      maxHp: 450,
      facing: -1,
      hitFlash: 0,
      purpleFlameTimer: 2.0,
      castIndex: 2,
      activeSkillBanner: null,
      activeSkillTimer: 0,
      primaryColor: '#4c1d95',
      hornColor: '#a855f7',
      auraColor: '#d946ef',
      defeated: false,
    },
  ];

  // Include diverse enemies you have ever fought across the Isekai world!
  const defaultRoster: EnemyArchetype[] = [
    'goblin_normal',
    'hobgoblin',
    'bandit_fighter',
    'bandit_archer',
    'demon_succubus',
    'demon_tank',
    'demon_lightning',
  ];
  const pool = foughtIsekaiEnemies.length > 0 ? foughtIsekaiEnemies : defaultRoster;
  const labelByArch: Record<EnemyArchetype, { name: string; hp: number; w: number; h: number; dmg: number; yOff: number }> = {
    skeleton_guard: { name: 'Risen Guard', hp: 60, w: 20, h: 26, dmg: 12, yOff: 26 },
    shadow_bat: { name: 'Abyss Bat', hp: 40, w: 18, h: 14, dmg: 10, yOff: 64 },
    cultist_mage: { name: 'Hex Mage', hp: 50, w: 20, h: 26, dmg: 12, yOff: 26 },
    gargoyle_charger: { name: 'Basalt Gargoyle', hp: 70, w: 20, h: 26, dmg: 14, yOff: 26 },
    cursed_armor: { name: 'Cursed Knight', hp: 85, w: 22, h: 28, dmg: 16, yOff: 28 },
    phantom_wisp: { name: 'Spirit Wisp', hp: 48, w: 20, h: 26, dmg: 12, yOff: 56 },
    goblin_normal: { name: 'Echo Goblin', hp: 48, w: 17, h: 22, dmg: 10, yOff: 22 },
    hobgoblin: { name: 'Echo Hobgoblin', hp: 88, w: 22, h: 30, dmg: 14, yOff: 30 },
    bandit_fighter: { name: 'Royal-Road Brigand', hp: 82, w: 18, h: 26, dmg: 14, yOff: 26 },
    bandit_archer: { name: 'Royal-Road Archer', hp: 64, w: 18, h: 26, dmg: 12, yOff: 26 },
    demon_succubus: { name: 'Void Succubus', hp: 92, w: 20, h: 28, dmg: 15, yOff: 66 },
    demon_tank: { name: 'Abyssal Demon Tank', hp: 135, w: 24, h: 32, dmg: 18, yOff: 32 },
    demon_lightning: { name: 'Volt Demon Striker', hp: 98, w: 20, h: 28, dmg: 16, yOff: 28 },
  };

  const uniqueSample = Array.from(new Set(pool)).slice(0, 4);
  const minions = uniqueSample.map((arch, idx) => {
    const spec = labelByArch[arch] ?? labelByArch.goblin_normal;
    return makeEnemy(
      `dk_minion_${idx}`,
      arch,
      spec.name,
      240 + idx * 92,
      FLOOR_Y - spec.yOff,
      spec.hp,
      spec.w,
      spec.h,
      'volcano',
      25,
      spec.dmg,
    );
  });

  return { demonKings, minions };
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

export function createDefaultGuildBulletin(
  playerName = 'BasteraKnight',
  playerRank: GuildRank = 'F',
): GuildBulletinSnapshot {
  const rankBoost = (rankIndex(playerRank) + 1) * 280;
  const rankings: GuildBulletinRankingEntry[] = [
    { name: 'Alden of Axel', rank: 'S', score: 4820, title: 'Dragonbane Sovereign' },
    { name: 'Freya Silverwind', rank: 'A', score: 3690, title: 'Volcano Vanguard' },
    { name: 'Kaito Blade', rank: 'B', score: 2540, title: 'Carriage Protector' },
    { name: playerName, rank: playerRank, score: rankBoost, title: RANK_TITLES[playerRank] },
  ];
  return {
    rankings: rankings.sort((a, b) => b.score - a.score),
    popularMissions: [
      { missionId: 'f_goblin_warren', title: 'Goblin Warren Clearing', rankReq: 'F', activeParties: 14, completions: 289 },
      { missionId: 'c_princess_carriage', title: 'Royal Princess Carriage Escort', rankReq: 'C', activeParties: 9, completions: 142 },
      { missionId: 'b_demon_invasion', title: 'Demon Realm Volcano Vanguard', rankReq: 'B', activeParties: 6, completions: 78 },
      { missionId: 'a_three_demon_kings', title: 'Three Demon Kings Judgment', rankReq: 'A', activeParties: 2, completions: 19 },
    ],
    tickerText: `LIVE GUILD WIRE: Solaris Adventurers surging in Goblin Warren · Demon Realm Volcanoes erupting · Send party invites at Reception!`,
  };
}
