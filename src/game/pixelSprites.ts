import { WEAPONS } from './data';
import {
  drawBossPortrait,
  getBakedBiomeWall,
  getBakedJoJoBossSprite,
  getBakedWarriorBattleSprite,
} from './pixelArtAtlas';
import type {
  ActiveBoss,
  BiomeId,
  BossBattlePhase,
  BossBattleSlashFx,
  CandleProp,
  EnemyState,
  HiddenPassage,
  InteractableProp,
  MultiplayerPeer,
  Platform,
  PlayerState,
  Projectile,
  WeaponId,
} from './types';
import { FLOOR_Y } from './worldGen';

export const PIXEL_W = 480;
export const PIXEL_H = 270;

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

function drawPixelSparkle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
) {
  pRect(ctx, x - size, y, size * 2 + 1, 1, color);
  pRect(ctx, x, y - size, 1, size * 2 + 1, color);
}

const skyBackdropCache: Record<string, HTMLCanvasElement> = {};

function getSkyBackdrop(key: string, stops: [number, string][]): HTMLCanvasElement {
  if (skyBackdropCache[key]) return skyBackdropCache[key];
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = PIXEL_H;
  const gctx = c.getContext('2d');
  if (gctx) {
    const grad = gctx.createLinearGradient(0, 0, 0, PIXEL_H);
    for (const [offset, color] of stops) {
      grad.addColorStop(offset, color);
    }
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, 4, PIXEL_H);
  }
  skyBackdropCache[key] = c;
  return c;
}

export function drawBiomeBackdrop(
  ctx: CanvasRenderingContext2D,
  biome: BiomeId,
  camX: number,
  time: number,
) {
  const wallStrip = getBakedBiomeWall(biome);
  const stripW = wallStrip.width; // 256
  const parallaxX = Math.floor(camX * 0.38);
  const offset = ((parallaxX % stripW) + stripW) % stripW;

  // Tile seamless Castlevania/Blasphemous-grade architectural wall strip
  for (let drawX = -offset; drawX < PIXEL_W; drawX += stripW) {
    ctx.drawImage(wallStrip, Math.round(drawX), 0);
  }

  // Animated dynamic props layered over baked masonry (chandeliers, pulsing runes, lava shimmer)
  const first = Math.floor(parallaxX / stripW);
  for (let i = first - 1; i <= first + 2; i++) {
    const wx = i * stripW - parallaxX;
    if (biome === 'castle') {
      // Swaying ornate gothic chandelier centered before the stained glass rose window
      const chandX = wx + 85;
      const sway = Math.round(Math.sin(time * 1.4 + i) * 1);
      pRect(ctx, chandX, 0, 2, 16, '#271e24');
      pRect(ctx, chandX - 15 + sway, 16, 32, 2, '#78350f');
      pRect(ctx, chandX - 11 + sway, 18, 24, 2, '#b45309');
      pRect(ctx, chandX - 3 + sway, 20, 8, 3, '#f59e0b');
      [-13, -5, 5, 13].forEach((ox, idx) => {
        const cx = chandX + ox + sway;
        pRect(ctx, cx, 11, 2, 5, '#fef3c7');
        const cf = Math.round(Math.sin(time * 9 + i + idx) * 0.8);
        pRect(ctx, cx - 1, 7 + cf, 4, 4, 'rgba(249, 115, 22, 0.35)');
        pRect(ctx, cx, 8 + cf, 2, 3, '#f97316');
        pRect(ctx, cx, 9 + cf, 1, 2, '#fef08a');
      });
    } else if (biome === 'forest') {
      // Swaying luminescent vines & pulsing ancient rune glyphs
      const vSway = Math.round(Math.sin(time * 2 + i) * 1.5);
      pRect(ctx, wx + 42 + vSway, 0, 2, 54, '#15803d');
      pRect(ctx, wx + 42 + vSway, 54, 2, 4, '#6ee7b7');
      pRect(ctx, wx + 206 - vSway, 0, 2, 62, '#166534');
      pRect(ctx, wx + 206 - vSway, 62, 2, 4, '#34d399');
      const pulse = 0.35 + 0.45 * Math.sin(time * 3 + i);
      ctx.fillStyle = `rgba(110, 231, 183, ${pulse})`;
      ctx.fillRect(Math.round(wx + 114), 132, 8, 24);
    } else {
      // Flowing molten magma shimmer + swaying iron torture cage
      const shimmer = 0.3 + 0.35 * Math.sin(time * 6 + i);
      ctx.fillStyle = `rgba(254, 240, 138, ${shimmer})`;
      ctx.fillRect(Math.round(wx + 123), 72 + Math.round((time * 32) % 36), 6, 14);
      const cSway = Math.round(Math.sin(time * 2.1 + i) * 1);
      for (let cy = 10; cy < 82; cy += 9) {
        pRect(ctx, wx + 208 + cSway, cy, 3, 5, '#57534e');
      }
      pRect(ctx, wx + 201 + cSway, 82, 16, 22, '#291515');
      pRect(ctx, wx + 204 + cSway, 85, 4, 16, '#120505');
      pRect(ctx, wx + 210 + cSway, 85, 4, 16, '#120505');
    }
  }
}

export function drawPlatforms(
  ctx: CanvasRenderingContext2D,
  platforms: Platform[],
  biome: BiomeId,
  camX: number,
  time: number,
) {
  for (const plat of platforms) {
    const sx = Math.round(plat.x - camX);
    if (sx + plat.w < -16 || sx > PIXEL_W + 16) continue;

    if (plat.kind === 'floor') {
      if (biome === 'castle') {
        // 2.5D Castlevania flagstone walkway top ledge + multi-course ashlar masonry below
        pRect(ctx, sx, plat.y, plat.w, plat.h, '#140e12');
        pRect(ctx, sx, plat.y - 2, plat.w, 6, '#362730');
        for (let bx = 0; bx < plat.w; bx += 24) {
          const tileIdx = Math.floor((bx + plat.x) / 24);
          const broken = tileIdx % 5 === 0;
          const mossy = tileIdx % 7 === 0;
          // 2.5D top flagstone bevel with diagonal mortar perspective seam
          pRect(ctx, sx + bx, plat.y - 2, 22, 4, broken ? '#2a1e24' : '#4a3742');
          pRect(ctx, sx + bx, plat.y - 2, 22, 1, '#6b5361');
          pRect(ctx, sx + bx + 22, plat.y - 2, 2, 5, '#0b0709');
          // Course 1 & 2 irregular stone blocks under ledge
          pRect(ctx, sx + bx, plat.y + 6, 22, 10, broken ? '#1b1318' : '#32242c');
          pRect(ctx, sx + bx, plat.y + 6, 22, 2, '#4d3944');
          pRect(ctx, sx + bx + 8, plat.y + 18, 22, 10, '#271c22');
          pRect(ctx, sx + bx + 8, plat.y + 18, 22, 1, '#3d2d36');
          pRect(ctx, sx + bx, plat.y + 30, 22, 12, '#1b1317');
          if (broken) {
            pRect(ctx, sx + bx + 6, plat.y + 8, 2, 7, '#090609');
            pRect(ctx, sx + bx + 8, plat.y + 11, 5, 2, '#090609');
          }
          if (mossy) {
            pRect(ctx, sx + bx + 2, plat.y + 4, 7, 2, '#166534');
            pRect(ctx, sx + bx + 4, plat.y + 6, 3, 2, '#22c55e');
          }
        }
        // Iconic Red & Golden Royal Carpet with diamond heraldic weave, tassels & tattered brick breaks
        pRect(ctx, sx, plat.y - 1, plat.w, 6, '#5c1118');
        pRect(ctx, sx, plat.y, plat.w, 4, '#be123c');
        pRect(ctx, sx, plat.y - 1, plat.w, 1, '#fbbf24');
        pRect(ctx, sx, plat.y + 4, plat.w, 1, '#b45309');
        for (let gx = 4; gx < plat.w; gx += 16) {
          if ((gx + plat.x) % 112 !== 0) {
            pRect(ctx, sx + gx, plat.y + 1, 5, 2, '#fde047');
            pRect(ctx, sx + gx + 2, plat.y, 1, 4, '#fbbf24');
            // Draped gold tassel over front lip every 32px
            if (gx % 32 === 4) {
              pRect(ctx, sx + gx + 1, plat.y + 5, 2, 2, '#f59e0b');
            }
          } else {
            pRect(ctx, sx + gx - 2, plat.y - 1, 9, 6, '#32242c');
            pRect(ctx, sx + gx - 3, plat.y + 3, 2, 2, '#f59e0b');
            pRect(ctx, sx + gx + 7, plat.y + 3, 2, 2, '#f59e0b');
          }
        }
      } else if (biome === 'forest') {
        pRect(ctx, sx, plat.y, plat.w, plat.h, '#0d1a16');
        pRect(ctx, sx, plat.y - 2, plat.w, 6, '#1b4735');
        pRect(ctx, sx, plat.y - 2, plat.w, 1, '#6ee7b7');
        for (let bx = 0; bx < plat.w; bx += 20) {
          pRect(ctx, sx + bx, plat.y + 6, 18, 12, '#182b24');
          pRect(ctx, sx + bx, plat.y + 6, 18, 2, '#284a3d');
          pRect(ctx, sx + bx + 4, plat.y - 1, 8, 2, '#34d399');
        }
      } else {
        pRect(ctx, sx, plat.y, plat.w, plat.h, '#160908');
        pRect(ctx, sx, plat.y - 2, plat.w, 5, '#451a14');
        pRect(ctx, sx, plat.y - 2, plat.w, 1, '#fb923c');
        const lavaPulse = 0.7 + 0.3 * Math.sin(time * 4);
        ctx.fillStyle = `rgba(249, 115, 22, ${lavaPulse})`;
        for (let bx = 0; bx < plat.w; bx += 32) {
          pRect(ctx, sx + bx, plat.y + 6, 28, 12, '#2b1210');
          pRect(ctx, sx + bx, plat.y + 6, 28, 2, '#54211b');
          ctx.fillRect(Math.round(sx + bx + 6), plat.y + 22, 18, 4);
        }
      }
    } else {
      // Elevated Brick / Carpet / Secret Bridge Ledge
      const baseColor =
        plat.kind === 'secret_bridge'
          ? '#4b3621'
          : plat.kind === 'bridge'
            ? '#3e2723'
            : biome === 'castle'
              ? '#382a31'
              : biome === 'forest'
                ? '#243b33'
                : '#3b1915';
      pRect(ctx, sx, plat.y, plat.w, plat.h, '#0c070a');
      pRect(ctx, sx + 1, plat.y + 1, plat.w - 2, plat.h - 2, baseColor);
      pRect(ctx, sx + 1, plat.y + 1, plat.w - 2, 2, plat.kind === 'bridge' ? '#a16207' : '#6d5561');
      if (plat.kind === 'carpet_ledge') {
        pRect(ctx, sx + 2, plat.y, plat.w - 4, 3, '#9f1239');
        pRect(ctx, sx + 2, plat.y, plat.w - 4, 1, '#fbbf24');
      } else if (plat.kind === 'secret_bridge') {
        pRect(ctx, sx, plat.y, plat.w, 2, '#f59e0b');
      } else if (plat.kind === 'bridge') {
        // Ornate chain hangers + brass bolts
        pRect(ctx, sx + 4, plat.y - 16, 2, 16, '#64748b');
        pRect(ctx, sx + plat.w - 6, plat.y - 16, 2, 16, '#64748b');
        pRect(ctx, sx + 3, plat.y + 2, 4, 4, '#fbbf24');
        pRect(ctx, sx + plat.w - 7, plat.y + 2, 4, 4, '#fbbf24');
      }
      for (let bx = 12; bx < plat.w - 6; bx += 16) {
        pRect(ctx, sx + bx, plat.y + 3, 2, plat.h - 4, '#140e12');
      }
    }
  }
}

const glowStampCache: Record<string, HTMLCanvasElement> = {};

function getGlowStamp(kind: 'amber' | 'emerald'): HTMLCanvasElement {
  if (glowStampCache[kind]) return glowStampCache[kind];
  const size = 112;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const gctx = c.getContext('2d');
  if (gctx) {
    const r = size / 2;
    const rg = gctx.createRadialGradient(r, r, 2, r, r, r);
    if (kind === 'emerald') {
      rg.addColorStop(0, 'rgba(52, 211, 153, 0.36)');
      rg.addColorStop(1, 'rgba(52, 211, 153, 0)');
    } else {
      rg.addColorStop(0, 'rgba(251, 191, 36, 0.38)');
      rg.addColorStop(0.45, 'rgba(234, 88, 12, 0.15)');
      rg.addColorStop(1, 'rgba(234, 88, 12, 0)');
    }
    gctx.fillStyle = rg;
    gctx.fillRect(0, 0, size, size);
  }
  glowStampCache[kind] = c;
  return c;
}

export function drawCandles(
  ctx: CanvasRenderingContext2D,
  candles: CandleProp[],
  camX: number,
  time: number,
) {
  for (const c of candles) {
    const sx = Math.round(c.x - camX);
    if (sx < -40 || sx > PIXEL_W + 40) continue;

    const flicker = Math.sin(time * 9 + c.phase) * 0.8 + Math.cos(time * 15 + c.phase) * 0.5;
    const flameY = c.kind === 'candelabra' ? c.y - 26 : c.kind === 'brazier' ? c.y - 16 : c.y - 12;

    const stamp = getGlowStamp(c.kind === 'rune_lantern' ? 'emerald' : 'amber');
    const radius = (c.kind === 'candelabra' ? 56 : c.kind === 'brazier' ? 60 : 44) + flicker * 2;
    ctx.drawImage(
      stamp,
      Math.round(sx - radius),
      Math.round(flameY - radius),
      Math.round(radius * 2),
      Math.round(radius * 2),
    );

    if (c.kind === 'candelabra') {
      pRect(ctx, sx - 5, c.y - 3, 10, 3, '#b45309');
      pRect(ctx, sx - 3, c.y - 5, 6, 2, '#d97706');
      pRect(ctx, sx - 1, c.y - 22, 2, 17, '#f59e0b');
      pRect(ctx, sx - 7, c.y - 18, 14, 2, '#fbbf24');
      [-6, 0, 6].forEach((ox, idx) => {
        const top = idx === 1 ? c.y - 26 : c.y - 23;
        pRect(ctx, sx + ox - 1, top, 2, 5, '#fef3c7');
        const fy = top - 3 + Math.round(flicker * 0.6);
        pRect(ctx, sx + ox - 1, fy, 2, 3, '#f97316');
        pRect(ctx, sx + ox, fy, 1, 2, '#fef08a');
      });
    } else if (c.kind === 'wall_sconce') {
      pRect(ctx, sx - 2, c.y - 4, 4, 5, '#78350f');
      pRect(ctx, sx - 1, c.y - 11, 2, 7, '#fef3c7');
      pRect(ctx, sx - 1, c.y - 14 + Math.round(flicker * 0.5), 2, 3, '#fb923c');
      pRect(ctx, sx, c.y - 13 + Math.round(flicker * 0.5), 1, 2, '#fef08a');
    } else if (c.kind === 'rune_lantern') {
      pRect(ctx, sx - 3, c.y - 14, 6, 10, '#1e293b');
      pRect(ctx, sx - 2, c.y - 12, 4, 6, '#34d399');
    } else {
      pRect(ctx, sx - 6, c.y - 10, 12, 10, '#3f2222');
      pRect(ctx, sx - 4, c.y - 15 + Math.round(flicker), 8, 5, '#f97316');
      pRect(ctx, sx - 2, c.y - 17 + Math.round(flicker), 4, 4, '#fde047');
    }
  }
}

export function drawInteractables(
  ctx: CanvasRenderingContext2D,
  props: InteractableProp[],
  passages: HiddenPassage[],
  camX: number,
  time: number,
) {
  for (const hp of passages) {
    const sx = Math.round(hp.x - camX);
    if (sx < -50 || sx > PIXEL_W + 50) continue;
    if (hp.discovered) {
      pRect(ctx, sx, hp.y, hp.w, hp.h, '#090609');
      pRect(ctx, sx + 2, hp.y + 2, hp.w - 4, hp.h - 2, '#171019');
      ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
      ctx.fillRect(sx + 6, hp.y + 6, hp.w - 12, hp.h - 8);
    }
  }

  for (const p of props) {
    const sx = Math.round(p.x - camX);
    if (sx < -40 || sx > PIXEL_W + 40) continue;

    if (p.kind === 'throne') {
      pRect(ctx, sx - 2, p.y + 30, 32, 4, '#451a03');
      pRect(ctx, sx + 3, p.y - 2, 22, p.h - 2, '#290f02');
      pRect(ctx, sx + 5, p.y, 18, p.h - 4, '#5c180c');
      pRect(ctx, sx + 7, p.y + 2, 14, p.h - 8, '#991b1b');
      pRect(ctx, sx + 6, p.y - 5, 16, 4, '#f59e0b');
      pRect(ctx, sx + 8, p.y - 7, 3, 2, '#fef08a');
      pRect(ctx, sx + 13, p.y - 8, 2, 3, '#fef08a');
      pRect(ctx, sx + 17, p.y - 7, 3, 2, '#fef08a');
      pRect(ctx, sx, p.y + 18, 28, 12, '#7f1d1d');
      pRect(ctx, sx + 2, p.y + 18, 24, 2, '#fbbf24');
      pRect(ctx, sx, p.y + 15, 5, 16, '#d97706');
      pRect(ctx, sx + 23, p.y + 15, 5, 16, '#d97706');
      pRect(ctx, sx + 11, p.y + 6, 6, 8, '#fbbf24');
      pRect(ctx, sx + 13, p.y + 8, 2, 4, '#7f1d1d');
    } else if (p.kind === 'broken_brick') {
      if (p.activated) continue;
      pRect(ctx, sx, p.y, p.w, p.h, '#241a20');
      pRect(ctx, sx + 1, p.y + 1, p.w - 2, p.h - 2, '#3d2d35');
      for (let by = 2; by < p.h - 5; by += 8) {
        pRect(ctx, sx + 2, p.y + by, Math.min(10, p.w - 4), 5, '#4d3a43');
        if (p.w > 22) {
          pRect(ctx, sx + 14, p.y + by + 1, p.w - 16, 5, '#46343d');
        }
      }
      const c1 = Math.min(8, p.h - 4);
      pRect(ctx, sx + Math.floor(p.w * 0.42), p.y + 2, 2, c1, '#120c10');
      if (p.h > 22) {
        pRect(ctx, sx + Math.floor(p.w * 0.48), p.y + 10, 2, 10, '#120c10');
        pRect(ctx, sx + Math.floor(p.w * 0.38), p.y + 20, 3, Math.min(10, p.h - 22), '#120c10');
      }
      if (p.secretId) {
        const pulse = 0.45 + 0.45 * Math.sin(time * 4.5);
        ctx.fillStyle = `rgba(251, 191, 36, ${pulse})`;
        ctx.fillRect(sx + Math.floor(p.w * 0.42), p.y + 3, 2, c1);
        if (p.h > 22) {
          ctx.fillRect(sx + Math.floor(p.w * 0.48), p.y + 11, 2, 9);
        }
      }
    } else if (p.kind === 'lever') {
      pRect(ctx, sx + 2, p.y + 14, 14, 8, '#475569');
      const tilt = p.activated ? 5 : -5;
      pRect(ctx, sx + 8 + tilt, p.y + 2, 3, 14, '#cbd5e1');
      pRect(ctx, sx + 7 + tilt, p.y, 5, 4, p.activated ? '#34d399' : '#ef4444');
    } else if (p.kind === 'pressure_plate') {
      pRect(
        ctx,
        sx,
        p.y + (p.activated ? 3 : 0),
        p.w,
        p.h - (p.activated ? 3 : 0),
        p.activated ? '#34d399' : '#f59e0b',
      );
    } else if (p.kind === 'tapestry') {
      if (p.activated) continue;
      const sway = Math.round(Math.sin(time * 3) * 1.5);
      pRect(ctx, sx + sway, p.y, p.w, p.h, '#881337');
      pRect(ctx, sx + 4 + sway, p.y + 4, p.w - 8, p.h - 10, '#be123c');
      pRect(ctx, sx + 9 + sway, p.y + 8, 6, 12, '#fbbf24');
    } else if (p.kind === 'chest') {
      pRect(ctx, sx, p.y + 4, p.w, p.h - 4, '#78350f');
      pRect(ctx, sx, p.y + (p.activated ? 0 : 4), p.w, 6, p.activated ? '#92400e' : '#b45309');
      pRect(ctx, sx + 8, p.y + 8, 4, 4, '#fbbf24');
    } else if (p.kind === 'checkpoint') {
      pRect(ctx, sx + 4, p.y + 10, 12, 20, '#334155');
      pRect(ctx, sx + 1, p.y + 8, 18, 4, '#64748b');
      if (p.activated) {
        const flick = Math.round(Math.sin(time * 10) * 1.5);
        pRect(ctx, sx + 6, p.y + flick, 8, 8, '#38bdf8');
        pRect(ctx, sx + 8, p.y + 2 + flick, 4, 5, '#e0f2fe');
      } else {
        pRect(ctx, sx + 6, p.y + 4, 8, 4, '#1e293b');
      }
    } else if (p.kind === 'escape_gate') {
      pRect(ctx, sx, p.y, p.w, p.h, '#f59e0b');
      pRect(ctx, sx + 4, p.y + 4, p.w - 8, p.h - 4, '#fef08a');
    }
  }
}

export function drawWarrior(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  facing: 1 | -1,
  squashX: number,
  squashY: number,
  walkCycle: number,
  idleTimer: number,
  attackPhase: PlayerState['attackPhase'],
  weaponId: WeaponId,
  comboStep: number,
  parryActive: boolean,
  hitFlash: number,
  camX: number,
  isPeer = false,
  peerColor = '#60a5fa',
  peerName?: string,
) {
  const sx = Math.round(x - camX);
  const sy = Math.round(y);
  if (sx < -44 || sx > PIXEL_W + 44) return;

  ctx.save();
  ctx.translate(sx + 8, sy + 26);
  ctx.scale(facing * squashX, squashY);

  // Expressive multi-stage anime idle animation & quirky poses!
  const breath = Math.round(Math.sin(idleTimer * 4) * 1);
  const stride = Math.round(Math.sin(walkCycle) * 2.5);
  const cloakWave1 = Math.round(Math.sin(idleTimer * 4.5 + walkCycle) * 1.6);
  const cloakWave2 = Math.round(Math.sin(idleTimer * 4.5 + walkCycle - 0.9) * 2.4);

  // Quirky anime pose cycle when standing idle > 2.5s
  const quirkCycle = idleTimer > 2.5 ? (idleTimer - 2.5) % 6 : 0;
  const isAnimePose = quirkCycle > 3.6 && quirkCycle < 5.0 && attackPhase === 'none';

  const armorHi = hitFlash > 0 ? '#ffffff' : isPeer ? '#cbd5e1' : '#f8fafc';
  const armorMain = hitFlash > 0 ? '#ffffff' : isPeer ? '#94a3b8' : '#cbd5e1';
  const armorMid = hitFlash > 0 ? '#ffffff' : '#64748b';
  const armorDark = hitFlash > 0 ? '#ffffff' : '#334155';
  const capeColor = hitFlash > 0 ? '#ffffff' : isPeer ? peerColor : '#be123c';
  const capeShadow = hitFlash > 0 ? '#ffffff' : '#7f1d1d';
  const plumeColor = isPeer ? peerColor : '#fbbf24';

  // Multi-segment billowing anime scarf/cape with 1px ink trim & gold hem
  pRect(ctx, -12 - cloakWave1, -21 + breath, 9, 12, '#090609');
  pRect(ctx, -11 - cloakWave1, -20 + breath, 7, 10, capeColor);
  pRect(ctx, -15 - cloakWave2, -13 + breath, 7, 9, '#090609');
  pRect(ctx, -14 - cloakWave2, -12 + breath, 6, 7, capeShadow);
  pRect(ctx, -13 - cloakWave2, -13 + breath, 4, 5, capeColor);
  pRect(ctx, -14 - cloakWave2, -6 + breath, 5, 1, '#f59e0b');

  // Crisp 1px pixel silhouette outline
  pRect(ctx, -7, -29 + breath, 14, 24, '#090609');

  // Hip leather scabbard behind back
  pRect(ctx, -9, -12 + breath, 3, 9, '#78350f');
  pRect(ctx, -9, -12 + breath, 3, 2, '#fbbf24');

  // Articulated greaves, brass knee-cops & pointed steel-toe sabatons
  pRect(ctx, -5 + stride, -8, 4, 8, armorDark);
  pRect(ctx, -4 + stride, -7, 2, 4, armorMid);
  pRect(ctx, -5 + stride, -6, 3, 2, '#d97706');
  pRect(ctx, 1 - stride, -8, 4, 8, armorMain);
  pRect(ctx, 2 - stride, -7, 3, 2, armorHi);
  pRect(ctx, 1 - stride, -6, 3, 2, '#fbbf24'); // Knee glint
  pRect(ctx, 1 - stride, -3, 6, 3, '#1e293b');
  pRect(ctx, 4 - stride, -2, 3, 1, armorHi); // Sabaton toe cap

  // Sculpted knight cuirass, diagonal leather baldric + 2-lame pauldron + royal belt
  pRect(ctx, -6, -19 + breath, 12, 12, armorMain);
  pRect(ctx, -5, -18 + breath, 5, 6, armorHi);
  pRect(ctx, 0, -18 + breath, 5, 7, armorMid);
  pRect(ctx, -4, -18 + breath, 2, 2, '#78350f'); // Diagonal leather strap
  pRect(ctx, -2, -16 + breath, 2, 2, '#78350f');
  pRect(ctx, 0, -14 + breath, 2, 2, '#78350f');
  pRect(ctx, -2, -16 + breath, 2, 2, '#fbbf24'); // Chest clasp
  pRect(ctx, -7, -20 + breath, 6, 5, '#d97706'); // Layered pauldron
  pRect(ctx, -6, -20 + breath, 4, 2, '#fde047');
  pRect(ctx, -6, -17 + breath, 5, 1, '#94a3b8');
  pRect(ctx, -6, -10 + breath, 12, 2, '#b45309');
  pRect(ctx, -1, -10 + breath, 3, 2, '#fef08a');

  // Visored Armet helm with gold fillet, breathing slots, eye gleam & sweeping plume
  pRect(ctx, -6, -28 + breath, 12, 9, armorMain);
  pRect(ctx, -5, -28 + breath, 9, 2, armorHi);
  pRect(ctx, -6, -26 + breath, 12, 1, '#d97706'); // Crown band
  pRect(ctx, -5, -26 + breath, 2, 7, armorMid);
  pRect(ctx, -1, -24 + breath, 7, 3, '#0f172a'); // Dark visor slit
  pRect(ctx, 1, -23 + breath, 3, 2, isAnimePose ? '#fef08a' : '#38bdf8');
  pRect(ctx, 2, -23 + breath, 1, 1, '#ffffff');
  pRect(ctx, 2, -20 + breath, 1, 1, '#090609'); // Breathing grille slot
  pRect(ctx, 4, -20 + breath, 1, 1, '#090609');
  pRect(ctx, -5, -33 + breath, 8, 5, '#090609');
  pRect(ctx, -4, -32 + breath, 6, 4, plumeColor); // Sweeping plume crest
  pRect(ctx, -9 - Math.round(cloakWave1 * 0.5), -31 + breath, 6, 3, '#f59e0b');

  // Detailed 5-style sword blades & multi-layered anime slash arc
  const weapon = WEAPONS[weaponId];
  if (attackPhase === 'active') {
    const slashY = -27 + (comboStep % 2) * 5;
    if (weaponId === 'crescent') {
      // Twin crescent cross-slash
      ctx.fillStyle = weapon.accentColor;
      ctx.fillRect(5, slashY - 4, weapon.range, 6);
      ctx.fillRect(-weapon.range * 0.55, slashY + 4, weapon.range * 0.65, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(8, slashY - 2, weapon.range - 6, 2);
    } else if (weaponId === 'rapier') {
      // Needle multi-thrust streaks
      ctx.fillStyle = weapon.accentColor;
      ctx.fillRect(6, slashY + 1, weapon.range + 4, 3);
      ctx.fillRect(10, slashY - 4, weapon.range - 4, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(8, slashY + 2, weapon.range, 1);
    } else if (weaponId === 'katana') {
      // Razor Iaido horizontal flash arc
      ctx.fillStyle = weapon.accentColor;
      ctx.fillRect(4, slashY - 1, weapon.range + 6, 7);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(6, slashY + 1, weapon.range + 2, 2);
    } else {
      ctx.fillStyle = weapon.accentColor;
      ctx.fillRect(5, slashY, weapon.range - 2, 9);
      ctx.fillStyle = weapon.color;
      ctx.fillRect(7, slashY + 2, weapon.range - 6, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(10, slashY + 3, weapon.range - 14, 2);
    }
  } else if (attackPhase === 'windup') {
    pRect(ctx, -10, -26 + breath, 4, 16, weapon.color);
    pRect(ctx, -9, -25 + breath, 1, 13, '#ffffff');
    pRect(ctx, -11, -13 + breath, 6, 2, weapon.accentColor);
  } else if (isAnimePose) {
    pRect(ctx, 4, -27 + breath, 3, 19, weapon.color);
    pRect(ctx, 5, -26 + breath, 1, 16, '#ffffff');
    pRect(ctx, 2, -13 + breath, 7, 2, weapon.accentColor);
    const sparkY = -25 + Math.round(((quirkCycle - 3.6) / 1.4) * 14);
    drawPixelSparkle(ctx, 5, sparkY, 2, '#fef08a');
  } else {
    if (weaponId === 'katana') {
      pRect(ctx, 4, -21 + breath, 2, 15, weapon.color);
      pRect(ctx, 5, -23 + breath, 2, 4, '#ffffff');
      pRect(ctx, 3, -12 + breath, 5, 2, '#fbbf24');
    } else if (weaponId === 'crescent') {
      pRect(ctx, 4, -21 + breath, 2, 15, weapon.color);
      pRect(ctx, 6, -22 + breath, 3, 6, '#ffffff');
      pRect(ctx, 3, -12 + breath, 5, 2, weapon.accentColor);
    } else {
      pRect(ctx, 4, -20 + breath, 3, 14, weapon.color);
      pRect(ctx, 5, -19 + breath, 1, 11, '#ffffff');
      pRect(ctx, 3, -12 + breath, 5, 2, weapon.accentColor);
    }
    if (idleTimer > 1 && Math.floor(idleTimer * 2) % 6 === 0) {
      drawPixelSparkle(ctx, 5, -16 + breath, 1, '#ffffff');
    }
  }

  if (parryActive) {
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.strokeRect(-10, -31, 20, 32);
  }

  ctx.restore();

  if (!isPeer && isAnimePose && Math.floor(idleTimer * 3) % 2 === 0) {
    drawPixelSparkle(ctx, sx + 14, sy - 6, 2, '#fde047');
  }

  if (isPeer && peerName) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(peerName, sx + 8, sy - 7);
  }
}

export function drawEnemy(
  ctx: CanvasRenderingContext2D,
  enemy: EnemyState,
  camX: number,
  time: number,
  frozen: boolean,
) {
  const sx = Math.round(enemy.x - camX);
  const sy = Math.round(enemy.y);
  if (sx < -40 || sx > PIXEL_W + 40) return;

  ctx.save();
  ctx.translate(sx + enemy.w / 2, sy + enemy.h);
  if (enemy.state === 'ko') {
    ctx.globalAlpha = Math.max(0, enemy.koTimer / 0.32);
    ctx.rotate(enemy.facing * 0.9);
  }
  ctx.scale(enemy.facing, 1);

  const flash = enemy.hitFlash > 0;
  const windupPulse = enemy.state === 'windup' && Math.floor(time * 20) % 2 === 0;
  const idleBob = Math.round(Math.sin(time * 4 + enemy.patrolOriginX) * 1);
  const stride = Math.round(Math.sin(time * 9 + enemy.patrolOriginX) * (Math.abs(enemy.vx) > 8 ? 2 : 0));

  if (enemy.archetype === 'skeleton_guard') {
    const col = flash ? '#ffffff' : windupPulse ? '#fca5a5' : '#e2e8f0';
    const boneSh = flash ? '#ffffff' : '#94a3b8';
    const ink = '#09060b';
    pRect(ctx, -5, -28 + idleBob, 10, 9, ink);
    pRect(ctx, -6, -19 + idleBob, 12, 11, ink);
    pRect(ctx, -4, -29 + idleBob, 8, 3, '#475569');
    pRect(ctx, -6, -31 + idleBob, 2, 3, '#cbd5e1');
    pRect(ctx, 4, -31 + idleBob, 2, 3, '#cbd5e1');
    pRect(ctx, -4, -26 + idleBob, 8, 6, col);
    pRect(ctx, 1, -24 + idleBob, 2, 2, '#ef4444'); // Glowing eye socket
    pRect(ctx, 3, -22 + idleBob, 1, 1, '#09060b'); // Nasal cavity
    const jaw = Math.floor(time * 4 + enemy.patrolOriginX) % 4 === 0 ? 1 : 0;
    pRect(ctx, -3, -20 + idleBob + jaw, 6, 2, boneSh);
    pRect(ctx, -1, -20 + idleBob + jaw, 1, 2, ink); // Teeth gaps
    pRect(ctx, 1, -20 + idleBob + jaw, 1, 2, ink);
    // Ribcage slats + spine + tattered crimson cape
    pRect(ctx, -7, -19 + idleBob, 3, 12, '#7f1d1d');
    pRect(ctx, -4, -18 + idleBob, 8, 9, '#1e293b');
    pRect(ctx, -3, -17 + idleBob, 6, 2, col);
    pRect(ctx, -3, -14 + idleBob, 6, 2, col);
    pRect(ctx, -2, -11 + idleBob, 4, 2, boneSh);
    // Striding bone legs & sabatons
    pRect(ctx, -5 + stride, -8, 3, 8, boneSh);
    pRect(ctx, 2 - stride, -8, 3, 8, boneSh);
    pRect(ctx, -5 + stride, -3, 4, 3, '#334155');
    pRect(ctx, 2 - stride, -3, 4, 3, '#334155');
    // Kite Shield with cross emblem + Halberd/Spear
    pRect(ctx, 4, -20 + idleBob, 5, 11, '#b45309');
    pRect(ctx, 5, -19 + idleBob, 3, 8, '#fbbf24');
    pRect(ctx, 6, -18 + idleBob, 1, 6, '#991b1b');
    pRect(ctx, 5, -9 + idleBob, 3, 3, '#92400e');
    if (enemy.state === 'windup' || enemy.state === 'attack') {
      pRect(ctx, 6, -16, 17, 2, '#e2e8f0');
      pRect(ctx, 20, -19, 4, 7, '#f87171');
    }
  } else if (enemy.archetype === 'shadow_bat') {
    const flap = Math.round(Math.sin(time * 16) * 3);
    const col = flash ? '#ffffff' : windupPulse ? '#f87171' : '#7c3aed';
    pRect(ctx, -4, -11, 8, 8, '#09060b');
    pRect(ctx, -3, -10, 6, 6, col);
    pRect(ctx, -3, -14, 2, 4, '#a78bfa');
    pRect(ctx, 1, -14, 2, 4, '#a78bfa');
    // Multi-jointed scalloped bat wing struts + membranes
    pRect(ctx, -12, -13 + flap, 8, 2, '#a78bfa');
    pRect(ctx, -11, -11 + flap, 7, 3, '#4c1d95');
    pRect(ctx, -14, -9 + flap, 4, 3, '#2e1065');
    pRect(ctx, 4, -13 + flap, 8, 2, '#a78bfa');
    pRect(ctx, 4, -11 + flap, 7, 3, '#4c1d95');
    pRect(ctx, 10, -9 + flap, 4, 3, '#2e1065');
    pRect(ctx, 1, -8, 2, 2, '#fde047'); // Glowing eye
    pRect(ctx, 0, -5, 1, 2, '#ffffff'); // Vampire fangs
    pRect(ctx, 2, -5, 1, 2, '#ffffff');
  } else if (enemy.archetype === 'cultist_mage') {
    const col = flash ? '#ffffff' : windupPulse ? '#fde047' : '#881337';
    // Flowing tapered cultist robe, gold stole & pointed cowl
    pRect(ctx, -8, -12 + idleBob, 16, 12, '#09060b');
    pRect(ctx, -7, -21 + idleBob, 14, 21, col);
    pRect(ctx, -4, -20 + idleBob, 4, 18, '#be123c');
    pRect(ctx, 0, -19 + idleBob, 2, 16, '#fbbf24'); // Ceremonial gold stole
    pRect(ctx, -6, -30 + idleBob, 12, 10, '#4c0519');
    pRect(ctx, -3, -34 + idleBob, 5, 5, '#4c0519'); // Pointed cowl peak
    pRect(ctx, -2, -26 + idleBob, 6, 5, '#09060b'); // Shadowed face
    pRect(ctx, 1, -24 + idleBob, 2, 2, '#34d399');
    pRect(ctx, 7, -26 + idleBob, 2, 26, '#d97706');
    pRect(ctx, 6, -31 + idleBob, 4, 5, enemy.state === 'windup' ? '#fef08a' : '#38bdf8');
    const orbX = Math.round(Math.cos(time * 4) * 6);
    const orbY = Math.round(Math.sin(time * 4) * 3) - 30 + idleBob;
    pRect(ctx, 7 + orbX, orbY, 2, 2, '#67e8f9');
  } else if (enemy.archetype === 'cursed_armor') {
    // Towering Haunted Living Armor with Sallet Helm, Tower Shield & Zweihander!
    const armCol = flash ? '#ffffff' : windupPulse ? '#fde047' : '#64748b';
    const trimCol = flash ? '#ffffff' : '#f59e0b';
    pRect(ctx, -9, -31 + idleBob, 18, 25, '#09060b');
    pRect(ctx, -8, -22 + idleBob, 16, 14, armCol);
    pRect(ctx, -6, -21 + idleBob, 8, 9, '#94a3b8');
    pRect(ctx, -3, -18 + idleBob, 4, 5, '#7e22ce'); // Haunted chest sigil
    // Layered Pauldrons & Articulated Greaves
    pRect(ctx, -11, -23 + idleBob, 5, 6, trimCol);
    pRect(ctx, 6, -23 + idleBob, 5, 6, trimCol);
    pRect(ctx, -6 + stride, -8, 5, 8, '#334155');
    pRect(ctx, 2 - stride, -8, 5, 8, '#475569');
    // Horned Armet / Sallet Helm with glowing spectral visor slit
    pRect(ctx, -6, -30 + idleBob, 12, 9, '#94a3b8');
    pRect(ctx, -8, -33 + idleBob, 2, 4, '#cbd5e1');
    pRect(ctx, 6, -33 + idleBob, 2, 4, '#cbd5e1');
    pRect(ctx, -2, -26 + idleBob, 7, 3, '#09060b');
    pRect(ctx, 1, -25 + idleBob, 3, 2, '#a855f7');
    // Tower Shield + Zweihander
    pRect(ctx, 6, -21 + idleBob, 5, 14, '#1e293b');
    pRect(ctx, 7, -20 + idleBob, 3, 12, trimCol);
    if (enemy.state === 'windup' || enemy.state === 'attack') {
      pRect(ctx, 5, -28 + idleBob, 19, 4, '#e2e8f0');
      pRect(ctx, 8, -27 + idleBob, 14, 1, '#c084fc');
    } else {
      pRect(ctx, -10, -29 + idleBob, 3, 19, '#cbd5e1');
    }
  } else if (enemy.archetype === 'phantom_wisp') {
    // Floating Candlelight Wraith Specter with Skull Mask & Spirit Crown Flame
    const hover = Math.round(Math.sin(time * 5 + enemy.patrolOriginX) * 3);
    const bodyCol = flash ? '#ffffff' : windupPulse ? '#fef08a' : '#38bdf8';
    const tailSway = Math.round(Math.sin(time * 8 + enemy.patrolOriginX) * 2);
    // Ghostly tattered shroud + drifting ethereal tail
    pRect(ctx, -6, -22 + hover, 12, 14, '#09060b');
    pRect(ctx, -5, -21 + hover, 10, 12, bodyCol);
    pRect(ctx, -4 + tailSway, -9 + hover, 8, 5, '#0284c7');
    pRect(ctx, -2 + tailSway * 2, -4 + hover, 4, 4, '#bae6fd');
    // Spectral skull face + flickering candle-crown flame
    pRect(ctx, -4, -27 + hover, 8, 7, '#f8fafc');
    pRect(ctx, -2, -25 + hover, 2, 2, '#09060b');
    pRect(ctx, 2, -25 + hover, 2, 2, '#09060b');
    pRect(ctx, 2, -25 + hover, 1, 1, '#fde047');
    pRect(ctx, -1, -32 + hover, 2, 5, '#f97316');
    pRect(ctx, -1, -34 + hover, 2, 3, '#fef08a');
  } else {
    const col = flash ? '#ffffff' : windupPulse ? '#fb923c' : '#57534e';
    const wingLift = enemy.state === 'attack' || enemy.state === 'windup' ? -4 : 0;
    // Stone Gargoyle with sculpted feathered wings, magma chest crack & curved horns
    pRect(ctx, -9, -24 + idleBob, 18, 17, '#09060b');
    pRect(ctx, -8, -23 + idleBob, 16, 15, col);
    pRect(ctx, -5, -22 + idleBob, 10, 6, '#78716c');
    pRect(ctx, -1, -17 + idleBob, 3, 5, '#f97316'); // Magma chest crack
    pRect(ctx, -14, -31 + idleBob + wingLift, 7, 12, '#44403c');
    pRect(ctx, -17, -33 + idleBob + wingLift, 4, 7, '#292524');
    pRect(ctx, -6, -30 + idleBob, 3, 7, '#a8a29e');
    pRect(ctx, 3, -30 + idleBob, 3, 7, '#a8a29e');
    pRect(ctx, 2, -21 + idleBob, 3, 2, '#ef4444');
    pRect(ctx, 3, -18 + idleBob, 1, 2, '#e2e8f0'); // Stone fang
    pRect(ctx, -6, -7, 5, 7, '#292524');
    pRect(ctx, 2, -7, 5, 7, '#292524');
  }

  if (frozen) {
    ctx.strokeStyle = '#34d399';
    ctx.strokeRect(-10, -30, 20, 30);
  }
  ctx.restore();

  if (enemy.hp < enemy.maxHp && enemy.state !== 'ko') {
    pRect(ctx, sx, sy - 6, enemy.w, 3, '#0f172a');
    pRect(ctx, sx, sy - 6, (enemy.hp / enemy.maxHp) * enemy.w, 3, '#ef4444');
  }
}

export function drawJoJoBoss(
  ctx: CanvasRenderingContext2D,
  boss: ActiveBoss,
  camX: number,
  time: number,
  frozen: boolean,
  overrideScale?: number,
) {
  const sx = Math.round(boss.x - camX);
  const sy = Math.round(boss.y);
  if (sx < -140 || sx > PIXEL_W + 140) return;

  const def = boss.def;
  const poseKey: 'idle' | 'windup' | 'attack' | 'ko' =
    boss.state === 'attack'
      ? 'attack'
      : boss.state === 'windup'
        ? 'windup'
        : boss.state === 'ko'
          ? 'ko'
          : 'idle';
  const isBattle = Boolean(overrideScale && overrideScale > 1.7);
  const sprite = getBakedJoJoBossSprite(def, poseKey, isBattle);
  const floatBob = poseKey === 'ko' ? 0 : Math.round(Math.sin(time * 3.5 + boss.posePhase) * 2);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (boss.hitFlash > 0) {
    ctx.filter = 'brightness(2.2) contrast(1.4)';
  }

  if (isBattle) {
    // Native 116x116 1:1 CPS3 sprite (boots at y=110) aligned flush onto Pokemon Battle Dais
    ctx.drawImage(sprite, Math.round(sx - 34), Math.round(sy - 78 + floatBob));
  } else {
    // Corridor Boss: 62x64 crisp native sprite (boots at y=61) facing player cleanly
    ctx.translate(sx + 12, sy + 36);
    ctx.scale(-boss.facing, 1);
    ctx.drawImage(sprite, -24, -61 + floatBob);
  }
  ctx.restore();

  // Floating Anime Menacing Katakana SFX (ゴゴゴ / ドドド)
  ctx.save();
  ctx.fillStyle = def.auraColor;
  ctx.font = 'bold 9px monospace';
  const g1Y = sy - 38 + Math.sin(time * 5) * 3;
  const g2Y = sy - 20 + Math.cos(time * 4) * 3;
  const g3Y = sy - 54 + Math.sin(time * 3.5 + 1) * 2;
  ctx.fillText('ゴ', sx - 24, g1Y);
  ctx.fillText('ゴ', sx + 48, g2Y);
  ctx.fillText(poseKey === 'attack' ? 'ド' : 'ゴ', sx + 12, g3Y);

  if (frozen) {
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(sx - 18, sy - 42, 68, 82);
  }
  ctx.restore();
}

export function drawProjectiles(
  ctx: CanvasRenderingContext2D,
  projectiles: Projectile[],
  camX: number,
) {
  for (const pr of projectiles) {
    const sx = Math.round(pr.x - camX);
    const sy = Math.round(pr.y);
    if (sx < -20 || sx > PIXEL_W + 20) continue;

    if (pr.kind === 'knife') {
      pRect(ctx, sx - 6, sy - 1, 12, 2, '#e2e8f0');
      pRect(ctx, sx - 6, sy - 2, 3, 4, '#f59e0b');
    } else if (pr.kind === 'slash_wave') {
      pRect(ctx, sx - 5, sy - 11, 10, 22, pr.color);
      pRect(ctx, sx - 2, sy - 9, 4, 18, '#ffffff');
    } else {
      ctx.fillStyle = pr.color;
      ctx.beginPath();
      ctx.arc(sx, sy, pr.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx - 1, sy - 1, 2, 2);
    }
  }
}

export function drawPeer(
  ctx: CanvasRenderingContext2D,
  peer: MultiplayerPeer,
  camX: number,
  time: number,
) {
  drawWarrior(
    ctx,
    peer.x,
    peer.y,
    peer.facing,
    1,
    1,
    peer.anim === 'run' ? time * 12 : 0,
    time,
    peer.anim === 'attack' ? 'active' : 'none',
    (peer.weaponId as WeaponId) in WEAPONS ? (peer.weaponId as WeaponId) : 'claymore',
    1,
    false,
    0,
    camX,
    true,
    peer.color,
    peer.name,
  );
}

function drawBattleSlashFx(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  fx: BossBattleSlashFx,
) {
  const p = Math.max(0, Math.min(1, fx.progress));
  const alpha = p < 0.7 ? 1 : Math.max(0, (1 - p) / 0.3);
  ctx.save();
  ctx.globalAlpha = alpha;

  const drawDiagSlash = (ox: number, oy: number, dir: 1 | -1, sweepProg: number, len = 54) => {
    const t = Math.max(0, Math.min(1, sweepProg));
    const x1 = cx + ox - dir * (len * 0.5);
    const y1 = cy + oy - len * 0.45;
    const x2 = x1 + dir * len * t;
    const y2 = y1 + len * 0.9 * t;

    ctx.strokeStyle = fx.color;
    ctx.lineWidth = 6;
    ctx.lineCap = 'square';
    ctx.beginPath();
    ctx.moveTo(Math.round(x1), Math.round(y1));
    ctx.lineTo(Math.round(x2), Math.round(y2));
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(Math.round(x1), Math.round(y1));
    ctx.lineTo(Math.round(x2), Math.round(y2));
    ctx.stroke();

    if (t > 0.1 && t < 0.95) {
      drawPixelSparkle(ctx, Math.round(x2), Math.round(y2), 4, fx.accentColor);
    }
  };

  if (fx.style === 'sword') {
    drawDiagSlash(0, 0, 1, Math.min(1, p * 1.6), 62);
  } else if (fx.style === 'cross') {
    drawDiagSlash(-4, -2, 1, Math.min(1, p * 1.9), 58);
    if (p > 0.22) {
      drawDiagSlash(4, 2, -1, Math.min(1, (p - 0.22) * 1.9), 58);
    }
  } else if (fx.style === 'barrage') {
    const offsets: [number, number, 1 | -1][] = [
      [-16, -14, 1],
      [12, -10, -1],
      [-8, 6, 1],
      [16, 12, -1],
      [0, -2, 1],
    ];
    offsets.forEach(([ox, oy, dir], i) => {
      const start = i * 0.12;
      if (p > start) {
        drawDiagSlash(ox, oy, dir, Math.min(1, (p - start) * 2.4), 42);
      }
    });
  } else if (fx.style === 'knife_volley') {
    [-16, -6, 4, 14].forEach((oy, idx) => {
      const start = idx * 0.1;
      if (p > start) {
        const t = Math.min(1, (p - start) * 2.2);
        const kx = cx + 38 - t * 68;
        pRect(ctx, kx, cy + oy, 14, 2, '#e2e8f0');
        pRect(ctx, kx + 10, cy + oy - 1, 4, 4, fx.color);
      }
    });
  } else if (fx.style === 'lightning') {
    drawDiagSlash(-6, -4, -1, Math.min(1, p * 2.2), 62);
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - 42);
    ctx.lineTo(cx + 8, cy - 12);
    ctx.lineTo(cx - 10, cy + 4);
    ctx.lineTo(cx + 12, cy + 28);
    ctx.stroke();
  } else if (fx.style === 'seismic') {
    const shockW = Math.round(p * 74);
    pRect(ctx, cx - shockW / 2, cy + 16, shockW, 6, fx.color);
    pRect(ctx, cx - shockW / 3, cy + 12, (shockW * 2) / 3, 4, '#ffffff');
    drawDiagSlash(0, 0, -1, Math.min(1, p * 1.8), 54);
  } else if (fx.style === 'void_crush') {
    const r = Math.max(4, Math.round((1 - p) * 32));
    ctx.strokeStyle = fx.color;
    ctx.lineWidth = 3;
    ctx.strokeRect(cx - r, cy - r, r * 2, r * 2);
    drawDiagSlash(0, 0, -1, Math.min(1, p * 1.7), 52);
  } else if (fx.style === 'fire' || fx.style === 'solar') {
    drawDiagSlash(0, 0, 1, Math.min(1, p * 1.7), 64);
    drawDiagSlash(0, -4, -1, Math.min(1, p * 1.5), 48);
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + p * 3;
      const r = 10 + p * 34;
      pRect(
        ctx,
        cx + Math.cos(ang) * r,
        cy + Math.sin(ang) * r,
        3,
        3,
        i % 2 === 0 ? fx.color : '#fef08a',
      );
    }
  } else {
    [-12, 0, 12].forEach((offset, idx) => {
      const start = idx * 0.1;
      if (p > start) {
        drawDiagSlash(offset, offset * 0.35, -1, Math.min(1, (p - start) * 2.0), 54);
      }
    });
  }

  ctx.restore();
}

export function drawPokemonBossStage(
  ctx: CanvasRenderingContext2D,
  biome: BiomeId,
  boss: ActiveBoss,
  player: PlayerState,
  phase: BossBattlePhase,
  phaseProgress: number,
  slashFx: BossBattleSlashFx | null,
  guardActive: boolean,
  frozenTurns: number,
  time: number,
) {
  const def = boss.def;
  // 1. Unique Per-Boss Climate Sky (cached offscreen per boss index)
  const battleSky = getSkyBackdrop(`battle_boss_${def.index}`, [
    [0, def.climateSkyTop],
    [0.6, def.climateSkyBottom],
    [1, '#090609'],
  ]);
  ctx.drawImage(battleSky, 0, 0, PIXEL_W, PIXEL_H);

  // Layer baked Castlevania / Ruin / Volcano architecture subtly tinted into the climate sky
  ctx.save();
  ctx.globalAlpha = 0.42;
  const wallStrip = getBakedBiomeWall(biome);
  ctx.drawImage(wallStrip, 112, 0);
  ctx.drawImage(wallStrip, -144, 0);
  ctx.drawImage(wallStrip, 368, 0);
  ctx.restore();

  // Climate-specific celestial & atmospheric effects (cached offscreen circular pixel Blood Moon / Eclipse!)
  if (def.climate === 'blood_moon_ash' || def.climate === 'arcane_eclipse') {
    const stampKey = def.climate === 'blood_moon_ash' ? 'blood_moon_stamp' : 'eclipse_moon_stamp';
    if (!skyBackdropCache[stampKey]) {
      const mc = document.createElement('canvas');
      mc.width = 60;
      mc.height = 60;
      const mctx = mc.getContext('2d');
      if (mctx) {
        const isBlood = def.climate === 'blood_moon_ash';
        mctx.fillStyle = isBlood ? 'rgba(225, 29, 72, 0.22)' : 'rgba(139, 92, 246, 0.26)';
        mctx.beginPath();
        mctx.arc(30, 30, 29, 0, Math.PI * 2);
        mctx.fill();
        for (let my = -22; my <= 22; my++) {
          for (let mx = -22; mx <= 22; mx++) {
            const d2 = mx * mx + my * my;
            if (d2 <= 484) {
              if (isBlood) {
                const crater =
                  (mx + 6) * (mx + 6) + (my + 4) * (my + 4) < 36 ||
                  (mx - 8) * (mx - 8) + (my - 7) * (my - 7) < 25;
                mctx.fillStyle =
                  d2 > 400 ? '#881337' : crater ? '#be123c' : mx < -6 ? '#fb7185' : '#e11d48';
              } else {
                mctx.fillStyle = d2 > 360 ? '#a78bfa' : '#09060b';
              }
              mctx.fillRect(30 + mx, 30 + my, 1, 1);
            }
          }
        }
      }
      skyBackdropCache[stampKey] = mc;
    }
    ctx.drawImage(skyBackdropCache[stampKey], 191, 8);
  } else if (def.climate === 'starlight_aurora') {
    ctx.fillStyle = 'rgba(45, 212, 191, 0.18)';
    ctx.fillRect(0, 22 + Math.round(Math.sin(time * 2) * 5), PIXEL_W, 18);
    ctx.fillStyle = 'rgba(167, 139, 250, 0.16)';
    ctx.fillRect(0, 44 + Math.round(Math.cos(time * 1.8) * 5), PIXEL_W, 14);
  } else if (def.climate === 'crimson_thunder' && Math.floor(time * 7) % 13 === 0) {
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(260, 0);
    ctx.lineTo(246, 54);
    ctx.lineTo(262, 92);
    ctx.stroke();
  }

  // Diagonal anime speed-streaks tinted by boss aura
  ctx.save();
  ctx.strokeStyle = def.auraColor;
  ctx.globalAlpha = phase === 'enemy_anim' || phase === 'player_anim' ? 0.35 : 0.14;
  ctx.lineWidth = 2;
  for (let i = -2; i < 14; i++) {
    const sx = ((i * 62 - time * 110) % (PIXEL_W + 140)) - 40;
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx - 68, 200);
    ctx.stroke();
  }
  ctx.restore();

  // Unique Climate Weather Particles
  const isFallingClimate =
    def.climate === 'blizzard_frost' ||
    def.climate === 'emerald_monsoon' ||
    def.climate === 'obsidian_sandstorm' ||
    def.climate === 'crimson_thunder';
  for (let i = 0; i < 28; i++) {
    const mx =
      (i * 41 +
        (def.climate === 'obsidian_sandstorm' ? time * 95 : Math.sin(time * 1.8 + i) * 18)) %
      PIXEL_W;
    const rawY = (time * (isFallingClimate ? 58 + (i % 4) * 14 : 18 + (i % 4) * 6) + i * 29) % PIXEL_H;
    const my = isFallingClimate ? rawY : PIXEL_H - rawY;
    ctx.fillStyle = def.climateParticleColor;
    ctx.globalAlpha = 0.72;
    if (def.climate === 'emerald_monsoon') {
      ctx.fillRect(Math.round(mx), Math.round(my), 1, 5);
    } else {
      ctx.fillRect(Math.round(mx), Math.round(my), i % 3 === 0 ? 2 : 1, i % 3 === 0 ? 2 : 1);
    }
  }
  ctx.globalAlpha = 1;

  // 2. Detailed Multi-Tiered Pokemon Battle Pedestals with Beveled Rim & Carpet/Rune Trim
  const bossSlideX = phase === 'intro' ? (1 - Math.min(1, phaseProgress * 1.4)) * 130 : 0;
  const bossDaisX = 342 + bossSlideX;
  const bossDaisY = 148;
  pRect(ctx, bossDaisX - 82, bossDaisY, 164, 20, '#0c0609');
  pRect(ctx, bossDaisX - 78, bossDaisY + 2, 156, 14, '#291a22');
  pRect(ctx, bossDaisX - 74, bossDaisY + 3, 148, 5, '#472f3b');
  pRect(ctx, bossDaisX - 70, bossDaisY + 2, 140, 2, def.auraColor);

  const playerSlideX = phase === 'intro' ? -(1 - Math.min(1, phaseProgress * 1.4)) * 120 : 0;
  const playerDaisX = 124 + playerSlideX;
  const playerDaisY = 194;
  pRect(ctx, playerDaisX - 68, playerDaisY, 136, 18, '#0c0609');
  pRect(ctx, playerDaisX - 64, playerDaisY + 2, 128, 12, '#6b1420');
  pRect(ctx, playerDaisX - 60, playerDaisY + 3, 120, 4, '#9f1239');
  pRect(ctx, playerDaisX - 58, playerDaisY + 2, 116, 2, '#fbbf24');

  // 3. Draw Crisp 1:1 Native Pixel JoJo Boss + Stand Spirit on Top-Right Dais
  const bossLunge =
    phase === 'enemy_anim' && slashFx
      ? Math.sin(Math.min(1, phaseProgress) * Math.PI) * -28
      : 0;
  const bossHitJitter =
    phase === 'player_anim' && slashFx && slashFx.progress > 0.2 && slashFx.progress < 0.75
      ? Math.round(Math.sin(time * 65) * 4)
      : 0;

  const bossStageScale = Number((def.scaleFactor * 1.55).toFixed(2));
  const pseudoBoss: ActiveBoss = {
    ...boss,
    x: bossDaisX + bossLunge + bossHitJitter - 12,
    y: bossDaisY - 32,
    facing: -1,
    state:
      phase === 'victory'
        ? 'ko'
        : phase === 'enemy_anim'
          ? 'attack'
          : 'idle',
    stateTimer: phase === 'victory' ? Math.max(0, 0.65 * (1 - phaseProgress)) : 0.5,
    hitFlash: phase === 'player_anim' && slashFx && slashFx.progress > 0.2 && slashFx.progress < 0.65 ? 0.1 : 0,
  };
  drawJoJoBoss(ctx, pseudoBoss, 0, time, frozenTurns > 0, bossStageScale);

  // 4. Draw Crisp 1:1 Native CPS3 Warrior Battle Sprite on Bottom-Left Dais
  const playerLunge =
    phase === 'player_anim' && slashFx
      ? Math.sin(Math.min(1, phaseProgress) * Math.PI) * 34
      : 0;
  const playerRunOff =
    phase === 'run_anim' || phase === 'escape_anim' ? -phaseProgress * 120 : 0;
  const playerHitJitter =
    phase === 'enemy_anim' && slashFx && slashFx.progress > 0.25 && slashFx.progress < 0.75
      ? Math.round(Math.sin(time * 60) * 4)
      : 0;
  const playerIsSlashing = phase === 'player_anim' && phaseProgress < 0.6;
  const playerHurtFlash =
    phase === 'enemy_anim' && slashFx && slashFx.progress > 0.2 && slashFx.progress < 0.65;
  const warriorSprite = getBakedWarriorBattleSprite(player.equippedWeapon, playerIsSlashing);
  const warriorBob = Math.round(Math.sin(time * 4) * 1.5);
  const wx = Math.round(playerDaisX + playerLunge + playerRunOff + playerHitJitter - 28);
  const wy = Math.round(playerDaisY - 63 + warriorBob);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (playerHurtFlash) {
    ctx.filter = 'brightness(2.2) contrast(1.4)';
  }
  ctx.drawImage(warriorSprite, wx, wy);
  if (guardActive) {
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.strokeRect(wx + 8, wy + 4, 42, 56);
  }
  ctx.restore();

  // 5. Anime Super Facial Cut-In Banner when Boss Unleashes Stand Attack!
  if (phase === 'enemy_anim' && phaseProgress < 0.48) {
    const slide = Math.min(1, phaseProgress * 6);
    const barY = 74;
    const barW = Math.round(292 * slide);
    pRect(ctx, 18, barY, barW, 44, '#09060b');
    pRect(ctx, 20, barY + 2, Math.max(0, barW - 4), 40, def.climateSkyBottom);
    pRect(ctx, 20, barY + 2, Math.max(0, barW - 4), 2, def.auraColor);
    pRect(ctx, 20, barY + 40, Math.max(0, barW - 4), 2, def.auraColor);
    if (barW >= 56) {
      ctx.save();
      ctx.translate(22, barY + 2);
      drawBossPortrait(ctx, def, 'wryyy', 40);
      ctx.restore();
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(def.attackName.toUpperCase(), 68, barY + 18, 232);
      ctx.fillStyle = '#ffffff';
      ctx.font = '8px monospace';
      ctx.fillText(`"${def.battleShout}"`, 68, barY + 32, 232);
    }
  }

  // 6. Healing sparkles or Escape smoke puffs
  if (phase === 'potion_anim') {
    for (let i = 0; i < 10; i++) {
      const sy = playerDaisY - 6 - ((phaseProgress * 45 + i * 7) % 42);
      const sx = playerDaisX - 24 + ((i * 11) % 48);
      drawPixelSparkle(ctx, sx, sy, 2, i % 2 === 0 ? '#34d399' : '#fef08a');
    }
  } else if (phase === 'run_anim' || phase === 'escape_anim') {
    for (let i = 0; i < 8; i++) {
      const r = 6 + (i % 3) * 4;
      ctx.fillStyle = 'rgba(226, 232, 240, 0.55)';
      ctx.fillRect(
        Math.round(playerDaisX - 20 + i * 7),
        Math.round(playerDaisY - 12 - (i % 3) * 8 - phaseProgress * 10),
        r,
        r,
      );
    }
  }

  // 7. Slashing Fight Animation across active target!
  if (slashFx) {
    const targetX = slashFx.target === 'boss' ? bossDaisX : playerDaisX;
    const targetY = slashFx.target === 'boss' ? bossDaisY - 38 : playerDaisY - 26;
    drawBattleSlashFx(ctx, targetX, targetY, slashFx);
  }
}

