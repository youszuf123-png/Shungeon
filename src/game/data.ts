import type {
  BiomeId,
  BossDef,
  InventoryItem,
  SkillDef,
  SkillId,
  WeaponDef,
  WeaponId,
} from './types';

export const TOTAL_BOSSES = 120;
export const BOSSES_PER_BIOME = 40;
export const TOTAL_HIDDEN_PASSAGES = 108;

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  claymore: {
    id: 'claymore',
    name: "Abandoned Knight's Claymore",
    styleName: 'Vanguard Style',
    description: 'Wide sweeping arc with heavy poise break and royal cleave.',
    sarcasticNote: 'Slightly rusted, smells like old monarchy, hits like a carriage.',
    damage: 28,
    range: 38,
    arcHeight: 30,
    windup: 0.11,
    active: 0.14,
    recovery: 0.16,
    comboHits: 3,
    knockback: 145,
    color: '#e2e8f0',
    accentColor: '#d97706',
    unlockedByDefault: true,
  },
  rapier: {
    id: 'rapier',
    name: 'Gilded Court Rapier',
    styleName: 'Duelist Style',
    description: 'Rapid 4-hit precision thrusts with forward lunge and crit speed.',
    sarcasticNote: 'For poking aristocratic monsters politely between the ribs.',
    damage: 19,
    range: 42,
    arcHeight: 16,
    windup: 0.05,
    active: 0.09,
    recovery: 0.08,
    comboHits: 4,
    knockback: 80,
    color: '#fef08a',
    accentColor: '#eab308',
    unlockedByDefault: true,
  },
  crescent: {
    id: 'crescent',
    name: 'Twin Crescent Sabers',
    styleName: 'Tempest Style',
    description: 'Twin-blade spinning flurry that strikes both front and back.',
    sarcasticNote: 'Twice the blades, half the impulse control.',
    damage: 22,
    range: 34,
    arcHeight: 34,
    windup: 0.06,
    active: 0.12,
    recovery: 0.1,
    comboHits: 5,
    knockback: 105,
    color: '#93c5fd',
    accentColor: '#3b82f6',
    unlockedByDefault: false,
    craftCost: { resourceId: 'royal_ember', amount: 3 },
  },
  runeblade: {
    id: 'runeblade',
    name: 'Shattered Throne Greatsword',
    styleName: 'Arcane Breaker Style',
    description: 'Massive overhead cleave that launches a candlefire shockwave.',
    sarcasticNote: 'Forged from a melted chandelier and pure spite.',
    damage: 40,
    range: 44,
    arcHeight: 38,
    windup: 0.16,
    active: 0.16,
    recovery: 0.2,
    comboHits: 2,
    knockback: 210,
    color: '#fca5a5',
    accentColor: '#dc2626',
    unlockedByDefault: false,
    craftCost: { resourceId: 'ruin_shard', amount: 4 },
  },
  katana: {
    id: 'katana',
    name: 'Obsidian Void Katana',
    styleName: 'Iaido Flash Style',
    description: 'Instant draw-cut with razor reach and crimson echo slash.',
    sarcasticNote: 'Nothing personal, just a very dramatic horizontal line.',
    damage: 34,
    range: 48,
    arcHeight: 24,
    windup: 0.04,
    active: 0.1,
    recovery: 0.12,
    comboHits: 3,
    knockback: 130,
    color: '#c4b5fd',
    accentColor: '#7c3aed',
    unlockedByDefault: false,
    craftCost: { resourceId: 'magma_core', amount: 3 },
  },
  fire_sword: {
    id: 'fire_sword',
    name: 'Fire Sword',
    styleName: '2x Infernal Overlord Style',
    description: 'OP hidden blade from behind the 1st Checkpoint — unleashes roaring red-orange flame arcs with 2x total damage!',
    sarcasticNote: 'Broke three dungeon seals and every single boss health bar.',
    damage: 38,
    damageMultiplier: 2,
    range: 54,
    arcHeight: 40,
    windup: 0.06,
    active: 0.14,
    recovery: 0.11,
    comboHits: 4,
    knockback: 225,
    color: '#fb923c',
    accentColor: '#dc2626',
    unlockedByDefault: false,
  },
};

export const SKILLS: Record<SkillId, SkillDef> = {
  blade_dash: {
    id: 'blade_dash',
    name: 'Phantom Lunge',
    shortTag: 'DASH',
    description: 'Invulnerable dash through enemies leaving a blade trail.',
    cooldown: 2.2,
    staminaCost: 18,
    damageMultiplier: 1.4,
    color: '#fbbf24',
  },
  parry_guard: {
    id: 'parry_guard',
    name: 'Royal Deflect',
    shortTag: 'PARRY',
    description: 'Raise stance for 0.45s; blocks blows and counters with gold shockwave.',
    cooldown: 3.0,
    staminaCost: 12,
    damageMultiplier: 1.8,
    color: '#f59e0b',
  },
  candlefire_wave: {
    id: 'candlefire_wave',
    name: 'Candlefire Arc',
    shortTag: 'WAVE',
    description: 'Unleash a blazing wax-fire projectile across the corridor.',
    cooldown: 2.8,
    staminaCost: 22,
    damageMultiplier: 1.5,
    color: '#f97316',
  },
  chrono_freeze: {
    id: 'chrono_freeze',
    name: 'Stopped Second',
    shortTag: 'TIME',
    description: 'Freeze nearby monsters & projectiles in emerald time for 2.2s.',
    cooldown: 7.5,
    staminaCost: 30,
    damageMultiplier: 1.1,
    color: '#34d399',
  },
  stand_rush: {
    id: 'stand_rush',
    name: 'ORA ORA',
    shortTag: 'ORA ORA',
    description: 'Summon a Bastera-themed Star Platinum spirit that punches enemies rapidly for 2.5s.',
    cooldown: 5.5,
    staminaCost: 24,
    damageMultiplier: 2.5,
    color: '#a78bfa',
  },
  sunburst_cleave: {
    id: 'sunburst_cleave',
    name: 'Hamon Sunburst',
    shortTag: 'SOLAR',
    description: 'Golden ripple slam dealing heavy radial damage around you.',
    cooldown: 5.5,
    staminaCost: 28,
    damageMultiplier: 2.1,
    color: '#fde047',
  },
};

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'crimson_vial',
    name: 'Crimson Candle Vial',
    category: 'potion',
    description: 'Restores 45 HP immediately.',
    sarcasticQuote: 'Tastes like fermented raspberries and questionable alchemy.',
    count: 3,
    color: '#ef4444',
    healAmount: 45,
  },
  {
    id: 'royal_ember',
    name: 'Royal Ember',
    category: 'resource',
    description: 'Warm wax-infused cinder from Castle guards and chests.',
    sarcasticQuote: 'Never melts, still somehow burns your pockets.',
    count: 1,
    color: '#f59e0b',
  },
  {
    id: 'ruin_shard',
    name: 'Ancient Ruin Shard',
    category: 'resource',
    description: 'Moss-etched rune crystal from enchanted corridors.',
    sarcasticQuote: 'Glows ominously whenever you make poor life choices.',
    count: 0,
    color: '#34d399',
  },
  {
    id: 'magma_core',
    name: 'Volcano Magma Core',
    category: 'resource',
    description: 'Superheated obsidian heart from hellish champions.',
    sarcasticQuote: 'Warm enough to brew tea, dangerous enough to melt your sword.',
    count: 0,
    color: '#f97316',
  },
  {
    id: 'velvet_crest',
    name: 'Velvet Crest Relic',
    category: 'relic',
    description: 'Passively boosts Max HP by +15 while carried.',
    sarcasticQuote: 'A royal monogram that says "do not die on the good carpet."',
    count: 1,
    color: '#d97706',
    maxHpBonus: 15,
  },
];

export function getBiomeForBossIndex(bossNumber: number): BiomeId {
  if (bossNumber <= BOSSES_PER_BIOME) return 'castle';
  if (bossNumber <= BOSSES_PER_BIOME * 2) return 'volcano';
  return 'forest';
}

export function getBiomeDisplayName(biome: BiomeId): string {
  if (biome === 'castle') return 'Abandoned Royal Castle';
  if (biome === 'volcano') return 'Volcano Hell Citadel';
  return 'Enchanted Ruins Forest';
}

const JOJO_PREFIXES = [
  'Lord',
  'Baron',
  'Count',
  'Viceroy',
  'Sir',
  'Archduke',
  'Maestro',
  'Cardinal',
  'Warden',
  'Emperor',
  'Marquis',
  'Dread',
  'Grand',
  'Inquisitor',
  'Knight',
  'Sovereign',
];

const JOJO_NAMES = [
  'Dio Brando',
  'Karsius',
  'Esidisius',
  'Wamuu',
  'Zeppelio',
  'Kira-Vane',
  'Diavolo',
  'Puccini',
  'Valentino',
  'Tooru-Vex',
  'Polnarex',
  'Avdolis',
  'Kakyoinor',
  'Okuyas',
  'Rohanor',
  'Risotto',
  'Prosciutto',
  'Ghiaccio',
  'Cioccolata',
  'Weather',
  'Petshop',
  'D’Arby',
  'N’Doul',
  'Vanilla Ice',
  'Otomo',
  'Pesci',
  'Formaggio',
  'Illuso',
  'Melone',
  'Secco',
  'Ringo',
  'Blackmore',
];

const STAND_ADJECTIVES = [
  'Crimson',
  'Golden',
  'Silver',
  'Starlight',
  'Killer',
  'Sticky',
  'Crazy',
  'Made-in',
  'Dirty',
  'Wonder',
  'Purple',
  'Metallica',
  'Echoing',
  'Hierophant',
  'Stone',
  'Magician',
  'Black',
  'White',
  'Hermit',
  'Scary',
];

const STAND_NOUNS = [
  'World',
  'Queen',
  'King',
  'Moon',
  'Train',
  'Phantom',
  'Requiem',
  'Chariot',
  'Diamond',
  'Experience',
  'Heaven',
  'Calamity',
  'Valkyrie',
  'Pendulum',
  'Sovereign',
  'Haze',
  'Sabbath',
  'Cream',
  'Album',
  'Emperor',
];

const BOSS_CLIMATES: {
  id: BossDef['climate'];
  label: string;
  skyTop: string;
  skyBottom: string;
  particle: string;
}[] = [
  { id: 'blood_moon_ash', label: 'Blood Moon Ashfall', skyTop: '#16040a', skyBottom: '#3d0b1a', particle: '#fb7185' },
  { id: 'crimson_thunder', label: 'Crimson Lightning Storm', skyTop: '#0d0618', skyBottom: '#3b0d24', particle: '#fde047' },
  { id: 'blizzard_frost', label: 'Absolute Zero Blizzard', skyTop: '#041224', skyBottom: '#13314d', particle: '#bae6fd' },
  { id: 'arcane_eclipse', label: 'Violet Solar Eclipse', skyTop: '#0a041a', skyBottom: '#2d114d', particle: '#c084fc' },
  { id: 'acid_spore_mist', label: 'Venomous Spore Fog', skyTop: '#06140c', skyBottom: '#163b22', particle: '#a3e635' },
  { id: 'emerald_monsoon', label: 'Emerald Tempest Gale', skyTop: '#041718', skyBottom: '#0f3d38', particle: '#34d399' },
  { id: 'magma_emberstorm', label: 'Infernal Ember Hurricane', skyTop: '#1c0403', skyBottom: '#59160a', particle: '#fb923c' },
  { id: 'void_time_fracture', label: 'Shattered Chrono Rift', skyTop: '#070914', skyBottom: '#1b2042', particle: '#38bdf8' },
  { id: 'solar_mirage', label: 'Blinding Hamon Zenith', skyTop: '#1c1104', skyBottom: '#4f2c09', particle: '#fef08a' },
  { id: 'obsidian_sandstorm', label: 'Obsidian Shard Squall', skyTop: '#120b0d', skyBottom: '#331d21', particle: '#cbd5e1' },
  { id: 'phantom_fog', label: 'Wraith Candle Mist', skyTop: '#0e0a14', skyBottom: '#291b38', particle: '#e9d5ff' },
  { id: 'starlight_aurora', label: 'Astral Requiem Aurora', skyTop: '#040e1c', skyBottom: '#122f47', particle: '#5eead4' },
];

const HAT_STYLES: BossDef['hatStyle'][] = [
  'crown',
  'pompadour',
  'tophat',
  'visor',
  'hood',
  'horns',
  'halo_spikes',
  'samurai_crest',
];

const COAT_STYLES: BossDef['coatStyle'][] = [
  'cape',
  'trench',
  'armor',
  'vest',
  'robes',
  'spiked_mantle',
];

const STAND_SHAPES: BossDef['standShape'][] = [
  'brawler',
  'reaper',
  'knight',
  'clockwork',
  'serpent',
  'sovereign',
];

const EMBLEMS: BossDef['emblem'][] = [
  'star',
  'clock',
  'skull',
  'diamond',
  'eye',
  'flame',
];

const ATTACK_SYSTEMS: {
  pattern: BossDef['attackPattern'];
  name: string;
  shoutVerb: string;
}[] = [
  { pattern: 'time_knives', name: 'Chrono Knife Barrage', shoutVerb: 'freeze time and unleash a hundred silver knives' },
  { pattern: 'stand_barrage', name: 'MUDA Overdrive Flurry', shoutVerb: 'pulverize your armor in a hundred fists' },
  { pattern: 'pillar_slam', name: 'Royal Pillar Cataclysm', shoutVerb: 'crack the cathedral floor beneath you' },
  { pattern: 'gravity_orb', name: 'C-Moon Singularity Crush', shoutVerb: 'invert gravity until your ribs sing' },
  { pattern: 'blood_scythe', name: 'Crimson Crescent Sever', shoutVerb: 'slice your shadow clean off the carpet' },
  { pattern: 'lightning_overdrive', name: 'Red Stone Thunder Arc', shoutVerb: 'strike with a million volts of Stand lightning' },
  { pattern: 'magma_eruption', name: 'Magician Flare Eruption', shoutVerb: 'incinerate this hall in volcanic fire' },
  { pattern: 'chrono_shear', name: 'King Erase Dimensional Cut', shoutVerb: 'erase the next two seconds and cut right through' },
];

const VOICE_OPENERS = [
  'KONO {NAME} DA!',
  'Yare yare daze...',
  'WRYYYYY! Behold {STAND}!',
  'Oh? You approach {NAME}?',
  'Dojyaaan! Welcome to {CLIMATE}!',
  'Arrivederci, little knight!',
  'Hoho! Even here in {CLIMATE}?!',
  'NANI?! Someone survived to floor {IDX}?',
  'Listen well to {STAND}!',
  'Muda, muda, MUDA!',
];

const VOICE_BODIES = [
  'My {STAND} shall {VERB}!',
  'Not even 108 hidden passages can save you from {STAND}’s {ATTACK}!',
  'Under the {CLIMATE}, {STAND}’s power grows tenfold!',
  'Step one inch closer to Floor {IDX} and witness {ATTACK}!',
  'Your tiny sword style cannot out-pose {STAND}!',
  'Three centuries on Floor {IDX} end with {ATTACK}!',
  'The air itself bows to {STAND} in {CLIMATE}!',
  'Even your three skill slots will shatter against {STAND}’s {ATTACK}!',
  'I, {NAME}, already foresaw your next slash—now taste {ATTACK}!',
  'Bow before Floor {IDX}, or be erased by {STAND}!',
  'Your candle flickers out the instant {STAND} unleashes {ATTACK}!',
  'No escape, no mercy—only {STAND} and {CLIMATE}!',
];

const DEFEAT_LINES = [
  'NANI?! {STAND} shattered against a dungeon knight?!',
  'Impossible! How did you break through my {ATTACK}?!',
  'Curse you... the {CLIMATE} fades with my pride...',
  'Yare yare... {NAME} acknowledges your blade on Floor {IDX}.',
  'WRYYY... my glorious crown... ruined in front of {STAND}!',
  'Wait—did you actually parry {ATTACK}?! Unbelievable!',
  'Take the loot, warrior... tell the next bosses {NAME} went down posing!',
  'Even in {CLIMATE}, my Stand could not stop your resolve!',
];

const SCALES = [
  [0, 2, 3, 5, 7, 8, 11], // Harmonic minor
  [0, 1, 4, 5, 7, 8, 10], // Phrygian dominant
  [0, 2, 4, 6, 7, 9, 11], // Lydian
  [0, 3, 5, 6, 7, 10],    // Blues minor
  [0, 1, 3, 5, 7, 8, 10], // Phrygian
];

function hslHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.max(0, Math.min(100, s)) / 100;
  const lig = Math.max(0, Math.min(100, l)) / 100;
  const k = (n: number) => (n + hue / 30) % 12;
  const a = sat * Math.min(lig, 1 - lig);
  const f = (n: number) => lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

export function getBossDef(bossIndex: number): BossDef {
  const safeIndex = Math.max(1, bossIndex);
  const zero = safeIndex - 1;
  const biome = getBiomeForBossIndex((zero % TOTAL_BOSSES) + 1);

  const prefix = JOJO_PREFIXES[(zero * 5 + 3) % JOJO_PREFIXES.length];
  const baseName = JOJO_NAMES[(zero * 7 + Math.floor(zero / 12)) % JOJO_NAMES.length];
  const numeral =
    zero >= JOJO_NAMES.length
      ? ` ${['II', 'III', 'IV', 'V', 'VI', 'VII'][Math.floor(zero / JOJO_NAMES.length) % 6]}`
      : '';
  const name = `${prefix} ${baseName}${numeral}`;

  const standAdj = STAND_ADJECTIVES[(zero * 3 + 1) % STAND_ADJECTIVES.length];
  const standNoun = STAND_NOUNS[(zero * 11 + 5) % STAND_NOUNS.length];
  const standName = `${standAdj} ${standNoun}`;

  // Unique climate per boss (combining 12 climates + unique hue-shifted sky tints!)
  const climateBase = BOSS_CLIMATES[(zero * 5 + Math.floor(zero / 12)) % BOSS_CLIMATES.length];
  const hue = (zero * 137 + (biome === 'castle' ? 345 : biome === 'forest' ? 145 : 15)) % 360;
  const primaryColor = hslHex(hue, 72, 42);
  const secondaryColor = hslHex(hue + 42, 85, 62);
  const auraColor = hslHex(hue + 195, 88, 66);

  const attackSys = ATTACK_SYSTEMS[(zero * 3 + Math.floor(zero / 8)) % ATTACK_SYSTEMS.length];
  const opener = VOICE_OPENERS[(zero * 7 + Math.floor(zero / 10)) % VOICE_OPENERS.length];
  const body = VOICE_BODIES[(zero * 11 + Math.floor(zero / 12)) % VOICE_BODIES.length];
  const defeatTpl = DEFEAT_LINES[(zero * 5 + 2) % DEFEAT_LINES.length];

  const fillTokens = (tpl: string) =>
    tpl
      .replace(/\{NAME\}/g, name)
      .replace(/\{STAND\}/g, standName)
      .replace(/\{CLIMATE\}/g, climateBase.label)
      .replace(/\{ATTACK\}/g, attackSys.name)
      .replace(/\{VERB\}/g, attackSys.shoutVerb)
      .replace(/\{IDX\}/g, String(safeIndex));

  const rawVoice = fillTokens(`${opener} ${body}`);
  const voiceLine = rawVoice.includes(String(safeIndex))
    ? rawVoice
    : `${rawVoice} [Floor ${safeIndex}]`;
  const battleShout = fillTokens(`${standName}—${attackSys.name}!`);
  const defeatLine = fillTokens(defeatTpl);

  const rootNotes = [110, 123.47, 130.81, 146.83, 164.81, 174.61, 196];
  const rootHz = rootNotes[(zero * 3) % rootNotes.length];
  const scale =
    SCALES[(zero * 2 + (biome === 'volcano' ? 4 : biome === 'forest' ? 2 : 0)) % SCALES.length];
  const bpm = 124 + ((zero * 9) % 44);
  const waves: BossDef['music']['leadWave'][] = ['sawtooth', 'square', 'triangle'];

  const bossTitles =
    biome === 'castle'
      ? ['Phantom Sentinel', 'Crimson Baron', 'Royal Usurper', 'Sovereign Duelist']
      : biome === 'forest'
        ? ['Ancient Hierophant', 'Emerald Warden', 'Ruin Reaper', 'Moss Overlord']
        : ['Hellfire Tyrant', 'Calamity King', 'Obsidian Archon', 'Magma Requiem'];
  const epithet = bossTitles[(zero + Math.floor(zero / 4)) % bossTitles.length];

  return {
    index: safeIndex,
    name,
    title: `Floor ${safeIndex} · ${epithet}`,
    standName,
    biome,
    climate: climateBase.id,
    climateLabel: `${climateBase.label} · Ch.${safeIndex}`,
    climateSkyTop: hslHex(hue, 45, 7),
    climateSkyBottom: hslHex(hue + 18, 52, 18),
    climateParticleColor: climateBase.particle,
    maxHp: Math.round(115 + zero * 14),
    primaryColor,
    secondaryColor,
    auraColor,
    skinColor: zero % 5 === 0 ? '#d8b4fe' : zero % 4 === 0 ? '#fde68a' : '#fed7aa',
    hatStyle: HAT_STYLES[(zero * 3 + Math.floor(zero / 8)) % HAT_STYLES.length],
    coatStyle: COAT_STYLES[(zero * 5 + Math.floor(zero / 6)) % COAT_STYLES.length],
    standShape: STAND_SHAPES[(zero * 7 + Math.floor(zero / 10)) % STAND_SHAPES.length],
    emblem: EMBLEMS[(zero * 11 + 2) % EMBLEMS.length],
    scaleFactor: Number((1.42 + (zero % 5) * 0.08).toFixed(2)),
    voiceLine,
    battleShout,
    defeatLine,
    attackPattern: attackSys.pattern,
    attackName: attackSys.name,
    music: {
      bpm,
      rootHz,
      scale,
      leadWave: waves[zero % waves.length],
      bassPattern: [0, 0, 7, 0, 5, 3, 2, 0].map((v, i) => (v + ((zero + i) % 3)) % 8),
      motifSeed: safeIndex * 97 + 13,
    },
  };
}

export const SARCASTIC_OBJECT_DIALOGUES = {
  throne: [
    [
      'An ornate velvet throne. Whoever ruled here forgot to hire a dusting wizard.',
      'You sit for half a second. Still no dental plan. Back to escaping.',
    ],
    [
      'The Royal Seat of Eternal Taxes. Surprisingly comfy, suspiciously sticky.',
      'Even abandoned monarchs apparently refused to leave cushions behind.',
    ],
    [
      'A gilded throne with gold tassels. A ghost probably claims it as an Airbnb.',
    ],
  ],
  broken_brick: [
    [
      'Cracked masonry! Either ancient siege damage or a boss punched it for dramatic effect.',
      'Pro tip: hitting suspiciously cracked bricks might reveal one of 108 hidden passages.',
    ],
    [
      'Bricks held together by centuries of moss and pure architectural stubbornness.',
    ],
  ],
  candle: [
    [
      'These candles have burned for 400 years without dripping. Truly terrifying wax budget.',
    ],
  ],
  checkpoint: [
    [
      'Royal Checkpoint Brazier lit! Your miserable progress has been politely notarized.',
      'HP and Stamina restored. Try not to immediately walk into a Stand barrage.',
    ],
  ],
  chest: [
    [
      'A royal coffer left unguarded. Either a trap or terrible castle security.',
    ],
  ],
  tapestry: [
    [
      'A faded crimson tapestry depicting a king tripping down these exact stairs.',
      'Wait—there is a draft coming from behind the fabric!',
    ],
  ],
  escape_gate: [
    [
      'The Grand Escape Gate of Bastera! Sunlight—or at least slightly less cursed air—awaits!',
    ],
  ],
};
