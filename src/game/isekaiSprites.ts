import { WEAPON_SHOP_ORDER, WEAPONS } from './data';
import {
  DUNGEON_SECTOR_WIDTH,
  GUILD_FLOOR2_Y,
  TOWN_RANDOM_HOUSES,
  canAccessGuildFloor2,
} from './isekai';
import { DEFAULT_WARRIOR_CUSTOMIZATION } from './rules';
import { PIXEL_H, PIXEL_W } from './pixelSprites';
import type {
  AlliedNpc,
  CarriageEscortState,
  CoronationCutsceneHud,
  DemonKingEntity,
  GuildRank,
  IsekaiNpc,
  PurpleFlameZone,
  RealmMode,
  WarriorCustomization,
} from './types';

export const LABEL_SCALE = 4;

export function drawCrispOverlayLabel(
  labelCtx: CanvasRenderingContext2D,
  worldScreenX: number,
  worldScreenY: number,
  text: string,
  opts?: {
    color?: string;
    bg?: string;
    border?: string;
    fontSize?: number;
    padX?: number;
    padY?: number;
  },
) {
  const s = LABEL_SCALE;
  const cx = Math.round(worldScreenX * s);
  const cy = Math.round(worldScreenY * s);
  if (cx < -320 || cx > PIXEL_W * s + 320 || cy < -80 || cy > PIXEL_H * s + 80) return;

  const fontSize = opts?.fontSize ?? 22;
  const padX = opts?.padX ?? 12;
  const padY = opts?.padY ?? 6;

  labelCtx.save();
  labelCtx.font = `700 ${fontSize}px "JetBrains Mono", ui-monospace, monospace`;
  labelCtx.textAlign = 'center';
  labelCtx.textBaseline = 'middle';

  const metrics = labelCtx.measureText(text);
  const boxW = Math.ceil(metrics.width + padX * 2);
  const boxH = fontSize + padY * 2;
  const bx = Math.round(cx - boxW / 2);
  const by = Math.round(cy - boxH / 2);

  labelCtx.fillStyle = opts?.bg ?? 'rgba(9, 7, 14, 0.90)';
  labelCtx.fillRect(bx, by, boxW, boxH);

  labelCtx.strokeStyle = opts?.border ?? 'rgba(255, 255, 255, 0.22)';
  labelCtx.lineWidth = 2;
  labelCtx.strokeRect(bx + 1, by + 1, boxW - 2, boxH - 2);

  // Subtle dark shadow for instant readability over bright sunny or dark dungeon skies
  labelCtx.fillStyle = '#050308';
  labelCtx.fillText(text, cx + 2, cy + 2);

  labelCtx.fillStyle = opts?.color ?? '#f8fafc';
  labelCtx.fillText(text, cx, cy);
  labelCtx.restore();
}

function pRect(
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

function drawAnimeCloud(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  pRect(ctx, x, y + 6, w, 10, '#ffffff');
  pRect(ctx, x + 6, y, Math.round(w * 0.68), 10, '#ffffff');
  pRect(ctx, x + 12, y - 4, Math.round(w * 0.36), 8, '#f0f9ff');
  pRect(ctx, x + 2, y + 14, w - 4, 2, '#bae6fd');
}

function lerpChannel(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * Math.max(0, Math.min(1, t)));
}

function lerpHex(hexA: string, hexB: string, t: number): string {
  const pa = hexA.replace('#', '');
  const pb = hexB.replace('#', '');
  const r = lerpChannel(parseInt(pa.slice(0, 2), 16), parseInt(pb.slice(0, 2), 16), t);
  const g = lerpChannel(parseInt(pa.slice(2, 4), 16), parseInt(pb.slice(2, 4), 16), t);
  const b = lerpChannel(parseInt(pa.slice(4, 6), 16), parseInt(pb.slice(4, 6), 16), t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Bright sunny -> cozy twilight -> glowing indigo midnight 3x expanded Solaris Town:
 * Dark-green jungle behind homes, 22 varied Fachwerk houses, cool white marble Fountain with watery animations,
 * Adventure Guild Hall, Potion Shop, Wardrobe Boutique, wide Weapons Armory, and Solaris Hot Spring Pavilion.
 */
export function drawIsekaiTownBackdrop(
  ctx: CanvasRenderingContext2D,
  camX: number,
  time: number,
  isCelebration: boolean,
  nightFactor = 0,
  labelCtx?: CanvasRenderingContext2D | null,
) {
  const nf = Math.max(0, Math.min(1, nightFactor));
  // Smooth sky transition: Sunny Cerulean -> Warm Dusk -> Deep Starlit Indigo Night
  const grad = ctx.createLinearGradient(0, 0, 0, PIXEL_H);
  grad.addColorStop(0, lerpHex('#38bdf8', '#090d26', nf));
  grad.addColorStop(0.55, lerpHex('#bae6fd', '#1e1b4b', nf));
  grad.addColorStop(1, lerpHex('#fef9c3', '#312e81', nf));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, PIXEL_W, PIXEL_H);

  // Twinkling stars & silver moon during dusk/night
  if (nf > 0.15) {
    ctx.save();
    for (let s = 0; s < 32; s++) {
      const sx = (s * 67 + 19) % PIXEL_W;
      const sy = (s * 31 + 11) % 108;
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(time * 2.5 + s));
      ctx.globalAlpha = nf * tw;
      pRect(ctx, sx, sy, s % 5 === 0 ? 2 : 1, s % 5 === 0 ? 2 : 1, s % 3 === 0 ? '#e0f2fe' : '#fef08a');
    }
    ctx.globalAlpha = Math.min(1, nf * 1.1);
    ctx.fillStyle = 'rgba(224, 242, 254, 0.24)';
    ctx.beginPath();
    ctx.arc(392, 38, 21, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(392, 38, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Sun fading down on horizon at night
  if (nf < 0.85) {
    ctx.save();
    ctx.globalAlpha = 1 - nf;
    ctx.fillStyle = 'rgba(254, 240, 138, 0.45)';
    ctx.beginPath();
    ctx.arc(78, 42 + nf * 58, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(78, 42 + nf * 58, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const drift = (time * 8) % 640;
  if (nf < 0.7) {
    ctx.save();
    ctx.globalAlpha = 1 - nf * 0.7;
    drawAnimeCloud(ctx, 130 - drift * 0.3, 28, 62);
    drawAnimeCloud(ctx, 310 - drift * 0.25, 42, 74);
    drawAnimeCloud(ctx, 490 - drift * 0.3, 22, 54);
    ctx.restore();
  }

  // Distant emerald hills & snowy anime mountain peak + Royal Solaris Castle silhouette
  const pxOff = Math.floor(camX * 0.25);
  for (let i = -1; i <= 2; i++) {
    const mx = i * 320 - ((pxOff % 320) + 320) % 320;
    pRect(ctx, mx + 20, 118, 96, 80, lerpHex('#64748b', '#1e293b', nf));
    pRect(ctx, mx + 44, 96, 48, 30, lerpHex('#94a3b8', '#334155', nf));
    pRect(ctx, mx + 54, 92, 28, 12, lerpHex('#f8fafc', '#94a3b8', nf));
    pRect(ctx, mx + 178, 86, 54, 80, lerpHex('#cbd5e1', '#334155', nf));
    pRect(ctx, mx + 172, 68, 16, 42, lerpHex('#94a3b8', '#1e293b', nf));
    pRect(ctx, mx + 172, 54, 16, 14, '#2563eb');
    pRect(ctx, mx + 222, 68, 16, 42, lerpHex('#94a3b8', '#1e293b', nf));
    pRect(ctx, mx + 222, 54, 16, 14, '#2563eb');
    pRect(ctx, mx + 196, 52, 20, 56, lerpHex('#e2e8f0', '#475569', nf));
    pRect(ctx, mx + 194, 34, 24, 18, '#1d4ed8');
    pRect(ctx, mx + 205, 22, 2, 12, '#fbbf24');
  }

  pRect(ctx, 0, 140, PIXEL_W, 86, lerpHex('#15803d', '#064e3b', nf));
  pRect(ctx, 0, 158, PIXEL_W, 68, lerpHex('#166534', '#052e16', nf));

  // Deep Dense Dark-Green Jungle rising directly behind all town homes!
  const jungleFarOff = Math.floor(camX * 0.48);
  for (let i = -1; i <= 6; i++) {
    const jx = i * 108 - ((jungleFarOff % 108) + 108) % 108;
    pRect(ctx, jx + 16, 102, 10, 124, '#052e16');
    pRect(ctx, jx + 68, 90, 12, 136, '#052e16');
    pRect(ctx, jx + 18, 106, 3, 118, '#14532d');
    pRect(ctx, jx + 71, 94, 4, 130, '#14532d');

    pRect(ctx, jx - 10, 88, 56, 28, '#052e16');
    pRect(ctx, jx - 4, 74, 44, 22, '#064e3b');
    pRect(ctx, jx + 2, 62, 32, 18, '#14532d');
    pRect(ctx, jx + 8, 55, 20, 10, '#166534');
    pRect(ctx, jx + 12, 58, 10, 5, '#22c55e');

    pRect(ctx, jx + 36, 76, 68, 36, '#052e16');
    pRect(ctx, jx + 42, 60, 56, 26, '#064e3b');
    pRect(ctx, jx + 50, 48, 40, 20, '#14532d');
    pRect(ctx, jx + 58, 40, 24, 14, '#15803d');
    pRect(ctx, jx + 62, 43, 14, 6, '#4ade80');

    pRect(ctx, jx + 26, 48, 14, 4, '#15803d');
    pRect(ctx, jx + 22, 52, 8, 4, '#16a34a');
    pRect(ctx, jx + 86, 46, 14, 4, '#15803d');
    pRect(ctx, jx + 94, 50, 8, 4, '#16a34a');

    const sway = Math.round(Math.sin(time * 2.2 + i) * 2);
    pRect(ctx, jx + 14 + sway, 98, 2, 34, '#15803d');
    pRect(ctx, jx + 13 + sway, 114, 4, 4, '#22c55e');
    pRect(ctx, jx + 84 - sway, 84, 2, 42, '#16a34a');
    pRect(ctx, jx + 83 - sway, 106, 4, 4, '#4ade80');
  }

  const bxOff = Math.floor(camX);
  const treeNearOff = Math.floor(camX * 0.78);
  for (let i = -1; i <= 7; i++) {
    const tx = i * 92 - ((treeNearOff % 92) + 92) % 92;
    pRect(ctx, tx + 22, 122, 10, 104, '#14532d');
    pRect(ctx, tx + 24, 126, 3, 100, '#166534');
    pRect(ctx, tx - 4, 96, 54, 26, '#052e16');
    pRect(ctx, tx + 2, 86, 42, 18, '#14532d');
    pRect(ctx, tx + 8, 78, 30, 12, '#15803d');
    pRect(ctx, tx + 14, 80, 14, 5, '#4ade80');
    pRect(ctx, tx + 48, 186, 36, 40, '#052e16');
    pRect(ctx, tx + 52, 178, 28, 16, '#14532d');
    pRect(ctx, tx + 58, 174, 16, 8, '#16a34a');
  }

  // Expanded 3x Town: Varied Fachwerk Medieval Homes spanning x=44..4040!
  const winGlowColor = nf > 0.2 ? '#fde047' : '#38bdf8';
  for (let idx = 0; idx < TOWN_RANDOM_HOUSES.length; idx++) {
    const spec = TOWN_RANDOM_HOUSES[idx];
    const sx = Math.round(spec.x - bxOff);
    if (sx < -spec.w - 20 || sx > PIXEL_W + 24) continue;
    const topY = 226 - spec.h;
    const midY = topY + Math.round(spec.h * 0.44);
    pRect(ctx, sx, topY, spec.w, spec.h, spec.wallColor);
    pRect(ctx, sx, topY, 6, spec.h, spec.beamColor);
    pRect(ctx, sx + spec.w - 6, topY, 6, spec.h, spec.beamColor);
    pRect(ctx, sx, midY, spec.w, 5, spec.beamColor);
    pRect(ctx, sx + Math.floor(spec.w / 2) - 2, topY, 5, spec.h, spec.beamColor);
    pRect(ctx, sx + 12, topY + 5, 4, midY - topY - 5, spec.beamColor);
    pRect(ctx, sx + spec.w - 16, topY + 5, 4, midY - topY - 5, spec.beamColor);
    // Pitched Roof + optional chimney smoke
    pRect(ctx, sx - 6, topY - 18, spec.w + 12, 20, spec.roofColor);
    pRect(ctx, sx - 4, topY - 2, spec.w + 8, 4, spec.roofDark);
    pRect(ctx, sx + 4, topY - 30, spec.w - 8, 14, spec.roofColor);
    pRect(ctx, sx + 16, topY - 40, Math.max(24, spec.w - 32), 12, spec.roofDark);
    if (spec.hasChimney) {
      pRect(ctx, sx + spec.w - 22, topY - 46, 10, 18, '#64748b');
      const puff = ((time * 16 + idx * 7) % 18);
      ctx.fillStyle = 'rgba(241, 245, 249, 0.45)';
      ctx.fillRect(sx + spec.w - 20 + Math.round(Math.sin(time * 2 + idx) * 3), topY - 52 - puff, 5, 5);
    }
    if (spec.hasLaundry) {
      pRect(ctx, sx - 16, midY + 4, 16, 1, '#cbd5e1');
      pRect(ctx, sx - 13, midY + 5, 5, 7, '#f43f5e');
      pRect(ctx, sx - 6, midY + 5, 4, 6, '#ffffff');
    }
    // Leaded windows (cozy warm lantern gold at night!)
    pRect(ctx, sx + 12, topY + 12, 16, 17, winGlowColor);
    pRect(ctx, sx + 19, topY + 12, 2, 17, spec.beamColor);
    pRect(ctx, sx + spec.w - 28, topY + 12, 16, 17, winGlowColor);
    pRect(ctx, sx + spec.w - 21, topY + 12, 2, 17, spec.beamColor);
    // Ground-floor arched door + flowerbox
    pRect(ctx, sx + Math.floor(spec.w / 2) - 9, 194, 18, 30, '#451a03');
    pRect(ctx, sx + Math.floor(spec.w / 2) + 4, 209, 3, 3, '#fbbf24');
    pRect(ctx, sx + 10, topY + 29, 20, 4, '#78350f');
    pRect(ctx, sx + 12, topY + 26, 4, 3, '#f43f5e');
    pRect(ctx, sx + 20, topY + 26, 4, 3, '#fde047');
  }

  // Sunlit Market Stall beside Merchant Lena (x=130..185)
  const msx = Math.round(130 - bxOff);
  if (msx > -80 && msx < PIXEL_W + 20) {
    pRect(ctx, msx, 198, 52, 26, '#78350f');
    pRect(ctx, msx + 4, 174, 4, 50, '#451a03');
    pRect(ctx, msx + 44, 174, 4, 50, '#451a03');
    for (let a = 0; a < 6; a++) {
      pRect(ctx, msx - 2 + a * 9, 166, 9, 10, a % 2 === 0 ? '#ea580c' : '#fef3c7');
    }
    pRect(ctx, msx + 10, 192, 10, 6, '#ef4444');
    pRect(ctx, msx + 24, 192, 10, 6, '#facc15');
  }

  // HERO FOUNTAIN: Grand Cool White Carved Marble Fountain with Rich Watery Animations (x=215..291)
  const fx = Math.round(253 - bxOff);
  if (fx > -70 && fx < PIXEL_W + 70) {
    // Cool white & alabaster stepped octagonal marble plinth & carved reliefs
    pRect(ctx, fx - 38, 217, 76, 8, '#cbd5e1');
    pRect(ctx, fx - 36, 215, 72, 4, '#ffffff');
    pRect(ctx, fx - 32, 203, 64, 14, '#f8fafc');
    pRect(ctx, fx - 30, 206, 60, 10, '#e2e8f0');
    // Subtle carved marble vertical fluting lines
    for (let fl = -26; fl <= 26; fl += 8) {
      pRect(ctx, fx + fl, 207, 2, 8, '#cbd5e1');
      pRect(ctx, fx + fl + 1, 207, 1, 8, '#ffffff');
    }
    // Sparkling turquoise basin water + concentric pulsing ripples
    pRect(ctx, fx - 29, 200, 58, 7, '#0284c7');
    pRect(ctx, fx - 27, 201, 54, 4, '#38bdf8');
    const rip = Math.round((time * 22) % 24);
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.78)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(fx, 203, 6 + rip * 0.85, 2.2, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Central fluted pure-white marble pedestal + upper scallop bowl + top finial
    pRect(ctx, fx - 8, 174, 16, 28, '#ffffff');
    pRect(ctx, fx - 6, 175, 4, 26, '#e2e8f0');
    pRect(ctx, fx + 3, 175, 3, 26, '#cbd5e1');
    pRect(ctx, fx - 20, 180, 40, 6, '#ffffff');
    pRect(ctx, fx - 18, 185, 36, 3, '#cbd5e1');
    pRect(ctx, fx - 16, 178, 32, 3, '#38bdf8');
    pRect(ctx, fx - 4, 161, 8, 14, '#f8fafc');
    pRect(ctx, fx - 6, 159, 12, 3, '#ffffff');

    // Animated Watery Cascades spilling down both sides of upper bowl!
    const fallOff = Math.round((time * 26) % 8);
    for (const side of [-1, 1]) {
      const cx = fx + side * 16;
      ctx.fillStyle = 'rgba(125, 211, 252, 0.75)';
      ctx.fillRect(cx - 2, 181, 4, 21);
      pRect(ctx, cx - 1, 183 + fallOff, 2, 5, '#ffffff');
      pRect(ctx, cx - 1, 191 + (fallOff % 6), 2, 4, '#e0f2fe');
      // Splash rings at bottom basin
      const sp = Math.round(Math.sin(time * 12 + side) * 2);
      pRect(ctx, cx - 3, 199 + (sp > 0 ? -1 : 0), 6, 2, '#ffffff');
    }

    // Multi-layered Parabolic Water Jets arcing from finial!
    const jetH = 19 + Math.round(Math.sin(time * 9) * 3);
    pRect(ctx, fx - 2, 159 - jetH, 4, jetH, '#7dd3fc');
    pRect(ctx, fx - 1, 157 - jetH, 2, jetH, '#ffffff');
    for (let d = 0; d < 10; d++) {
      const p = (time * 1.45 + d * 0.2) % 1;
      const dir = d % 2 === 0 ? -1 : 1;
      const dx = fx + dir * (4 + p * 18);
      const dy = 152 - Math.sin(p * Math.PI) * 16 + p * 28;
      pRect(ctx, dx, dy, 2, 2, d % 3 === 0 ? '#ffffff' : '#bae6fd');
    }
  }

  // Hero Building 1: TWO-STORY ADVENTURE GUILD HALL (x=305..445, door x=342)
  const gx = Math.round(305 - bxOff);
  if (gx > -150 && gx < PIXEL_W + 20) {
    pRect(ctx, gx, 100, 140, 126, '#fde68a');
    pRect(ctx, gx, 100, 140, 6, '#78350f');
    pRect(ctx, gx, 160, 140, 6, '#78350f');
    pRect(ctx, gx, 100, 8, 126, '#451a03');
    pRect(ctx, gx + 132, 100, 8, 126, '#451a03');
    pRect(ctx, gx - 8, 76, 156, 26, '#1e3a8a');
    pRect(ctx, gx + 6, 60, 128, 18, '#1d4ed8');
    pRect(ctx, gx + 28, 46, 84, 16, '#2563eb');
    const flagSway = Math.round(Math.sin(time * 6) * 2);
    pRect(ctx, gx + 69, 28, 2, 18, '#fbbf24');
    pRect(ctx, gx + 71, 28 + flagSway, 16, 8, '#38bdf8');
    pRect(ctx, gx + 43, 114, 54, 24, '#451a03');
    pRect(ctx, gx + 45, 116, 50, 20, '#92400e');
    if (labelCtx) {
      drawCrispOverlayLabel(labelCtx, gx + 70, 126, 'GUILD', {
        color: '#fef08a',
        bg: 'rgba(69, 26, 3, 0.92)',
        border: '#fbbf24',
        fontSize: 22,
        padX: 14,
        padY: 5,
      });
    } else {
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GUILD', gx + 70, 129);
    }
    pRect(ctx, gx + 16, 116, 18, 24, nf > 0.2 ? '#fde047' : '#60a5fa');
    pRect(ctx, gx + 106, 116, 18, 24, nf > 0.2 ? '#fde047' : '#60a5fa');
    pRect(ctx, gx + 14, 178, 20, 22, '#fbbf24');
    pRect(ctx, gx + 106, 178, 20, 22, '#fbbf24');
  }

  // Hero Building 2: GLOWING POTION APOTHECARY SHOP (x=585..710, door x=648)
  const px = Math.round(585 - bxOff);
  if (px > -150 && px < PIXEL_W + 20) {
    pRect(ctx, px, 118, 124, 108, '#ecfdf5');
    pRect(ctx, px, 118, 7, 108, '#065f46');
    pRect(ctx, px + 117, 118, 7, 108, '#065f46');
    pRect(ctx, px - 6, 94, 136, 26, '#6d28d9');
    pRect(ctx, px + 8, 80, 108, 16, '#7c3aed');
    for (let a = 0; a < 12; a++) {
      pRect(ctx, px + 4 + a * 10, 152, 10, 12, a % 2 === 0 ? '#10b981' : '#fef9c3');
    }
    pRect(ctx, px + 76, 172, 34, 34, '#0f172a');
    pRect(ctx, px + 80, 186, 6, 16, '#ef4444');
    pRect(ctx, px + 89, 182, 7, 20, '#06b6d4');
    pRect(ctx, px + 99, 188, 7, 14, '#a855f7');
    pRect(ctx, px + 34, 126, 56, 20, '#4c1d95');
    if (labelCtx) {
      drawCrispOverlayLabel(labelCtx, px + 62, 136, 'POTIONS', {
        color: '#a7f3d0',
        bg: 'rgba(76, 29, 149, 0.94)',
        border: '#34d399',
        fontSize: 20,
        padX: 12,
        padY: 5,
      });
    } else {
      ctx.fillStyle = '#a7f3d0';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('POTIONS', px + 62, 139);
    }
  }

  // Hero Building 3: WARDROBE BOUTIQUE SHOP (x=845..970, door x=905)
  const wx = Math.round(845 - bxOff);
  if (wx > -150 && wx < PIXEL_W + 20) {
    pRect(ctx, wx, 118, 126, 108, '#fff1f2');
    pRect(ctx, wx, 118, 7, 108, '#831843');
    pRect(ctx, wx + 119, 118, 7, 108, '#831843');
    pRect(ctx, wx - 6, 94, 138, 26, '#be185d');
    pRect(ctx, wx + 8, 80, 110, 16, '#db2777');
    for (let a = 0; a < 12; a++) {
      pRect(ctx, wx + 4 + a * 10, 152, 10, 12, a % 2 === 0 ? '#f43f5e' : '#ffffff');
    }
    pRect(ctx, wx + 16, 172, 34, 34, nf > 0.2 ? '#fde047' : '#bae6fd');
    pRect(ctx, wx + 26, 180, 14, 24, '#a855f7');
    pRect(ctx, wx + 36, 126, 56, 20, '#831843');
    if (labelCtx) {
      drawCrispOverlayLabel(labelCtx, wx + 64, 136, 'WARDROBE', {
        color: '#fbcfe8',
        bg: 'rgba(131, 24, 67, 0.94)',
        border: '#f472b6',
        fontSize: 20,
        padX: 12,
        padY: 5,
      });
    } else {
      ctx.fillStyle = '#fbcfe8';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('WARDROBE', wx + 64, 139);
    }
  }

  // Hero Building 4: GRAND WIDE WEAPONS ARMORY SHOP (x=1100..1330, door x=1185)
  const ax = Math.round(1100 - bxOff);
  if (ax > -250 && ax < PIXEL_W + 20) {
    pRect(ctx, ax, 106, 224, 120, '#e2e8f0');
    pRect(ctx, ax, 106, 224, 6, '#431407');
    pRect(ctx, ax, 162, 224, 6, '#431407');
    pRect(ctx, ax, 106, 8, 120, '#431407');
    pRect(ctx, ax + 110, 106, 6, 120, '#78350f');
    pRect(ctx, ax + 216, 106, 8, 120, '#431407');
    pRect(ctx, ax - 8, 80, 240, 26, '#7c2d12');
    pRect(ctx, ax + 10, 64, 204, 18, '#9a3412');
    pRect(ctx, ax + 34, 52, 156, 14, '#b45309');
    pRect(ctx, ax + 184, 42, 14, 24, '#334155');
    pRect(ctx, ax + 18, 174, 48, 36, '#0f172a');
    pRect(ctx, ax + 24, 178, 3, 28, '#38bdf8');
    pRect(ctx, ax + 35, 176, 4, 30, '#f59e0b');
    pRect(ctx, ax + 48, 180, 3, 26, '#f43f5e');
    pRect(ctx, ax + 152, 174, 52, 36, '#0f172a');
    pRect(ctx, ax + 160, 178, 4, 28, '#a855f7');
    pRect(ctx, ax + 174, 176, 4, 30, '#fde047');
    pRect(ctx, ax + 188, 179, 3, 27, '#10b981');
    pRect(ctx, ax + 78, 122, 68, 22, '#29150c');
    if (labelCtx) {
      drawCrispOverlayLabel(labelCtx, ax + 112, 133, 'WEAPONS ARMORY', {
        color: '#fde047',
        bg: 'rgba(41, 21, 12, 0.94)',
        border: '#f59e0b',
        fontSize: 20,
        padX: 12,
        padY: 5,
      });
    } else {
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('WEAPONS ARMORY', ax + 112, 136);
    }
  }

  // Hero Building 5: SOLARIS HOT SPRING PAVILION (x=2540..2840, soak zone x=2630..2762)
  const hsx = Math.round(2540 - bxOff);
  if (hsx > -320 && hsx < PIXEL_W + 40) {
    // Bamboo privacy fence & traditional cedar bathhouse torii arch
    pRect(ctx, hsx + 12, 148, 276, 76, '#14532d');
    for (let bx = 18; bx < 280; bx += 14) {
      pRect(ctx, hsx + bx, 150, 10, 74, bx % 28 === 0 ? '#854d0e' : '#a16207');
    }
    pRect(ctx, hsx + 8, 144, 284, 8, '#7c2d12');
    // Left Cedar Bathhouse Reception Kiosk & Lanterns
    pRect(ctx, hsx + 16, 114, 72, 110, '#78350f');
    pRect(ctx, hsx + 10, 96, 84, 20, '#991b1b');
    pRect(ctx, hsx + 24, 84, 56, 14, '#b91c1c');
    pRect(ctx, hsx + 26, 124, 52, 22, '#f8fafc');
    if (labelCtx) {
      drawCrispOverlayLabel(labelCtx, hsx + 52, 135, 'HOT SPRING', {
        color: '#ffe4e6',
        bg: 'rgba(136, 19, 55, 0.94)',
        border: '#fda4af',
        fontSize: 20,
        padX: 12,
        padY: 5,
      });
    } else {
      ctx.fillStyle = '#be123c';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('HOT SPRING', hsx + 52, 138);
    }
    // Warm Paper Lanterns
    for (const lx of [hsx + 24, hsx + 80, hsx + 268]) {
      pRect(ctx, lx, 152, 10, 14, '#fb923c');
      pRect(ctx, lx + 2, 154, 6, 10, '#fef08a');
    }
    // Natural Mossy Stone Pool filled with Steaming Turquoise Mineral Water
    pRect(ctx, hsx + 92, 196, 160, 28, '#475569');
    pRect(ctx, hsx + 96, 200, 152, 18, '#0d9488');
    pRect(ctx, hsx + 100, 201, 144, 12, '#2dd4bf');
    const wave = Math.round(Math.sin(time * 5) * 2);
    pRect(ctx, hsx + 114 + wave, 204, 42, 2, '#99f6e4');
    pRect(ctx, hsx + 178 - wave, 207, 46, 2, '#ccfbf1');
    // Mossy boulders around rim
    pRect(ctx, hsx + 88, 192, 18, 14, '#64748b');
    pRect(ctx, hsx + 90, 190, 12, 5, '#22c55e');
    pRect(ctx, hsx + 242, 190, 22, 16, '#64748b');
    pRect(ctx, hsx + 245, 188, 14, 5, '#16a34a');
    // Rising soft white healing steam puffs
    for (let st = 0; st < 8; st++) {
      const p = (time * 0.45 + st * 0.14) % 1;
      const sxSteam = hsx + 108 + st * 17 + Math.sin(time * 2 + st) * 5;
      const sySteam = 194 - p * 44;
      ctx.fillStyle = `rgba(240, 253, 250, ${(0.55 * (1 - p)).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(sxSteam, sySteam, 6 + p * 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Iron Streetlamps lined down the 3x avenue (x=110..3960)
  for (let lxWorld = 115; lxWorld <= 4000; lxWorld += 230) {
    const lx = Math.round(lxWorld - bxOff);
    if (lx < -20 || lx > PIXEL_W + 20) continue;
    pRect(ctx, lx, 174, 3, 50, '#334155');
    pRect(ctx, lx - 3, 170, 9, 4, '#1e293b');
    pRect(ctx, lx - 2, 162, 7, 8, nf > 0.2 ? '#fef08a' : '#bae6fd');
  }

  // Celebration Streamers & Confetti after S-Rank Coronation!
  if (isCelebration) {
    const colors = ['#f43f5e', '#fbbf24', '#38bdf8', '#4ade80', '#c084fc'];
    for (let i = 0; i < 24; i++) {
      const cx = (i * 37 + Math.floor(time * 24)) % PIXEL_W;
      const cy = (i * 29 + Math.floor(time * 36)) % 210;
      pRect(ctx, cx, cy, 4, 4, colors[i % colors.length]);
    }
  }
}

/**
 * Detailed, cool-looking Caravan Rider Vance + Armored Guild Caravan Wagon + Draft Steed!
 */
export function drawCaravanRider(
  ctx: CanvasRenderingContext2D,
  worldX: number,
  camX: number,
  time: number,
  nightFactor = 0,
  facing: 1 | -1 = 1,
  labelCtx?: CanvasRenderingContext2D | null,
) {
  const sx = Math.round(worldX - camX);
  if (sx < -120 || sx > PIXEL_W + 120) return;

  const breath = Math.round(Math.sin(time * 3.5) * 1);
  // 1. Guild Covered Caravan Wagon
  pRect(ctx, sx + 4, 176, 68, 36, '#065f46'); // Arched emerald canopy
  pRect(ctx, sx + 10, 170, 56, 8, '#047857');
  pRect(ctx, sx + 4, 176, 68, 3, '#fbbf24');
  pRect(ctx, sx + 2, 198, 72, 16, '#78350f'); // Carved mahogany wagon bed
  pRect(ctx, sx + 4, 200, 68, 3, '#b45309');
  pRect(ctx, sx + 32, 182, 12, 12, '#1d4ed8'); // Azure Guild Crest on canvas
  pRect(ctx, sx + 35, 185, 6, 6, '#fbbf24');
  // Spoked iron-rimmed wheels
  for (const wx of [sx + 16, sx + 58]) {
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(wx, 216, 8, 0, Math.PI * 2);
    ctx.stroke();
    pRect(ctx, wx - 7, 215, 14, 2, '#94a3b8');
    pRect(ctx, wx - 1, 209, 2, 14, '#94a3b8');
  }
  // Swaying brass lantern hanging at wagon front
  const sway = Math.round(Math.sin(time * 4) * 1.5);
  pRect(ctx, sx + 74 + sway, 190, 5, 7, nightFactor > 0.2 ? '#fef08a' : '#f59e0b');

  // 2. Caparisoned Draft Steed ahead of wagon
  const hx = sx + 74;
  pRect(ctx, hx, 198 + breath, 20, 12, '#7c2d12');
  pRect(ctx, hx + 14, 186 + breath, 7, 14, '#7c2d12');
  pRect(ctx, hx + 18, 186 + breath, 7, 5, '#9a3412');
  pRect(ctx, hx + 2, 210, 3, 14, '#451a03');
  pRect(ctx, hx + 14, 210, 3, 14, '#451a03');
  pRect(ctx, hx + 4, 198 + breath, 12, 8, '#1d4ed8'); // Guild blanket
  pRect(ctx, hx + 15, 182 + breath, 3, 5, '#f43f5e'); // Brow feather plume

  // 3. Detailed Cool-Looking Caravan Rider Vance (standing beside wagon!)
  const rx = sx + 48;
  ctx.save();
  ctx.translate(rx, 224);
  ctx.scale(facing, 1);
  // Boots & leather duster coat
  pRect(ctx, -5, -9, 4, 9, '#1e293b');
  pRect(ctx, 1, -9, 4, 9, '#334155');
  pRect(ctx, -6, -24 + breath, 12, 16, '#292524'); // Studded dark duster
  pRect(ctx, -4, -23 + breath, 8, 11, '#78350f');
  pRect(ctx, -6, -23 + breath, 12, 3, '#b91c1c'); // Fluttering crimson-gold scarf
  pRect(ctx, -11 - breath, -22 + breath, 6, 3, '#dc2626');
  // Face, sunglasses/visor glint & wide-brimmed ranger hat w/ feather
  pRect(ctx, -4, -31 + breath, 8, 8, '#f3cba5');
  pRect(ctx, 1, -28 + breath, 3, 2, '#09060b');
  pRect(ctx, -9, -32 + breath, 18, 3, '#1e293b'); // Broad hat brim
  pRect(ctx, -5, -38 + breath, 10, 6, '#334155');
  pRect(ctx, -5, -33 + breath, 10, 2, '#fbbf24'); // Gold hatband
  pRect(ctx, -7, -38 + breath, 3, 5, '#ef4444'); // Crimson hat plume
  // Travel lantern staff in hand
  pRect(ctx, 6, -30, 2, 30, '#92400e');
  pRect(ctx, 5, -34, 4, 5, '#fde047');
  ctx.restore();

  // Crisp nameplate above Caravan Rider Vance
  if (labelCtx) {
    drawCrispOverlayLabel(labelCtx, sx + 48, 157, 'Caravan Rider Vance', {
      color: '#fde047',
      bg: 'rgba(10, 7, 14, 0.92)',
      border: '#f59e0b',
      fontSize: 21,
      padX: 12,
      padY: 5,
    });
  } else {
    pRect(ctx, sx + 12, 152, 72, 11, 'rgba(9, 6, 11, 0.85)');
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 6px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CARAVAN RIDER', sx + 48, 160);
  }
}

/**
 * Cozy Night Shading Layer:
 * Indigo twilight veil pierced by warm golden radial pools from streetlamps, Town windows,
 * Hot Spring lanterns, Caravan lantern, and the Knight's own warm belt lantern!
 */
export function drawIsekaiNightLighting(
  ctx: CanvasRenderingContext2D,
  camX: number,
  time: number,
  nightFactor: number,
  realm: RealmMode,
  playerScreenX: number,
  playerScreenY: number,
) {
  if (nightFactor <= 0.04) return;
  if (realm !== 'isekai_town' && realm !== 'dungeon_exterior' && realm !== 'carriage_escort') return;

  const nf = Math.min(1, nightFactor);
  // 1. Cozy Indigo Midnight Ambient Overlay
  ctx.save();
  ctx.fillStyle = `rgba(10, 14, 42, ${(nf * 0.56).toFixed(3)})`;
  ctx.fillRect(0, 0, PIXEL_W, PIXEL_H);

  // 2. Additive Warm Lantern Glows
  ctx.globalCompositeOperation = 'lighter';
  const drawWarmLight = (sx: number, sy: number, r: number, rgb: string, alpha: number) => {
    if (sx < -r || sx > PIXEL_W + r) return;
    const g = ctx.createRadialGradient(sx, sy, 2, sx, sy, r);
    g.addColorStop(0, `rgba(${rgb}, ${(alpha * nf).toFixed(3)})`);
    g.addColorStop(0.55, `rgba(${rgb}, ${(alpha * 0.42 * nf).toFixed(3)})`);
    g.addColorStop(1, `rgba(${rgb}, 0)`);
    ctx.fillStyle = g;
    ctx.fillRect(Math.round(sx - r), Math.round(sy - r), Math.round(r * 2), Math.round(r * 2));
  };

  if (realm === 'isekai_town') {
    const bxOff = Math.floor(camX);
    for (let lxWorld = 115; lxWorld <= 4000; lxWorld += 230) {
      drawWarmLight(lxWorld - bxOff, 166, 56, '253, 224, 71', 0.44);
    }
    for (const h of TOWN_RANDOM_HOUSES) {
      drawWarmLight(h.x + h.w / 2 - bxOff, 226 - h.h + 20, 42, '251, 191, 36', 0.3);
    }
    // Shopfront glows & Hot Spring turquoise/amber glow
    drawWarmLight(375 - bxOff, 180, 72, '251, 191, 36', 0.42);
    drawWarmLight(645 - bxOff, 185, 62, '45, 212, 191', 0.36);
    drawWarmLight(908 - bxOff, 185, 62, '244, 114, 182', 0.32);
    drawWarmLight(1212 - bxOff, 180, 78, '251, 146, 60', 0.38);
    drawWarmLight(530 - bxOff, 192, 64, '253, 224, 71', 0.48); // Caravan lantern
    drawWarmLight(2705 - bxOff, 195, 92, '45, 212, 191', 0.42); // Hot Spring glow
    drawWarmLight(2568 - bxOff, 158, 52, '251, 146, 60', 0.45);
  } else if (realm === 'dungeon_exterior') {
    drawWarmLight(175 - camX, 206, 86, '251, 146, 60', 0.56); // Campfire & Caravan lantern
  }

  // Personal warm aura around the Warrior
  const pulse = Math.sin(time * 5) * 4;
  drawWarmLight(playerScreenX, playerScreenY, 64 + pulse, '254, 240, 138', 0.36);
  ctx.restore();
}

/**
 * Green Grassy Forest right outside the Dungeon + Caravan on the left + MASSIVE ROCKY DARK HOLE on the right!
 */
export function drawDungeonExteriorBackdrop(
  ctx: CanvasRenderingContext2D,
  camX: number,
  time: number,
  nightFactor = 0,
  dungeonTarget: 'goblin_dungeon' | 'demon_realm' | 'demon_king_arena' = 'goblin_dungeon',
  labelCtx?: CanvasRenderingContext2D | null,
) {
  const nf = Math.max(0, Math.min(1, nightFactor));
  const isDemon = dungeonTarget !== 'goblin_dungeon';
  const grad = ctx.createLinearGradient(0, 0, 0, PIXEL_H);
  grad.addColorStop(0, lerpHex(isDemon ? '#0284c7' : '#38bdf8', '#090d26', nf));
  grad.addColorStop(0.58, lerpHex('#bbf7d0', '#14532d', nf));
  grad.addColorStop(1, lerpHex('#4ade80', '#052e16', nf));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, PIXEL_W, PIXEL_H);

  // Rolling sunlit emerald forest hills & towering oaks
  const pxOff = Math.floor(camX * 0.4);
  for (let i = -1; i <= 4; i++) {
    const tx = i * 160 - ((pxOff % 160) + 160) % 160;
    pRect(ctx, tx, 156, 160, 70, lerpHex('#15803d', '#064e3b', nf));
    pRect(ctx, tx + 24, 118, 12, 108, '#451a03');
    pRect(ctx, tx + 6, 82, 48, 42, lerpHex('#16a34a', '#14532d', nf));
    pRect(ctx, tx + 14, 68, 32, 22, lerpHex('#22c55e', '#15803d', nf));
    pRect(ctx, tx + 102, 128, 10, 98, '#451a03');
    pRect(ctx, tx + 86, 94, 42, 38, lerpHex('#15803d', '#064e3b', nf));
  }

  // Flickering Caravan Campfire on Left (x=196)
  const cfx = Math.round(196 - camX);
  if (cfx > -30 && cfx < PIXEL_W + 30) {
    const fl = Math.round(Math.sin(time * 14) * 2);
    pRect(ctx, cfx - 6, 219, 12, 5, '#451a03');
    pRect(ctx, cfx - 4, 211 + fl, 8, 9, '#f97316');
    pRect(ctx, cfx - 2, 214 + fl, 4, 6, '#fef08a');
  }

  // Swaying foreground wildflowers & tall green grass tufts
  const bxOff = Math.floor(camX);
  for (let gx = 40; gx < 920; gx += 46) {
    const sx = gx - bxOff;
    if (sx < -20 || sx > PIXEL_W + 20) continue;
    const sw = Math.round(Math.sin(time * 3 + gx) * 1.5);
    pRect(ctx, sx + sw, 214, 2, 10, '#16a34a');
    pRect(ctx, sx + 4 + sw, 216, 2, 8, '#4ade80');
    if (gx % 92 === 40) pRect(ctx, sx + 2 + sw, 213, 3, 3, '#fef08a');
  }

  // MASSIVE CRAGGY ROCK CLIFF & HUGE PITCH-BLACK ROCKY DARK HOLE ON THE RIGHT (x=910..1240)
  const holeX = Math.round(920 - bxOff);
  if (holeX < PIXEL_W + 40 && holeX + 320 > -20) {
    // Craggy rock cliff face towering over forest edge
    pRect(ctx, holeX, 64, 330, 162, '#334155');
    pRect(ctx, holeX + 18, 44, 300, 34, '#475569');
    pRect(ctx, holeX - 14, 108, 36, 118, '#475569');
    pRect(ctx, holeX - 8, 96, 26, 24, '#64748b');
    // Jagged stone strata & mossy hanging cliff vines
    for (let v = 0; v < 6; v++) {
      pRect(ctx, holeX + 24 + v * 42, 64, 4, 24 + (v % 3) * 10, '#15803d');
    }
    // Giant Oval / Archway ROCKY DARK HOLE leading endlessly underground!
    const mouthCx = holeX + 116;
    const mouthY = 128;
    ctx.fillStyle = '#040308';
    ctx.beginPath();
    ctx.ellipse(mouthCx, mouthY + 52, 64, 62, 0, Math.PI, Math.PI * 2);
    ctx.lineTo(mouthCx + 64, 224);
    ctx.lineTo(mouthCx - 64, 224);
    ctx.closePath();
    ctx.fill();

    // Jagged inner rock teeth framing the pitch-black abyss
    pRect(ctx, mouthCx - 68, 140, 14, 84, '#1e293b');
    pRect(ctx, mouthCx + 54, 140, 14, 84, '#1e293b');
    pRect(ctx, mouthCx - 48, 122, 16, 12, '#1e293b');
    pRect(ctx, mouthCx + 32, 122, 16, 12, '#1e293b');

    // Eerie subterranean mist drifting out of the hole
    const mistCol = isDemon ? 'rgba(192, 132, 252, 0.25)' : 'rgba(148, 163, 184, 0.25)';
    for (let m = 0; m < 5; m++) {
      const mp = (time * 0.5 + m * 0.21) % 1;
      ctx.fillStyle = mistCol;
      ctx.beginPath();
      ctx.arc(mouthCx - 28 + m * 14, 218 - mp * 34, 10 + mp * 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Wooden Cave Warning Post beside hole
    pRect(ctx, holeX + 12, 178, 5, 46, '#78350f');
    pRect(ctx, holeX - 6, 174, 42, 14, '#451a03');
    if (labelCtx) {
      drawCrispOverlayLabel(labelCtx, holeX + 15, 180, isDemon ? 'ABYSS HOLE' : 'DUNGEON HOLE', {
        color: isDemon ? '#fda4af' : '#fde047',
        bg: 'rgba(28, 16, 8, 0.92)',
        border: isDemon ? '#f43f5e' : '#fbbf24',
        fontSize: 20,
        padX: 10,
        padY: 4,
      });
    } else {
      ctx.fillStyle = isDemon ? '#f43f5e' : '#fde047';
      ctx.font = 'bold 6px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isDemon ? 'ABYSS HOLE' : 'DUNGEON', holeX + 15, 184);
    }
  }
}

export function drawIsekaiFloors(
  ctx: CanvasRenderingContext2D,
  realm: RealmMode,
  camX: number,
  time: number,
) {
  const bxOff = Math.floor(camX);
  if (realm === 'isekai_town') {
    pRect(ctx, 0, 224, PIXEL_W, 46, '#94a3b8');
    pRect(ctx, 0, 224, PIXEL_W, 3, '#f1f5f9');
    pRect(ctx, 0, 227, PIXEL_W, 2, '#64748b');
    for (let row = 0; row < 4; row++) {
      const sy = 230 + row * 10;
      const off = ((bxOff + row * 14) % 28 + 28) % 28;
      for (let cx = -off; cx < PIXEL_W; cx += 28) {
        pRect(ctx, cx, sy, 25, 8, (row + Math.floor(cx / 28)) % 2 === 0 ? '#cbd5e1' : '#94a3b8');
      }
    }
  } else if (realm === 'dungeon_exterior') {
    pRect(ctx, 0, 224, PIXEL_W, 46, '#3f6212');
    pRect(ctx, 0, 224, PIXEL_W, 5, '#22c55e');
    pRect(ctx, 0, 229, PIXEL_W, 3, '#15803d');
    for (let cx = -((bxOff % 32 + 32) % 32); cx < PIXEL_W; cx += 32) {
      pRect(ctx, cx, 236, 22, 6, '#57534e');
    }
  } else if (
    realm === 'isekai_guild' ||
    realm === 'isekai_wardrobe' ||
    realm === 'isekai_potion_shop' ||
    realm === 'isekai_weapons_shop'
  ) {
    const baseCol =
      realm === 'isekai_guild'
        ? '#5c2810'
        : realm === 'isekai_wardrobe'
          ? '#4a1930'
          : realm === 'isekai_potion_shop'
            ? '#132524'
            : '#291c18';
    const trimCol =
      realm === 'isekai_guild'
        ? '#b45309'
        : realm === 'isekai_wardrobe'
          ? '#f472b6'
          : realm === 'isekai_potion_shop'
            ? '#2dd4bf'
            : '#f59e0b';
    pRect(ctx, 0, 224, PIXEL_W, 46, baseCol);
    pRect(ctx, 0, 224, PIXEL_W, 3, trimCol);
    for (let px = -((bxOff % 32 + 32) % 32); px < PIXEL_W; px += 32) {
      pRect(ctx, px, 227, 2, 42, '#0f0a0e');
    }
  } else if (realm === 'goblin_dungeon') {
    pRect(ctx, 0, 224, PIXEL_W, 46, '#334155');
    pRect(ctx, 0, 224, PIXEL_W, 4, '#64748b');
    for (let gx = -((bxOff % 24 + 24) % 24); gx < PIXEL_W; gx += 24) {
      pRect(ctx, gx, 229, 21, 10, '#475569');
      pRect(ctx, gx + 10, 241, 21, 10, '#1e293b');
    }
  } else if (realm === 'carriage_escort') {
    pRect(ctx, 0, 224, PIXEL_W, 46, '#92400e');
    pRect(ctx, 0, 224, PIXEL_W, 4, '#fbbf24');
    pRect(ctx, 0, 232, PIXEL_W, 4, '#78350f');
  } else if (realm === 'demon_realm' || realm === 'demon_king_arena') {
    pRect(ctx, 0, 224, PIXEL_W, 46, '#1f0818');
    pRect(ctx, 0, 224, PIXEL_W, 4, realm === 'demon_king_arena' ? '#a855f7' : '#ef4444');
    const pulse = 0.25 + 0.15 * Math.sin(time * 5);
    ctx.fillStyle = realm === 'demon_king_arena' ? `rgba(192,132,252,${pulse})` : `rgba(251,146,60,${pulse})`;
    for (let lx = -((bxOff % 44 + 44) % 44); lx < PIXEL_W; lx += 44) {
      ctx.fillRect(lx, 234, 22, 3);
    }
  }
}

/**
 * Larger 2-Floor Japanese Isekai Adventure Guild Interior:
 * Floor 1: Stone hearth, tavern bar stools with NPCs drinking ale, Floor 1 Reception (F–C).
 * Grand Staircase ascends to the 2nd Floor Mezzanine Deck (Rank B+ only!) with Princess Escorts & Demon King Command.
 */
export function drawIsekaiGuildInterior(
  ctx: CanvasRenderingContext2D,
  camX: number,
  time: number,
  guildRank: GuildRank = 'F',
  labelCtx?: CanvasRenderingContext2D | null,
) {
  pRect(ctx, 0, 0, PIXEL_W, PIXEL_H, '#29150c');
  const ox = Math.floor(camX * 0.5);

  for (let x = -(ox % 48); x < PIXEL_W; x += 48) {
    pRect(ctx, x, 0, 8, 226, '#451a03');
    pRect(ctx, x + 8, 12, 40, 214, '#5c2810');
  }
  pRect(ctx, 0, 0, PIXEL_W, 18, '#3f1d0b');

  // Sunlit arched leaded windows along both halls
  for (let wx = 60 - Math.floor(camX); wx <= 800 - Math.floor(camX); wx += 150) {
    if (wx < -60 || wx > PIXEL_W + 20) continue;
    pRect(ctx, wx, 40, 44, 62, '#1c1008');
    pRect(ctx, wx + 4, 44, 36, 54, '#7dd3fc');
    pRect(ctx, wx + 20, 44, 4, 54, '#451a03');
    pRect(ctx, wx + 4, 68, 36, 4, '#451a03');
  }

  // Roaring stone hearth fireplace on left wall
  const fx = Math.round(44 - camX);
  if (fx > -70 && fx < PIXEL_W) {
    pRect(ctx, fx, 146, 48, 80, '#475569');
    pRect(ctx, fx + 10, 178, 28, 48, '#09060b');
    const fl = Math.round(Math.sin(time * 12) * 3);
    pRect(ctx, fx + 14, 198 + fl, 20, 26, '#ea580c');
    pRect(ctx, fx + 18, 206 + fl, 12, 18, '#fde047');
  }

  // Hanging iron chandeliers with warm glow
  for (const cxWorld of [160, 360, 620, 780]) {
    const sx = Math.round(cxWorld - camX);
    if (sx < -60 || sx > PIXEL_W + 60) continue;
    pRect(ctx, sx, 0, 2, 22, '#1e293b');
    pRect(ctx, sx - 24, 22, 50, 4, '#78350f');
    ctx.fillStyle = 'rgba(251, 191, 36, 0.22)';
    ctx.beginPath();
    ctx.arc(sx, 22, 34, 0, Math.PI * 2);
    ctx.fill();
  }

  // Visible Grand Oak Staircase leading from Floor 1 up to 2nd Floor Mezzanine (x=420..490)
  const stx = Math.round(420 - camX);
  if (stx < PIXEL_W + 40 && stx + 90 > -20) {
    for (let step = 0; step < 6; step++) {
      const sx = stx + step * 12;
      const sy = 224 - (step + 1) * 14;
      pRect(ctx, sx, sy, 16, 224 - sy, '#451a03');
      pRect(ctx, sx, sy, 16, 4, '#d97706');
      pRect(ctx, sx + 2, sy, 12, 2, '#b91c1c'); // Crimson carpet runner on steps
    }
    // Gold staircase handrail
    pRect(ctx, stx + 2, 198, 4, 26, '#b45309');
    pRect(ctx, stx + 36, 162, 4, 24, '#b45309');
    pRect(ctx, stx + 68, 128, 4, 22, '#b45309');
  }

  // 2nd Floor Mezzanine Deck Structural Backdrop & Balustrade (x=486..868)
  const f2x = Math.round(486 - camX);
  if (f2x < PIXEL_W + 20 && f2x + 382 > -20) {
    pRect(ctx, f2x, GUILD_FLOOR2_Y, 382, 86, '#1f0f08');
    pRect(ctx, f2x + 12, GUILD_FLOOR2_Y + 12, 358, 72, '#31170d');
    // Royal Crimson Command Banners hanging under mezzanine
    for (let bx = f2x + 32; bx < f2x + 340; bx += 78) {
      pRect(ctx, bx, GUILD_FLOOR2_Y + 14, 22, 46, '#991b1b');
      pRect(ctx, bx + 4, GUILD_FLOOR2_Y + 18, 14, 34, '#fbbf24');
    }
    // 2nd Floor Deck Railings & Support Pillars
    pRect(ctx, f2x, GUILD_FLOOR2_Y - 16, 382, 3, '#fbbf24');
    for (let rx = f2x + 8; rx < f2x + 375; rx += 20) {
      pRect(ctx, rx, GUILD_FLOOR2_Y - 14, 3, 14, '#b45309');
    }
    pRect(ctx, f2x + 4, GUILD_FLOOR2_Y, 10, 86, '#451a03');
    pRect(ctx, f2x + 186, GUILD_FLOOR2_Y, 10, 86, '#451a03');

    // Rank B+ Gate Plaque near the Grand Stair Landing
    const unlocked = canAccessGuildFloor2(guildRank);
    if (labelCtx) {
      drawCrispOverlayLabel(
        labelCtx,
        f2x + 29,
        GUILD_FLOOR2_Y - 29,
        unlocked ? '2F COMMAND (B+ OPEN)' : '2F LOCKED (NEED B-RANK)',
        {
          color: unlocked ? '#6ee7b7' : '#fda4af',
          bg: 'rgba(9, 6, 11, 0.92)',
          border: unlocked ? '#34d399' : '#f43f5e',
          fontSize: 19,
          padX: 10,
          padY: 4,
        },
      );
    } else {
      pRect(ctx, f2x - 24, GUILD_FLOOR2_Y - 36, 106, 14, '#09060b');
      ctx.strokeStyle = unlocked ? '#34d399' : '#f43f5e';
      ctx.lineWidth = 1;
      ctx.strokeRect(f2x - 24, GUILD_FLOOR2_Y - 36, 106, 14);
      ctx.fillStyle = unlocked ? '#6ee7b7' : '#fda4af';
      ctx.font = 'bold 6px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(unlocked ? '2F COMMAND (B+ OPEN)' : '2F LOCKED (NEED B-RANK)', f2x + 29, GUILD_FLOOR2_Y - 27);
    }
  }

  // Polished oak tavern floor
  pRect(ctx, 0, 224, PIXEL_W, 46, '#78350f');
  pRect(ctx, 0, 224, PIXEL_W, 3, '#b45309');
}

/**
 * Boutique Tailor & Armor Wardrobe Shop Interior:
 * Rose-gold drapes, velvet mannequins, ornate standing dressing mirror, ribbon spools.
 */
export function drawIsekaiWardrobeInterior(ctx: CanvasRenderingContext2D, camX: number) {
  pRect(ctx, 0, 0, PIXEL_W, PIXEL_H, '#3b0a22');
  pRect(ctx, 0, 20, PIXEL_W, 206, '#500724');
  // Wallpaper damask stripes
  const off = Math.floor(camX) % 32;
  for (let x = -off; x < PIXEL_W; x += 32) {
    pRect(ctx, x, 20, 14, 204, '#6b1035');
  }

  // Ornate gilded fitting mirror (x=220) & armor/dress mannequins (x=150, 355)
  const mx = Math.round(220 - camX);
  pRect(ctx, mx - 4, 130, 34, 94, '#fbbf24');
  pRect(ctx, mx, 134, 26, 86, '#bae6fd');
  pRect(ctx, mx + 4, 140, 8, 48, '#e0f2fe');

  const man1 = Math.round(148 - camX);
  pRect(ctx, man1 + 6, 170, 4, 54, '#78350f');
  pRect(ctx, man1, 174, 16, 28, '#1d4ed8'); // Royal Tunic display
  pRect(ctx, man1 + 4, 162, 8, 10, '#f5d0fe');

  const man2 = Math.round(355 - camX);
  pRect(ctx, man2 + 6, 170, 4, 54, '#78350f');
  pRect(ctx, man2, 174, 16, 28, '#7e22ce'); // Demon Slayer Haori display
  pRect(ctx, man2 + 4, 162, 8, 10, '#f5d0fe');

  // Rich crimson carpet floor
  pRect(ctx, 0, 224, PIXEL_W, 46, '#7f1d1d');
  pRect(ctx, 0, 224, PIXEL_W, 4, '#fbbf24');
}

/**
 * Glowing Alchemist Potion Shop Interior:
 * Shelves lined wall-to-wall with luminous colorful liquid bottles, tall bubbling glass vats & alchemy pipes!
 */
export function drawIsekaiPotionShopInterior(
  ctx: CanvasRenderingContext2D,
  camX: number,
  time: number,
) {
  pRect(ctx, 0, 0, PIXEL_W, PIXEL_H, '#0f172a');
  pRect(ctx, 0, 18, PIXEL_W, 208, '#1e1b4b');

  // Wood apothecary bays & shelf tiers
  const potionPalette = ['#ef4444', '#06b6d4', '#a855f7', '#10b981', '#f59e0b', '#ec4899', '#38bdf8'];
  for (let bay = 0; bay < 5; bay++) {
    const bx = Math.round(78 + bay * 92 - camX);
    if (bx < -96 || bx > PIXEL_W + 20) continue;
    pRect(ctx, bx, 38, 76, 152, '#312e81');
    pRect(ctx, bx + 4, 42, 68, 144, '#0f172a');
    for (let row = 0; row < 4; row++) {
      const sy = 68 + row * 32;
      pRect(ctx, bx + 2, sy, 72, 4, '#78350f');
      for (let b = 0; b < 5; b++) {
        const col = potionPalette[(bay * 3 + row * 2 + b) % potionPalette.length];
        const fx = bx + 8 + b * 13;
        const bh = 12 + ((b + row) % 3) * 3;
        const glow = 0.25 + 0.16 * Math.sin(time * 5 + bay + b + row);
        ctx.fillStyle = col;
        ctx.globalAlpha = glow;
        ctx.beginPath();
        ctx.arc(fx + 4, sy - Math.floor(bh / 2), 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        pRect(ctx, fx, sy - bh, 8, bh, col);
        pRect(ctx, fx + 2, sy - bh - 4, 4, 4, '#cbd5e1');
        pRect(ctx, fx + 1, sy - bh + 2, 2, Math.max(3, bh - 5), '#ffffff');
      }
    }
  }

  // Tall bubbling floor crystal liquid vats
  const vatXs = [125, 290, 470];
  vatXs.forEach((vxWorld, idx) => {
    const vx = Math.round(vxWorld - camX);
    if (vx < -40 || vx > PIXEL_W + 20) return;
    const vatCol = idx === 0 ? '#10b981' : idx === 1 ? '#ec4899' : '#38bdf8';
    pRect(ctx, vx - 2, 148, 22, 76, '#334155');
    ctx.fillStyle = vatCol;
    ctx.globalAlpha = 0.25 + 0.14 * Math.sin(time * 4 + idx);
    ctx.beginPath();
    ctx.arc(vx + 9, 184, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    pRect(ctx, vx + 1, 154, 16, 64, vatCol);
    // Rising glowing bubbles inside each container
    for (let k = 0; k < 4; k++) {
      const rise = ((time * 28 + k * 15 + idx * 9) % 54);
      pRect(ctx, vx + 4 + (k % 3) * 4, 212 - rise, 3, 3, '#fef9c3');
    }
  });

  // Emerald-tiled alchemist floor
  pRect(ctx, 0, 224, PIXEL_W, 46, '#132524');
  pRect(ctx, 0, 224, PIXEL_W, 4, '#2dd4bf');
}

/**
 * Extra-Wide Grand Weapons Shop Interior (maxX = 1220):
 * Displays all 10+ shop blades across stone racks & glowing pedestals at their exact colors, sizes, and special effects!
 */
export function drawIsekaiWeaponsShopInterior(
  ctx: CanvasRenderingContext2D,
  camX: number,
  time: number,
) {
  pRect(ctx, 0, 0, PIXEL_W, PIXEL_H, '#18100d');
  const ox = Math.floor(camX * 0.45);
  for (let x = -(ox % 56); x < PIXEL_W; x += 56) {
    pRect(ctx, x, 0, 10, 226, '#29150c');
    pRect(ctx, x + 10, 14, 46, 212, '#3a1f16');
  }

  // Warm forge hearth torches along wide hall
  for (let tx = 80; tx <= 1120; tx += 220) {
    const sx = Math.round(tx - camX);
    if (sx < -40 || sx > PIXEL_W + 40) continue;
    ctx.fillStyle = 'rgba(251, 146, 60, 0.22)';
    ctx.beginPath();
    ctx.arc(sx, 72, 34, 0, Math.PI * 2);
    ctx.fill();
    pRect(ctx, sx - 2, 74, 4, 14, '#78350f');
    pRect(ctx, sx - 3, 66 + Math.round(Math.sin(time * 11 + tx) * 2), 6, 8, '#f97316');
  }

  // Wide Gallery of Displayed Weapons with exact colors, custom visualLength/visualWidth & glowing Special Auras
  WEAPON_SHOP_ORDER.forEach((wid, idx) => {
    const w = WEAPONS[wid];
    const rx = Math.round(112 + idx * 88 - camX);
    if (rx < -65 || rx > PIXEL_W + 65) return;

    // Warm overhead gallery spotlight cone
    ctx.fillStyle = 'rgba(254, 240, 138, 0.08)';
    ctx.beginPath();
    ctx.moveTo(rx - 8, 34);
    ctx.lineTo(rx + 8, 34);
    ctx.lineTo(rx + 28, 174);
    ctx.lineTo(rx - 28, 174);
    ctx.closePath();
    ctx.fill();

    // Display stand / weapon wall plaque
    pRect(ctx, rx - 24, 92, 48, 86, '#451a03');
    pRect(ctx, rx - 22, 94, 44, 82, '#2d1c16');
    pRect(ctx, rx - 16, 174, 32, 50, '#57534e');
    pRect(ctx, rx - 20, 172, 40, 4, '#f59e0b');

    // Special Effect Aura Pulse behind each weapon
    const pulse = 0.28 + 0.16 * Math.sin(time * 4.5 + idx);
    ctx.fillStyle = w.accentColor;
    ctx.globalAlpha = pulse;
    ctx.beginPath();
    ctx.arc(rx, 134, 20 + Math.min(12, Math.floor(w.visualLength * 0.2)), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Exact Scaled Weapon Sprite rendered vertically on its display rack!
    const bladeLen = Math.max(18, Math.round(w.visualLength * 1.45));
    const bladeW = Math.max(3, w.visualWidth + 1);
    const bladeTop = 160 - bladeLen;
    pRect(ctx, rx - Math.floor(bladeW / 2), bladeTop, bladeW, bladeLen, w.color);
    pRect(ctx, rx - Math.floor(bladeW / 2), bladeTop + 2, 1, Math.max(6, bladeLen - 4), w.accentColor);
    // Crossguard & pommel
    pRect(ctx, rx - 6, 158, 12, 3, '#fbbf24');
    pRect(ctx, rx - 2, 161, 4, 8, '#78350f');

    // Special Effect badge tag below pedestal
    ctx.fillStyle = '#09060b';
    ctx.fillRect(rx - 22, 182, 44, 18);
    ctx.fillStyle = w.accentColor;
    ctx.font = 'bold 5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(w.specialLabel.slice(0, 11), rx, 190);
    ctx.fillStyle = '#fde047';
    ctx.fillText(`${w.shopPrice ?? 0}G`, rx, 197);
  });

  // Stone-plank armory floor
  pRect(ctx, 0, 224, PIXEL_W, 46, '#291c18');
  pRect(ctx, 0, 224, PIXEL_W, 4, '#f59e0b');
}

/**
 * Progressive Darkness Overlay when venturing Deeper or Farther in Endless Dungeons.
 * Leaves a warm lantern glow around the warrior while shrouding outer edges in deeper abyss!
 */
export function drawDungeonDepthOverlay(
  ctx: CanvasRenderingContext2D,
  depth: number,
  playerScreenX: number,
  playerScreenY: number,
  time: number,
  playerWorldX = 0,
  labelCtx?: CanvasRenderingContext2D | null,
) {
  const sectorProgress = Math.max(0, playerWorldX / DUNGEON_SECTOR_WIDTH);
  const effectiveLevel = depth + sectorProgress * 0.45;
  if (effectiveLevel < 1.35) return;

  const maxDarkness = Math.min(0.88, 0.24 + (effectiveLevel - 1.35) * 0.17);
  const cx = Math.max(0, Math.min(PIXEL_W, Math.round(playerScreenX)));
  const cy = Math.max(0, Math.min(PIXEL_H, Math.round(playerScreenY)));
  const torchRadius = Math.max(72, 146 - (effectiveLevel - 1.35) * 15 + Math.sin(time * 7) * 4);

  const grad = ctx.createRadialGradient(cx, cy, torchRadius * 0.35, cx, cy, torchRadius * 2.1);
  grad.addColorStop(0, 'rgba(4, 4, 12, 0)');
  grad.addColorStop(0.55, `rgba(6, 5, 16, ${(maxDarkness * 0.68).toFixed(2)})`);
  grad.addColorStop(1, `rgba(4, 3, 10, ${maxDarkness.toFixed(2)})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, PIXEL_W, PIXEL_H);

  const sectorNum = Math.floor(sectorProgress) + 1;
  if (labelCtx) {
    drawCrispOverlayLabel(labelCtx, PIXEL_W / 2, 13, `DEPTH ${depth} · SECTOR ${sectorNum} ABYSS`, {
      color: '#fca5a5',
      bg: 'rgba(12, 6, 18, 0.90)',
      border: '#ef4444',
      fontSize: 20,
      padX: 14,
      padY: 5,
    });
  } else {
    pRect(ctx, PIXEL_W / 2 - 104, 6, 208, 14, 'rgba(12, 6, 18, 0.85)');
    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`DEPTH ${depth} · SECTOR ${sectorNum} ABYSS`, PIXEL_W / 2, 15);
  }
}

/**
 * Gray Rocky Goblin Dungeon Cavern:
 * Slate gray stone walls, jagged stalactites, glowing crystal veins, iron cage torches, rocky floor.
 */
export function drawGoblinDungeonBackdrop(ctx: CanvasRenderingContext2D, camX: number, time: number) {
  pRect(ctx, 0, 0, PIXEL_W, PIXEL_H, '#1f2937');
  const pxOff = Math.floor(camX * 0.4) % 160;
  for (let x = -pxOff; x < PIXEL_W + 160; x += 160) {
    // Layered rocky cavern ribs & stalactites
    pRect(ctx, x, 0, 160, 226, '#334155');
    pRect(ctx, x + 22, 24, 116, 190, '#1e293b');
    for (let s = 0; s < 5; s++) {
      const sh = 24 + ((s * 17) % 34);
      pRect(ctx, x + 12 + s * 30, 0, 16, sh, '#475569');
      pRect(ctx, x + 16 + s * 30, sh, 8, 14, '#64748b');
    }
    // Glowing green mineral vein & cavern torch
    pRect(ctx, x + 52, 92, 6, 22, '#64748b');
    const flick = Math.round(Math.sin(time * 10 + x) * 2);
    ctx.fillStyle = 'rgba(251, 146, 60, 0.25)';
    ctx.beginPath();
    ctx.arc(x + 84, 128, 34, 0, Math.PI * 2);
    ctx.fill();
    pRect(ctx, x + 82, 130, 4, 14, '#78350f');
    pRect(ctx, x + 81, 122 + flick, 6, 8, '#f97316');
    pRect(ctx, x + 82, 124 + flick, 4, 5, '#fef08a');
  }

  // Rocky craggy cavern floor
  pRect(ctx, 0, 224, PIXEL_W, 46, '#334155');
  pRect(ctx, 0, 224, PIXEL_W, 4, '#64748b');
}

/**
 * Sunny Kingdom Highway Escort Backdrop + Moving Royal Carriage carrying the Princess!
 */
export function drawCarriageEscortBackdrop(ctx: CanvasRenderingContext2D, camX: number, time: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, PIXEL_H);
  grad.addColorStop(0, '#0ea5e9');
  grad.addColorStop(0.6, '#bae6fd');
  grad.addColorStop(1, '#dcfce7');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, PIXEL_W, PIXEL_H);

  drawAnimeCloud(ctx, 80 - ((time * 14) % 520), 26, 66);
  drawAnimeCloud(ctx, 290 - ((time * 10) % 520), 42, 54);

  const pxOff = Math.floor(camX * 0.35) % 240;
  for (let x = -pxOff; x < PIXEL_W + 240; x += 240) {
    pRect(ctx, x, 130, 240, 96, '#22c55e');
    // Woodland pine & oak clusters flanking the royal road
    for (let t = 0; t < 3; t++) {
      const tx = x + 28 + t * 76;
      pRect(ctx, tx + 10, 152, 8, 72, '#78350f');
      pRect(ctx, tx, 114, 28, 42, '#15803d');
      pRect(ctx, tx + 4, 102, 20, 16, '#16a34a');
    }
  }
  // Golden kingdom dirt & flagstone road
  pRect(ctx, 0, 224, PIXEL_W, 46, '#a16207');
  pRect(ctx, 0, 224, PIXEL_W, 4, '#eab308');
}

export function drawRoyalCarriage(
  ctx: CanvasRenderingContext2D,
  carriage: CarriageEscortState,
  camX: number,
  time: number,
) {
  const sx = Math.round(carriage.x - camX);
  if (sx < -160 || sx > PIXEL_W + 160) return;

  const bounce = Math.round(Math.abs(Math.sin(time * 9)) * 2);
  // Twin Royal White Steeds pulling carriage forward
  for (const hx of [sx + 88, sx + 106]) {
    pRect(ctx, hx, 198 + bounce, 24, 14, '#f8fafc');
    pRect(ctx, hx + 18, 184 + bounce, 9, 16, '#f8fafc');
    pRect(ctx, hx + 24, 184 + bounce, 7, 6, '#e2e8f0');
    pRect(ctx, hx + 4, 212, 3, 14, '#cbd5e1');
    pRect(ctx, hx + 16, 212, 3, 14, '#cbd5e1');
    pRect(ctx, hx + 18, 188 + bounce, 5, 5, '#fbbf24');
  }
  // Harness beam
  pRect(ctx, sx + 68, 206, 26, 3, '#78350f');

  // Ornate Royal Coach Body
  const cy = 166 + bounce;
  pRect(ctx, sx, cy, 70, 44, '#1e3a8a');
  pRect(ctx, sx + 3, cy + 3, 64, 38, '#2563eb');
  pRect(ctx, sx - 2, cy - 5, 74, 8, '#fbbf24'); // Gold carriage roof
  // Sunlit Carriage Window + Princess waving inside!
  pRect(ctx, sx + 18, cy + 10, 32, 20, '#0f172a');
  pRect(ctx, sx + 20, cy + 12, 28, 16, '#fef3c7');
  // Princess sprite inside window (blonde hair, pink gown, tiny tiara)
  pRect(ctx, sx + 28, cy + 14, 10, 8, '#fde047');
  pRect(ctx, sx + 30, cy + 16, 6, 6, '#fed7aa');
  pRect(ctx, sx + 31, cy + 12, 4, 3, '#fbbf24'); // Tiara
  pRect(ctx, sx + 28, cy + 22, 10, 6, '#f472b6');

  // Rotating Spoked Carriage Wheels
  for (const wx of [sx + 14, sx + 56]) {
    ctx.save();
    ctx.translate(wx, 214);
    ctx.rotate(time * 5);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.stroke();
    pRect(ctx, -11, -1, 22, 2, '#fbbf24');
    pRect(ctx, -1, -11, 2, 22, '#fbbf24');
    ctx.restore();
  }

  // Carriage HP Bar floating cleanly overhead
  pRect(ctx, sx + 4, cy - 16, 62, 5, '#09060b');
  const ratio = Math.max(0, carriage.hp / Math.max(1, carriage.maxHp));
  pRect(ctx, sx + 5, cy - 15, Math.round(60 * ratio), 3, ratio > 0.35 ? '#ec4899' : '#ef4444');
}

/**
 * Fantasy Manhwa-Inspired Demon Realm Invasion Backdrop:
 * Purple-Crimson Eclipse Sky, Floating Shattered Monoliths, Giant Ancient Impaled Swords,
 * Rotating Eldritch Rune Circles & Erupting Lava Volcanoes!
 */
export function drawDemonRealmBackdrop(ctx: CanvasRenderingContext2D, camX: number, time: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, PIXEL_H);
  grad.addColorStop(0, '#2e1065');
  grad.addColorStop(0.42, '#831843');
  grad.addColorStop(0.82, '#dc2626');
  grad.addColorStop(1, '#140308');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, PIXEL_W, PIXEL_H);

  // Giant Manhwa Crimson Eclipse & Rotating Arcane Ring in Sky
  const moonX = 365 - Math.round((camX * 0.08) % 120);
  ctx.save();
  ctx.strokeStyle = 'rgba(232, 121, 249, 0.42)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(moonX, 54, 34, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#09020e';
  ctx.beginPath();
  ctx.arc(moonX, 54, 24, 0, Math.PI * 2);
  ctx.fill();
  for (let r = 0; r < 6; r++) {
    const a = time * 0.9 + (r * Math.PI) / 3;
    pRect(ctx, moonX + Math.cos(a) * 32 - 2, 54 + Math.sin(a) * 32 - 2, 4, 4, '#f0abfc');
  }
  ctx.restore();

  // Floating Shattered Obsidian Monoliths & Giant Impaled Manhwa Swords on Distant Ridges
  const monoOff = Math.floor(camX * 0.18);
  for (let m = -1; m <= 3; m++) {
    const mx = m * 170 - ((monoOff % 170) + 170) % 170;
    const hover = Math.round(Math.sin(time * 2 + m) * 5);
    pRect(ctx, mx + 26, 36 + hover, 14, 34, '#1e071e');
    pRect(ctx, mx + 29, 44 + hover, 8, 2, '#c084fc');
    // Colossal Impaled Ancient Broadsword embedded in crag
    pRect(ctx, mx + 124, 96, 8, 84, '#3b0764');
    pRect(ctx, mx + 114, 114, 28, 4, '#fbbf24');
    pRect(ctx, mx + 126, 84, 4, 14, '#7e22ce');
  }

  // Animated Erupting Volcanoes across the Demon Realm horizon!
  const pxOff = Math.floor(camX * 0.3);
  for (let vx = -((pxOff % 240 + 240) % 240); vx < PIXEL_W + 240; vx += 240) {
    pRect(ctx, vx + 30, 128, 120, 98, '#1e0712');
    pRect(ctx, vx + 52, 98, 76, 40, '#2b0918');
    pRect(ctx, vx + 68, 82, 44, 24, '#3b0d1f');
    pRect(ctx, vx + 72, 80, 36, 5, '#ef4444');
    pRect(ctx, vx + 78, 80, 24, 3, '#fde047');

    const erupt = Math.sin(time * 4 + vx) * 0.5 + 0.5;
    const plumeH = Math.round(28 + erupt * 32);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.78)';
    ctx.fillRect(Math.round(vx + 78), 80 - plumeH, 24, plumeH);
    ctx.fillStyle = 'rgba(251, 146, 60, 0.85)';
    ctx.fillRect(Math.round(vx + 83), 82 - Math.round(plumeH * 0.75), 14, Math.round(plumeH * 0.75));
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(Math.round(vx + 87), 82 - Math.round(plumeH * 0.45), 6, Math.round(plumeH * 0.45));

    for (let e = 0; e < 7; e++) {
      const p = (time * 1.4 + e * 0.19) % 1;
      const ex = vx + 90 + Math.cos(e * 2.1) * (10 + p * 38);
      const ey = 76 - p * 54 + p * p * 38;
      pRect(ctx, ex, ey, 3, 3, e % 2 === 0 ? '#ef4444' : '#fde047');
    }

    pRect(ctx, vx + 84, 85, 8, 96, '#dc2626');
    pRect(ctx, vx + 86, 85, 4, 96, '#fb923c');
  }

  pRect(ctx, 0, 224, PIXEL_W, 46, '#270917');
  pRect(ctx, 0, 224, PIXEL_W, 4, '#ef4444');
}

/**
 * Manhwa Throne Citadel Backdrop tailored per Demon King Stage (1: Crimson Ash, 2: Frost Seraph, 3: Void Eclipse)!
 */
export function drawDemonKingArenaBackdrop(
  ctx: CanvasRenderingContext2D,
  camX: number,
  time: number,
  activeStage: 1 | 2 | 3 = 1,
) {
  const skyTop = activeStage === 1 ? '#3b071e' : activeStage === 2 ? '#0c1e4a' : '#090612';
  const skyMid = activeStage === 1 ? '#7f1d1d' : activeStage === 2 ? '#1e3a8a' : '#3b0764';
  const skyBot = activeStage === 1 ? '#b91c1c' : activeStage === 2 ? '#312e81' : '#1e1b4b';
  const runeCol = activeStage === 1 ? '#fb7185' : activeStage === 2 ? '#38bdf8' : '#c084fc';

  const grad = ctx.createLinearGradient(0, 0, 0, PIXEL_H);
  grad.addColorStop(0, skyTop);
  grad.addColorStop(0.55, skyMid);
  grad.addColorStop(1, skyBot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, PIXEL_W, PIXEL_H);

  // Colossal Rotating Manhwa Summoning Magic Array in Center Sky
  const cx = Math.round(330 - camX * 0.35);
  ctx.save();
  ctx.translate(cx, 112);
  ctx.rotate(time * 0.45);
  ctx.strokeStyle = runeCol;
  ctx.globalAlpha = 0.36;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 68, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeRect(-46, -46, 92, 92);
  ctx.rotate(Math.PI / 4);
  ctx.strokeRect(-46, -46, 92, 92);
  ctx.restore();

  // Chained Obsidian Throne Pillars
  const ox = Math.floor(camX * 0.55);
  for (let i = -1; i <= 5; i++) {
    const px = i * 130 - ((ox % 130) + 130) % 130;
    pRect(ctx, px + 18, 22, 18, 204, '#110a1a');
    pRect(ctx, px + 24, 34, 6, 180, runeCol);
    // Hanging chains
    for (let cy = 0; cy < 64; cy += 10) {
      pRect(ctx, px + 68, cy, 4, 6, '#475569');
    }
  }
}

/**
 * Draws all Town Walkers (moving forward & backward!), Seated Tavern Ale Drinkers, Receptionist, & Tailor NPCs!
 */
export function drawIsekaiNpcs(
  ctx: CanvasRenderingContext2D,
  npcs: IsekaiNpc[],
  camX: number,
  time: number,
  isCelebration: boolean,
  labelCtx?: CanvasRenderingContext2D | null,
) {
  for (const npc of npcs) {
    const sx = Math.round(npc.x - camX);
    if (sx < -40 || sx > PIXEL_W + 40) continue;

    ctx.save();
    ctx.translate(sx + 8, Math.round(npc.y + 24));
    ctx.scale(npc.facing, 1);

    const stride = !npc.sitting && npc.speed !== 0 ? Math.round(Math.sin(npc.walkCycle) * 2.5) : 0;
    const bob = Math.round(Math.sin(time * 4 + npc.minX) * 0.8);

    if (npc.sitting) {
      // Wooden barstool + Seated Adventurer raising frothy ale mug!
      pRect(ctx, -4, -7, 8, 7, '#78350f');
      pRect(ctx, -6, -9, 12, 2, '#b45309');
      pRect(ctx, -5, -20, 10, 12, npc.coatColor);
      pRect(ctx, -3, -19, 6, 8, npc.shirtColor);
      pRect(ctx, -4, -27, 8, 7, '#f3cba5');
      pRect(ctx, -5, -29, 10, 4, npc.hairColor);
      pRect(ctx, 1, -24, 2, 2, '#09060b');
      // Animated mug raise
      const lift = Math.sin((npc.drinkingPhase ?? time * 2.5) + npc.x * 0.1) > 0.35 ? -5 : 0;
      pRect(ctx, 5, -18 + lift, 5, 6, '#d97706'); // Frothy tankard
      pRect(ctx, 5, -20 + lift, 5, 2, '#ffffff'); // Foam!
    } else {
      // Legs (striding forward or backward)
      pRect(ctx, -4 + stride, -8, 3, 8, '#1e293b');
      pRect(ctx, 1 - stride, -8, 3, 8, '#334155');
      // Tunic / Guild Uniform / Dress
      pRect(ctx, -5, -19 + bob, 10, 12, npc.coatColor);
      pRect(ctx, -2, -18 + bob, 4, 10, npc.shirtColor);
      // Head & Anime Hair
      pRect(ctx, -4, -27 + bob, 8, 8, '#f3cba5');
      pRect(ctx, -5, -30 + bob, 10, 5, npc.hairColor);
      pRect(ctx, -5, -26 + bob, 3, 7, npc.hairColor);
      pRect(ctx, 1, -24 + bob, 2, 2, '#09060b');
      if (isCelebration && Math.floor(time * 4 + npc.x) % 2 === 0) {
        // Cheering arms raised!
        pRect(ctx, 4, -24 + bob, 3, 7, npc.coatColor);
      }
    }

    ctx.restore();

    // High-DPI crisp floating NPC name tag (never blurred by 3x pixel upscaling)
    if (labelCtx) {
      drawCrispOverlayLabel(labelCtx, sx + 8, Math.round(npc.y - 12), npc.name, {
        color: isCelebration ? '#fef08a' : '#f8fafc',
        bg: 'rgba(10, 7, 14, 0.90)',
        border: isCelebration ? 'rgba(251, 191, 36, 0.7)' : 'rgba(248, 250, 252, 0.28)',
        fontSize: 22,
        padX: 12,
        padY: 5,
      });
    } else {
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      const labelW = Math.min(88, npc.name.length * 4 + 10);
      const lx = Math.round(sx + 8 - labelW / 2);
      const ly = Math.round(npc.y - 17);
      ctx.fillStyle = 'rgba(10, 7, 14, 0.88)';
      ctx.fillRect(lx, ly, labelW, 10);
      ctx.fillStyle = isCelebration ? '#fef08a' : '#f8fafc';
      ctx.fillText(npc.name, Math.round(sx + 8), Math.round(npc.y - 9));
    }
  }
}

/**
 * Renders the Guild Allied Vanguard Squad (Harold, Elise, Aria) fighting alongside the player!
 */
export function drawAlliedNpcs(
  ctx: CanvasRenderingContext2D,
  allies: AlliedNpc[],
  camX: number,
  time: number,
  labelCtx?: CanvasRenderingContext2D | null,
) {
  for (const ally of allies) {
    if (ally.hp <= 0) continue;
    const sx = Math.round(ally.x - camX);
    if (sx < -40 || sx > PIXEL_W + 40) continue;

    ctx.save();
    ctx.translate(sx + 8, Math.round(ally.y + 26));
    ctx.scale(ally.facing, 1);
    const stride = Math.abs(ally.vx) > 6 ? Math.round(Math.sin(ally.walkCycle) * 2.5) : 0;
    const bob = Math.round(Math.sin(time * 5 + ally.x * 0.05) * 1);

    // Cloak, Legs, Armor
    pRect(ctx, -9, -20 + bob, 6, 15, ally.cloakColor);
    pRect(ctx, -4 + stride, -8, 3, 8, '#1e293b');
    pRect(ctx, 1 - stride, -8, 3, 8, '#334155');
    pRect(ctx, -5, -19 + bob, 10, 12, ally.hitFlash > 0 ? '#ffffff' : ally.armorColor);
    pRect(ctx, -4, -27 + bob, 8, 8, '#f3cba5');
    pRect(ctx, -5, -30 + bob, 10, 5, ally.role === 'mage' ? '#fde047' : '#94a3b8');
    pRect(ctx, 1, -24 + bob, 2, 2, '#09060b');

    if (ally.role === 'knight') {
      // Harold: Tower Shield + Gold Broadsword
      pRect(ctx, 4, -21 + bob, 6, 12, '#1d4ed8');
      pRect(ctx, 5, -20 + bob, 4, 10, '#fbbf24');
      pRect(ctx, 4, -30 + bob, 3, 18, ally.weaponColor);
    } else if (ally.role === 'lancer') {
      // Elise: Long Azure Halberd
      pRect(ctx, 2, -16 + bob, 20, 2, '#94a3b8');
      pRect(ctx, 18, -19 + bob, 6, 7, ally.weaponColor);
    } else {
      // Aria: Radiant Cleric Staff
      pRect(ctx, 5, -26 + bob, 2, 24, '#78350f');
      pRect(ctx, 3, -31 + bob, 6, 6, ally.weaponColor);
    }
    ctx.restore();

    // Crisp Ally Emerald Name + HP Bar
    const allyLabel = `ALLY · ${ally.name.split(' ').slice(-1)[0]}`;
    if (labelCtx) {
      drawCrispOverlayLabel(labelCtx, sx + 8, Math.round(ally.y - 12), allyLabel, {
        color: '#6ee7b7',
        bg: 'rgba(6, 20, 14, 0.90)',
        border: '#34d399',
        fontSize: 20,
        padX: 10,
        padY: 4,
      });
    } else {
      ctx.font = 'bold 6px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(6, 20, 14, 0.85)';
      ctx.fillRect(sx - 24, Math.round(ally.y - 16), 64, 9);
      ctx.fillStyle = '#6ee7b7';
      ctx.fillText(allyLabel, sx + 8, Math.round(ally.y - 9));
    }
    pRect(ctx, sx - 6, Math.round(ally.y - 5), 28, 3, '#09060b');
    pRect(ctx, sx - 5, Math.round(ally.y - 4), Math.round((26 * ally.hp) / Math.max(1, ally.maxHp)), 2, '#34d399');
  }
}

/**
 * Renders the active 1-by-1 Manhwa Demon Monarchs with completely distinct silhouettes, wings/halos/arms & weapons!
 */
export function drawDemonKings(
  ctx: CanvasRenderingContext2D,
  kings: DemonKingEntity[],
  camX: number,
  time: number,
  frozen: boolean,
  activeStage: 1 | 2 | 3 = 1,
  labelCtx?: CanvasRenderingContext2D | null,
) {
  for (const dk of kings) {
    if (dk.hp <= 0 || dk.defeated || dk.index !== activeStage) continue;
    const sx = Math.round(dk.x - camX);
    if (sx < -90 || sx > PIXEL_W + 90) continue;

    ctx.save();
    ctx.translate(sx + dk.w / 2, Math.round(dk.y + dk.h));
    ctx.scale(dk.facing, 1);

    const flash = dk.hitFlash > 0;
    const bob = Math.round(Math.sin(time * 4 + dk.index) * 2);

    // Distinct Manhwa Monarch Back Aura
    ctx.fillStyle = dk.auraColor;
    ctx.globalAlpha = 0.24 + 0.08 * Math.sin(time * 7);
    ctx.beginPath();
    ctx.arc(0, -dk.h * 0.55, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    if (dk.index === 1) {
      // KING #1: MALAKOR — Colossal Crimson-Ash Horned Titan w/ Ashen Magma Greatsword
      pRect(ctx, -18, -46 + bob, 36, 44, flash ? '#ffffff' : '#1c060c');
      pRect(ctx, -14, -42 + bob, 28, 32, flash ? '#ffffff' : '#991b1b');
      pRect(ctx, -4, -36 + bob, 8, 18, '#f97316'); // Magma ribcage core
      pRect(ctx, -20, -45 + bob, 11, 11, '#fbbf24');
      pRect(ctx, 9, -45 + bob, 11, 11, '#fbbf24');
      pRect(ctx, -9, -58 + bob, 18, 14, flash ? '#ffffff' : '#7f1d1d');
      pRect(ctx, -15, -70 + bob, 5, 14, '#fef08a'); // Massive curved horns
      pRect(ctx, 10, -70 + bob, 5, 14, '#fef08a');
      pRect(ctx, -4, -52 + bob, 3, 2, '#fde047');
      pRect(ctx, 2, -52 + bob, 3, 2, '#fde047');
      // Colossal Jagged Greatsword
      pRect(ctx, 14, -64 + bob, 7, 56, '#450a0a');
      pRect(ctx, 16, -62 + bob, 3, 52, '#fb7185');
    } else if (dk.index === 2) {
      // KING #2: VAELGOR — Fallen 6-Winged Abyssal Frost Seraph w/ Cracked Halo & Ice Scythe
      const flap = Math.round(Math.sin(time * 9) * 4);
      for (let w = 0; w < 3; w++) {
        pRect(ctx, -34 + w * 4, -52 + w * 10 + flap, 22, 6, '#38bdf8');
        pRect(ctx, 12 - w * 4, -52 + w * 10 - flap, 22, 6, '#1d4ed8');
      }
      // Cracked Sovereign Halo above head
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, -64 + bob, 14, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      pRect(ctx, -14, -44 + bob, 28, 42, flash ? '#ffffff' : '#0f172a');
      pRect(ctx, -11, -40 + bob, 22, 30, flash ? '#ffffff' : '#1e40af');
      pRect(ctx, -8, -56 + bob, 16, 13, flash ? '#ffffff' : '#e0f2fe');
      pRect(ctx, -4, -51 + bob, 3, 2, '#38bdf8');
      pRect(ctx, 2, -51 + bob, 3, 2, '#38bdf8');
      // Frost Crescent Scythe
      pRect(ctx, 14, -62 + bob, 3, 54, '#e2e8f0');
      pRect(ctx, 4, -64 + bob, 20, 6, '#38bdf8');
    } else {
      // KING #3: ZARAKIEL — 4-Armed Void-Eclipse Sovereign w/ Triple Shadow Rings & Twin Void Spears
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, -34 + bob, 30, time * 2, time * 2 + Math.PI * 1.4);
      ctx.stroke();
      ctx.strokeStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(0, -34 + bob, 24, -time * 3, -time * 3 + Math.PI * 1.5);
      ctx.stroke();
      // Main Shadow Monarch Frame + Extra Arms
      pRect(ctx, -16, -48 + bob, 32, 46, flash ? '#ffffff' : '#090612');
      pRect(ctx, -12, -44 + bob, 24, 34, flash ? '#ffffff' : '#3b0764');
      pRect(ctx, -20, -40 + bob, 8, 5, '#fbbf24');
      pRect(ctx, 12, -40 + bob, 8, 5, '#fbbf24');
      pRect(ctx, -10, -61 + bob, 20, 14, flash ? '#ffffff' : '#1e1b4b');
      pRect(ctx, -9, -66 + bob, 18, 5, '#fbbf24'); // Imperial Eclipse Crown
      pRect(ctx, -4, -55 + bob, 3, 2, '#e879f9');
      pRect(ctx, 2, -55 + bob, 3, 2, '#e879f9');
      // Twin Void-Eclipse Spears
      pRect(ctx, 16, -68 + bob, 3, 62, '#fbbf24');
      pRect(ctx, 14, -74 + bob, 7, 10, '#c084fc');
      pRect(ctx, -22, -62 + bob, 3, 56, '#fbbf24');
    }

    if (frozen) {
      ctx.strokeStyle = '#34d399';
      ctx.strokeRect(-20, -68, 40, 70);
    }
    ctx.restore();

    // Name & HP bar above active Demon King
    if (labelCtx) {
      drawCrispOverlayLabel(labelCtx, sx + dk.w / 2, Math.round(dk.y - 18), `STAGE ${dk.index}/3 · ${dk.name}`, {
        color: '#fef08a',
        bg: 'rgba(10, 6, 16, 0.92)',
        border: dk.auraColor,
        fontSize: 22,
        padX: 12,
        padY: 5,
      });
    } else {
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      const nameW = Math.min(134, dk.name.length * 4 + 12);
      ctx.fillStyle = 'rgba(10, 6, 16, 0.85)';
      ctx.fillRect(Math.round(sx + dk.w / 2 - nameW / 2), Math.round(dk.y - 22), nameW, 10);
      ctx.fillStyle = '#fef08a';
      ctx.fillText(`STAGE ${dk.index}/3 · ${dk.name}`, sx + dk.w / 2, Math.round(dk.y - 14));
    }
    pRect(ctx, sx - 8, Math.round(dk.y - 9), dk.w + 16, 5, '#09060b');
    pRect(
      ctx,
      sx - 7,
      Math.round(dk.y - 8),
      Math.round(((dk.w + 14) * dk.hp) / Math.max(1, dk.maxHp)),
      3,
      dk.auraColor,
    );
  }
}

export function drawPurpleFlameZones(
  ctx: CanvasRenderingContext2D,
  zones: PurpleFlameZone[],
  camX: number,
  time: number,
) {
  for (const z of zones) {
    const sx = Math.round(z.x - camX);
    if (sx < -60 || sx > PIXEL_W + 60) continue;
    const flick = Math.round(Math.sin(time * 22 + z.x) * 4);
    const cx = sx + z.w / 2;
    const baseY = z.y + z.h;
    ctx.save();
    ctx.fillStyle = 'rgba(147, 51, 234, 0.35)';
    ctx.beginPath();
    ctx.arc(cx, Math.round(baseY - 14), z.w * 0.65 + 4, 0, Math.PI * 2);
    ctx.fill();
    pRect(ctx, sx, z.y + flick, z.w, z.h, '#7e22ce');
    pRect(ctx, sx + 4, z.y + 8 + flick, Math.max(4, z.w - 8), Math.max(8, z.h - 8), '#c084fc');
    pRect(ctx, cx - 3, z.y + 18 + flick, 6, Math.max(6, z.h - 18), '#fdf4ff');
    ctx.restore();
  }
}

/**
 * Royal S-Rank Coronation Cutscene:
 * Solaris Cathedral Dais, sunlight beams, descending Golden Crown placed onto Bastera Knight, & cheering townsfolk!
 */
export function drawCoronationCutscene(
  ctx: CanvasRenderingContext2D,
  cutscene: CoronationCutsceneHud,
  customization: WarriorCustomization = DEFAULT_WARRIOR_CUSTOMIZATION,
  time: number,
) {
  ctx.save();
  const grad = ctx.createLinearGradient(0, 0, 0, PIXEL_H);
  grad.addColorStop(0, '#1e3a8a');
  grad.addColorStop(0.5, '#3b82f6');
  grad.addColorStop(1, '#fef3c7');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, PIXEL_W, PIXEL_H);

  // Cathedral Sunbeams
  ctx.fillStyle = 'rgba(254, 240, 138, 0.22)';
  ctx.beginPath();
  ctx.moveTo(180, 0);
  ctx.lineTo(300, 0);
  ctx.lineTo(350, 230);
  ctx.lineTo(130, 230);
  ctx.closePath();
  ctx.fill();

  // Red Royal Carpet Dais
  pRect(ctx, 70, 180, PIXEL_W - 140, 44, '#7f1d1d');
  pRect(ctx, 70, 180, PIXEL_W - 140, 4, '#fbbf24');

  // King & Princess standing to the left presenting the Crown!
  pRect(ctx, 136, 132, 16, 48, '#7e22ce');
  pRect(ctx, 138, 120, 12, 12, '#fed7aa');
  pRect(ctx, 138, 114, 12, 6, '#fbbf24');

  // Kneeling/Standing Bastera Knight in the Sunbeam Center
  const kx = 236;
  const ky = 148;
  pRect(ctx, kx - 8, ky, 16, 32, customization.armorColor);
  pRect(ctx, kx - 14, ky + 4, 8, 28, customization.cloakColor);
  pRect(ctx, kx - 7, ky - 12, 14, 12, customization.armorColor);
  pRect(ctx, kx - 2, ky - 8, 8, 4, '#0f172a');

  // Descending Jeweled Sovereign Crown!
  const dropProgress = Math.min(1, cutscene.progress * 1.4);
  const crownY = Math.round(52 + dropProgress * (ky - 68));
  pRect(ctx, kx - 8, crownY, 16, 6, '#f59e0b');
  pRect(ctx, kx - 8, crownY - 4, 3, 4, '#fbbf24');
  pRect(ctx, kx - 2, crownY - 6, 4, 6, '#fef08a');
  pRect(ctx, kx + 5, crownY - 4, 3, 4, '#fbbf24');
  pRect(ctx, kx - 1, crownY + 2, 2, 2, '#e11d48');

  // Celebration Confetti
  const colors = ['#f43f5e', '#fbbf24', '#38bdf8', '#4ade80', '#c084fc'];
  for (let i = 0; i < 28; i++) {
    const cx = (i * 31 + Math.floor(time * 28)) % PIXEL_W;
    const cy = (i * 23 + Math.floor(time * 42)) % 220;
    pRect(ctx, cx, cy, 4, 4, colors[i % colors.length]);
  }

  // Banner Caption
  pRect(ctx, 48, 206, PIXEL_W - 96, 48, '#09060b');
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;
  ctx.strokeRect(48, 206, PIXEL_W - 96, 48);
  ctx.fillStyle = '#fde047';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ALL HAIL THE NEW S-RANK SOVEREIGN!', PIXEL_W / 2, 226);
  ctx.fillStyle = '#fef3c7';
  ctx.font = '8px monospace';
  ctx.fillText(cutscene.subtitle, PIXEL_W / 2, 242);
  ctx.restore();
}
