import { getBossFacialTraits } from './bossFaces';
import { SKILLS, WEAPONS } from './data';
import { DEFAULT_WARRIOR_CUSTOMIZATION } from './rules';
import type { BiomeId, BossDef, SkillId, WarriorCustomization, WeaponId } from './types';

export type AnimeExpression = 'smirk' | 'menacing' | 'wryyy' | 'grit';

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function parseHex(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16) || 0,
      parseInt(clean[1] + clean[1], 16) || 0,
      parseInt(clean[2] + clean[2], 16) || 0,
    ];
  }
  const num = parseInt(clean.slice(0, 6), 16);
  if (Number.isNaN(num)) return [128, 128, 128];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function toHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [clampByte(r), clampByte(g), clampByte(b)]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  );
}

/** Handles both #hex and hsl(...) strings cleanly via offscreen 1x1 sampler fallback if needed */
const colorCache = new Map<string, [number, number, number]>();
function resolveRgb(color: string): [number, number, number] {
  if (color.startsWith('#')) return parseHex(color);
  const cached = colorCache.get(color);
  if (cached) return cached;
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = 1;
    c.height = 1;
    const x = c.getContext('2d');
    if (x) {
      x.fillStyle = color;
      x.fillRect(0, 0, 1, 1);
      const d = x.getImageData(0, 0, 1, 1).data;
      const rgb: [number, number, number] = [d[0], d[1], d[2]];
      colorCache.set(color, rgb);
      return rgb;
    }
  }
  return [148, 86, 176];
}

export function shadeColor(color: string, factor: number): string {
  const [r, g, b] = resolveRgb(color);
  if (factor >= 0) {
    return toHex(
      r + (255 - r) * factor,
      g + (255 - g) * factor,
      b + (255 - b) * factor,
    );
  }
  const k = 1 + factor;
  // Slight cool indigo tint in shadows like JoJo CPS3 / Castlevania SotN
  return toHex(r * k, g * k * 0.94, Math.min(255, b * k * 1.08));
}

export interface CelRamp {
  hi: string;
  base: string;
  sh: string;
  deep: string;
  ink: string;
}

export function makeRamp(base: string): CelRamp {
  return {
    hi: shadeColor(base, 0.34),
    base,
    sh: shadeColor(base, -0.3),
    deep: shadeColor(base, -0.56),
    ink: '#09060b',
  };
}

function px(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/**
 * Draws a 48x48 Hirohiko Araki / CPS3 Heritage-for-the-Future anime pixel portrait
 * with diagonal brow shadow, sharp jawline, glowing eyes, and dynamic expression.
 */
export function drawBossPortrait(
  ctx: CanvasRenderingContext2D,
  def: BossDef,
  expression: AnimeExpression,
  size = 48,
) {
  const scale = size / 48;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.scale(scale, scale);

  const pRamp = makeRamp(def.primaryColor);
  const sRamp = makeRamp(def.secondaryColor);
  const skinRamp = makeRamp(def.skinColor);

  // Dramatic manga sky & speed-streak backdrop inside portrait frame
  px(ctx, 0, 0, 48, 48, def.climateSkyTop);
  px(ctx, 0, 26, 48, 22, def.climateSkyBottom);
  for (let i = 0; i < 6; i++) {
    px(ctx, (i * 9 + 2) % 48, 0, 1, 48, def.auraColor);
  }
  // Faint Menacing katakana behind portrait
  ctx.fillStyle = def.auraColor;
  ctx.globalAlpha = 0.45;
  ctx.font = 'bold 8px monospace';
  ctx.fillText('ゴ', 3, 12);
  ctx.fillText('ゴ', 37, 22);
  ctx.globalAlpha = 1;

  // High-collar JoJo coat lapels, gold buttons & sculpted shoulders
  px(ctx, 4, 34, 40, 14, pRamp.ink);
  px(ctx, 6, 35, 36, 13, pRamp.sh);
  px(ctx, 10, 35, 28, 13, pRamp.base);
  px(ctx, 8, 37, 3, 2, '#fbbf24'); // Shoulder lapel emblem studs
  px(ctx, 37, 37, 3, 2, '#fbbf24');
  // Upward dramatic collar wings with inner trim
  px(ctx, 7, 27, 7, 11, pRamp.ink);
  px(ctx, 8, 28, 5, 10, pRamp.base);
  px(ctx, 9, 28, 2, 8, pRamp.hi);
  px(ctx, 34, 27, 7, 11, pRamp.ink);
  px(ctx, 35, 28, 5, 10, pRamp.base);
  px(ctx, 36, 28, 2, 8, pRamp.hi);
  // Sculpted neck tendons, collarbones & JoJo gold chain medallion
  px(ctx, 18, 33, 12, 12, skinRamp.sh);
  px(ctx, 20, 34, 8, 11, skinRamp.base);
  px(ctx, 19, 34, 2, 7, skinRamp.deep); // Neck tendon shadow
  px(ctx, 27, 34, 2, 7, skinRamp.deep);
  px(ctx, 17, 40, 14, 1, skinRamp.ink);
  px(ctx, 18, 42, 12, 6, sRamp.base); // Inner chest / cravat
  px(ctx, 22, 42, 4, 6, sRamp.hi);
  // Gold necklace chain & emblem pendant
  px(ctx, 19, 41, 2, 2, '#fbbf24');
  px(ctx, 27, 41, 2, 2, '#fbbf24');
  px(ctx, 21, 42, 6, 2, '#d97706');
  px(ctx, 22, 43, 4, 3, '#fde047');
  px(ctx, 23, 44, 2, 1, def.auraColor);

  // Bespoke Mega Boss Portrait Overrides (DIO & Undead Dread Knight)
  if (def.megaArchetype === 'mega_dio') {
    // High black & gold vampire coat collar
    px(ctx, 6, 24, 8, 14, '#09060b');
    px(ctx, 7, 25, 6, 12, '#eab308');
    px(ctx, 34, 24, 8, 14, '#09060b');
    px(ctx, 35, 25, 6, 12, '#eab308');
    // Razor-sharp chiseled vampire jawline + pale immortal skin
    px(ctx, 13, 12, 22, 17, '#09060b');
    px(ctx, 15, 29, 18, 5, '#09060b');
    px(ctx, 18, 34, 12, 4, '#09060b');
    px(ctx, 14, 13, 20, 16, '#fef3c7');
    px(ctx, 16, 28, 16, 5, '#fef3c7');
    px(ctx, 19, 33, 10, 4, '#fde68a');
    px(ctx, 14, 13, 20, 6, '#e7c697'); // Forehead shadow
    // Spiky radiant yellow-gold vampire mane + green heart headband
    const dioSpikes: [number, number, number, number][] = [
      [8, 6, 6, 12],
      [13, 2, 6, 13],
      [20, 1, 8, 14],
      [29, 2, 6, 13],
      [34, 6, 6, 12],
    ];
    for (const [sx, sy, sw, sh] of dioSpikes) {
      px(ctx, sx, sy, sw, sh, '#09060b');
      px(ctx, sx + 1, sy + 1, sw - 2, sh - 2, '#facc15');
      px(ctx, sx + 2, sy + 1, Math.max(1, sw - 4), sh - 4, '#fef08a');
    }
    px(ctx, 12, 12, 24, 3, '#09060b');
    px(ctx, 13, 13, 22, 2, '#eab308');
    px(ctx, 22, 11, 4, 4, '#22c55e'); // Heart circlet gem
    px(ctx, 14, 15, 4, 9, '#facc15');
    px(ctx, 30, 15, 4, 9, '#eab308');
    // Cunning crimson glowing vampire eyes
    px(ctx, 16, 18, 5, 2, '#09060b');
    px(ctx, 27, 18, 5, 2, '#09060b');
    px(ctx, 16, 20, 6, 3, '#09060b');
    px(ctx, 17, 21, 4, 2, '#f43f5e');
    px(ctx, 18, 21, 2, 1, '#fef08a');
    px(ctx, 26, 20, 6, 3, '#09060b');
    px(ctx, 27, 21, 4, 2, '#f43f5e');
    px(ctx, 28, 21, 2, 1, '#fef08a');
    // Cheekbone & sharp vampire fangs grin
    px(ctx, 23, 22, 2, 5, '#d9a066');
    px(ctx, 18, 29, 12, 5, '#09060b');
    px(ctx, 19, 30, 10, 3, '#9f1239');
    px(ctx, 19, 30, 10, 1, '#ffffff');
    px(ctx, 20, 31, 1, 2, '#ffffff');
    px(ctx, 27, 31, 1, 2, '#ffffff');
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, 47, 47);
    ctx.restore();
    return;
  }

  if (def.megaArchetype === 'mega_undead_knight') {
    // Runed dark-steel pauldrons & horned obsidian skull dread helm
    px(ctx, 4, 31, 40, 17, '#09060b');
    px(ctx, 6, 32, 36, 15, '#334155');
    px(ctx, 10, 33, 28, 13, '#1e293b');
    px(ctx, 19, 36, 10, 8, '#09060b');
    px(ctx, 21, 38, 6, 4, '#22d3ee'); // Neon soulfire chest rune
    // Sweeping dread horns
    px(ctx, 5, 2, 6, 13, '#09060b');
    px(ctx, 6, 3, 4, 11, '#8b5cf6');
    px(ctx, 7, 4, 2, 7, '#e2e8f0');
    px(ctx, 37, 2, 6, 13, '#09060b');
    px(ctx, 38, 3, 4, 11, '#8b5cf6');
    px(ctx, 39, 4, 2, 7, '#e2e8f0');
    // Armored Dread Helm + Hollow Skull Visor
    px(ctx, 11, 10, 26, 26, '#09060b');
    px(ctx, 12, 11, 24, 23, '#475569');
    px(ctx, 13, 12, 22, 6, '#94a3b8');
    px(ctx, 15, 19, 18, 12, '#09060b');
    // Blazing emerald-cyan eye slits inside dark helm cavity
    px(ctx, 17, 21, 5, 3, '#34d399');
    px(ctx, 18, 22, 3, 1, '#ffffff');
    px(ctx, 26, 21, 5, 3, '#34d399');
    px(ctx, 27, 22, 3, 1, '#ffffff');
    // Steel teeth grill + glowing forehead crown sigil
    px(ctx, 22, 14, 4, 4, '#e879f9');
    for (let tx = 18; tx <= 28; tx += 3) {
      px(ctx, tx, 28, 2, 4, '#cbd5e1');
    }
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, 47, 47);
    ctx.restore();
    return;
  }

  if (def.isGyroBoss) {
    // Gyro Zeppeli Bespoke Steel Ball Run Portrait: feathered gyro hat w/ emerald spheres, emerald goggles, blonde curls, goatee & gold tooth!
    // Flowing golden curls behind collar
    px(ctx, 8, 12, 32, 26, '#a16207');
    px(ctx, 10, 14, 28, 22, '#ca8a04');
    px(ctx, 5, 31, 38, 17, '#09060b');
    px(ctx, 7, 32, 34, 16, '#581c87');
    px(ctx, 11, 34, 26, 14, '#7e22ce');
    // Holster straps & emerald steel ball emblem
    px(ctx, 12, 36, 4, 12, '#78350f');
    px(ctx, 32, 36, 4, 12, '#78350f');
    px(ctx, 19, 39, 10, 9, '#15803d');
    px(ctx, 21, 41, 6, 5, '#4ade80');
    // Chiseled tanned face
    px(ctx, 14, 13, 20, 21, '#09060b');
    px(ctx, 15, 14, 18, 19, '#e7b98f');
    px(ctx, 18, 32, 12, 5, '#e7b98f');
    // Gyro's signature violet-brown feathered cowboy hat with emerald spheres around crown!
    px(ctx, 4, 11, 40, 4, '#09060b');
    px(ctx, 5, 12, 38, 2, '#581c87');
    px(ctx, 10, 2, 28, 11, '#09060b');
    px(ctx, 11, 3, 26, 9, '#6b21a8');
    px(ctx, 12, 8, 24, 3, '#3b0764');
    // Emerald hat spheres
    px(ctx, 13, 8, 4, 4, '#22c55e');
    px(ctx, 22, 8, 4, 4, '#4ade80');
    px(ctx, 31, 8, 4, 4, '#22c55e');
    // Emerald aviator goggles on hat brim
    px(ctx, 14, 11, 8, 5, '#09060b');
    px(ctx, 15, 12, 6, 3, '#10b981');
    px(ctx, 26, 11, 8, 5, '#09060b');
    px(ctx, 27, 12, 6, 3, '#10b981');
    // Sharp eyes & confident grin + golden tooth
    px(ctx, 16, 19, 5, 2, '#09060b');
    px(ctx, 27, 19, 5, 2, '#09060b');
    px(ctx, 17, 21, 4, 3, '#ffffff');
    px(ctx, 18, 21, 2, 3, '#10b981');
    px(ctx, 27, 21, 4, 3, '#ffffff');
    px(ctx, 28, 21, 2, 3, '#10b981');
    // Chin goatee squares + "GO! GO! ZEPPELI" golden tooth smile
    px(ctx, 18, 28, 12, 4, '#09060b');
    px(ctx, 19, 29, 10, 2, '#ffffff');
    px(ctx, 21, 29, 2, 2, '#fde047'); // Gold tooth!
    px(ctx, 25, 29, 2, 2, '#fde047');
    px(ctx, 21, 33, 6, 3, '#09060b');
    px(ctx, 19, 33, 2, 2, '#854d0e');
    px(ctx, 27, 33, 2, 2, '#854d0e');
    // Glowing green spinning Steel Ball beside portrait
    px(ctx, 37, 24, 9, 9, '#15803d');
    px(ctx, 38, 25, 7, 7, '#22c55e');
    px(ctx, 40, 27, 3, 3, '#bbf7d0');

    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, 47, 47);
    ctx.restore();
    return;
  }

  const traits = getBossFacialTraits(def.index);

  // Chiseled JoJo Face Silhouette sculpted by per-boss JawShape
  if (traits.jawShape === 'monolith') {
    px(ctx, 11, 12, 26, 23, pRamp.ink);
    px(ctx, 12, 13, 24, 21, skinRamp.base);
    px(ctx, 14, 32, 20, 4, pRamp.ink);
    px(ctx, 15, 32, 18, 3, skinRamp.base);
  } else if (traits.jawShape === 'razor_v' || traits.jawShape === 'angular_bishonen') {
    px(ctx, 14, 12, 20, 17, pRamp.ink);
    px(ctx, 16, 29, 16, 4, pRamp.ink);
    px(ctx, 19, 33, 10, 4, pRamp.ink);
    px(ctx, 21, 36, 6, 2, pRamp.ink);
    px(ctx, 15, 13, 18, 16, skinRamp.base);
    px(ctx, 17, 28, 14, 5, skinRamp.base);
    px(ctx, 20, 32, 8, 4, skinRamp.base);
  } else {
    px(ctx, 13, 12, 22, 20, pRamp.ink);
    px(ctx, 15, 31, 18, 4, pRamp.ink);
    px(ctx, 18, 34, 12, 3, pRamp.ink);
    px(ctx, 14, 13, 20, 18, skinRamp.base);
    px(ctx, 16, 30, 16, 4, skinRamp.base);
    px(ctx, 19, 33, 10, 3, skinRamp.base);
  }

  // Cheek & jaw cel-shading (Araki hard shadow planes!)
  px(ctx, 14, 13, 20, 8, skinRamp.deep); // Heavy upper-brow shadow
  px(ctx, 14, 21, 5, 10, skinRamp.sh); // Left cheek shadow
  px(ctx, 16, 31, 4, 3, skinRamp.sh);
  if (traits.jawShape === 'gaunt_vamp') {
    px(ctx, 16, 25, 3, 6, skinRamp.deep);
    px(ctx, 29, 25, 3, 6, skinRamp.deep);
  } else {
    px(ctx, 28, 22, 5, 6, skinRamp.hi); // Cheekbone highlight
  }
  // Iconic JoJo cheek-bone & nose-bridge ink lines + cross-hatched manga cheekbone accents
  px(ctx, 17, 25, 2, 4, skinRamp.ink);
  px(ctx, 29, 25, 2, 4, skinRamp.ink);
  px(ctx, 15, 23, 2, 1, skinRamp.deep);
  px(ctx, 31, 23, 2, 1, skinRamp.deep);
  px(ctx, 23, 21, 2, 6, skinRamp.sh); // Nose bridge
  px(ctx, 24, 25, 2, 2, skinRamp.ink); // Sharp nose shadow
  px(ctx, 24, 21, 1, 3, skinRamp.hi); // Nose bridge highlight
  if (expression === 'wryyy' || expression === 'grit') {
    px(ctx, 14, 16, 1, 4, def.auraColor); // Anime aura vein glow
    px(ctx, 33, 16, 1, 4, def.auraColor);
  }

  // Per-Boss Unique Scars, Tattoos & Tribal Markings
  if (traits.faceMarking === 'lightning_scar') {
    px(ctx, 16, 15, 2, 6, traits.scarColor);
    px(ctx, 17, 21, 2, 5, traits.scarColor);
    px(ctx, 18, 26, 2, 4, traits.scarColor);
  } else if (traits.faceMarking === 'pillar_tribal') {
    px(ctx, 15, 24, 5, 2, def.auraColor);
    px(ctx, 28, 24, 5, 2, def.auraColor);
    px(ctx, 22, 14, 4, 3, def.auraColor);
  } else if (traits.faceMarking === 'joestar_rune') {
    px(ctx, 29, 24, 3, 3, '#f43f5e');
    px(ctx, 30, 23, 1, 5, '#fbbf24');
  } else if (traits.faceMarking === 'cheek_stitches') {
    px(ctx, 16, 25, 4, 1, '#09060b');
    px(ctx, 17, 24, 1, 3, '#09060b');
    px(ctx, 28, 25, 4, 1, '#09060b');
    px(ctx, 30, 24, 1, 3, '#09060b');
  } else if (traits.faceMarking === 'gold_teardrop') {
    px(ctx, 18, 24, 2, 4, '#fbbf24');
    px(ctx, 29, 24, 2, 4, '#fbbf24');
  } else if (traits.faceMarking === 'crescent_brand') {
    px(ctx, 22, 14, 4, 2, '#fef08a');
    px(ctx, 21, 15, 2, 2, '#fef08a');
  } else if (traits.faceMarking === 'royal_paint') {
    px(ctx, 15, 23, 4, 3, pRamp.base);
    px(ctx, 29, 23, 4, 3, pRamp.base);
  } else if (traits.faceMarking === 'crimson_cross') {
    px(ctx, 23, 14, 2, 5, '#e11d48');
    px(ctx, 21, 16, 6, 1, '#e11d48');
  } else {
    px(ctx, 16, 15, 3, 2, def.secondaryColor);
    px(ctx, 29, 15, 3, 2, def.secondaryColor);
  }

  // Piercing Anime Eyes & Eyebrows styled by per-boss BrowStyle + EyeDesign
  const wideEyes = expression === 'wryyy' || expression === 'grit';
  const eyeH = traits.eyeDesign === 'narrow_assassin' ? 2 : wideEyes ? 4 : 3;
  const hairRamp = makeRamp(traits.hairColor);
  // Distinct per-boss BrowStyle
  if (traits.browStyle === 'arched_noble') {
    px(ctx, 16, 17, 5, 1, hairRamp.ink);
    px(ctx, 19, 18, 3, 2, hairRamp.ink);
    px(ctx, 27, 17, 5, 1, hairRamp.ink);
    px(ctx, 26, 18, 3, 2, hairRamp.ink);
  } else if (traits.browStyle === 'notched_brawler') {
    px(ctx, 16, 18, 3, 2, hairRamp.ink);
    px(ctx, 20, 19, 2, 1, hairRamp.ink); // Scar notch in left brow
    px(ctx, 26, 18, 6, 2, hairRamp.ink);
  } else if (traits.browStyle === 'heavy_knitted') {
    px(ctx, 15, 18, 8, 2, hairRamp.ink);
    px(ctx, 25, 18, 8, 2, hairRamp.ink);
    px(ctx, 23, 19, 2, 2, skinRamp.ink);
  } else if (traits.browStyle === 'split_scar') {
    px(ctx, 16, 18, 6, 2, hairRamp.ink);
    px(ctx, 26, 18, 6, 2, hairRamp.ink);
    px(ctx, 19, 16, 2, 6, traits.scarColor);
  } else {
    px(ctx, 16, 18, 6, 2, hairRamp.ink);
    px(ctx, 20, 20, 2, 1, hairRamp.ink);
    px(ctx, 26, 18, 6, 2, hairRamp.ink);
    px(ctx, 26, 20, 2, 1, hairRamp.ink);
  }

  if (traits.eyeDesign === 'cyber_visor') {
    // Sleek glowing red/cyan targeting visor over left eye + cold right glare
    px(ctx, 15, 19, 9, 5, '#09060b');
    px(ctx, 16, 20, 7, 3, traits.altEyeColor);
    px(ctx, 17, 21, 4, 1, '#ffffff');
    px(ctx, 26, 20, 6, eyeH, '#09060b');
    px(ctx, 27, 21, 4, eyeH - 1, '#f8fafc');
    px(ctx, 28, 21, 2, eyeH - 1, def.auraColor);
  } else if (traits.eyeDesign === 'bandaged_eye') {
    // Crossed battle bandage over left eye!
    px(ctx, 15, 18, 8, 6, '#e2e8f0');
    px(ctx, 16, 19, 6, 1, '#94a3b8');
    px(ctx, 16, 22, 6, 1, '#94a3b8');
    px(ctx, 26, 20, 6, eyeH, '#09060b');
    px(ctx, 27, 21, 4, eyeH - 1, '#f8fafc');
    px(ctx, 28, 21, 2, eyeH - 1, traits.altEyeColor);
    px(ctx, 29, 21, 1, 1, '#ffffff');
  } else {
    const scleraL = traits.eyeDesign === 'burning_cat' ? '#09060b' : '#f8fafc';
    const scleraR = traits.eyeDesign === 'burning_cat' ? '#09060b' : '#f8fafc';
    const irisL = def.auraColor;
    const irisR =
      traits.eyeDesign === 'dual_heterochromia' ? traits.altEyeColor : def.auraColor;
    if (traits.eyeDesign === 'teardrop_kohl') {
      px(ctx, 15, 20, 1, eyeH + 1, '#09060b');
      px(ctx, 32, 20, 1, eyeH + 1, '#09060b');
    }
    if (traits.eyeDesign === 'scarred_glare') {
      px(ctx, 28, 17, 2, 11, traits.scarColor);
    }
    px(ctx, 16, 20, 6, eyeH, '#09060b');
    px(ctx, 17, 21, 4, Math.max(1, eyeH - 1), scleraL);
    px(ctx, 18, 21, traits.eyeDesign === 'burning_cat' ? 1 : 2, Math.max(1, eyeH - 1), irisL);
    px(ctx, 19, 21, 1, 1, '#ffffff');
    px(ctx, 26, 20, 6, eyeH, '#09060b');
    px(ctx, 27, 21, 4, Math.max(1, eyeH - 1), scleraR);
    px(ctx, 28, 21, traits.eyeDesign === 'burning_cat' ? 1 : 2, Math.max(1, eyeH - 1), irisR);
    px(ctx, 29, 21, 1, 1, '#ffffff');
    if (traits.eyeDesign === 'glowing_oracle') {
      // Third Epitaph eye on forehead!
      px(ctx, 22, 14, 4, 3, '#09060b');
      px(ctx, 23, 15, 2, 1, traits.altEyeColor);
    }
  }

  // Per-Boss Mask OR Iconic JoJo Facial Expression + LipDetail
  const lipTint =
    traits.lipDetail === 'crimson_rouge'
      ? '#be123c'
      : traits.lipDetail === 'violet_goth'
        ? '#6b21a8'
        : traits.lipDetail === 'gold_plated'
          ? '#fbbf24'
          : skinRamp.sh;

  if (traits.jawShape === 'masked_phantom') {
    px(ctx, 16, 27, 16, 8, '#09060b');
    px(ctx, 17, 28, 14, 6, '#334155');
    px(ctx, 20, 29, 8, 4, '#0f172a');
    px(ctx, 21, 30, 1, 2, def.auraColor);
    px(ctx, 24, 30, 1, 2, def.auraColor);
    px(ctx, 27, 30, 1, 2, def.auraColor);
  } else if (expression === 'wryyy') {
    // Maniacal DIO fanged laugh!
    px(ctx, 18, 28, 12, 5, pRamp.ink);
    px(ctx, 19, 29, 10, 3, '#7f1d1d');
    px(ctx, 19, 29, 10, 1, '#ffffff'); // Upper teeth
    px(ctx, 20, 31, 8, 1, '#f8fafc'); // Lower teeth
    px(ctx, 20, 30, 1, 2, '#ffffff'); // Sharp left vampire fang!
    px(ctx, 27, 30, 1, 2, '#ffffff'); // Sharp right vampire fang!
    px(ctx, 30, 14, 2, 1, '#fb7185');
    px(ctx, 31, 15, 1, 2, '#fb7185');
  } else if (expression === 'grit') {
    px(ctx, 19, 29, 10, 4, pRamp.ink);
    px(ctx, 20, 30, 8, 2, '#ffffff');
    px(ctx, 22, 30, 1, 2, '#94a3b8');
    px(ctx, 25, 30, 1, 2, '#94a3b8');
  } else if (expression === 'smirk') {
    px(ctx, 20, 30, 6, 1, pRamp.ink);
    px(ctx, 26, 29, 3, 1, pRamp.ink);
    px(ctx, 27, 29, 2, 1, '#ffffff');
    px(ctx, 21, 31, 6, 2, lipTint);
  } else {
    px(ctx, 20, 30, 8, 1, pRamp.ink);
    px(ctx, 21, 31, 6, 2, lipTint);
  }
  if (traits.lipDetail === 'scarred_lip' && traits.jawShape !== 'masked_phantom') {
    px(ctx, 22, 28, 1, 6, traits.scarColor);
  }

  // Facial Hair & Accessories (Goatee, Monocle, Earrings, Chinplate, Fang Piercings)
  if (traits.accessory === 'van_dyke_goatee') {
    px(ctx, 22, 32, 4, 5, '#09060b');
    px(ctx, 20, 27, 8, 1, '#1e1b4b');
  } else if (traits.accessory === 'royal_stubble') {
    px(ctx, 18, 32, 12, 3, skinRamp.deep);
    px(ctx, 21, 34, 6, 2, '#09060b');
  } else if (traits.accessory === 'monocle_chain') {
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1;
    ctx.strokeRect(25.5, 19.5, 7, 5);
    px(ctx, 32, 24, 1, 10, '#f59e0b');
  } else if (traits.accessory === 'gold_earrings') {
    px(ctx, 12, 24, 2, 5, '#fbbf24');
    px(ctx, 34, 24, 2, 5, '#fbbf24');
  } else if (traits.accessory === 'fang_piercings') {
    px(ctx, 19, 32, 1, 2, '#e2e8f0');
    px(ctx, 28, 32, 1, 2, '#e2e8f0');
  } else if (traits.accessory === 'steel_chinplate') {
    px(ctx, 20, 32, 8, 4, '#64748b');
    px(ctx, 22, 33, 4, 2, '#cbd5e1');
  }

  // Headgear & Sculpted Anime Hair
  if (def.hatStyle === 'crown') {
    px(ctx, 11, 10, 26, 8, pRamp.sh); // Flowing noble hair
    px(ctx, 12, 5, 24, 9, pRamp.ink);
    px(ctx, 13, 6, 22, 7, '#f59e0b');
    px(ctx, 13, 3, 4, 4, '#fbbf24');
    px(ctx, 22, 2, 4, 5, '#fef08a');
    px(ctx, 31, 3, 4, 4, '#fbbf24');
    px(ctx, 23, 8, 2, 3, '#e11d48');
  } else if (def.hatStyle === 'pompadour') {
    px(ctx, 11, 11, 26, 10, '#09060b');
    px(ctx, 12, 4, 25, 11, '#1e1b4b');
    px(ctx, 14, 5, 22, 5, '#4338ca');
    px(ctx, 16, 6, 16, 2, '#818cf8'); // Glossy pompadour highlight
    px(ctx, 12, 15, 3, 10, '#1e1b4b'); // Sideburns
    px(ctx, 33, 15, 3, 10, '#1e1b4b');
  } else if (def.hatStyle === 'visor') {
    // Sleek armored visor cap merging into dark hair spikes
    px(ctx, 12, 5, 24, 11, '#09060b');
    px(ctx, 13, 6, 22, 9, sRamp.sh);
    px(ctx, 11, 13, 26, 3, '#09060b'); // Heavy visor brim casting eye shadow
    px(ctx, 15, 14, 18, 2, sRamp.base);
    px(ctx, 22, 8, 4, 4, '#fbbf24'); // Emblem pin
  } else if (def.hatStyle === 'tophat') {
    px(ctx, 14, 2, 20, 13, '#09060b');
    px(ctx, 15, 3, 18, 11, '#27272a');
    px(ctx, 15, 11, 18, 3, sRamp.base);
    px(ctx, 9, 13, 30, 3, '#09060b');
    px(ctx, 10, 14, 28, 1, '#52525b');
  } else if (def.hatStyle === 'halo_spikes') {
    // DIO spiky golden/aura mane + heart headband
    const spikes: [number, number, number, number][] = [
      [10, 7, 5, 10],
      [15, 3, 5, 12],
      [21, 2, 6, 13],
      [28, 3, 5, 12],
      [33, 7, 5, 10],
    ];
    for (const [sx, sy, sw, sh] of spikes) {
      px(ctx, sx, sy, sw, sh, '#09060b');
      px(ctx, sx + 1, sy + 1, sw - 2, sh - 2, sRamp.base);
      px(ctx, sx + 1, sy + 1, 2, sh - 4, sRamp.hi);
    }
    px(ctx, 13, 12, 22, 3, pRamp.ink);
    px(ctx, 22, 11, 4, 4, '#22c55e'); // DIO green heart circlet
  } else if (def.hatStyle === 'horns') {
    px(ctx, 12, 9, 24, 7, sRamp.deep);
    px(ctx, 7, 3, 5, 11, '#09060b');
    px(ctx, 8, 4, 3, 9, '#fef3c7');
    px(ctx, 36, 3, 5, 11, '#09060b');
    px(ctx, 37, 4, 3, 9, '#fef3c7');
  } else if (def.hatStyle === 'samurai_crest') {
    px(ctx, 11, 7, 26, 9, '#1e293b');
    px(ctx, 8, 2, 6, 7, '#fbbf24');
    px(ctx, 34, 2, 6, 7, '#fbbf24');
    px(ctx, 22, 3, 4, 9, sRamp.hi);
  } else {
    // Hooded assassin framing shadowy face
    px(ctx, 10, 5, 28, 14, pRamp.ink);
    px(ctx, 11, 6, 26, 10, pRamp.base);
    px(ctx, 13, 8, 22, 6, pRamp.sh);
  }

  // Distinct Anime Front Bangs framing the forehead & cheeks (using per-boss hairColor)
  if (traits.hairBangs === 'swept_dio') {
    px(ctx, 12, 11, 5, 11, hairRamp.base);
    px(ctx, 16, 12, 5, 6, hairRamp.hi);
    px(ctx, 31, 11, 5, 11, hairRamp.sh);
  } else if (traits.hairBangs === 'curtain_locks') {
    px(ctx, 11, 12, 4, 15, hairRamp.sh);
    px(ctx, 33, 12, 4, 15, hairRamp.sh);
    px(ctx, 15, 12, 5, 5, hairRamp.base);
    px(ctx, 28, 12, 5, 5, hairRamp.base);
  } else if (traits.hairBangs === 'spiked_wild') {
    px(ctx, 14, 11, 3, 7, hairRamp.base);
    px(ctx, 21, 11, 4, 8, hairRamp.hi);
    px(ctx, 29, 11, 3, 7, hairRamp.base);
  } else if (traits.hairBangs === 'parted_aristocrat') {
    px(ctx, 13, 12, 8, 4, hairRamp.base);
    px(ctx, 27, 12, 8, 4, hairRamp.sh);
  } else {
    // braid_bangs
    px(ctx, 12, 13, 3, 16, hairRamp.base);
    px(ctx, 12, 17, 3, 2, '#fbbf24');
    px(ctx, 33, 13, 3, 16, hairRamp.sh);
    px(ctx, 33, 17, 3, 2, '#fbbf24');
  }

  // Sharp inner portrait border
  ctx.strokeStyle = def.auraColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, 47, 47);

  ctx.restore();
}

export function drawWarriorPortrait(
  ctx: CanvasRenderingContext2D,
  weaponId: WeaponId,
  size = 40,
  customization: WarriorCustomization = DEFAULT_WARRIOR_CUSTOMIZATION,
) {
  const scale = size / 32;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.scale(scale, scale);

  const cloakRamp = makeRamp(customization.cloakColor);
  const armorRamp = makeRamp(customization.armorColor);
  const plumeRamp = makeRamp(customization.plumeColor);

  px(ctx, 0, 0, 32, 32, '#140b12');
  px(ctx, 0, 18, 32, 14, '#2b121c');
  // Customized cape shoulders
  px(ctx, 2, 22, 28, 10, cloakRamp.deep);
  px(ctx, 5, 22, 22, 10, cloakRamp.base);
  // Customized steel pauldrons & chestplate
  px(ctx, 6, 21, 20, 11, armorRamp.base);
  px(ctx, 8, 22, 16, 10, armorRamp.sh);
  px(ctx, 4, 20, 6, 5, '#f59e0b');
  px(ctx, 22, 20, 6, 5, '#f59e0b');
  // Plumed Knight Helm
  px(ctx, 9, 2, 12, 6, plumeRamp.base);
  px(ctx, 11, 3, 9, 4, plumeRamp.hi);
  px(ctx, 8, 7, 16, 15, '#09060b');
  px(ctx, 9, 8, 14, 13, armorRamp.hi);
  px(ctx, 9, 8, 14, 3, '#f8fafc');
  px(ctx, 10, 14, 12, 4, '#0f172a'); // Dark visor shadow
  px(ctx, 12, 15, 3, 2, customization.visorColor); // Customized visor eye glow
  px(ctx, 18, 15, 3, 2, customization.visorColor);
  px(ctx, 13, 15, 1, 1, '#ffffff');
  px(ctx, 19, 15, 1, 1, '#ffffff');
  // Vertical blade hint (blazing crimson-orange for Fire Sword!)
  if (weaponId === 'fire_sword') {
    px(ctx, 26, 3, 3, 25, '#dc2626');
    px(ctx, 27, 4, 2, 22, '#fb923c');
    px(ctx, 27, 6, 1, 17, '#fef08a');
  } else {
    px(ctx, 26, 4, 3, 24, weaponId === 'katana' ? '#f8fafc' : WEAPONS[weaponId].color);
  }

  ctx.restore();
}

/**
 * Baked 256x270 Castlevania SotN / Blasphemous-grade parallax wall canvas per biome.
 */
const biomeWallCache = new Map<BiomeId, HTMLCanvasElement>();

export function getBakedBiomeWall(biome: BiomeId): HTMLCanvasElement {
  const existing = biomeWallCache.get(biome);
  if (existing) return existing;

  const W = 256;
  const H = 270;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  if (biome === 'castle') {
    // 1. Base stone wall gradient
    px(ctx, 0, 0, W, H, '#120b10');
    px(ctx, 0, 140, W, 130, '#180f15');

    // 2. Hand-pixeled staggered Ashlar Masonry Blocks (4-tone ramp + cracks + mortar)
    const rowH = 12;
    for (let row = 0; row < 19; row++) {
      const y = row * rowH;
      const offset = (row % 2) * 14;
      for (let bx = -16 + offset; bx < W; bx += 28) {
        const hash = (row * 31 + bx * 17) & 15;
        const bw = 27;
        const tone = hash < 3 ? '#261a22' : hash < 8 ? '#1f141b' : '#191016';
        px(ctx, bx, y, bw, rowH - 1, tone);
        px(ctx, bx, y, bw, 1, '#362630'); // Top bevel highlight
        px(ctx, bx, y, 1, rowH - 1, '#2d1f28'); // Left bevel
        px(ctx, bx, y + rowH - 1, bw + 1, 1, '#0b0609'); // Dark mortar
        px(ctx, bx + bw, y, 1, rowH, '#0b0609');
        if (hash === 2 || hash === 11) {
          // Weathered brick crack
          px(ctx, bx + 8, y + 2, 1, 4, '#0b0609');
          px(ctx, bx + 9, y + 5, 3, 1, '#0b0609');
          px(ctx, bx + 11, y + 6, 1, 3, '#0b0609');
        }
      }
    }

    // 3. Lower Wainscoting Cornice & Carved Stone Dado Panels (y: 162..226)
    px(ctx, 0, 160, W, 5, '#3b2934');
    px(ctx, 0, 160, W, 1, '#59404e');
    px(ctx, 0, 164, W, 2, '#0a0608');
    for (let dx = 36; dx < W - 24; dx += 44) {
      px(ctx, dx, 170, 34, 46, '#140c11');
      px(ctx, dx + 2, 172, 30, 42, '#23171f');
      px(ctx, dx + 5, 175, 24, 36, '#180f15');
      px(ctx, dx + 6, 176, 22, 1, '#32222c');
    }

    // 4. Grand Pointed Gothic Stained Glass Rose & Lancet Window (x: 48..122, y: 14..152)
    // Outer stone archway frame with stepped voussoirs
    for (let step = 0; step < 12; step++) {
      const aw = 78 - step * 5;
      const ax = 85 - Math.floor(aw / 2);
      px(ctx, ax - 3, 28 - step * 2, aw + 6, 4, '#2f202a');
      px(ctx, ax, 29 - step * 2, aw, 4, '#0d070c');
    }
    px(ctx, 45, 28, 80, 124, '#2d1e28');
    px(ctx, 48, 30, 74, 118, '#0c070b');
    // Stained-glass lancet mosaic backdrop
    px(ctx, 51, 32, 68, 114, '#1b0f26');
    // Rose Window upper medallion (center 85, 56)
    for (let ry = -18; ry <= 18; ry++) {
      for (let rx = -18; rx <= 18; rx++) {
        const d2 = rx * rx + ry * ry;
        if (d2 <= 324) {
          const ang = Math.atan2(ry, rx);
          const sector = Math.floor(((ang + Math.PI) / (Math.PI * 2)) * 8);
          let col = '#6b21a8';
          if (d2 > 260) col = '#0c070b';
          else if (Math.abs(rx) < 2 || Math.abs(ry) < 2 || Math.abs(Math.abs(rx) - Math.abs(ry)) < 2) {
            col = '#0c070b';
          } else if (d2 < 36) {
            col = '#fbbf24';
          } else if (sector % 3 === 0) {
            col = '#be123c';
          } else if (sector % 3 === 1) {
            col = '#2563eb';
          } else {
            col = '#9333ea';
          }
          px(ctx, 85 + rx, 56 + ry, 1, 1, col);
        }
      }
    }
    // Lower Twin Lancet Panes with diamond leading & ruby/sapphire glass
    for (let ly = 78; ly < 144; ly++) {
      for (let lx = 53; lx <= 117; lx++) {
        if (Math.abs(lx - 85) <= 2) {
          px(ctx, lx, ly, 1, 1, '#120a10'); // Central stone mullion
          continue;
        }
        const diag = ((lx + ly) % 10 === 0) || ((lx - ly + 200) % 10 === 0);
        if (diag) {
          px(ctx, lx, ly, 1, 1, '#09060b');
        } else {
          const band = (Math.floor(lx / 8) + Math.floor(ly / 12)) % 4;
          const gcol =
            band === 0 ? '#7e22ce' : band === 1 ? '#9f1239' : band === 2 ? '#1d4ed8' : '#b45309';
          px(ctx, lx, ly, 1, 1, gcol);
        }
      }
    }
    // Window sill
    px(ctx, 43, 148, 84, 5, '#3b2934');
    px(ctx, 43, 148, 84, 1, '#614656');

    // 5. Diagonal Dithered Stained-Glass Moonlight Shaft across wall
    ctx.save();
    ctx.fillStyle = 'rgba(167, 139, 250, 0.06)';
    ctx.beginPath();
    ctx.moveTo(54, 48);
    ctx.lineTo(116, 48);
    ctx.lineTo(174, 224);
    ctx.lineTo(94, 224);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 6. Framed Royal Oil Portrait & Gothic Bookshelf (x: 142..226)
    // Ornate Gilded Portrait Frame
    px(ctx, 146, 72, 34, 44, '#09060b');
    px(ctx, 147, 73, 32, 42, '#b45309');
    px(ctx, 149, 75, 28, 38, '#f59e0b');
    px(ctx, 151, 77, 24, 34, '#241118');
    // Tiny gothic chiaroscuro royal ancestor oil painting inside frame
    px(ctx, 151, 77, 24, 34, '#18090e');
    px(ctx, 153, 79, 20, 12, '#2a0f18');
    // Shadowed noble locks & spiked crown
    px(ctx, 156, 82, 14, 14, '#271316');
    px(ctx, 158, 79, 2, 4, '#fbbf24');
    px(ctx, 162, 78, 2, 5, '#fef08a');
    px(ctx, 166, 79, 2, 4, '#fbbf24');
    px(ctx, 158, 82, 10, 2, '#d97706');
    // Chiseled portrait face with brow shadow
    px(ctx, 159, 84, 8, 9, '#d6a587');
    px(ctx, 160, 92, 6, 2, '#d6a587');
    px(ctx, 159, 84, 8, 3, '#8c5a45');
    px(ctx, 160, 87, 2, 1, '#09060b');
    px(ctx, 164, 87, 2, 1, '#09060b');
    px(ctx, 162, 88, 2, 3, '#9a6550');
    // Draped crimson velvet mantle & gilded collar chain
    px(ctx, 153, 95, 20, 16, '#5c0f1e');
    px(ctx, 155, 96, 16, 15, '#881337');
    px(ctx, 158, 95, 10, 3, '#fbbf24');
    px(ctx, 161, 98, 4, 13, '#d97706');

    // Heraldic Heater Shield (tapered tip) & Crossed Halberds (x: 192..226, y: 74..120)
    for (let h = 0; h < 34; h++) {
      px(ctx, 193 + Math.floor(h * 0.72), 74 + h, 2, 2, '#94a3b8');
      px(ctx, 217 - Math.floor(h * 0.72), 74 + h, 2, 2, '#64748b');
    }
    px(ctx, 198, 82, 18, 12, '#09060b');
    px(ctx, 200, 94, 14, 6, '#09060b');
    px(ctx, 203, 100, 8, 4, '#09060b');
    px(ctx, 199, 83, 16, 11, '#991b1b');
    px(ctx, 201, 94, 12, 5, '#7f1d1d');
    px(ctx, 204, 99, 6, 3, '#7f1d1d');
    px(ctx, 205, 86, 4, 11, '#fbbf24');
    px(ctx, 202, 89, 10, 3, '#fbbf24');

    // Tall Gothic Bookshelf (x: 152..216, y: 124..216)
    px(ctx, 152, 124, 62, 92, '#140a08');
    px(ctx, 154, 126, 58, 88, '#2b1610');
    for (let sy = 144; sy <= 198; sy += 26) {
      px(ctx, 154, sy, 58, 3, '#4a261a');
      for (let bx = 156; bx < 208; bx += 5) {
        const bh = 12 + ((bx * 7 + sy) % 6);
        const cols = ['#991b1b', '#1e40af', '#b45309', '#166534', '#6b21a8'];
        const bc = cols[(bx + sy) % cols.length];
        px(ctx, bx, sy - bh, 4, bh, bc);
        px(ctx, bx + 1, sy - bh + 2, 2, 1, '#fbbf24');
      }
    }

    // 7. Fluted Gothic Stone Pillar & Overhead Ribbed Arch (x: 0..28)
    px(ctx, 0, 0, 28, 224, '#1b1319');
    px(ctx, 3, 0, 4, 224, '#362732');
    px(ctx, 9, 0, 3, 224, '#291d26');
    px(ctx, 15, 0, 3, 224, '#231820');
    px(ctx, 22, 0, 6, 224, '#0f0a0e');
    // Capital & Base Plinth
    px(ctx, 0, 16, 32, 8, '#362732');
    px(ctx, 0, 24, 30, 4, '#241920');
    px(ctx, 0, 210, 32, 14, '#2b1e26');
    px(ctx, 0, 210, 32, 2, '#4c3844');
    // Hanging Vaulted Ceiling Arch Top (y: 0..22)
    px(ctx, 0, 0, W, 10, '#140d12');
    px(ctx, 28, 10, 24, 6, '#1b1218');
    px(ctx, 200, 10, 56, 6, '#1b1218');
    // Corner cobwebs
    for (let cw = 0; cw < 12; cw++) {
      px(ctx, 28 + cw, 16 + Math.floor(cw * 0.5), 1, 1, 'rgba(226,232,240,0.22)');
      px(ctx, 28 + cw, 22 - Math.floor(cw * 0.3), 1, 1, 'rgba(226,232,240,0.16)');
    }
  } else if (biome === 'forest') {
    px(ctx, 0, 0, W, H, '#040e12');
    px(ctx, 0, 108, W, 162, '#08181a');
    // Far misty canopy & giant ancient trunks
    [14, 58, 106, 160, 212].forEach((tx, idx) => {
      px(ctx, tx, 0, 16 + (idx % 2) * 6, 224, '#071515');
      px(ctx, tx + 3, 0, 3, 224, '#0d2522');
    });
    // Moss-etched ashlar ruin courses
    for (let row = 6; row < 19; row++) {
      const y = row * 12;
      const offset = (row % 2) * 12;
      for (let bx = -12 + offset; bx < W; bx += 24) {
        const moss = ((row * 13 + bx) & 7) === 0;
        px(ctx, bx, y, 23, 11, moss ? '#132d25' : '#0f221f');
        px(ctx, bx, y, 23, 1, moss ? '#22c55e' : '#1b3833');
        px(ctx, bx, y + 11, 24, 1, '#050c0d');
      }
    }
    // Ancient crumbled temple archway & mossy stone pillars
    px(ctx, 54, 46, 128, 20, '#142622');
    px(ctx, 56, 48, 124, 5, '#2b4f47');
    px(ctx, 64, 66, 20, 158, '#132421');
    px(ctx, 66, 66, 6, 158, '#264740');
    px(ctx, 68, 92, 12, 4, '#22c55e');
    px(ctx, 154, 66, 20, 158, '#132421');
    px(ctx, 156, 66, 6, 158, '#264740');
    px(ctx, 156, 128, 14, 5, '#16a34a');
    // Glowing ancient rune monolith between pillars
    px(ctx, 102, 112, 32, 112, '#142624');
    px(ctx, 105, 115, 26, 107, '#1d3633');
    px(ctx, 114, 130, 8, 28, '#34d399');
    px(ctx, 110, 140, 16, 4, '#6ee7b7');
    px(ctx, 116, 170, 4, 12, '#34d399');
    // Gnarled foreground tree + creeping roots + hanging fern fronds
    px(ctx, 0, 0, 30, 224, '#0c1f1a');
    px(ctx, 4, 0, 7, 224, '#1b4036');
    px(ctx, 15, 0, 4, 224, '#143129');
    px(ctx, 0, 202, 42, 22, '#112a22');
    px(ctx, 0, 202, 36, 4, '#22c55e');
    px(ctx, 30, 14, 18, 4, '#15803d');
    px(ctx, 174, 22, 22, 4, '#15803d');
  } else {
    // Reworked Volcano Hell Citadel: glowing volcanic caldera backdrop, obsidian basalt peaks, sulfur crystals, magma cascades & iron chains
    px(ctx, 0, 0, W, H, '#120303');
    px(ctx, 0, 32, W, 62, '#280705');
    px(ctx, 0, 74, W, 56, '#4c0f08');
    px(ctx, 0, 114, W, 156, '#1c0504');

    // Distant jagged volcanic caldera cones & glowing magma craters
    for (let vx = -20; vx < W + 40; vx += 64) {
      px(ctx, vx + 8, 52, 48, 64, '#1b0504');
      px(ctx, vx + 16, 38, 32, 22, '#240706');
      px(ctx, vx + 22, 34, 20, 6, '#dc2626'); // Glowing volcano crater rim!
      px(ctx, vx + 26, 35, 12, 3, '#fef08a');
    }

    // Chiseled Obsidian Basalt Ashlar Masonry with molten cracks
    for (let row = 8; row < 19; row++) {
      const y = row * 12;
      const offset = (row % 2) * 16;
      for (let bx = -16 + offset; bx < W; bx += 32) {
        px(ctx, bx, y, 31, 11, (row + bx) % 5 === 0 ? '#2b0b09' : '#1b0605');
        px(ctx, bx, y, 31, 1, '#521914');
        px(ctx, bx, y + 11, 32, 1, '#080101');
        if ((row * 3 + bx) % 11 === 0) {
          px(ctx, bx + 6, y + 4, 10, 2, '#f97316'); // Glowing ember vein inside basalt
          px(ctx, bx + 9, y + 4, 4, 1, '#fef08a');
        }
      }
    }

    // Hanging Obsidian Ceiling Stalactites & Glowing Sulfur Crystals
    for (let cx = 6; cx < W; cx += 28) {
      const sh = 16 + ((cx * 7) % 24);
      px(ctx, cx, 0, 8, sh, '#120303');
      px(ctx, cx + 2, 0, 4, sh + 7, '#2b0c09');
      if (cx % 56 === 6) {
        px(ctx, cx + 3, sh + 3, 2, 6, '#fb923c');
      }
    }

    // Jagged Basalt Stalagmites along Citadel Base
    for (let x = 0; x < W; x += 22) {
      const h = 34 + ((x * 13) % 42);
      px(ctx, x, 224 - h, 20, h, '#140404');
      px(ctx, x + 4, 224 - h - 10, 12, 12, '#1c0505');
      px(ctx, x + 6, 224 - h - 8, 3, 10, '#4a1713');
    }

    // Carved Demonic Obsidian Archway + Skull Keystone + Twin Glowing Lava Falls + Chains
    px(ctx, 56, 30, 140, 20, '#260b09');
    px(ctx, 56, 30, 140, 2, '#6d221c');
    px(ctx, 60, 50, 24, 174, '#1b0706');
    px(ctx, 65, 50, 6, 174, '#4c1813');
    px(ctx, 168, 50, 24, 174, '#1b0706');
    px(ctx, 173, 50, 6, 174, '#4c1813');
    px(ctx, 117, 32, 18, 16, '#78716c');
    px(ctx, 120, 37, 3, 3, '#fde047');
    px(ctx, 129, 37, 3, 3, '#fde047');
    px(ctx, 122, 43, 8, 3, '#d6d3d1');

    // Hanging Forged Iron Chains
    for (let cy = 50; cy < 156; cy += 8) {
      px(ctx, 48, cy, 3, 5, '#64748b');
      px(ctx, 202, cy, 3, 5, '#64748b');
    }

    // Multi-tier Glowing Molten Magma Cascade Sluice
    px(ctx, 110, 56, 32, 168, '#7c2d12');
    px(ctx, 114, 60, 24, 164, '#ea580c');
    px(ctx, 119, 64, 14, 160, '#fbbf24');
    px(ctx, 123, 66, 6, 158, '#fef9c3');
    for (let gy = 74; gy < 214; gy += 22) {
      px(ctx, 108, gy, 36, 3, '#170606');
    }
  }

  biomeWallCache.set(biome, c);
  return c;
}

/**
 * Baked high-detail CPS3-style pixel sprite cache for JoJo bosses + Stand Spirits.
 * Rendered at native 1:1 canvas texels (64x92 for Battle, 38x58 for Corridor)
 * so every muscle, coat fold, facial shadow, fang, and Stand plate is crisp pixel art.
 */
const bossSpriteCache = new Map<string, HTMLCanvasElement>();

export function getBakedJoJoBossSprite(
  def: BossDef,
  pose: 'idle' | 'windup' | 'attack' | 'ko',
  battleSize: boolean,
): HTMLCanvasElement {
  const key = `${def.index}_${def.isGyroBoss ? 'gyro' : def.megaArchetype ?? 'std'}_${pose}_${battleSize ? 'B' : 'C'}`;
  const existing = bossSpriteCache.get(key);
  if (existing) return existing;

  // Render on a spacious 116x116 native pixel canvas, then scale down cleanly for corridor if needed
  const c = document.createElement('canvas');
  c.width = 116;
  c.height = 116;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const pRamp = makeRamp(def.primaryColor);
  const sRamp = makeRamp(def.secondaryColor);
  const aRamp = makeRamp(def.auraColor);
  const skinRamp = makeRamp(def.skinColor);

  // Stand Spirit hovers behind-right (Boss faces LEFT toward Warrior!)
  const standX = 76;
  const standY = 48;

  ctx.save();
  ctx.globalAlpha = pose === 'ko' ? 0.35 : 0.94;

  // Spectral aura wisps circling behind Stand
  px(ctx, standX - 24, standY - 34, 3, 6, aRamp.hi);
  px(ctx, standX + 20, standY - 28, 3, 8, aRamp.hi);
  px(ctx, standX + 12, standY + 12, 4, 4, aRamp.base);

  // All 6 Bespoke JoJo Stand Spirit Silhouettes (no blocky boxes!)
  if (def.standShape === 'reaper') {
    // Hooded Grim Reaper Stand with layered spectral shroud, rib armor & rune scythe
    px(ctx, standX - 11, standY - 38, 22, 16, '#09060b');
    px(ctx, standX - 8, standY - 41, 16, 4, aRamp.ink);
    px(ctx, standX - 9, standY - 36, 18, 13, '#18181b');
    px(ctx, standX - 5, standY - 30, 4, 2, '#fef08a');
    px(ctx, standX + 1, standY - 30, 4, 2, '#fef08a');
    // Tattered jagged cloak & skeletal rib plates
    px(ctx, standX - 16, standY - 22, 32, 11, aRamp.ink);
    px(ctx, standX - 15, standY - 21, 30, 9, aRamp.sh);
    px(ctx, standX - 10, standY - 12, 20, 18, aRamp.deep);
    px(ctx, standX - 6, standY + 6, 12, 14, aRamp.sh);
    px(ctx, standX - 2, standY + 18, 4, 8, aRamp.base); // Ethereal tail wisp
    for (let r = 0; r < 3; r++) {
      px(ctx, standX - 7, standY - 18 + r * 5, 14, 2, '#e2e8f0');
    }
    // Curved Crescent Death Scythe with glowing rune edge
    px(ctx, standX - 28, standY - 43, 24, 4, '#94a3b8');
    px(ctx, standX - 31, standY - 39, 12, 4, '#e2e8f0');
    px(ctx, standX - 30, standY - 37, 8, 2, aRamp.hi);
    px(ctx, standX - 7, standY - 40, 3, 60, '#64748b');
    px(ctx, standX - 6, standY - 40, 1, 58, '#cbd5e1');
  } else if (def.standShape === 'knight') {
    // Silver Chariot Style Sleek Armored Fencing Stand!
    // Sweeping crested helmet + spiked visor fin
    px(ctx, standX - 7, standY - 41, 14, 15, '#09060b');
    px(ctx, standX - 6, standY - 40, 12, 13, '#cbd5e1');
    px(ctx, standX - 5, standY - 40, 8, 4, '#f8fafc');
    px(ctx, standX - 3, standY - 46, 6, 7, aRamp.hi); // Plume fin
    px(ctx, standX - 5, standY - 34, 10, 3, '#09060b');
    px(ctx, standX - 4, standY - 33, 3, 2, '#38bdf8');
    px(ctx, standX + 1, standY - 33, 3, 2, '#38bdf8');
    // Tiered silver shoulder pauldrons & tapered cuirass
    px(ctx, standX - 18, standY - 25, 36, 10, '#09060b');
    px(ctx, standX - 20, standY - 26, 10, 9, '#e2e8f0');
    px(ctx, standX + 10, standY - 26, 10, 9, '#94a3b8');
    px(ctx, standX - 10, standY - 16, 20, 17, '#cbd5e1');
    px(ctx, standX - 3, standY - 20, 6, 6, aRamp.base); // Chest sapphire
    px(ctx, standX - 6, standY + 1, 12, 14, '#64748b');
    px(ctx, standX - 3, standY + 15, 6, 8, aRamp.base); // Spectral wisp
    // Extending Needle Stand Rapier thrust forward!
    px(ctx, standX - 36, standY - 12, 24, 3, '#f8fafc');
    px(ctx, standX - 39, standY - 11, 5, 1, '#ffffff');
    px(ctx, standX - 14, standY - 15, 5, 9, '#fbbf24');
  } else if (def.standShape === 'serpent') {
    // Hierophant / Coiled Ophidian Stand with segmented tail & visor crystal
    // Coiling serpentine spirit tail behind
    px(ctx, standX + 8, standY - 2, 16, 10, aRamp.ink);
    px(ctx, standX + 9, standY - 1, 14, 8, aRamp.sh);
    px(ctx, standX + 2, standY + 7, 16, 9, aRamp.base);
    px(ctx, standX - 8, standY + 14, 14, 7, aRamp.hi);
    px(ctx, standX - 14, standY + 19, 8, 5, sRamp.base);
    // Slender armored torso with diamond mosaic pattern
    px(ctx, standX - 13, standY - 24, 26, 12, aRamp.ink);
    px(ctx, standX - 12, standY - 23, 24, 10, aRamp.base);
    px(ctx, standX - 9, standY - 13, 18, 16, aRamp.sh);
    px(ctx, standX - 6, standY - 20, 12, 2, sRamp.hi);
    px(ctx, standX - 4, standY - 15, 8, 2, sRamp.hi);
    // Sleek faceted melon/visor helmet with gold band
    px(ctx, standX - 7, standY - 39, 14, 14, '#09060b');
    px(ctx, standX - 6, standY - 38, 12, 12, aRamp.hi);
    px(ctx, standX - 6, standY - 33, 12, 4, '#09060b');
    px(ctx, standX - 4, standY - 32, 3, 2, '#fef08a');
    px(ctx, standX + 1, standY - 32, 3, 2, '#fef08a');
    px(ctx, standX - 2, standY - 37, 4, 3, sRamp.hi);
    // Ribbon tentacle lash forward
    px(ctx, standX - 26, standY - 14, 14, 3, aRamp.hi);
    px(ctx, standX - 31, standY - 11, 7, 3, sRamp.base);
  } else if (def.standShape === 'sovereign') {
    // Winged Requiem Stand with layered feathered pinions & spiked crown
    for (let w = 0; w < 5; w++) {
      px(ctx, standX - 28 + w * 3, standY - 29 + w * 4, 14 - w * 2, 4, sRamp.base);
      px(ctx, standX - 27 + w * 3, standY - 29 + w * 4, 8, 1, sRamp.hi);
      px(ctx, standX + 14 - w, standY - 29 + w * 4, 14 - w * 2, 4, sRamp.base);
    }
    px(ctx, standX - 15, standY - 23, 30, 12, aRamp.ink);
    px(ctx, standX - 13, standY - 22, 26, 10, aRamp.base);
    px(ctx, standX - 9, standY - 12, 18, 19, aRamp.sh);
    px(ctx, standX - 7, standY - 19, 14, 13, aRamp.hi);
    px(ctx, standX - 2, standY - 16, 4, 6, '#fde047'); // Imperial chest cross
    px(ctx, standX - 7, standY - 37, 14, 14, '#fef08a');
    px(ctx, standX - 5, standY - 42, 2, 5, '#fbbf24');
    px(ctx, standX - 1, standY - 44, 2, 7, '#fef08a');
    px(ctx, standX + 3, standY - 42, 2, 5, '#fbbf24');
    px(ctx, standX - 5, standY - 31, 4, 2, '#09060b');
    px(ctx, standX + 1, standY - 31, 4, 2, '#09060b');
    px(ctx, standX - 4, standY - 31, 2, 2, '#ffffff');
    px(ctx, standX + 2, standY - 31, 2, 2, '#ffffff');
  } else if (def.standShape === 'clockwork') {
    // Chronos Gear Halo + Brass-Trimmed Timepiece Stand
    ctx.strokeStyle = sRamp.hi;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(standX, standY - 19, 22, 0, Math.PI * 2);
    ctx.stroke();
    for (let t = 0; t < 8; t++) {
      const ang = (t / 8) * Math.PI * 2;
      px(ctx, standX + Math.cos(ang) * 22 - 1, standY - 19 + Math.sin(ang) * 22 - 1, 3, 3, '#fbbf24');
    }
    px(ctx, standX - 15, standY - 23, 30, 12, aRamp.base);
    px(ctx, standX - 9, standY - 11, 18, 22, aRamp.sh);
    px(ctx, standX - 6, standY - 18, 12, 12, '#0f172a');
    px(ctx, standX - 1, standY - 17, 2, 6, '#fde047');
    px(ctx, standX, standY - 12, 5, 2, '#fde047');
    px(ctx, standX - 7, standY - 37, 14, 14, sRamp.base);
    px(ctx, standX - 5, standY - 31, 3, 2, '#ffffff');
    px(ctx, standX + 2, standY - 31, 3, 2, '#ffffff');
  } else {
    // Sculpted Muscular CPS3 Brawler Stand (Star Platinum / The World!)
    // Billowing Star Platinum Scarf streaming right
    px(ctx, standX + 6, standY - 28, 16, 6, sRamp.ink);
    px(ctx, standX + 7, standY - 27, 14, 4, sRamp.base);
    px(ctx, standX + 17, standY - 24, 9, 5, sRamp.sh);
    // Broad sculpted shoulder pauldrons + chest + tapered waist + ORA fists
    px(ctx, standX - 19, standY - 24, 38, 12, aRamp.ink);
    px(ctx, standX - 18, standY - 23, 36, 10, aRamp.base);
    // Contoured Spiked Shoulder Pauldrons
    px(ctx, standX - 22, standY - 26, 10, 11, aRamp.ink);
    px(ctx, standX - 21, standY - 25, 8, 9, sRamp.base);
    px(ctx, standX - 20, standY - 25, 5, 4, sRamp.hi);
    px(ctx, standX - 24, standY - 27, 4, 3, '#fde047');
    px(ctx, standX + 12, standY - 26, 10, 11, aRamp.ink);
    px(ctx, standX + 13, standY - 25, 8, 9, sRamp.sh);
    px(ctx, standX + 14, standY - 25, 5, 4, sRamp.base);
    px(ctx, standX + 20, standY - 27, 4, 3, '#fde047');
    // Chiseled torso, pec separation & six-pack abs
    px(ctx, standX - 12, standY - 13, 24, 14, aRamp.ink);
    px(ctx, standX - 11, standY - 13, 22, 13, aRamp.base);
    px(ctx, standX - 9, standY - 21, 18, 9, aRamp.hi);
    px(ctx, standX - 1, standY - 20, 2, 8, aRamp.sh);
    px(ctx, standX - 5, standY - 10, 4, 3, aRamp.hi);
    px(ctx, standX + 1, standY - 10, 4, 3, aRamp.hi);
    px(ctx, standX - 5, standY - 6, 4, 3, aRamp.sh);
    px(ctx, standX + 1, standY - 6, 4, 3, aRamp.sh);
    // Tapered waist & ethereal fading spirit tail
    px(ctx, standX - 8, standY + 1, 16, 11, aRamp.sh);
    px(ctx, standX - 5, standY + 12, 10, 9, aRamp.base);
    px(ctx, standX - 2, standY + 21, 4, 6, aRamp.hi);
    // Pair of glowing knuckle-studded ORA fists thrust forward!
    px(ctx, standX - 29, standY - 14, 11, 10, aRamp.ink);
    px(ctx, standX - 28, standY - 13, 9, 8, aRamp.hi);
    px(ctx, standX - 28, standY - 10, 3, 5, '#fde047'); // Brass knuckles
    px(ctx, standX - 24, standY + 1, 10, 9, aRamp.ink);
    px(ctx, standX - 23, standY + 2, 8, 7, aRamp.base);
    px(ctx, standX - 23, standY + 4, 3, 4, '#fbbf24');
    // Tapered Stand Armored Helm + Flowing Spiky Stand Mane
    px(ctx, standX - 8, standY - 40, 16, 15, aRamp.ink);
    px(ctx, standX - 6, standY - 26, 12, 3, aRamp.ink);
    px(ctx, standX - 7, standY - 39, 14, 13, sRamp.base);
    px(ctx, standX - 5, standY - 26, 10, 2, sRamp.sh);
    px(ctx, standX - 4, standY - 47, 8, 8, aRamp.hi);
    px(ctx, standX + 2, standY - 44, 7, 6, aRamp.base);
    px(ctx, standX - 6, standY - 34, 5, 3, '#09060b');
    px(ctx, standX + 1, standY - 34, 5, 3, '#09060b');
    px(ctx, standX - 5, standY - 33, 3, 2, '#ffffff');
    px(ctx, standX + 2, standY - 33, 3, 2, '#ffffff');
  }
  ctx.restore();

  // 2. Towering Chiseled JoJo Villain Body (Center-Left at X=44, Base Y=110)
  const bx = 44;
  const by = 110;
  const lean = pose === 'attack' ? -5 : pose === 'windup' ? 4 : 0;
  const expr: AnimeExpression =
    pose === 'attack' ? 'wryyy' : pose === 'ko' ? 'grit' : pose === 'windup' ? 'menacing' : 'smirk';

  // Sculpted Dynamic JoJo Staggered Stance Boots & Buckled Shin Plates
  px(ctx, bx - 16, by - 33, 11, 24, '#09060b');
  px(ctx, bx + 4, by - 33, 11, 24, '#09060b');
  px(ctx, bx - 15, by - 32, 9, 22, '#1e1b2e');
  px(ctx, bx + 5, by - 32, 9, 22, '#18181b');
  px(ctx, bx - 14, by - 31, 3, 12, '#334155'); // Thigh highlight
  px(ctx, bx + 6, by - 31, 3, 12, '#27272a');
  px(ctx, bx - 14, by - 22, 7, 4, sRamp.hi); // Sculpted knee guard
  px(ctx, bx + 6, by - 22, 7, 4, sRamp.base);
  // Pointed high-fashion JoJo boots with brass spur heel & buckle strap
  px(ctx, bx - 19, by - 10, 14, 10, '#09060b');
  px(ctx, bx - 18, by - 9, 11, 8, sRamp.sh);
  px(ctx, bx - 17, by - 9, 6, 5, sRamp.base);
  px(ctx, bx - 18, by - 6, 4, 2, '#fbbf24'); // Boot buckle
  px(ctx, bx + 3, by - 10, 14, 10, '#09060b');
  px(ctx, bx + 4, by - 9, 11, 8, sRamp.sh);
  px(ctx, bx + 6, by - 9, 6, 5, sRamp.base);
  px(ctx, bx + 12, by - 4, 3, 2, '#fbbf24'); // Heel spur

  // Flowing Dynamic Outfit Behind & Over Villain across all 6 CoatStyles!
  if (def.coatStyle === 'cape' || def.coatStyle === 'trench') {
    px(ctx, bx + 8 + lean, by - 60, 17, 19, pRamp.ink);
    px(ctx, bx + 12 + lean, by - 41, 17, 19, pRamp.ink);
    px(ctx, bx + 15 + lean, by - 22, 15, 13, pRamp.ink);
    px(ctx, bx + 9 + lean, by - 59, 15, 18, pRamp.deep);
    px(ctx, bx + 13 + lean, by - 41, 15, 18, pRamp.sh);
    px(ctx, bx + 16 + lean, by - 22, 13, 11, pRamp.base);
    px(ctx, bx + 19 + lean, by - 35, 3, 18, pRamp.hi);
    px(ctx, bx + 16 + lean, by - 13, 12, 2, '#fbbf24');
  } else if (def.coatStyle === 'spiked_mantle') {
    px(ctx, bx - 23 + lean, by - 70, 10, 10, sRamp.base);
    px(ctx, bx - 26 + lean, by - 74, 5, 5, sRamp.hi);
    px(ctx, bx + 13 + lean, by - 70, 10, 10, sRamp.base);
    px(ctx, bx + 21 + lean, by - 74, 5, 5, sRamp.hi);
  } else if (def.coatStyle === 'robes') {
    // Sweeping warlock/cardinal split lower vestments over boots
    px(ctx, bx - 16 + lean, by - 35, 32, 23, pRamp.ink);
    px(ctx, bx - 15 + lean, by - 34, 30, 21, pRamp.sh);
    px(ctx, bx - 5 + lean, by - 34, 10, 20, sRamp.base);
    px(ctx, bx - 15 + lean, by - 15, 30, 2, '#fbbf24');
  } else if (def.coatStyle === 'armor') {
    // Layered gothic steel shoulder pauldrons & tassets
    px(ctx, bx - 21 + lean, by - 67, 11, 11, '#09060b');
    px(ctx, bx - 20 + lean, by - 66, 9, 9, '#94a3b8');
    px(ctx, bx - 19 + lean, by - 66, 6, 4, '#e2e8f0');
    px(ctx, bx + 10 + lean, by - 67, 11, 11, '#09060b');
    px(ctx, bx + 11 + lean, by - 66, 9, 9, '#94a3b8');
    px(ctx, bx + 12 + lean, by - 66, 6, 4, '#cbd5e1');
  }

  // Broad Shoulders + Tapered V-Shaped Heroic Waist + Gold Buttons & Chain
  px(ctx, bx - 17 + lean, by - 65, 34, 16, pRamp.ink);
  px(ctx, bx - 14 + lean, by - 49, 28, 12, pRamp.ink);
  px(ctx, bx - 15 + lean, by - 37, 30, 7, pRamp.ink);
  px(ctx, bx - 16 + lean, by - 64, 32, 15, def.coatStyle === 'vest' ? sRamp.base : pRamp.base);
  px(ctx, bx - 13 + lean, by - 49, 26, 12, def.coatStyle === 'vest' ? sRamp.sh : pRamp.base);
  px(ctx, bx - 16 + lean, by - 64, 5, 15, pRamp.hi);
  px(ctx, bx + 10 + lean, by - 64, 6, 15, pRamp.sh);
  // Gold lapel emblem pins & buttons
  px(ctx, bx - 11 + lean, by - 58, 3, 3, '#fbbf24');
  px(ctx, bx + 8 + lean, by - 58, 3, 3, '#fbbf24');
  px(ctx, bx - 10 + lean, by - 46, 2, 2, '#fef08a');
  px(ctx, bx + 8 + lean, by - 46, 2, 2, '#fef08a');
  // Open-Chest V-Neck + Sculpted Pecs, Abs & Medallion Necklace
  px(ctx, bx - 7 + lean, by - 64, 14, 15, skinRamp.base);
  px(ctx, bx - 5 + lean, by - 49, 10, 12, skinRamp.base);
  px(ctx, bx - 7 + lean, by - 64, 4, 15, skinRamp.sh);
  px(ctx, bx - 5 + lean, by - 55, 10, 2, skinRamp.ink);
  px(ctx, bx - 2 + lean, by - 52, 4, 11, skinRamp.sh);
  px(ctx, bx - 3 + lean, by - 61, 6, 2, '#fbbf24');
  px(ctx, bx - 1 + lean, by - 59, 3, 3, def.auraColor);
  // Ornate JoJo Waist Belt & Per-Boss Emblem Buckle ('star'|'clock'|'skull'|'diamond'|'eye'|'flame')
  px(ctx, bx - 14 + lean, by - 38, 28, 5, '#09060b');
  px(ctx, bx - 13 + lean, by - 37, 26, 3, sRamp.base);
  px(ctx, bx - 4 + lean, by - 39, 8, 6, '#fbbf24');
  if (def.emblem === 'skull') {
    px(ctx, bx - 2 + lean, by - 38, 4, 4, '#f8fafc');
    px(ctx, bx - 2 + lean, by - 37, 1, 1, '#09060b');
    px(ctx, bx + 1 + lean, by - 37, 1, 1, '#09060b');
  } else if (def.emblem === 'flame') {
    px(ctx, bx - 2 + lean, by - 39, 4, 5, '#f97316');
    px(ctx, bx - 1 + lean, by - 38, 2, 3, '#fef08a');
  } else if (def.emblem === 'eye') {
    px(ctx, bx - 3 + lean, by - 37, 6, 3, '#ffffff');
    px(ctx, bx - 1 + lean, by - 37, 2, 3, def.auraColor);
  } else {
    px(ctx, bx - 2 + lean, by - 38, 4, 4, def.auraColor);
  }
  // Dramatic High Upturned Coat Collars framing neck
  px(ctx, bx - 12 + lean, by - 73, 5, 16, sRamp.ink);
  px(ctx, bx - 11 + lean, by - 72, 4, 14, sRamp.base);
  px(ctx, bx + 7 + lean, by - 73, 5, 16, sRamp.ink);
  px(ctx, bx + 7 + lean, by - 72, 4, 14, sRamp.base);

  // Expressive JoJo Arms (Studded Wrist Cuffs + Dramatic Finger Point / Pose!)
  if (pose === 'attack') {
    px(ctx, bx - 38 + lean, by - 59, 24, 7, pRamp.ink);
    px(ctx, bx - 37 + lean, by - 58, 22, 5, skinRamp.base);
    px(ctx, bx - 24 + lean, by - 59, 4, 7, '#09060b'); // Studded cuff
    px(ctx, bx - 23 + lean, by - 58, 2, 5, '#fbbf24');
    px(ctx, bx - 43 + lean, by - 58, 6, 3, skinRamp.hi); // Pointing finger!
  } else {
    px(ctx, bx - 23 + lean, by - 62, 7, 14, pRamp.ink);
    px(ctx, bx - 22 + lean, by - 61, 5, 12, pRamp.base);
    px(ctx, bx - 27 + lean, by - 51, 8, 6, pRamp.ink);
    px(ctx, bx - 26 + lean, by - 50, 7, 4, skinRamp.base);
    px(ctx, bx - 23 + lean, by - 51, 3, 6, '#fbbf24'); // Wrist cuff
  }
  px(ctx, bx + 15 + lean, by - 62, 7, 19, pRamp.ink);
  px(ctx, bx + 16 + lean, by - 61, 5, 17, pRamp.sh);
  px(ctx, bx + 16 + lean, by - 46, 5, 3, '#fbbf24');

  // Chiseled Tapered JoJo Anime Head + Per-Boss Unique Facial Design
  const traits = getBossFacialTraits(def.index);
  const hx = bx - 8 + lean;
  const hy = by - 89;
  if (traits.jawShape === 'monolith') {
    px(ctx, hx - 2, hy - 1, 20, 21, '#09060b');
    px(ctx, hx - 1, hy, 18, 19, skinRamp.base);
  } else {
    px(ctx, hx - 1, hy - 1, 18, 17, '#09060b');
    px(ctx, hx + 1, hy + 16, 14, 4, '#09060b');
    px(ctx, hx + 3, hy + 19, 10, 3, '#09060b');
    px(ctx, hx, hy, 16, 16, skinRamp.base);
    px(ctx, hx + 2, hy + 16, 12, 3, skinRamp.base);
    px(ctx, hx + 4, hy + 19, 8, 2, skinRamp.base);
  }
  px(ctx, hx, hy, 16, 7, skinRamp.deep);
  px(ctx, hx + 11, hy + 7, 5, 10, skinRamp.sh);
  px(ctx, hx + 3, hy + 12, 2, 4, skinRamp.ink);
  px(ctx, hx + 5, hy + 8, 2, 5, skinRamp.sh);
  if (traits.faceMarking === 'lightning_scar' || traits.faceMarking === 'crimson_cross') {
    px(ctx, hx + 1, hy + 4, 2, 8, traits.scarColor);
  } else if (traits.faceMarking === 'pillar_tribal' || traits.faceMarking === 'royal_paint') {
    px(ctx, hx + 1, hy + 10, 3, 2, def.auraColor);
    px(ctx, hx + 11, hy + 10, 3, 2, def.auraColor);
  } else if (traits.faceMarking === 'gold_teardrop') {
    px(ctx, hx + 2, hy + 11, 2, 3, '#fbbf24');
  }
  const eyeH = expr === 'wryyy' || expr === 'grit' ? 3 : 2;
  px(ctx, hx + 1, hy + 6, 5, 2, '#09060b');
  px(ctx, hx + 8, hy + 6, 6, 2, '#09060b');
  if (traits.eyeDesign === 'cyber_visor') {
    px(ctx, hx + 1, hy + 7, 6, 4, '#09060b');
    px(ctx, hx + 2, hy + 8, 4, 2, traits.altEyeColor);
    px(ctx, hx + 9, hy + 8, 4, eyeH, '#ffffff');
    px(ctx, hx + 9, hy + 8, 2, eyeH, def.auraColor);
  } else if (traits.eyeDesign === 'bandaged_eye') {
    px(ctx, hx + 1, hy + 7, 6, 4, '#e2e8f0');
    px(ctx, hx + 9, hy + 8, 4, eyeH, '#ffffff');
    px(ctx, hx + 9, hy + 8, 2, eyeH, traits.altEyeColor);
  } else {
    px(ctx, hx + 2, hy + 8, 4, eyeH, '#ffffff');
    px(ctx, hx + 2, hy + 8, 2, eyeH, def.auraColor);
    px(ctx, hx + 9, hy + 8, 4, eyeH, '#ffffff');
    px(ctx, hx + 9, hy + 8, 2, eyeH, traits.eyeDesign === 'dual_heterochromia' ? traits.altEyeColor : def.auraColor);
    if (traits.eyeDesign === 'glowing_oracle') {
      px(ctx, hx + 6, hy + 3, 3, 2, traits.altEyeColor);
    }
  }
  if (traits.jawShape === 'masked_phantom') {
    px(ctx, hx + 1, hy + 13, 14, 6, '#1e293b');
    px(ctx, hx + 4, hy + 15, 6, 2, def.auraColor);
  } else if (expr === 'wryyy') {
    px(ctx, hx + 3, hy + 14, 10, 4, '#09060b');
    px(ctx, hx + 4, hy + 15, 8, 2, '#991b1b');
    px(ctx, hx + 4, hy + 15, 8, 1, '#ffffff');
    px(ctx, hx + 5, hy + 16, 1, 1, '#ffffff');
    px(ctx, hx + 10, hy + 16, 1, 1, '#ffffff');
  } else if (expr === 'grit') {
    px(ctx, hx + 4, hy + 15, 8, 3, '#09060b');
    px(ctx, hx + 5, hy + 16, 6, 1, '#ffffff');
  } else if (expr === 'smirk') {
    px(ctx, hx + 4, hy + 16, 5, 1, '#09060b');
    px(ctx, hx + 9, hy + 15, 2, 1, '#09060b');
    px(ctx, hx + 10, hy + 15, 1, 1, '#ffffff');
  } else {
    px(ctx, hx + 4, hy + 16, 6, 1, '#09060b');
  }
  if (traits.accessory === 'van_dyke_goatee') {
    px(ctx, hx + 6, hy + 18, 4, 4, '#09060b');
  } else if (traits.accessory === 'gold_earrings') {
    px(ctx, hx + 15, hy + 11, 2, 4, '#fbbf24');
  } else if (traits.accessory === 'steel_chinplate') {
    px(ctx, hx + 5, hy + 17, 6, 3, '#64748b');
  }

  // Sculpted Anime Hair & Headgear framing the face (with Mega Boss DIO & Undead Dread Knight bespoke flourishes!)
  if (def.megaArchetype === 'mega_dio') {
    // Spiky radiant golden-yellow DIO hair + green heart headband + glowing crimson eyes + twin vibrant swords!
    px(ctx, hx - 5, hy - 12, 6, 12, '#eab308');
    px(ctx, hx + 1, hy - 15, 7, 15, '#facc15');
    px(ctx, hx + 8, hy - 14, 7, 14, '#fef08a');
    px(ctx, hx + 14, hy - 10, 5, 11, '#eab308');
    px(ctx, hx - 1, hy - 2, 18, 3, '#09060b');
    px(ctx, hx + 1, hy - 1, 14, 2, '#eab308');
    px(ctx, hx + 5, hy - 2, 4, 3, '#22c55e');
    // Vibrant Dual Vampire Swords held at the ready!
    const swX = pose === 'attack' ? bx - 50 : bx - 36;
    const swY = pose === 'attack' ? by - 64 : by - 56;
    px(ctx, swX, swY, 22, 3, '#22d3ee');
    px(ctx, swX + 1, swY + 1, 20, 1, '#ffffff');
    px(ctx, swX + 20, swY - 2, 4, 7, '#fde047');
    px(ctx, swX + 4, swY + 12, 18, 3, '#f43f5e');
    px(ctx, swX + 5, swY + 13, 16, 1, '#fef08a');
  } else if (def.megaArchetype === 'mega_undead_knight') {
    // Horned Dread Skull Helm + Neon Soulfire Visor + Colossal Rune Greatsword!
    px(ctx, hx - 6, hy - 15, 5, 14, '#8b5cf6');
    px(ctx, hx - 5, hy - 14, 3, 11, '#f8fafc');
    px(ctx, hx + 17, hy - 15, 5, 14, '#8b5cf6');
    px(ctx, hx + 18, hy - 14, 3, 11, '#f8fafc');
    px(ctx, hx - 2, hy - 5, 20, 19, '#1e293b');
    px(ctx, hx, hy - 3, 16, 6, '#64748b');
    px(ctx, hx + 1, hy + 5, 14, 8, '#09060b');
    px(ctx, hx + 3, hy + 7, 4, 2, '#34d399');
    px(ctx, hx + 9, hy + 7, 4, 2, '#34d399');
    // Colossal glowing violet-cyan rune greatsword!
    const gsX = pose === 'attack' ? bx - 54 : bx - 38;
    const gsY = pose === 'attack' ? by - 72 : by - 64;
    px(ctx, gsX, gsY, 5, 36, '#09060b');
    px(ctx, gsX + 1, gsY + 1, 3, 34, '#8b5cf6');
    px(ctx, gsX + 2, gsY + 2, 1, 32, '#22d3ee');
    px(ctx, gsX - 4, gsY + 32, 13, 3, '#fbbf24');
    px(ctx, bx - 3 + lean, by - 58, 6, 6, '#e879f9'); // Glowing chest soulfire rune
  } else if (def.hatStyle === 'crown') {
    px(ctx, hx - 2, hy - 3, 20, 6, pRamp.sh);
    px(ctx, hx + 14, hy + 2, 4, 12, pRamp.deep);
    px(ctx, hx, hy - 8, 16, 6, '#f59e0b');
    px(ctx, hx, hy - 12, 3, 4, '#fbbf24');
    px(ctx, hx + 6, hy - 13, 4, 5, '#fef08a');
    px(ctx, hx + 13, hy - 12, 3, 4, '#fbbf24');
  } else if (def.hatStyle === 'pompadour') {
    px(ctx, hx - 6, hy - 8, 23, 9, '#1e1b4b');
    px(ctx, hx - 4, hy - 7, 17, 4, '#4338ca');
    px(ctx, hx - 3, hy - 6, 12, 2, '#818cf8');
  } else if (def.hatStyle === 'visor') {
    px(ctx, hx - 4, hy - 2, 20, 4, '#09060b');
    px(ctx, hx, hy - 8, 18, 7, sRamp.sh);
    px(ctx, hx + 3, hy - 6, 3, 3, '#fbbf24');
    px(ctx, hx + 13, hy - 4, 5, 10, '#18181b');
  } else if (def.hatStyle === 'tophat') {
    px(ctx, hx - 4, hy - 2, 24, 3, '#09060b');
    px(ctx, hx + 1, hy - 14, 14, 12, '#27272a');
    px(ctx, hx + 1, hy - 5, 14, 3, sRamp.base);
  } else if (def.hatStyle === 'halo_spikes') {
    px(ctx, hx - 3, hy - 9, 5, 9, sRamp.base);
    px(ctx, hx + 3, hy - 12, 5, 12, sRamp.hi);
    px(ctx, hx + 10, hy - 10, 6, 10, sRamp.base);
    px(ctx, hx + 2, hy - 2, 4, 3, '#22c55e');
  } else if (def.hatStyle === 'horns') {
    px(ctx, hx - 4, hy - 11, 4, 11, '#fef3c7');
    px(ctx, hx + 16, hy - 11, 4, 11, '#fef3c7');
    px(ctx, hx, hy - 4, 16, 5, sRamp.deep);
  } else if (def.hatStyle === 'samurai_crest') {
    px(ctx, hx - 2, hy - 6, 20, 7, '#1e293b');
    px(ctx, hx - 4, hy - 12, 5, 7, '#fbbf24');
    px(ctx, hx + 15, hy - 12, 5, 7, '#fbbf24');
  } else if (def.hatStyle === 'gyro_hat') {
    // Gyro Zeppeli feathered purple-brown hat + golden curls + emerald orbs + green-flaming Steel Ball!
    px(ctx, hx - 4, hy + 2, 5, 18, '#ca8a04'); // Blonde curls
    px(ctx, hx + 15, hy + 2, 5, 18, '#a16207');
    px(ctx, hx - 7, hy - 2, 30, 4, '#09060b'); // Wide cowboy brim
    px(ctx, hx - 6, hy - 1, 28, 2, '#6b21a8');
    px(ctx, hx - 1, hy - 13, 18, 12, '#09060b');
    px(ctx, hx, hy - 12, 16, 10, '#7e22ce');
    // Emerald orbs on Gyro hat band
    px(ctx, hx + 1, hy - 5, 3, 3, '#22c55e');
    px(ctx, hx + 7, hy - 5, 3, 3, '#4ade80');
    px(ctx, hx + 12, hy - 5, 3, 3, '#22c55e');
    // Spinning green flame Steel Ball held forward in hand!
    const sbX = pose === 'attack' ? bx - 52 : bx - 34;
    const sbY = pose === 'attack' ? by - 64 : by - 52;
    px(ctx, sbX - 4, sbY - 4, 18, 18, '#15803d');
    px(ctx, sbX - 2, sbY - 6, 14, 22, '#22c55e');
    px(ctx, sbX, sbY, 10, 10, '#16a34a');
    px(ctx, sbX + 2, sbY + 2, 6, 6, '#86efac');
    px(ctx, sbX + 4, sbY + 4, 2, 2, '#fef08a');
  } else {
    px(ctx, hx - 2, hy - 6, 20, 10, pRamp.sh);
  }

  // Resize cleanly for Corridor vs Native 1:1 for Battle!
  if (battleSize) {
    bossSpriteCache.set(key, c);
    return c;
  }

  const small = document.createElement('canvas');
  small.width = 62;
  small.height = 64;
  const sctx = small.getContext('2d')!;
  sctx.imageSmoothingEnabled = false;
  sctx.drawImage(c, 0, 0, 62, 64);
  bossSpriteCache.set(key, small);
  return small;
}

const warriorBattleCache = new Map<string, HTMLCanvasElement>();

/**
 * Baked native 1:1 pixel sprite (76x70) for Bastera Knight on the Pokemon battle dais.
 * Handcrafted SotN / CPS3 knight anatomy: scalloped crimson cloak, fluted steel cuirass
 * with leather baldric & royal crest, 3-lame brass pauldrons, armet visor breathing slots,
 * flowing 3-strand plume, and unique per-weapon forged blades.
 */
export function getBakedWarriorBattleSprite(
  weaponId: WeaponId,
  isSlashing: boolean,
  customization: WarriorCustomization = DEFAULT_WARRIOR_CUSTOMIZATION,
): HTMLCanvasElement {
  const key = `${weaponId}_${isSlashing ? 'atk' : 'idle'}_${customization.cloakColor}_${customization.armorColor}_${customization.visorColor}_${customization.plumeColor}_${customization.outfitStyle ?? 'knight_plate'}_${customization.headgearStyle ?? 'helm'}_${customization.crownEquipped ? 'C' : 'N'}`;
  const cached = warriorBattleCache.get(key);
  if (cached) return cached;
  if (warriorBattleCache.size > 40) {
    warriorBattleCache.clear();
  }

  const c = document.createElement('canvas');
  c.width = 76;
  c.height = 70;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const cloakRamp = makeRamp(customization.cloakColor);
  const armorRamp = makeRamp(customization.armorColor);
  const plumeRamp = makeRamp(customization.plumeColor);
  const weapon = WEAPONS[weaponId];
  const bx = 28;
  const by = 65;

  // Flowing multi-fold customized royal cape with notched tattered hem & gold trim
  px(ctx, bx - 24, by - 42, 20, 30, '#09060b');
  px(ctx, bx - 23, by - 41, 18, 28, cloakRamp.deep);
  px(ctx, bx - 21, by - 40, 14, 22, cloakRamp.base);
  px(ctx, bx - 18, by - 39, 7, 13, cloakRamp.hi);
  px(ctx, bx - 26, by - 22, 10, 14, '#09060b');
  px(ctx, bx - 25, by - 21, 8, 12, cloakRamp.deep);
  px(ctx, bx - 23, by - 20, 5, 7, cloakRamp.base);
  px(ctx, bx - 24, by - 11, 14, 2, '#f59e0b'); // Gold cloak border hem

  // 1px dark manga ink outline around knight frame
  px(ctx, bx - 11, by - 51, 22, 41, '#09060b');

  // Heroic V-stance armored greaves, cuisses, flanged knee-cops & pointed sabatons
  px(ctx, bx - 10, by - 18, 8, 18, '#09060b');
  px(ctx, bx - 9, by - 17, 6, 16, armorRamp.sh);
  px(ctx, bx - 8, by - 16, 3, 12, armorRamp.base);
  px(ctx, bx + 2, by - 18, 8, 18, '#09060b');
  px(ctx, bx + 3, by - 17, 6, 16, armorRamp.base);
  px(ctx, bx + 5, by - 16, 3, 12, armorRamp.hi);
  px(ctx, bx - 10, by - 12, 7, 5, '#09060b');
  px(ctx, bx - 9, by - 11, 5, 3, '#d97706');
  px(ctx, bx + 2, by - 12, 8, 5, '#09060b');
  px(ctx, bx + 3, by - 11, 6, 3, '#fbbf24');
  px(ctx, bx - 12, by - 5, 10, 5, armorRamp.deep);
  px(ctx, bx + 2, by - 5, 12, 5, armorRamp.sh);
  px(ctx, bx + 6, by - 4, 6, 2, armorRamp.hi);

  // Cel-shaded fluted breastplate, diagonal leather baldric & gold crest
  px(ctx, bx - 10, by - 35, 20, 18, armorRamp.sh);
  px(ctx, bx - 9, by - 34, 9, 15, armorRamp.base);
  px(ctx, bx + 1, by - 34, 8, 13, armorRamp.hi);
  px(ctx, bx + 4, by - 33, 4, 8, '#f8fafc');
  for (let b = 0; b < 11; b++) {
    px(ctx, bx - 8 + b, by - 33 + b, 3, 2, '#78350f');
  }
  px(ctx, bx - 4, by - 29, 3, 3, '#fbbf24');
  // Customized royal tabard & tassets
  px(ctx, bx - 4, by - 24, 8, 9, cloakRamp.base);
  px(ctx, bx - 1, by - 23, 2, 6, '#fbbf24');
  px(ctx, bx - 10, by - 20, 20, 4, '#09060b');
  px(ctx, bx - 9, by - 19, 18, 2, '#d97706');
  px(ctx, bx - 2, by - 20, 4, 4, '#fde047');

  // 3-lame layered shoulder pauldrons
  px(ctx, bx - 15, by - 37, 10, 9, '#09060b');
  px(ctx, bx - 14, by - 36, 8, 3, '#f59e0b');
  px(ctx, bx - 14, by - 33, 7, 2, armorRamp.base);
  px(ctx, bx - 13, by - 31, 6, 2, '#d97706');
  px(ctx, bx - 12, by - 36, 3, 2, '#fef08a');
  px(ctx, bx + 5, by - 37, 10, 9, '#09060b');
  px(ctx, bx + 6, by - 36, 8, 3, '#d97706');
  px(ctx, bx + 6, by - 33, 7, 2, armorRamp.hi);
  px(ctx, bx + 7, by - 36, 4, 2, '#fde047');

  // Sculpted Armet Knight Helm with visor glow & 3-strand plume
  px(ctx, bx - 9, by - 50, 18, 15, armorRamp.sh);
  px(ctx, bx - 8, by - 49, 15, 4, '#f8fafc');
  px(ctx, bx - 2, by - 46, 11, 11, armorRamp.base);
  px(ctx, bx - 9, by - 47, 18, 2, '#d97706');
  px(ctx, bx - 1, by - 43, 10, 4, '#09060b');
  px(ctx, bx + 2, by - 42, 4, 2, isSlashing ? '#fef08a' : customization.visorColor);
  px(ctx, bx + 4, by - 42, 2, 1, '#ffffff');
  px(ctx, bx + 2, by - 38, 1, 2, '#09060b');
  px(ctx, bx + 4, by - 38, 1, 2, '#09060b');
  px(ctx, bx + 6, by - 38, 1, 2, '#09060b');
  px(ctx, bx - 8, by - 57, 14, 7, '#09060b');
  px(ctx, bx - 7, by - 56, 12, 5, plumeRamp.base);
  px(ctx, bx - 5, by - 56, 8, 2, plumeRamp.hi);
  px(ctx, bx - 15, by - 54, 9, 4, plumeRamp.sh);
  px(ctx, bx - 19, by - 50, 7, 3, plumeRamp.base);

  if (customization.crownEquipped) {
    // Gleaming S-Rank Royal Sovereign Crown perched atop helm!
    px(ctx, bx - 9, by - 59, 18, 5, '#09060b');
    px(ctx, bx - 8, by - 58, 16, 4, '#f59e0b');
    px(ctx, bx - 8, by - 62, 3, 4, '#fbbf24');
    px(ctx, bx - 2, by - 64, 4, 6, '#fef08a');
    px(ctx, bx + 5, by - 62, 3, 4, '#fbbf24');
    px(ctx, bx - 1, by - 57, 2, 2, '#e11d48');
  }

  // Equipped Weapon Blade + Gauntlet
  if (isSlashing) {
    px(ctx, bx + 11, by - 33, 8, 6, armorRamp.hi);
    px(ctx, bx + 17, by - 37, 5, 13, weapon.accentColor);
    if (weaponId === 'crescent') {
      px(ctx, bx + 20, by - 42, 20, 15, '#09060b');
      px(ctx, bx + 21, by - 41, 18, 13, weapon.color);
      px(ctx, bx + 24, by - 37, 10, 6, '#09060b');
    } else if (weaponId === 'fire_sword') {
      // Massive blazing crimson-orange Fire Sword horizontal inferno sweep
      px(ctx, bx + 19, by - 38, 28, 11, '#7f1d1d');
      px(ctx, bx + 20, by - 36, 26, 7, '#dc2626');
      px(ctx, bx + 21, by - 35, 24, 4, '#fb923c');
      px(ctx, bx + 22, by - 34, 19, 2, '#fef08a');
    } else {
      px(ctx, bx + 20, by - 35, 24, 5, '#09060b');
      px(ctx, bx + 21, by - 34, 22, 3, weapon.color);
      px(ctx, bx + 22, by - 34, 19, 1, '#ffffff');
    }
  } else {
    px(ctx, bx + 9, by - 31, 6, 6, armorRamp.base);
    px(ctx, bx + 11, by - 34, 4, 10, weapon.accentColor);
    if (weaponId === 'katana') {
      px(ctx, bx + 10, by - 32, 7, 2, '#fbbf24');
      for (let k = 0; k < 26; k++) {
        const curve = Math.floor((k * k) / 170);
        px(ctx, bx + 13 + curve, by - 33 - k, 3, 2, '#09060b');
        px(ctx, bx + 14 + curve, by - 33 - k, 2, 1, weapon.color);
      }
    } else if (weaponId === 'crescent') {
      px(ctx, bx + 13, by - 57, 4, 27, '#09060b');
      px(ctx, bx + 14, by - 56, 2, 25, '#94a3b8');
      px(ctx, bx + 16, by - 58, 7, 14, weapon.color);
      px(ctx, bx + 18, by - 55, 5, 8, '#ffffff');
    } else if (weaponId === 'fire_sword') {
      // OP Fire Sword: jagged crimson-orange flame greatsword with molten yellow spine!
      px(ctx, bx + 10, by - 34, 9, 3, '#dc2626');
      px(ctx, bx + 13, by - 63, 7, 30, '#450a0a');
      px(ctx, bx + 14, by - 62, 5, 28, '#dc2626');
      px(ctx, bx + 15, by - 61, 4, 26, '#fb923c');
      px(ctx, bx + 16, by - 59, 2, 22, '#fde047');
      px(ctx, bx + 12, by - 52, 2, 4, '#f97316');
      px(ctx, bx + 19, by - 46, 2, 5, '#fb923c');
      px(ctx, bx + 12, by - 40, 2, 4, '#ef4444');
    } else if (weaponId === 'runeblade') {
      px(ctx, bx + 13, by - 60, 6, 30, '#09060b');
      px(ctx, bx + 14, by - 59, 4, 28, weapon.color);
      px(ctx, bx + 15, by - 56, 2, 3, '#c084fc');
      px(ctx, bx + 15, by - 49, 2, 3, '#e879f9');
      px(ctx, bx + 15, by - 42, 2, 3, '#c084fc');
    } else {
      px(ctx, bx + 13, by - 59, 5, 29, '#09060b');
      px(ctx, bx + 14, by - 58, 3, 27, weapon.color);
      px(ctx, bx + 15, by - 56, 1, 23, '#ffffff');
      px(ctx, bx + 12, by - 32, 2, 2, '#ef4444');
    }
  }

  warriorBattleCache.set(key, c);
  return c;
}

const itemIconCache = new Map<string, HTMLCanvasElement>();
const weaponIconCache = new Map<WeaponId, HTMLCanvasElement>();
const skillIconCache = new Map<SkillId, HTMLCanvasElement>();

/**
 * Baked 32x32 pixel-art item icons for Inventory & Battle Potion slots.
 */
export function getBakedItemIcon(itemId: string): HTMLCanvasElement {
  const existing = itemIconCache.get(itemId);
  if (existing) return existing;

  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  // Dark ornate gothic velvet slot background
  px(ctx, 0, 0, 32, 32, '#120a0e');
  px(ctx, 1, 1, 30, 30, '#1f1218');

  if (itemId === 'crimson_vial' || itemId === 'hi_ruby_potion' || itemId === 'royal_elixir_hp' || itemId === 'fury_draught' || itemId === 'titan_crimson_tonic') {
    const bodyDark =
      itemId === 'hi_ruby_potion'
        ? '#881337'
        : itemId === 'royal_elixir_hp'
          ? '#064e3b'
          : itemId === 'fury_draught'
            ? '#4c1d95'
            : itemId === 'titan_crimson_tonic'
              ? '#164e63'
              : '#7f1d1d';
    const liqMid =
      itemId === 'hi_ruby_potion'
        ? '#f43f5e'
        : itemId === 'royal_elixir_hp'
          ? '#10b981'
          : itemId === 'fury_draught'
            ? '#a855f7'
            : itemId === 'titan_crimson_tonic'
              ? '#06b6d4'
              : '#ef4444';
    const liqHi =
      itemId === 'hi_ruby_potion'
        ? '#fda4af'
        : itemId === 'royal_elixir_hp'
          ? '#6ee7b7'
          : itemId === 'fury_draught'
            ? '#e879f9'
            : itemId === 'titan_crimson_tonic'
              ? '#67e8f9'
              : '#f87171';
    px(ctx, 13, 3, 6, 4, '#09060b');
    px(ctx, 14, 4, 4, 3, '#d97706');
    px(ctx, 11, 7, 10, 4, '#fbbf24');
    px(ctx, 12, 8, 8, 2, '#94a3b8');
    px(ctx, 8, 12, 16, 15, '#09060b');
    px(ctx, 6, 15, 20, 10, '#09060b');
    px(ctx, 7, 15, 18, 10, bodyDark);
    px(ctx, 9, 13, 14, 13, bodyDark);
    px(ctx, 8, 17, 16, 7, liqMid);
    px(ctx, 10, 19, 12, 4, liqHi);
    px(ctx, 9, 14, 3, 8, '#ffffff');
    px(ctx, 18, 20, 3, 3, '#fef08a');
    if (itemId === 'fury_draught' || itemId === 'titan_crimson_tonic') {
      // Glowing lightning / power sparks on Damage-Boost flasks
      px(ctx, 4, 9, 3, 2, liqHi);
      px(ctx, 25, 10, 3, 2, '#fde047');
    }
  } else if (itemId === 'royal_ember') {
    // Crown-wax blazing amber ember crystal
    px(ctx, 13, 4, 6, 4, '#fef08a');
    px(ctx, 10, 8, 12, 6, '#f97316');
    px(ctx, 7, 13, 18, 12, '#09060b');
    px(ctx, 8, 14, 16, 10, '#b45309');
    px(ctx, 10, 12, 12, 10, '#f59e0b');
    px(ctx, 12, 14, 8, 6, '#fde047');
    px(ctx, 14, 15, 4, 4, '#ffffff');
    px(ctx, 6, 9, 2, 2, '#fbbf24');
    px(ctx, 24, 11, 2, 2, '#fde047');
  } else if (itemId === 'ruin_shard') {
    // Emerald moss-etched rune crystal prism
    px(ctx, 14, 3, 4, 24, '#09060b');
    px(ctx, 10, 7, 12, 17, '#09060b');
    px(ctx, 7, 11, 18, 9, '#09060b');
    px(ctx, 11, 8, 10, 15, '#059669');
    px(ctx, 8, 12, 16, 7, '#10b981');
    px(ctx, 12, 6, 8, 18, '#34d399');
    px(ctx, 13, 8, 3, 12, '#a7f3d0');
    px(ctx, 15, 13, 2, 5, '#ffffff');
    px(ctx, 6, 19, 5, 3, '#22c55e'); // Moss cluster
  } else if (itemId === 'magma_core') {
    // Cracked obsidian volcanic orb oozing molten lava veins
    px(ctx, 6, 6, 20, 20, '#09060b');
    px(ctx, 7, 7, 18, 18, '#291515');
    px(ctx, 9, 9, 14, 14, '#451a14');
    px(ctx, 12, 8, 3, 16, '#ea580c');
    px(ctx, 8, 14, 16, 3, '#f97316');
    px(ctx, 11, 13, 8, 5, '#fde047');
    px(ctx, 14, 14, 3, 3, '#ffffff');
  } else if (itemId === 'orb_flame') {
    // Blazing Crimson-Orange Flame Orb with white-hot solar core & rising sparks
    px(ctx, 5, 5, 22, 22, '#09060b');
    px(ctx, 6, 6, 20, 20, '#9a3412');
    px(ctx, 8, 8, 16, 16, '#ea580c');
    px(ctx, 9, 9, 14, 14, '#f97316');
    px(ctx, 12, 10, 8, 11, '#fbbf24');
    px(ctx, 14, 12, 5, 7, '#fef08a');
    px(ctx, 15, 14, 3, 4, '#ffffff');
    // Outer orbiting flame sparks
    px(ctx, 5, 8, 3, 3, '#fb923c');
    px(ctx, 24, 9, 3, 3, '#fde047');
    px(ctx, 22, 23, 3, 3, '#ef4444');
  } else if (itemId === 'orb_wind') {
    // Emerald-Teal Swirling Gale Wind Orb
    px(ctx, 5, 5, 22, 22, '#09060b');
    px(ctx, 6, 6, 20, 20, '#0f766e');
    px(ctx, 8, 8, 16, 16, '#14b8a6');
    px(ctx, 9, 9, 14, 14, '#2dd4bf');
    // Swirling wind ribbons inside sphere
    px(ctx, 9, 11, 13, 3, '#ccfbf1');
    px(ctx, 10, 15, 13, 3, '#99f6e4');
    px(ctx, 12, 19, 9, 2, '#ffffff');
    px(ctx, 11, 12, 3, 3, '#ffffff');
    // Gust trail wisps
    px(ctx, 4, 13, 4, 2, '#5eead4');
    px(ctx, 24, 17, 4, 2, '#5eead4');
  } else if (itemId === 'orb_electric') {
    // High-Voltage Gold & Cyan Electrical Orb with crackling pixel lightning bolt
    px(ctx, 5, 5, 22, 22, '#09060b');
    px(ctx, 6, 6, 20, 20, '#a16207');
    px(ctx, 8, 8, 16, 16, '#eab308');
    px(ctx, 9, 9, 14, 14, '#facc15');
    // Lightning bolt rune inside orb
    px(ctx, 15, 9, 5, 3, '#ffffff');
    px(ctx, 13, 12, 5, 3, '#fef9c3');
    px(ctx, 12, 15, 8, 3, '#ffffff');
    px(ctx, 15, 18, 5, 4, '#38bdf8');
    // Electric cyan arc sparks
    px(ctx, 4, 7, 3, 2, '#38bdf8');
    px(ctx, 25, 8, 3, 2, '#7dd3fc');
    px(ctx, 5, 22, 3, 2, '#38bdf8');
    px(ctx, 24, 23, 3, 2, '#38bdf8');
  } else if (itemId.startsWith('rank_badge_')) {
    // Guild Rank Heraldic Badge
    const rank = itemId.replace('rank_badge_', '');
    const badgeColor =
      rank === 'S' ? '#fbbf24' : rank === 'A' ? '#e11d48' : rank === 'B' ? '#a855f7' : rank === 'C' ? '#3b82f6' : '#94a3b8';
    px(ctx, 5, 5, 22, 22, '#09060b');
    px(ctx, 6, 6, 20, 20, badgeColor);
    px(ctx, 9, 9, 14, 14, '#1e1b2e');
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(rank, 16, 20);
  } else {
    // Velvet Crest Relic (royal gold-trimmed crimson heraldic shield brooch)
    px(ctx, 6, 5, 20, 15, '#09060b');
    px(ctx, 8, 20, 16, 5, '#09060b');
    px(ctx, 11, 25, 10, 3, '#09060b');
    px(ctx, 7, 6, 18, 13, '#fbbf24');
    px(ctx, 9, 19, 14, 5, '#d97706');
    px(ctx, 12, 24, 8, 3, '#b45309');
    px(ctx, 9, 8, 14, 11, '#9f1239');
    px(ctx, 11, 19, 10, 4, '#7f1d1d');
    px(ctx, 14, 10, 4, 10, '#fde047');
    px(ctx, 11, 13, 10, 3, '#fde047');
  }

  itemIconCache.set(itemId, c);
  return c;
}

/**
 * Baked 32x32 pixel-art sword style sprites for Weapons inventory tab & Armory Showcase.
 */
export function getBakedWeaponIcon(weaponId: WeaponId): HTMLCanvasElement {
  const existing = weaponIconCache.get(weaponId);
  if (existing) return existing;

  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const weapon = WEAPONS[weaponId];
  px(ctx, 0, 0, 32, 32, '#120a0e');
  px(ctx, 1, 1, 30, 30, '#1c1016');

  if (weaponId === 'katana' || weaponId === 'thunder_odachi') {
    const len = weaponId === 'thunder_odachi' ? 22 : 20;
    const thick = weaponId === 'thunder_odachi' ? 4 : 3;
    for (let i = 0; i < len; i++) {
      const curve = Math.floor((i * i) / 95);
      px(ctx, 6 + i, 24 - i - curve, thick + 1, thick + 1, '#09060b');
      px(ctx, 7 + i, 24 - i - curve, thick, thick, weapon.color);
      px(ctx, 7 + i, 23 - i - curve, 1, 1, '#ffffff');
    }
    px(ctx, 7, 20, 7, 2, weapon.accentColor);
    px(ctx, 4, 24, 4, 4, weapon.accentColor);
  } else if (weaponId === 'crescent' || weaponId === 'crimson_reaper') {
    for (let i = 0; i < 18; i++) {
      px(ctx, 6 + i, 23 - i, 3, 3, weapon.color);
      px(ctx, 8 + i, 25 - i, 2, 2, weapon.accentColor);
    }
    px(ctx, 16, 4, 11, 8, weapon.color);
    px(ctx, 19, 7, 6, 5, '#1c1016');
    px(ctx, 5, 23, 5, 4, weapon.accentColor);
  } else if (weaponId === 'runeblade' || weaponId === 'solar_excalibur') {
    for (let i = 0; i < 19; i++) {
      px(ctx, 6 + i, 22 - i, 6, 6, '#09060b');
      px(ctx, 7 + i, 22 - i, 4, 4, weapon.color);
      px(ctx, 8 + i, 22 - i, 2, 2, '#ffffff');
    }
    px(ctx, 14, 15, 3, 3, weapon.accentColor);
    px(ctx, 6, 20, 8, 4, weapon.accentColor);
    px(ctx, 4, 24, 4, 4, '#fbbf24');
  } else if (weaponId === 'rapier' || weaponId === 'emerald_zephyr') {
    for (let i = 0; i < 21; i++) {
      px(ctx, 6 + i, 24 - i, 2, 2, weapon.color);
      px(ctx, 6 + i, 23 - i, 1, 1, '#ffffff');
    }
    px(ctx, 6, 20, 7, 7, '#09060b');
    px(ctx, 7, 21, 5, 5, weapon.accentColor);
    px(ctx, 8, 22, 2, 2, '#fef08a');
  } else if (weaponId === 'azure_glaive') {
    for (let i = 0; i < 20; i++) {
      px(ctx, 5 + i, 24 - i, 3, 3, '#475569');
    }
    px(ctx, 19, 4, 9, 9, '#09060b');
    px(ctx, 20, 5, 7, 7, weapon.color);
    px(ctx, 21, 6, 4, 4, '#e0f2fe');
  } else if (weaponId === 'venom_twinblade') {
    for (let i = 0; i < 15; i++) {
      px(ctx, 8 + i, 22 - i, 4, 4, '#09060b');
      px(ctx, 9 + i, 22 - i, 2, 2, weapon.color);
    }
    px(ctx, 19, 9, 4, 4, '#bef264');
    px(ctx, 7, 19, 5, 3, weapon.accentColor);
  } else if (weaponId === 'fire_sword') {
    // OP Fire Sword: serrated blazing crimson-orange flame blade with white-hot core!
    px(ctx, 2, 2, 28, 28, '#1a0606');
    for (let i = 0; i < 19; i++) {
      px(ctx, 6 + i, 22 - i, 6, 6, '#450a0a');
      px(ctx, 7 + i, 22 - i, 4, 4, '#dc2626');
      px(ctx, 8 + i, 22 - i, 3, 3, '#fb923c');
      px(ctx, 9 + i, 22 - i, 1, 1, '#fef08a');
      if (i % 3 === 1) {
        px(ctx, 6 + i, 19 - i, 2, 3, '#f97316');
        px(ctx, 11 + i, 24 - i, 2, 3, '#ef4444');
      }
    }
    px(ctx, 5, 19, 9, 3, '#fbbf24');
    px(ctx, 8, 22, 3, 6, '#991b1b');
    px(ctx, 4, 25, 4, 4, '#f97316');
  } else {
    // Claymore
    for (let i = 0; i < 19; i++) {
      px(ctx, 7 + i, 23 - i, 4, 4, '#09060b');
      px(ctx, 8 + i, 23 - i, 3, 3, weapon.color);
      px(ctx, 9 + i, 22 - i, 1, 1, '#ffffff');
    }
    px(ctx, 6, 19, 8, 3, '#d97706');
    px(ctx, 9, 22, 3, 6, '#d97706');
    px(ctx, 4, 25, 4, 4, '#fbbf24');
  }

  weaponIconCache.set(weaponId, c);
  return c;
}

/**
 * Baked 32x32 pixel-art skill icons for 3-Slot Skills tab.
 */
export function getBakedSkillIcon(skillId: SkillId): HTMLCanvasElement {
  const existing = skillIconCache.get(skillId);
  if (existing) return existing;

  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const sk = SKILLS[skillId];
  px(ctx, 0, 0, 32, 32, '#100a14');
  px(ctx, 2, 2, 28, 28, '#1a1121');

  if (skillId === 'stand_rush') {
    // Purple spiked Stand fist
    px(ctx, 8, 10, 16, 13, '#09060b');
    px(ctx, 9, 11, 14, 11, '#a78bfa');
    px(ctx, 10, 12, 10, 4, '#ddd6fe');
    px(ctx, 8, 14, 15, 3, '#fbbf24');
  } else if (skillId === 'chrono_freeze') {
    // Emerald stopped pocket-clock
    px(ctx, 7, 7, 18, 18, '#09060b');
    px(ctx, 8, 8, 16, 16, '#34d399');
    px(ctx, 10, 10, 12, 12, '#064e3b');
    px(ctx, 15, 11, 2, 6, '#fde047');
    px(ctx, 16, 15, 5, 2, '#fde047');
  } else if (skillId === 'parry_guard') {
    // Twin crossed golden shield & blade
    px(ctx, 8, 7, 16, 18, '#f59e0b');
    px(ctx, 10, 9, 12, 14, '#78350f');
    px(ctx, 7, 22, 18, 3, '#ffffff');
    px(ctx, 15, 6, 2, 18, '#fef08a');
  } else if (skillId === 'candlefire_wave') {
    // Blazing fire crescent
    px(ctx, 8, 12, 16, 12, '#f97316');
    px(ctx, 11, 7, 10, 14, '#fb923c');
    px(ctx, 13, 12, 6, 9, '#fef08a');
  } else if (skillId === 'blade_dash') {
    // Supersonic gold speed arrows
    px(ctx, 4, 14, 20, 4, sk.color);
    px(ctx, 16, 9, 4, 14, '#fef08a');
    px(ctx, 20, 12, 6, 8, '#ffffff');
  } else {
    // Hamon Sunburst solar emblem
    px(ctx, 9, 9, 14, 14, '#f59e0b');
    px(ctx, 11, 11, 10, 10, '#fde047');
    px(ctx, 15, 4, 2, 24, '#fef08a');
    px(ctx, 4, 15, 24, 2, '#fef08a');
  }

  skillIconCache.set(skillId, c);
  return c;
}

const starPlatinumCache = new Map<string, HTMLCanvasElement>();

/**
 * Baked 64x52 pixel-art Star Platinum guardian spirit styled in Bastera's dark royal armor theme:
 * Indigo-violet spiked hair, golden royal crown circlet, crimson sash, armored pauldrons, and spiked punch gauntlets.
 */
export function getBakedStarPlatinumSprite(frame: 0 | 1): HTMLCanvasElement {
  const key = `sp_${frame}`;
  const existing = starPlatinumCache.get(key);
  if (existing) return existing;

  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 52;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  // Ethereal royal aura wisps behind spirit
  px(ctx, 2, 10, 4, 22, 'rgba(167, 139, 250, 0.35)');
  px(ctx, 6, 4, 6, 30, 'rgba(139, 92, 246, 0.25)');

  // Flowing indigo-violet spiky hair + royal golden Bastera circlet
  px(ctx, 13, 3, 14, 10, '#09060b');
  px(ctx, 14, 4, 12, 8, '#312e81');
  px(ctx, 11, 6, 4, 4, '#4c1d95');
  px(ctx, 15, 2, 4, 4, '#6366f1');
  px(ctx, 21, 3, 4, 4, '#4f46e5');
  // Face + glowing cyan eyes + determined brow
  px(ctx, 16, 10, 10, 9, '#7c3aed');
  px(ctx, 17, 11, 8, 7, '#a78bfa');
  px(ctx, 16, 9, 11, 2, '#fbbf24'); // Golden royal headband
  px(ctx, 20, 9, 2, 2, '#dc2626'); // Ruby centerpiece
  px(ctx, 19, 12, 3, 2, '#09060b');
  px(ctx, 23, 12, 3, 2, '#09060b');
  px(ctx, 20, 12, 2, 2, '#22d3ee'); // Glowing cyan eyes
  px(ctx, 24, 12, 2, 2, '#22d3ee');

  // Muscular violet torso + royal crimson sash + golden Bastera shoulder pauldrons
  px(ctx, 12, 19, 18, 17, '#09060b');
  px(ctx, 13, 20, 16, 15, '#6d28d9');
  px(ctx, 15, 21, 11, 8, '#8b5cf6');
  px(ctx, 16, 22, 4, 4, '#a78bfa');
  px(ctx, 21, 22, 4, 4, '#a78bfa');
  // Royal crimson scarf & golden waist belt
  px(ctx, 11, 19, 19, 3, '#9f1239');
  px(ctx, 8, 22, 5, 10, '#be123c');
  px(ctx, 14, 33, 14, 3, '#fbbf24');
  // Armored Pauldrons with golden trim
  px(ctx, 9, 19, 6, 7, '#d97706');
  px(ctx, 10, 20, 4, 4, '#fef08a');
  px(ctx, 25, 19, 6, 7, '#d97706');
  px(ctx, 26, 20, 4, 4, '#fef08a');

  // Spectral lower taper (floating spirit silhouette)
  px(ctx, 14, 36, 12, 8, '#4c1d95');
  px(ctx, 16, 44, 8, 5, '#7c3aed');
  px(ctx, 18, 48, 4, 3, '#c4b5fd');

  // Rapid-fire ORA ORA spiked golden-violet punch barrage fists!
  const f1X = frame === 0 ? 34 : 44;
  const f2X = frame === 0 ? 46 : 32;
  const f3X = frame === 0 ? 39 : 49;

  // Motion speed streaks
  px(ctx, 27, 17, f1X - 25, 2, '#ddd6fe');
  px(ctx, 27, 25, f2X - 25, 2, '#c4b5fd');
  px(ctx, 27, 31, f3X - 25, 2, '#fbbf24');

  // Fist 1 (upper)
  px(ctx, f1X, 14, 11, 7, '#09060b');
  px(ctx, f1X + 1, 15, 9, 5, '#a78bfa');
  px(ctx, f1X + 7, 15, 3, 5, '#fbbf24'); // Spiked brass knuckle
  px(ctx, f1X + 11, 16, 2, 3, '#ffffff');

  // Fist 2 (middle)
  px(ctx, f2X, 22, 12, 7, '#09060b');
  px(ctx, f2X + 1, 23, 10, 5, '#8b5cf6');
  px(ctx, f2X + 8, 23, 3, 5, '#fef08a');
  px(ctx, f2X + 12, 24, 2, 3, '#ffffff');

  // Fist 3 (lower)
  px(ctx, f3X, 29, 10, 6, '#09060b');
  px(ctx, f3X + 1, 30, 8, 4, '#a78bfa');
  px(ctx, f3X + 6, 30, 3, 4, '#fbbf24');

  starPlatinumCache.set(key, c);
  return c;
}

const floorStripCache = new Map<BiomeId, HTMLCanvasElement>();

/**
 * Pre-baked seamless 640x46 biome floor strip (replaces 40+ per-tile fillRect calls per frame with 1 drawImage!).
 */
export function getBakedFloorStrip(biome: BiomeId): HTMLCanvasElement {
  const existing = floorStripCache.get(biome);
  if (existing) return existing;

  const W = 640;
  const H = 46;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  // y=2 corresponds to plat.y (top surface bevel begins at y=0)
  if (biome === 'castle') {
    px(ctx, 0, 2, W, 44, '#140e12');
    px(ctx, 0, 0, W, 6, '#362730');
    for (let bx = 0; bx < W; bx += 24) {
      const tileIdx = Math.floor(bx / 24);
      const broken = tileIdx % 5 === 0;
      const mossy = tileIdx % 7 === 0;
      px(ctx, bx, 0, 22, 4, broken ? '#2a1e24' : '#4a3742');
      px(ctx, bx, 0, 22, 1, '#6b5361');
      px(ctx, bx + 22, 0, 2, 5, '#0b0709');
      px(ctx, bx, 8, 22, 10, broken ? '#1b1318' : '#32242c');
      px(ctx, bx, 8, 22, 2, '#4d3944');
      px(ctx, bx + 8, 20, 22, 10, '#271c22');
      px(ctx, bx + 8, 20, 22, 1, '#3d2d36');
      px(ctx, bx, 32, 22, 12, '#1b1317');
      if (broken) {
        px(ctx, bx + 6, 10, 2, 7, '#090609');
        px(ctx, bx + 8, 13, 5, 2, '#090609');
      }
      if (mossy) {
        px(ctx, bx + 2, 6, 7, 2, '#166534');
        px(ctx, bx + 4, 8, 3, 2, '#22c55e');
      }
    }
    px(ctx, 0, 1, W, 6, '#5c1118');
    px(ctx, 0, 2, W, 4, '#be123c');
    px(ctx, 0, 1, W, 1, '#fbbf24');
    px(ctx, 0, 6, W, 1, '#b45309');
    for (let gx = 4; gx < W; gx += 16) {
      if (gx % 112 !== 0) {
        px(ctx, gx, 3, 5, 2, '#fde047');
        px(ctx, gx + 2, 2, 1, 4, '#fbbf24');
        if (gx % 32 === 4) {
          px(ctx, gx + 1, 7, 2, 2, '#f59e0b');
        }
      } else {
        px(ctx, gx - 2, 1, 9, 6, '#32242c');
        px(ctx, gx - 3, 5, 2, 2, '#f59e0b');
        px(ctx, gx + 7, 5, 2, 2, '#f59e0b');
      }
    }
  } else if (biome === 'forest') {
    px(ctx, 0, 2, W, 44, '#0d1a16');
    px(ctx, 0, 0, W, 6, '#1b4735');
    px(ctx, 0, 0, W, 1, '#6ee7b7');
    for (let bx = 0; bx < W; bx += 20) {
      px(ctx, bx, 8, 18, 12, '#182b24');
      px(ctx, bx, 8, 18, 2, '#284a3d');
      px(ctx, bx + 4, 1, 8, 2, '#34d399');
    }
  } else {
    px(ctx, 0, 2, W, 44, '#130505');
    px(ctx, 0, 0, W, 6, '#431410');
    px(ctx, 0, 0, W, 1, '#fb923c');
    for (let bx = 0; bx < W; bx += 28) {
      const tileIdx = Math.floor(bx / 28);
      px(ctx, bx, 1, 25, 4, tileIdx % 3 === 0 ? '#5c1914' : '#42120f');
      px(ctx, bx, 8, 24, 12, '#260b0a');
      px(ctx, bx, 8, 24, 2, '#5e201a');
      px(ctx, bx + 6, 21, 16, 12, '#1c0807');
      px(ctx, bx + 4, 24, 16, 4, '#ea580c');
      if (tileIdx % 4 === 0) {
        px(ctx, bx + 9, 25, 6, 2, '#fde047');
      }
    }
  }

  floorStripCache.set(biome, c);
  return c;
}



