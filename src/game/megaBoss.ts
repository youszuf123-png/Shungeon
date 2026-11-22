import { getBossDefeatedMultiplier } from './data';
import type { ActiveBoss, BiomeId, BossDef, MegaBossArchetype, MegaBossSkillDef } from './types';

export const MEGA_BOSS_SPAWN_CHANCE = 0.10; // 10% chance on every boss defeat

export const DIO_MEGA_SKILLS: MegaBossSkillDef[] = [
  {
    id: 'crimson_crescent_sword',
    name: 'Scarlet World Crescent',
    animStyle: 'mega_cross_swords',
    palette: ['#f43f5e', '#22d3ee', '#fde047'],
    damageMult: 1.55,
    shout: 'WRYYYY! Crimson & cyan dual vampire greatswords cleave reality!',
  },
  {
    id: 'chrono_prism_knives',
    name: 'Prism Time-Stop Knives',
    animStyle: 'mega_prism_knives',
    palette: ['#fde047', '#ec4899', '#38bdf8'],
    damageMult: 1.6,
    shout: 'CHECKMATE DA! A swirling storm of vibrant prism blades converges!',
  },
  {
    id: 'za_warudo_eclipse',
    name: 'Over Heaven Eclipse',
    animStyle: 'mega_clock_shatter',
    palette: ['#a855f7', '#34d399', '#fef08a'],
    damageMult: 1.75,
    shout: 'ZA WARUDO! Fractured emerald clockwork shatters your guard!',
  },
  {
    id: 'blood_nova_flurry',
    name: 'MUDA Rainbow Overdrive',
    animStyle: 'mega_rainbow_barrage',
    palette: ['#ef4444', '#fb923c', '#fde047'],
    damageMult: 1.65,
    shout: 'MUDA MUDA MUDA! Seven-color blazing vampire slash barrage!',
  },
];

export const UNDEAD_KNIGHT_MEGA_SKILLS: MegaBossSkillDef[] = [
  {
    id: 'abyssal_doom_cleave',
    name: 'Abyssal Eclipse Guillotine',
    animStyle: 'mega_guillotine',
    palette: ['#8b5cf6', '#22d3ee', '#f8fafc'],
    damageMult: 1.75,
    shout: 'KNEEL! A colossal violet-cyan rune greatsword cleaves the sky!',
  },
  {
    id: 'spectral_blade_vortex',
    name: 'Eightfold Phantom Blades',
    animStyle: 'mega_sword_vortex',
    palette: ['#34d399', '#38bdf8', '#e879f9'],
    damageMult: 1.6,
    shout: 'RISE, FALLEN SWORDS! An orbital ring of neon blades erupts!',
  },
  {
    id: 'soulfire_judgment',
    name: 'Soulfire Citadel Eruption',
    animStyle: 'mega_soulfire_pillars',
    palette: ['#fb923c', '#e879f9', '#fde047'],
    damageMult: 1.65,
    shout: 'ASH TO ASH! Roaring pillars of violet-orange soulflame surge upward!',
  },
  {
    id: 'phantom_cross_execution',
    name: 'Dread Cross Execution',
    animStyle: 'mega_cross_execution',
    palette: ['#f472b6', '#fbbf24', '#22d3ee'],
    damageMult: 1.7,
    shout: 'NO ESCAPE! Triple hyper-vibrant cursed sword arcs intersect!',
  },
];

export function shouldTriggerMegaBossGlitch(rng: () => number = Math.random): boolean {
  return rng() < MEGA_BOSS_SPAWN_CHANCE;
}

export function pickMegaBossArchetype(rng: () => number = Math.random): MegaBossArchetype {
  return rng() < 0.5 ? 'mega_dio' : 'mega_undead_knight';
}

export function createMegaBossDef(
  archetype: MegaBossArchetype,
  floorIndex: number,
  biome: BiomeId,
  bossesDefeated = 0,
): BossDef {
  const safeFloor = Math.max(1, floorIndex);
  const defeatedScale = getBossDefeatedMultiplier(bossesDefeated);
  const baseMaxHp = Math.max(380, Math.round((190 + safeFloor * 26) * 2.15));
  const scaledHp = Math.round(baseMaxHp * defeatedScale);

  if (archetype === 'mega_dio') {
    return {
      index: 900 + safeFloor,
      name: 'DIO, Vampire Sovereign',
      title: `DIMENSIONAL BREACH · MEGA BOSS`,
      standName: 'THE WORLD OVER HEAVEN',
      biome,
      climate: 'void_time_fracture',
      climateLabel: 'Glitched Chrono Breach',
      climateSkyTop: '#160422',
      climateSkyBottom: '#4c052d',
      climateParticleColor: '#fde047',
      maxHp: scaledHp,
      baseMaxHp,
      defeatedScale,
      primaryColor: '#eab308',
      secondaryColor: '#f43f5e',
      auraColor: '#22d3ee',
      skinColor: '#fef3c7',
      isMegaBoss: true,
      megaArchetype: 'mega_dio',
      megaSkills: DIO_MEGA_SKILLS,
      hatStyle: 'halo_spikes',
      coatStyle: 'cape',
      standShape: 'brawler',
      emblem: 'clock',
      scaleFactor: 1.85,
      voiceLine:
        'Kono DIO da!! Reality glitched open so I could personally sever your fate!',
      battleShout: 'THE WORLD OVER HEAVEN — CRIMSON ECLIPSE!',
      defeatLine:
        'Impossible...!! Even with reality tearing apart, your blade reached DIO?!',
      attackPattern: 'chrono_shear',
      attackName: 'Scarlet World Crescent',
      music: {
        bpm: 158,
        rootHz: 146.83,
        scale: [0, 1, 4, 5, 7, 8, 10],
        leadWave: 'sawtooth',
        bassPattern: [0, 0, 7, 0, 5, 3, 2, 1],
        motifSeed: 777 + safeFloor,
      },
    };
  }

  return {
    index: 950 + safeFloor,
    name: 'Malakor, Undead Dread Knight',
    title: `DIMENSIONAL BREACH · MEGA BOSS`,
    standName: 'ABYSSAL ECLIPSE',
    biome,
    climate: 'crimson_thunder',
    climateLabel: 'Glitched Soulfire Rift',
    climateSkyTop: '#08051a',
    climateSkyBottom: '#2d0a3b',
    climateParticleColor: '#38bdf8',
    maxHp: scaledHp,
    baseMaxHp,
    defeatedScale,
    primaryColor: '#475569',
    secondaryColor: '#8b5cf6',
    auraColor: '#34d399',
    skinColor: '#cbd5e1',
    isMegaBoss: true,
    megaArchetype: 'mega_undead_knight',
    megaSkills: UNDEAD_KNIGHT_MEGA_SKILLS,
    hatStyle: 'horns',
    coatStyle: 'armor',
    standShape: 'knight',
    emblem: 'skull',
    scaleFactor: 1.9,
    voiceLine:
      'I tore through the citadel seal! Draw your blade against the Undead Dread Knight!',
    battleShout: 'ABYSSAL ECLIPSE — SOULFIRE GUILLOTINE!',
    defeatLine:
      'My cursed armor cracks... Yet the abyss remembers a warrior of such fury...',
    attackPattern: 'pillar_slam',
    attackName: 'Abyssal Eclipse Guillotine',
    music: {
      bpm: 152,
      rootHz: 123.47,
      scale: [0, 2, 3, 5, 7, 8, 11],
      leadWave: 'sawtooth',
      bassPattern: [0, 0, 5, 0, 7, 3, 1, 0],
      motifSeed: 888 + safeFloor,
    },
  };
}

export function createMegaBossInstance(
  archetype: MegaBossArchetype,
  floorIndex: number,
  biome: BiomeId,
  x: number,
  floorY: number,
  bossesDefeated = 0,
): ActiveBoss {
  const def = createMegaBossDef(archetype, floorIndex, biome, bossesDefeated);
  return {
    def,
    x,
    y: floorY - 46,
    vx: 0,
    vy: 0,
    w: 32,
    h: 46,
    hp: def.maxHp,
    maxHp: def.maxHp,
    facing: -1,
    state: 'intro',
    stateTimer: 1.0,
    hitFlash: 0,
    posePhase: 0,
    arenaMinX: x - 180,
    arenaMaxX: x + 120,
    defeated: false,
  };
}
