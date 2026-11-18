export type JawShape =
  | 'razor_v'
  | 'chiseled_hero'
  | 'gaunt_vamp'
  | 'monolith'
  | 'masked_phantom'
  | 'scarred_rogue'
  | 'angular_bishonen';

export type EyeDesign =
  | 'burning_cat'
  | 'cyber_visor'
  | 'bandaged_eye'
  | 'dual_heterochromia'
  | 'teardrop_kohl'
  | 'scarred_glare'
  | 'narrow_assassin'
  | 'glowing_oracle';

export type FaceMarking =
  | 'lightning_scar'
  | 'joestar_rune'
  | 'pillar_tribal'
  | 'cheek_stitches'
  | 'gold_teardrop'
  | 'crescent_brand'
  | 'royal_paint'
  | 'crimson_cross'
  | 'rune_sigil';

export type FaceAccessory =
  | 'van_dyke_goatee'
  | 'royal_stubble'
  | 'monocle_chain'
  | 'gold_earrings'
  | 'fang_piercings'
  | 'steel_chinplate'
  | 'none';

export type BrowStyle =
  | 'furious_v'
  | 'arched_noble'
  | 'notched_brawler'
  | 'heavy_knitted'
  | 'split_scar';

export type HairBangs =
  | 'swept_dio'
  | 'curtain_locks'
  | 'spiked_wild'
  | 'parted_aristocrat'
  | 'braid_bangs';

export type LipDetail =
  | 'ink_neutral'
  | 'crimson_rouge'
  | 'violet_goth'
  | 'gold_plated'
  | 'scarred_lip';

export interface BossFacialTraits {
  jawShape: JawShape;
  eyeDesign: EyeDesign;
  faceMarking: FaceMarking;
  accessory: FaceAccessory;
  browStyle: BrowStyle;
  hairBangs: HairBangs;
  lipDetail: LipDetail;
  altEyeColor: string;
  scarColor: string;
  hairColor: string;
  signatureKey: string;
}

const JAW_SHAPES: JawShape[] = [
  'razor_v',
  'chiseled_hero',
  'gaunt_vamp',
  'monolith',
  'masked_phantom',
  'scarred_rogue',
  'angular_bishonen',
];

const EYE_DESIGNS: EyeDesign[] = [
  'burning_cat',
  'cyber_visor',
  'bandaged_eye',
  'dual_heterochromia',
  'teardrop_kohl',
  'scarred_glare',
  'narrow_assassin',
  'glowing_oracle',
];

const FACE_MARKINGS: FaceMarking[] = [
  'lightning_scar',
  'joestar_rune',
  'pillar_tribal',
  'cheek_stitches',
  'gold_teardrop',
  'crescent_brand',
  'royal_paint',
  'crimson_cross',
  'rune_sigil',
];

const ACCESSORIES: FaceAccessory[] = [
  'van_dyke_goatee',
  'royal_stubble',
  'monocle_chain',
  'gold_earrings',
  'fang_piercings',
  'steel_chinplate',
  'none',
];

const BROW_STYLES: BrowStyle[] = [
  'furious_v',
  'arched_noble',
  'notched_brawler',
  'heavy_knitted',
  'split_scar',
];

const HAIR_BANGS: HairBangs[] = [
  'swept_dio',
  'curtain_locks',
  'spiked_wild',
  'parted_aristocrat',
  'braid_bangs',
];

const LIP_DETAILS: LipDetail[] = [
  'ink_neutral',
  'crimson_rouge',
  'violet_goth',
  'gold_plated',
  'scarred_lip',
];

const ALT_EYE_COLORS = [
  '#ef4444',
  '#38bdf8',
  '#fbbf24',
  '#a855f7',
  '#34d399',
  '#f43f5e',
  '#f97316',
];

const SCAR_COLORS = ['#991b1b', '#7c2d12', '#6b21a8', '#0f766e', '#b45309'];

const HAIR_COLORS = [
  '#1e1b4b',
  '#facc15',
  '#e11d48',
  '#e2e8f0',
  '#16a34a',
  '#7c3aed',
  '#fb923c',
  '#0f172a',
  '#22d3ee',
];

/**
 * Generates a deterministic, mathematically unique facial trait profile for every boss 1..120+.
 * Uses a bijective affine map mod 504 (7 * 8 * 9, gcd(137, 504) === 1) plus distinct
 * brow shapes, anime bangs, lip tones, hair colors, accessories, and eye/scar pigments.
 */
export function getBossFacialTraits(bossIndex: number): BossFacialTraits {
  const n = Math.max(0, bossIndex - 1);
  const code = (n * 137 + 19) % 504;
  const jawShape = JAW_SHAPES[code % JAW_SHAPES.length];
  const eyeDesign = EYE_DESIGNS[Math.floor(code / JAW_SHAPES.length) % EYE_DESIGNS.length];
  const faceMarking =
    FACE_MARKINGS[
      Math.floor(code / (JAW_SHAPES.length * EYE_DESIGNS.length)) % FACE_MARKINGS.length
    ];
  const accessory = ACCESSORIES[(n * 3 + Math.floor(code / 11)) % ACCESSORIES.length];
  const browStyle = BROW_STYLES[(n * 2 + Math.floor(n / 7)) % BROW_STYLES.length];
  const hairBangs = HAIR_BANGS[(n * 3 + Math.floor(n / 5)) % HAIR_BANGS.length];
  const lipDetail = LIP_DETAILS[(n * 4 + Math.floor(n / 6)) % LIP_DETAILS.length];
  const altEyeColor = ALT_EYE_COLORS[(n * 3) % ALT_EYE_COLORS.length];
  const scarColor = SCAR_COLORS[(n * 2) % SCAR_COLORS.length];
  const hairColor = HAIR_COLORS[(n * 5 + 1) % HAIR_COLORS.length];

  return {
    jawShape,
    eyeDesign,
    faceMarking,
    accessory,
    browStyle,
    hairBangs,
    lipDetail,
    altEyeColor,
    scarColor,
    hairColor,
    signatureKey: `${jawShape}|${eyeDesign}|${faceMarking}|${accessory}|${browStyle}|${hairBangs}|${lipDetail}`,
  };
}
