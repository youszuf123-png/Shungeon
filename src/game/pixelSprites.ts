import { WEAPONS } from './data';
import {
  drawBossPortrait,
  getBakedBiomeWall,
  getBakedFloorStrip,
  getBakedJoJoBossSprite,
  getBakedStarPlatinumSprite,
  getBakedWarriorBattleSprite,
  shadeColor,
} from './pixelArtAtlas';
import { drawCrispOverlayLabel } from './isekaiSprites';
import { DEFAULT_WARRIOR_CUSTOMIZATION } from './rules';
import type {
  ActiveBoss,
  BiomeId,
  BossBattlePhase,
  BossBattleSlashFx,
  CandleProp,
  EnemyState,
  HiddenPassage,
  InteractableProp,
  MegaCutsceneHud,
  MultiplayerPeer,
  Platform,
  PlayerState,
  Projectile,
  WarriorCustomization,
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
      // Animated volcanic caldera shimmer + dual bubbling magma falls + rising caldera sparks + cage
      const shimmer = 0.35 + 0.4 * Math.sin(time * 6.5 + i);
      ctx.fillStyle = `rgba(254, 240, 138, ${shimmer})`;
      ctx.fillRect(Math.round(wx + 118), 66 + Math.round((time * 42) % 44), 14, 16);
      ctx.fillStyle = `rgba(249, 115, 22, ${shimmer * 0.85})`;
      ctx.fillRect(Math.round(wx + 115), 110 + Math.round((time * 54) % 64), 20, 18);
      // Crater heat mirage haze along horizon
      const craterGlow = 0.14 + 0.1 * Math.sin(time * 3.5 + i);
      ctx.fillStyle = `rgba(239, 68, 68, ${craterGlow})`;
      ctx.fillRect(Math.round(wx), 40, stripW, 38);
      const cSway = Math.round(Math.sin(time * 2.1 + i) * 1);
      for (let cy = 10; cy < 82; cy += 9) {
        pRect(ctx, wx + 208 + cSway, cy, 3, 5, '#64748b');
      }
      pRect(ctx, wx + 201 + cSway, 82, 16, 22, '#291515');
      pRect(ctx, wx + 204 + cSway, 85, 4, 16, '#120505');
      pRect(ctx, wx + 210 + cSway, 85, 4, 16, '#120505');
      pRect(ctx, wx + 207 + cSway, 90, 4, 6, '#fb923c');
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
      const strip = getBakedFloorStrip(biome);
      const visLeft = Math.max(0, -sx);
      const visRight = Math.min(plat.w, PIXEL_W - sx);
      const visW = visRight - visLeft;
      if (visW > 0) {
        ctx.drawImage(
          strip,
          visLeft,
          0,
          visW,
          strip.height,
          sx + visLeft,
          plat.y - 2,
          visW,
          strip.height,
        );
        if (biome === 'volcano') {
          const lavaGlow = 0.14 + 0.14 * Math.sin(time * 4.2);
          ctx.fillStyle = `rgba(254, 240, 138, ${lavaGlow})`;
          ctx.fillRect(Math.round(sx + visLeft), plat.y + 22, visW, 4);
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
    if (sx + p.w < -40 || sx > PIXEL_W + 40) continue;

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
      if (p.id === 'chest_fire_sword_op') {
        // Infernal Crimson-Orange Pedestal Glow around the OP Fire Sword chest!
        const auraR = 22 + Math.round(Math.sin(time * 7) * 3);
        ctx.save();
        ctx.fillStyle = p.activated ? 'rgba(249,115,22,0.12)' : 'rgba(220,38,38,0.28)';
        ctx.beginPath();
        ctx.arc(sx + 10, p.y + 8, auraR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        pRect(ctx, sx - 2, p.y + 3, p.w + 4, p.h - 2, '#450a0a');
        pRect(ctx, sx, p.y + (p.activated ? 0 : 4), p.w, 6, '#dc2626');
        pRect(ctx, sx + 2, p.y + (p.activated ? 1 : 5), p.w - 4, 2, '#fb923c');
        pRect(ctx, sx + 8, p.y + 8, 4, 4, '#fde047');
      } else {
        pRect(ctx, sx, p.y + 4, p.w, p.h - 4, '#78350f');
        pRect(ctx, sx, p.y + (p.activated ? 0 : 4), p.w, 6, p.activated ? '#92400e' : '#b45309');
        pRect(ctx, sx + 8, p.y + 8, 4, 4, '#fbbf24');
      }
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
    } else if (p.kind === 'isekai_portal') {
      // Dimensional Golden Spin Isekai Portal swirling with emerald & azure energy!
      const pulse = Math.sin(time * 6) * 3;
      ctx.save();
      ctx.fillStyle = 'rgba(34, 197, 94, 0.25)';
      ctx.beginPath();
      ctx.ellipse(sx + p.w / 2, p.y + p.h / 2, p.w / 2 + 8 + pulse, p.h / 2 + 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(sx + p.w / 2, p.y + p.h / 2, p.w / 2 + 2, p.h / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(sx + p.w / 2, p.y + p.h / 2, p.w / 3, p.h / 2 - 6, time * 2, 0, Math.PI * 2);
      ctx.stroke();
      pRect(ctx, sx + p.w / 2 - 4, p.y + p.h / 2 - 6, 8, 12, '#fef08a');
      ctx.restore();
    } else if (
      p.kind === 'guild_door' ||
      p.kind === 'wardrobe_door' ||
      p.kind === 'potion_door' ||
      p.kind === 'weapons_door' ||
      p.kind === 'town_exit_door'
    ) {
      const frameCol =
        p.kind === 'guild_door'
          ? '#b45309'
          : p.kind === 'wardrobe_door'
            ? '#db2777'
            : p.kind === 'potion_door'
              ? '#10b981'
              : p.kind === 'weapons_door'
                ? '#f59e0b'
                : '#0ea5e9';
      pRect(ctx, sx - 2, p.y - 2, p.w + 4, p.h + 2, '#1c1008');
      pRect(ctx, sx, p.y, p.w, p.h, '#451a03');
      pRect(ctx, sx + 3, p.y + 3, p.w - 6, p.h - 3, '#78350f');
      pRect(ctx, sx + 4, p.y + 6, p.w - 8, 3, frameCol);
      pRect(ctx, sx + p.w - 8, p.y + Math.floor(p.h * 0.55), 3, 3, '#fde047');
    } else if (p.kind === 'guild_bar') {
      pRect(ctx, sx, p.y + 8, p.w, p.h - 8, '#3f1d0b');
      pRect(ctx, sx - 2, p.y + 6, p.w + 4, 4, '#92400e');
      pRect(ctx, sx + 10, p.y - 2, 12, 10, '#78350f');
      pRect(ctx, sx + 10, p.y + 2, 12, 2, '#94a3b8');
      pRect(ctx, sx + 34, p.y + 1, 6, 6, '#fbbf24');
    } else if (p.kind === 'guild_reception') {
      pRect(ctx, sx, p.y + 6, p.w, p.h - 6, '#451a03');
      pRect(ctx, sx - 2, p.y + 4, p.w + 4, 4, '#b45309');
      pRect(ctx, sx + 8, p.y - 1, 14, 5, '#fef3c7');
      pRect(ctx, sx + 26, p.y - 4, 8, 8, '#38bdf8');
    } else if (p.kind === 'guild_floor2_reception') {
      pRect(ctx, sx, p.y + 6, p.w, p.h - 6, '#581c87');
      pRect(ctx, sx - 2, p.y + 4, p.w + 4, 4, '#fbbf24');
      pRect(ctx, sx + 10, p.y - 2, 16, 6, '#fef08a');
      pRect(ctx, sx + 32, p.y - 5, 10, 9, '#f43f5e');
    } else if (p.kind === 'guild_stairs') {
      // Grand Carved Oak Staircase ascending rightwards up to 2nd Floor
      pRect(ctx, sx, p.y, p.w, p.h, '#2b1206');
      for (let st = 0; st < 7; st++) {
        const syStep = p.y + p.h - (st + 1) * 11;
        const sxStep = sx + st * 8;
        pRect(ctx, sxStep, syStep, p.w - st * 8 + 12, 11, st % 2 === 0 ? '#78350f' : '#92400e');
        pRect(ctx, sxStep, syStep, 10, 2, '#fbbf24');
      }
      pRect(ctx, sx + 4, p.y + 4, 4, p.h - 4, '#b45309');
      pRect(ctx, sx + p.w - 6, p.y - 14, 4, 18, '#fbbf24');
    } else if (p.kind === 'wardrobe_counter') {
      pRect(ctx, sx, p.y + 6, p.w, p.h - 6, '#500724');
      pRect(ctx, sx - 2, p.y + 4, p.w + 4, 4, '#ec4899');
      pRect(ctx, sx + 8, p.y - 4, 12, 8, '#f472b6');
      pRect(ctx, sx + 24, p.y - 2, 10, 6, '#fbbf24');
    } else if (p.kind === 'potion_counter') {
      // Alchemist Glowing Crystal Counter
      pRect(ctx, sx, p.y + 6, p.w, p.h - 6, '#1e1b4b');
      pRect(ctx, sx - 2, p.y + 4, p.w + 4, 4, '#a855f7');
      pRect(ctx, sx + 8, p.y - 5, 8, 9, '#ef4444');
      pRect(ctx, sx + 22, p.y - 6, 8, 10, '#06b6d4');
      pRect(ctx, sx + 36, p.y - 4, 8, 8, '#a855f7');
      pRect(ctx, sx + 50, p.y - 5, 8, 9, '#10b981');
    } else if (p.kind === 'weapons_counter') {
      // Blacksmith Forge Counter & Anvil
      pRect(ctx, sx, p.y + 6, p.w, p.h - 6, '#431407');
      pRect(ctx, sx - 2, p.y + 4, p.w + 4, 4, '#f59e0b');
      pRect(ctx, sx + 12, p.y - 6, 20, 10, '#334155');
      pRect(ctx, sx + 44, p.y - 3, 18, 7, '#fb923c');
    } else if (p.kind === 'dungeon_exit_rope') {
      // Hanging Escape Rope + Lantern
      pRect(ctx, sx + 14, p.y, 4, p.h - 10, '#d97706');
      pRect(ctx, sx + 12, p.y + p.h - 14, 8, 8, '#b45309');
      pRect(ctx, sx + 22, p.y + 8, 8, 10, '#fef08a');
    } else if (p.kind === 'dungeon_descend_gate') {
      // Glowing Abyssal Descent Stair-Gate
      pRect(ctx, sx, p.y, p.w, p.h, '#1e1b4b');
      pRect(ctx, sx + 4, p.y + 4, p.w - 8, p.h - 4, '#312e81');
      pRect(ctx, sx + 10, p.y + 12, p.w - 20, p.h - 12, '#09060b');
      pRect(ctx, sx + 14, p.y + 18, p.w - 28, 6, '#a855f7');
    } else if (p.kind === 'citadel_portal') {
      const pulse = Math.sin(time * 5) * 2;
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(sx + p.w / 2, p.y + p.h / 2, p.w / 2 + pulse, p.h / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
      pRect(ctx, sx + p.w / 2 - 4, p.y + p.h / 2 - 8, 8, 16, '#7dd3fc');
      ctx.restore();
    } else if (p.kind === 'arena_door') {
      pRect(ctx, sx, p.y, p.w, p.h, '#7f1d1d');
      pRect(ctx, sx + 6, p.y + 6, p.w - 12, p.h - 6, '#09060b');
      pRect(ctx, sx + 10, p.y + 10, p.w - 20, 4, '#fbbf24');
    } else if (p.kind === 'arena_board') {
      // Grand Arena Challenger Selection Pedestal
      pRect(ctx, sx + 4, p.y + 20, p.w - 8, p.h - 20, '#44403c');
      pRect(ctx, sx, p.y, p.w, 26, '#7f1d1d');
      pRect(ctx, sx + 3, p.y + 3, p.w - 6, 20, '#fef3c7');
      pRect(ctx, sx + 8, p.y + 7, p.w - 16, 3, '#b91c1c');
      pRect(ctx, sx + 8, p.y + 13, p.w - 20, 3, '#1e293b');
      pRect(ctx, sx + 8, p.y + 18, p.w - 14, 2, '#d97706');
    }
  }

  // Cryptic glowing threshold hint at x = 0..14 inviting the player backwards behind Checkpoint 1
  const gateScreenX = Math.round(-camX);
  if (gateScreenX > -32 && gateScreenX < PIXEL_W + 24) {
    const pulse = 0.38 + 0.25 * Math.sin(time * 3.8);
    ctx.save();
    ctx.fillStyle = `rgba(127, 29, 29, ${pulse})`;
    ctx.fillRect(gateScreenX - 6, FLOOR_Y - 56, 12, 56);
    ctx.fillStyle = 'rgba(249, 115, 22, 0.72)';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('◀ ?', gateScreenX - 2, FLOOR_Y - 62);
    ctx.restore();
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
  customization: WarriorCustomization = DEFAULT_WARRIOR_CUSTOMIZATION,
  comboSubStep = 0,
  isSpinDashAttack = false,
  simTime = 0,
  labelCtx?: CanvasRenderingContext2D | null,
) {
  const sx = Math.round(x - camX);
  const sy = Math.round(y);
  if (sx < -52 || sx > PIXEL_W + 52) return;

  // Ground contact shadow
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  ctx.fillRect(sx + 1, sy + 25, 14, 3);
  ctx.restore();

  ctx.save();
  ctx.translate(sx + 8, sy + 26);
  ctx.scale(facing * squashX, squashY);

  const breath = Math.round(Math.sin(idleTimer * 4) * 1);
  const stride = Math.round(Math.sin(walkCycle) * 2.5);
  const cloakWave1 = Math.round(Math.sin(idleTimer * 4.5 + walkCycle) * 1.6);
  const cloakWave2 = Math.round(Math.sin(idleTimer * 4.5 + walkCycle - 0.9) * 2.4);

  const quirkCycle = idleTimer > 2.5 ? (idleTimer - 2.5) % 6 : 0;
  const isAnimePose = quirkCycle > 3.6 && quirkCycle < 5.0 && attackPhase === 'none';

  const baseArmor = isPeer ? '#94a3b8' : customization.armorColor;
  const baseCape = isPeer ? peerColor : customization.cloakColor;
  const armorHi = hitFlash > 0 ? '#ffffff' : shadeColor(baseArmor, 0.34);
  const armorMain = hitFlash > 0 ? '#ffffff' : baseArmor;
  const armorMid = hitFlash > 0 ? '#ffffff' : shadeColor(baseArmor, -0.32);
  const armorDark = hitFlash > 0 ? '#ffffff' : shadeColor(baseArmor, -0.56);
  const capeColor = hitFlash > 0 ? '#ffffff' : baseCape;
  const capeShadow = hitFlash > 0 ? '#ffffff' : shadeColor(baseCape, -0.45);
  const plumeColor = isPeer ? peerColor : customization.plumeColor;
  const plumeShade = shadeColor(plumeColor, -0.32);
  const visorGlow = isPeer ? '#38bdf8' : customization.visorColor;

  // Dynamic body lean & rotation during Spinning Poke Dash or Triple Slash!
  if (isSpinDashAttack) {
    ctx.translate(0, -13);
    ctx.rotate(simTime * 28);
    ctx.translate(0, 13);
  } else if (attackPhase === 'active') {
    const lean = comboStep === 2 ? 0.22 : comboStep === 3 ? 0.14 : 0.1;
    ctx.rotate(lean);
  }

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
  pRect(ctx, 1 - stride, -6, 3, 2, '#fbbf24');
  pRect(ctx, 1 - stride, -3, 6, 3, '#1e293b');
  pRect(ctx, 4 - stride, -2, 3, 1, armorHi);

  const outfitStyle = customization.outfitStyle ?? 'knight_plate';
  const headgearStyle = customization.headgearStyle ?? 'helm';

  // Sculpted knight cuirass / adventurer tunic / crimson guild coat / demon slayer / royal regalia
  pRect(ctx, -6, -19 + breath, 12, 12, armorMain);
  if (outfitStyle === 'adventurer_tunic') {
    pRect(ctx, -6, -19 + breath, 12, 13, '#15803d');
    pRect(ctx, -4, -18 + breath, 8, 10, '#166534');
    pRect(ctx, -1, -18 + breath, 3, 12, '#fef3c7');
  } else if (outfitStyle === 'guild_coat') {
    pRect(ctx, -6, -19 + breath, 12, 13, '#7f1d1d');
    pRect(ctx, -5, -18 + breath, 10, 11, '#991b1b');
    pRect(ctx, -2, -18 + breath, 4, 11, '#fef3c7');
    pRect(ctx, -1, -16 + breath, 2, 4, '#fbbf24');
  } else if (outfitStyle === 'demon_slayer') {
    pRect(ctx, -6, -19 + breath, 12, 13, '#3b0764');
    pRect(ctx, -5, -18 + breath, 5, 11, '#7e22ce');
    pRect(ctx, 0, -18 + breath, 5, 11, '#1e1b4b');
    pRect(ctx, -2, -14 + breath, 4, 3, '#f43f5e');
  } else if (outfitStyle === 'royal_regalia') {
    pRect(ctx, -6, -19 + breath, 12, 13, '#e2e8f0');
    pRect(ctx, -5, -18 + breath, 10, 11, '#f8fafc');
    pRect(ctx, -2, -18 + breath, 4, 11, '#9f1239');
    pRect(ctx, -2, -16 + breath, 4, 3, '#fbbf24');
  } else {
    pRect(ctx, -5, -18 + breath, 5, 6, armorHi);
    pRect(ctx, 0, -18 + breath, 5, 7, armorMid);
  }
  pRect(ctx, -2, -16 + breath, 2, 2, '#fbbf24');
  pRect(ctx, -7, -20 + breath, 6, 5, '#d97706');
  pRect(ctx, -6, -20 + breath, 4, 2, '#fde047');
  pRect(ctx, -6, -10 + breath, 12, 2, '#b45309');
  pRect(ctx, -1, -10 + breath, 3, 2, '#fef08a');

  // Headgear
  if (headgearStyle === 'beret') {
    pRect(ctx, -6, -27 + breath, 11, 8, '#f3cba5');
    pRect(ctx, 1, -24 + breath, 2, 2, '#0f172a');
    pRect(ctx, -7, -32 + breath, 13, 5, capeColor);
    pRect(ctx, -5, -33 + breath, 8, 2, '#fde047');
  } else if (headgearStyle === 'bandana') {
    pRect(ctx, -6, -27 + breath, 11, 8, '#f3cba5');
    pRect(ctx, 1, -24 + breath, 2, 2, '#0f172a');
    pRect(ctx, -6, -29 + breath, 12, 3, '#dc2626');
    pRect(ctx, -10 - Math.round(cloakWave1 * 0.4), -29 + breath, 5, 2, '#ef4444');
  } else if (headgearStyle === 'circlet') {
    pRect(ctx, -6, -27 + breath, 11, 8, '#f3cba5');
    pRect(ctx, -6, -29 + breath, 11, 3, '#334155');
    pRect(ctx, 1, -24 + breath, 2, 2, visorGlow);
    pRect(ctx, -6, -28 + breath, 12, 2, '#fbbf24');
    pRect(ctx, 0, -29 + breath, 2, 2, '#38bdf8');
  } else {
    pRect(ctx, -6, -28 + breath, 12, 9, armorMain);
    pRect(ctx, -5, -28 + breath, 9, 2, armorHi);
    pRect(ctx, -6, -26 + breath, 12, 1, '#d97706');
    pRect(ctx, -1, -24 + breath, 7, 3, '#0f172a');
    pRect(ctx, 1, -23 + breath, 3, 2, isAnimePose ? '#fef08a' : visorGlow);
    pRect(ctx, -5, -33 + breath, 8, 5, '#090609');
    pRect(ctx, -4, -32 + breath, 6, 4, plumeColor);
    pRect(ctx, -9 - Math.round(cloakWave1 * 0.5), -31 + breath, 6, 3, plumeShade);
  }

  if (customization.crownEquipped) {
    const cy = headgearStyle === 'helm' ? -36 : -34;
    pRect(ctx, -5, cy + breath, 10, 4, '#f59e0b');
    pRect(ctx, -5, cy - 3 + breath, 2, 3, '#fbbf24');
    pRect(ctx, -1, cy - 4 + breath, 3, 4, '#fef08a');
    pRect(ctx, 3, cy - 3 + breath, 2, 3, '#fbbf24');
    pRect(ctx, 0, cy + 1 + breath, 2, 2, '#e11d48');
  }

  // Distinct Weapon Rendering & Full Choreography (3-Arc Slash / Double Poke / Fast Triple Slash / Spin-Dash Wind Poke!)
  const weapon = WEAPONS[weaponId];
  const vLen = weapon.visualLength;
  const vWid = weapon.visualWidth;

  if (isSpinDashAttack) {
    // BURSTING SPINNING POKE DASH with swirling wind vortex ribbons & tornado cones!
    const spinOsc = Math.sin(simTime * 42);
    const windLen = Math.round(weapon.range * 1.85);
    // Outer swirling wind ribbons
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2.5;
    for (let ring = 0; ring < 3; ring++) {
      ctx.beginPath();
      ctx.ellipse(12 + ring * 14, -14 + spinOsc * 2, 8 + ring * 3, 14 - ring * 2, simTime * 16 + ring, 0, Math.PI * 1.6);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(110, 231, 183, 0.35)';
    ctx.beginPath();
    ctx.moveTo(4, -24);
    ctx.lineTo(windLen + 10, -14);
    ctx.lineTo(4, -4);
    ctx.closePath();
    ctx.fill();
    // Spinning drilled weapon core
    pRect(ctx, 4, -15 - Math.round(vWid / 2), vLen + 14, vWid + 1, weapon.accentColor);
    pRect(ctx, 6, -14 - Math.round(vWid / 2), vLen + 12, Math.max(2, vWid - 1), weapon.color);
    pRect(ctx, 10, -14, windLen, 2, '#ffffff');
  } else if (attackPhase === 'active') {
    if (comboStep === 2) {
      // DOUBLE POKE COMBO (extended long-range piercing twin thrusts!)
      const pokeLen = Math.round(weapon.range * 1.48);
      const yShift = comboSubStep === 0 ? -18 : -11;
      const yGhost = comboSubStep === 0 ? -11 : -18;
      // Ghost previous thrust streak
      ctx.fillStyle = weapon.accentColor;
      ctx.globalAlpha = 0.48;
      ctx.fillRect(6, yGhost, pokeLen - 6, 3);
      ctx.globalAlpha = 1;
      // Primary extended piercing thrust + shockwave rings
      ctx.fillStyle = weapon.accentColor;
      ctx.fillRect(6, yShift - 2, pokeLen, vWid + 4);
      ctx.fillStyle = weapon.color;
      ctx.fillRect(8, yShift - 1, pokeLen - 2, vWid + 1);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(10, yShift, pokeLen - 4, 2);
      ctx.strokeStyle = weapon.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(18, yShift + 1, 4, 11, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (comboStep === 3) {
      // VERY FAST TRIPLE SLASH: Up-to-Down (0), Left-to-Right (1), Right-to-Left (2)
      const reach = weapon.range + 10;
      ctx.lineCap = 'round';
      if (comboSubStep === 0) {
        // Swing 1: Up-to-Down Vertical Overhead Cleave!
        ctx.strokeStyle = weapon.accentColor;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(8, -14, reach * 0.72, -Math.PI * 0.65, Math.PI * 0.45);
        ctx.stroke();
        ctx.strokeStyle = weapon.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(8, -14, reach * 0.72, -Math.PI * 0.6, Math.PI * 0.4);
        ctx.stroke();
        pRect(ctx, 10, -28, vWid + 2, vLen + 4, '#ffffff');
      } else if (comboSubStep === 1) {
        // Swing 2: Left-to-Right Sweeping Horizontal Crescent!
        ctx.strokeStyle = weapon.accentColor;
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(-4, -22);
        ctx.quadraticCurveTo(reach * 0.55, -28, reach + 6, -13);
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.quadraticCurveTo(reach * 0.55, -26, reach + 4, -13);
        ctx.stroke();
      } else {
        // Swing 3: Right-to-Left Reverse Backhand Crescent!
        ctx.strokeStyle = weapon.accentColor;
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(reach + 6, -24);
        ctx.quadraticCurveTo(reach * 0.45, -4, -6, -12);
        ctx.stroke();
        ctx.strokeStyle = weapon.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(reach + 4, -23);
        ctx.quadraticCurveTo(reach * 0.45, -6, -4, -13);
        ctx.stroke();
      }
    } else {
      // Combo Step 1: Detailed 3-frame animated sword slash choreography (no poke!)
      const reach = weapon.range + 4;
      const startAng = comboSubStep === 0 ? -1.4 : comboSubStep === 1 ? -0.6 : 0.1;
      const endAng = startAng + 1.55;
      ctx.strokeStyle = weapon.accentColor;
      ctx.lineWidth = 8 + Math.min(3, vWid);
      ctx.beginPath();
      ctx.arc(6, -15, reach * 0.75, startAng, endAng);
      ctx.stroke();
      ctx.strokeStyle = weapon.color;
      ctx.lineWidth = 4 + Math.min(2, Math.floor(vWid / 2));
      ctx.beginPath();
      ctx.arc(6, -15, reach * 0.75, startAng + 0.12, endAng);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(6, -15, reach * 0.78, startAng + 0.2, endAng);
      ctx.stroke();
    }
  } else if (attackPhase === 'windup') {
    pRect(ctx, -10, -8 - vLen, vWid + 1, vLen, weapon.color);
    pRect(ctx, -9, -7 - vLen, 1, vLen - 3, '#ffffff');
    pRect(ctx, -12, -13 + breath, vWid + 5, 2, weapon.accentColor);
  } else if (isAnimePose) {
    pRect(ctx, 4, -12 - vLen, vWid, vLen, weapon.color);
    pRect(ctx, 5, -11 - vLen, 1, vLen - 3, '#ffffff');
    pRect(ctx, 2, -13 + breath, 7, 2, weapon.accentColor);
    const sparkY = -25 + Math.round(((quirkCycle - 3.6) / 1.4) * 14);
    drawPixelSparkle(ctx, 5, sparkY, 2, '#fef08a');
  } else {
    // Draw equipped weapon at its custom size, color & special effect glint!
    const topY = -10 - vLen + breath;
    pRect(ctx, 3, topY - 1, vWid + 2, vLen + 2, '#090609');
    pRect(ctx, 4, topY, vWid, vLen, weapon.color);
    if (vWid >= 2) {
      pRect(ctx, 4 + Math.floor(vWid / 2), topY + 2, 1, Math.max(4, vLen - 4), '#ffffff');
    }
    pRect(ctx, 2, -12 + breath, vWid + 5, 2, weapon.accentColor);

    if (weapon.specialEffect !== 'none' && Math.floor(idleTimer * 6) % 2 === 0) {
      const fxCol =
        weapon.specialEffect === 'burn'
          ? '#fb923c'
          : weapon.specialEffect === 'frost'
            ? '#7dd3fc'
            : weapon.specialEffect === 'lightning'
              ? '#fde047'
              : weapon.specialEffect === 'lifesteal'
                ? '#f43f5e'
                : weapon.specialEffect === 'venom'
                  ? '#bef264'
                  : weapon.specialEffect === 'holy_beam'
                    ? '#fef08a'
                    : weapon.accentColor;
      drawPixelSparkle(ctx, 4 + Math.floor(vWid / 2), topY + Math.floor(vLen * 0.35), 2, fxCol);
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
    if (labelCtx) {
      drawCrispOverlayLabel(labelCtx, sx + 8, sy - 11, peerName, {
        color: '#e0f2fe',
        bg: 'rgba(15, 23, 42, 0.88)',
        border: peerColor,
        fontSize: 18,
        padX: 8,
        padY: 3,
      });
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = '7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(peerName, sx + 8, sy - 7);
    }
  }
}

export function drawEnemy(
  ctx: CanvasRenderingContext2D,
  enemy: EnemyState,
  camX: number,
  time: number,
  frozen: boolean,
  labelCtx?: CanvasRenderingContext2D | null,
) {
  const sx = Math.round(enemy.x - camX);
  const sy = Math.round(enemy.y);
  if (sx + enemy.w < -60 || sx > PIXEL_W + 60) return;

  const isBoss = Boolean(enemy.isDungeonBoss);
  const scaleFactor = enemy.sizeScale ?? (isBoss ? 1.4 : 1);
  const darkness = Math.max(0, Math.min(0.85, enemy.darkness ?? 0));

  // Ground contact shadow & Dungeon Boss pulsing halo
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  ctx.fillRect(sx + 2, sy + enemy.h - 2, Math.max(10, enemy.w - 4), 3);
  if (isBoss && enemy.state !== 'ko') {
    const auraR = 24 + Math.sin(time * 7) * 3;
    ctx.fillStyle = enemy.biome === 'volcano' ? 'rgba(239, 68, 68, 0.28)' : 'rgba(168, 85, 247, 0.28)';
    ctx.beginPath();
    ctx.arc(sx + enemy.w / 2, sy + enemy.h / 2, auraR, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.translate(sx + enemy.w / 2, sy + enemy.h);
  if (enemy.state === 'ko') {
    ctx.globalAlpha = Math.max(0, enemy.koTimer / 0.32);
    ctx.rotate(enemy.facing * 0.9);
  }
  ctx.scale(enemy.facing * scaleFactor, scaleFactor);

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
  } else if (enemy.archetype === 'goblin_normal') {
    const skin = flash ? '#ffffff' : windupPulse ? '#fef08a' : '#65a30d';
    pRect(ctx, -5, -21 + idleBob, 10, 9, '#09060b');
    pRect(ctx, -4, -20 + idleBob, 8, 7, skin);
    pRect(ctx, -9, -18 + idleBob, 5, 3, '#84cc16'); // Pointed goblin ears
    pRect(ctx, 4, -18 + idleBob, 5, 3, '#84cc16');
    pRect(ctx, 1, -17 + idleBob, 2, 2, '#ef4444');
    pRect(ctx, -5, -12 + idleBob, 10, 7, '#78350f'); // Tattered hide tunic
    pRect(ctx, -4 + stride, -5, 3, 5, '#4d7c0f');
    pRect(ctx, 1 - stride, -5, 3, 5, '#4d7c0f');
    pRect(ctx, 4, -13 + idleBob, 8, 2, '#cbd5e1'); // Crooked rusty knife
  } else if (enemy.archetype === 'hobgoblin') {
    const skin = flash ? '#ffffff' : windupPulse ? '#fb923c' : '#b45309';
    pRect(ctx, -8, -28 + idleBob, 16, 20, '#09060b');
    pRect(ctx, -7, -27 + idleBob, 14, 17, skin);
    pRect(ctx, -11, -24 + idleBob, 4, 4, '#d97706'); // Wide goblin ears
    pRect(ctx, 7, -24 + idleBob, 4, 4, '#d97706');
    pRect(ctx, 1, -24 + idleBob, 3, 2, '#fde047'); // Fierce amber eyes
    pRect(ctx, 2, -21 + idleBob, 2, 2, '#ffffff'); // Tusks
    pRect(ctx, -7, -17 + idleBob, 14, 9, '#44403c'); // Iron chestplate
    pRect(ctx, -6 + stride, -8, 5, 8, '#78350f');
    pRect(ctx, 2 - stride, -8, 5, 8, '#78350f');
    // Massive spiked iron club!
    pRect(ctx, 6, -24 + idleBob, 5, 16, '#57534e');
    pRect(ctx, 5, -24 + idleBob, 7, 3, '#e2e8f0');
  } else if (enemy.archetype === 'bandit_fighter') {
    const coat = flash ? '#ffffff' : windupPulse ? '#fde047' : '#991b1b';
    pRect(ctx, -6, -26 + idleBob, 12, 19, '#09060b');
    pRect(ctx, -5, -25 + idleBob, 10, 7, '#e7b98f');
    pRect(ctx, -6, -26 + idleBob, 12, 3, '#dc2626'); // Red brigand bandana
    pRect(ctx, 1, -22 + idleBob, 3, 2, '#09060b');
    pRect(ctx, -5, -18 + idleBob, 10, 11, coat);
    pRect(ctx, -4 + stride, -7, 3, 7, '#1e293b');
    pRect(ctx, 2 - stride, -7, 3, 7, '#1e293b');
    pRect(ctx, 4, -18 + idleBob, 11, 3, '#e2e8f0'); // Cutlass
  } else if (enemy.archetype === 'bandit_archer') {
    const cloak = flash ? '#ffffff' : windupPulse ? '#fde047' : '#14532d';
    pRect(ctx, -6, -26 + idleBob, 12, 19, '#09060b');
    pRect(ctx, -5, -26 + idleBob, 10, 8, cloak); // Ranger hood
    pRect(ctx, 0, -23 + idleBob, 4, 4, '#e7b98f');
    pRect(ctx, 2, -22 + idleBob, 2, 1, '#09060b');
    pRect(ctx, -5, -18 + idleBob, 10, 11, '#3f6212');
    pRect(ctx, -4 + stride, -7, 3, 7, '#292524');
    pRect(ctx, 2 - stride, -7, 3, 7, '#292524');
    // Curved oak longbow
    pRect(ctx, 6, -24 + idleBob, 2, 16, '#92400e');
    pRect(ctx, 5, -22 + idleBob, 1, 12, '#e2e8f0');
  } else if (enemy.archetype === 'bandit_assassin') {
    const cloak = flash ? '#ffffff' : windupPulse ? '#facc15' : '#18181b';
    pRect(ctx, -6, -25 + idleBob, 12, 18, '#09060b');
    pRect(ctx, -5, -25 + idleBob, 10, 8, cloak); // Dark stealth cowl
    pRect(ctx, -5, -21 + idleBob, 10, 3, '#be123c'); // Crimson face mask
    pRect(ctx, 1, -23 + idleBob, 3, 2, '#facc15'); // Fierce assassin eye glint
    pRect(ctx, -5, -17 + idleBob, 10, 10, '#27272a');
    pRect(ctx, -4 + stride, -7, 3, 7, '#09090b');
    pRect(ctx, 2 - stride, -7, 3, 7, '#09090b');
    // Dual poisoned curved daggers
    pRect(ctx, 5, -16 + idleBob, 9, 2, '#a3e635');
    pRect(ctx, -11, -15 + idleBob, 7, 2, '#94a3b8');
  } else if (enemy.archetype === 'bandit_pyromancer') {
    const robe = flash ? '#ffffff' : windupPulse ? '#fef08a' : '#7f1d1d';
    pRect(ctx, -6, -27 + idleBob, 12, 20, '#09060b');
    pRect(ctx, -5, -27 + idleBob, 10, 8, '#991b1b'); // Pointed crimson cowl
    pRect(ctx, 0, -24 + idleBob, 4, 4, '#09090b');
    pRect(ctx, 2, -23 + idleBob, 2, 2, '#fb923c'); // Ember eyes
    pRect(ctx, -5, -19 + idleBob, 10, 12, robe);
    pRect(ctx, -5, -19 + idleBob, 2, 12, '#fbbf24'); // Gold mage sash
    pRect(ctx, -4 + stride, -7, 3, 7, '#450a0a');
    pRect(ctx, 2 - stride, -7, 3, 7, '#450a0a');
    // Blazing Warlock Fire-Staff
    pRect(ctx, 6, -28 + idleBob, 2, 22, '#78350f');
    const fl = Math.round(Math.sin(time * 16) * 2);
    pRect(ctx, 4, -33 + idleBob + fl, 6, 6, '#f97316');
    pRect(ctx, 5, -31 + idleBob + fl, 4, 4, '#fef08a');
  } else if (enemy.archetype === 'bandit_brute') {
    const armor = flash ? '#ffffff' : windupPulse ? '#f87171' : '#57534e';
    pRect(ctx, -11, -33 + idleBob, 22, 25, '#09060b');
    pRect(ctx, -10, -25 + idleBob, 20, 17, armor);
    pRect(ctx, -6, -33 + idleBob, 12, 8, '#44403c'); // Heavy iron pot-helm
    pRect(ctx, -8, -35 + idleBob, 3, 4, '#cbd5e1');
    pRect(ctx, 5, -35 + idleBob, 3, 4, '#cbd5e1');
    pRect(ctx, -2, -29 + idleBob, 6, 2, '#ef4444'); // Visor glare
    pRect(ctx, -9, -25 + idleBob, 6, 4, '#991b1b'); // Spiked crimson pauldron
    pRect(ctx, 3, -25 + idleBob, 6, 4, '#991b1b');
    pRect(ctx, -8 + stride, -8, 6, 8, '#292524');
    pRect(ctx, 2 - stride, -8, 6, 8, '#292524');
    // Heavy Tower Shield & War Axe
    pRect(ctx, 7, -26 + idleBob, 8, 16, '#475569');
    pRect(ctx, 9, -24 + idleBob, 4, 12, '#cbd5e1');
    pRect(ctx, -12, -29 + idleBob, 3, 18, '#78350f');
    pRect(ctx, -16, -29 + idleBob, 6, 7, '#e2e8f0');
  } else if (enemy.archetype === 'demon_succubus') {
    const hover = Math.round(Math.sin(time * 5 + enemy.patrolOriginX) * 3);
    const body = flash ? '#ffffff' : windupPulse ? '#f472b6' : '#be123c';
    const wing = Math.round(Math.sin(time * 12) * 3);
    // Bat wings
    pRect(ctx, -13, -24 + hover + wing, 7, 10, '#4c0519');
    pRect(ctx, 6, -24 + hover - wing, 7, 10, '#4c0519');
    // Horns & silver-violet locks
    pRect(ctx, -4, -30 + hover, 2, 5, '#09060b');
    pRect(ctx, 2, -30 + hover, 2, 5, '#09060b');
    pRect(ctx, -5, -26 + hover, 10, 9, '#a855f7');
    pRect(ctx, -3, -24 + hover, 6, 6, '#f5d0fe');
    pRect(ctx, 1, -22 + hover, 2, 2, '#f43f5e');
    pRect(ctx, -4, -17 + hover, 8, 12, body);
    pRect(ctx, -3, -5 + hover, 2, 5, '#4c0519');
    pRect(ctx, 1, -5 + hover, 2, 5, '#4c0519');
    pRect(ctx, 6, -16 + hover, 4, 4, '#f43f5e'); // Heart orb!
  } else if (enemy.archetype === 'demon_tank') {
    const armor = flash ? '#ffffff' : windupPulse ? '#ef4444' : '#312e81';
    pRect(ctx, -11, -34 + idleBob, 22, 26, '#09060b');
    pRect(ctx, -10, -26 + idleBob, 20, 18, armor);
    pRect(ctx, -6, -34 + idleBob, 12, 9, '#1e1b4b');
    pRect(ctx, -9, -39 + idleBob, 3, 7, '#cbd5e1'); // Giant horns
    pRect(ctx, 6, -39 + idleBob, 3, 7, '#cbd5e1');
    pRect(ctx, -3, -30 + idleBob, 6, 3, '#ef4444'); // Glowing red eyes
    pRect(ctx, -3, -21 + idleBob, 6, 6, '#dc2626'); // Demonic core
    pRect(ctx, -8 + stride, -8, 6, 8, '#1e1b4b');
    pRect(ctx, 2 - stride, -8, 6, 8, '#1e1b4b');
    pRect(ctx, 7, -23 + idleBob, 7, 13, '#4c1d95'); // Heavy shield gauntlet
  } else if (enemy.archetype === 'demon_lightning') {
    const body = flash ? '#ffffff' : windupPulse ? '#fef08a' : '#7e22ce';
    pRect(ctx, -6, -27 + idleBob, 12, 19, '#09060b');
    pRect(ctx, -5, -26 + idleBob, 10, 7, body);
    pRect(ctx, -7, -30 + idleBob, 3, 5, '#fde047'); // Lightning horns
    pRect(ctx, 4, -30 + idleBob, 3, 5, '#fde047');
    pRect(ctx, 0, -23 + idleBob, 4, 2, '#fef08a');
    pRect(ctx, -5, -19 + idleBob, 10, 12, '#4c1d95');
    pRect(ctx, -4 + stride, -7, 3, 7, '#1e1b4b');
    pRect(ctx, 1 - stride, -7, 3, 7, '#1e1b4b');
    // Crackling lightning blade in hand
    const zap = Math.round(Math.sin(time * 24) * 2);
    pRect(ctx, 5, -18 + idleBob + zap, 11, 2, '#fde047');
    pRect(ctx, 8, -16 + idleBob - zap, 7, 2, '#ffffff');
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

  // Strong Dungeon Boss golden crown & horned war-crest
  if (isBoss) {
    pRect(ctx, -7, -36 + idleBob, 14, 4, '#fbbf24');
    pRect(ctx, -7, -40 + idleBob, 3, 4, '#fef08a');
    pRect(ctx, -2, -42 + idleBob, 4, 6, '#fbbf24');
    pRect(ctx, 4, -40 + idleBob, 3, 4, '#fef08a');
  }

  // Weapon status visual indicators (Burn / Frost / Venom)
  if ((enemy.statusBurnTimer ?? 0) > 0) {
    const fl = Math.round(Math.sin(time * 22) * 2);
    pRect(ctx, -7, -14 + fl, 4, 5, '#f97316');
    pRect(ctx, 3, -18 - fl, 4, 5, '#fde047');
  }
  if ((enemy.statusFrostTimer ?? 0) > 0) {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-11, -33, 22, 33);
    pRect(ctx, -9, -12, 3, 3, '#bae6fd');
    pRect(ctx, 6, -24, 3, 3, '#bae6fd');
  }
  if ((enemy.statusVenomTimer ?? 0) > 0) {
    const drip = Math.round((time * 18) % 6);
    pRect(ctx, -5, -20 + drip, 3, 3, '#84cc16');
    pRect(ctx, 4, -14 + ((drip + 3) % 6), 3, 3, '#a3e635');
  }

  // Endless Dungeon distance-darkening abyssal shroud & Demon King Stage bespoke variant aura!
  if (darkness > 0.08 && enemy.state !== 'ko') {
    ctx.fillStyle = `rgba(4, 2, 10, ${(darkness * 0.62).toFixed(2)})`;
    ctx.fillRect(-13, -38, 26, 38);
    if (darkness >= 0.35) {
      pRect(ctx, 1, -24 + idleBob, 2, 2, '#f43f5e');
    }
  }
  if (enemy.variantStyle && enemy.state !== 'ko') {
    const vCol =
      enemy.variantStyle === 'crimson_ash'
        ? '#f97316'
        : enemy.variantStyle === 'frost_seraph'
          ? '#38bdf8'
          : '#c084fc';
    ctx.strokeStyle = vCol;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-12, -34 + idleBob, 24, 34);
  }

  if (frozen) {
    ctx.strokeStyle = '#34d399';
    ctx.strokeRect(-10, -30, 20, 30);
  }
  ctx.restore();

  if (isBoss && enemy.state !== 'ko') {
    const barW = Math.max(46, enemy.w + 22);
    const bx = Math.round(sx + enemy.w / 2 - barW / 2);
    if (labelCtx) {
      drawCrispOverlayLabel(labelCtx, sx + enemy.w / 2, sy - 18, `★ ${enemy.name}`, {
        color: '#fde047',
        bg: 'rgba(15, 6, 12, 0.90)',
        border: '#f43f5e',
        fontSize: 19,
        padX: 10,
        padY: 4,
      });
    } else {
      ctx.font = 'bold 6px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(15, 6, 12, 0.85)';
      ctx.fillRect(bx - 6, sy - 20, barW + 12, 9);
      ctx.fillStyle = '#fde047';
      ctx.fillText(`★ ${enemy.name}`, sx + enemy.w / 2, sy - 13);
    }
    pRect(ctx, bx, sy - 9, barW, 4, '#09060b');
    pRect(ctx, bx + 1, sy - 8, Math.round(((barW - 2) * enemy.hp) / Math.max(1, enemy.maxHp)), 2, '#f43f5e');
  } else if (enemy.hp < enemy.maxHp && enemy.state !== 'ko') {
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
    ctx.globalAlpha = 0.72;
  }

  // Colorful glowing prismatic flames erupting from behind the boss's back!
  if (poseKey !== 'ko') {
    const flameColors = [
      '#f43f5e',
      '#fb923c',
      '#fde047',
      '#34d399',
      '#38bdf8',
      '#a855f7',
      '#e879f9',
      def.auraColor,
    ];
    const backDir = isBattle ? 1 : boss.facing === 1 ? -1 : 1;
    const anchorX = isBattle ? sx + 32 : Math.round(sx + boss.w / 2 + backDir * (def.isGyroBoss ? 14 : 9));
    const anchorY = isBattle ? sy - 10 + floatBob : Math.round(sy + boss.h - 22 + floatBob);
    const scale = isBattle ? 1.65 : def.isGyroBoss ? 1.35 : 1;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    // Soft prismatic radial aura behind the boss's back
    const aura = ctx.createRadialGradient(
      anchorX,
      anchorY - 6 * scale,
      2,
      anchorX,
      anchorY - 12 * scale,
      30 * scale,
    );
    aura.addColorStop(0, 'rgba(253, 224, 71, 0.42)');
    aura.addColorStop(0.42, 'rgba(232, 121, 249, 0.28)');
    aura.addColorStop(0.76, 'rgba(56, 189, 248, 0.16)');
    aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(anchorX, anchorY - 10 * scale, 30 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Animated billowing colorful flame tongues shooting out behind the back
    const count = isBattle ? 11 : 8;
    for (let f = 0; f < count; f++) {
      const col = flameColors[f % flameColors.length];
      const phase = time * (9 + (f % 3) * 2.2) + f * 1.15;
      const spread = (f - (count - 1) / 2) * 3.8 * scale;
      const height = (15 + Math.sin(phase) * 5 + (f % 3) * 4) * scale;
      const driftX = backDir * (5 + Math.cos(phase * 0.9) * 3.5) * scale + spread * 0.35;
      const fx = Math.round(anchorX + spread * 0.55 + Math.sin(phase * 0.7) * 2.2 * scale);
      const fy = Math.round(anchorY + Math.abs(spread) * 0.25);

      ctx.globalAlpha = boss.hitFlash > 0 ? 0.5 : 0.72;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(fx - 3.6 * scale, fy);
      ctx.quadraticCurveTo(
        fx + driftX * 0.45,
        fy - height * 0.62,
        fx + driftX,
        fy - height,
      );
      ctx.quadraticCurveTo(
        fx + driftX * 0.7 + 3.2 * scale,
        fy - height * 0.48,
        fx + 3.6 * scale,
        fy,
      );
      ctx.closePath();
      ctx.fill();

      // Hot luminous core inside each colorful back flame
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = f % 2 === 0 ? '#fef08a' : '#e0f2fe';
      ctx.fillRect(
        Math.round(fx + driftX * 0.32 - 1),
        Math.round(fy - height * 0.45),
        Math.max(2, Math.round(2 * scale)),
        Math.max(2, Math.round(3 * scale)),
      );
    }
    ctx.restore();
  }

  if (isBattle) {
    // Native 116x116 1:1 CPS3 sprite (boots at y=110) aligned flush onto Pokemon Battle Dais
    ctx.drawImage(sprite, Math.round(sx - 34), Math.round(sy - 78 + floatBob));
    if (boss.hitFlash > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.45;
      ctx.drawImage(sprite, Math.round(sx - 34), Math.round(sy - 78 + floatBob));
    }
  } else {
    // Corridor Boss: 62x64 crisp native sprite (boots at y=61) facing player cleanly, scaled huge for Gyro Zeppeli!
    const corridorScale = def.isGyroBoss ? 1.45 : 1;
    ctx.translate(Math.round(sx + boss.w / 2), Math.round(sy + boss.h));
    ctx.scale(-boss.facing * corridorScale, corridorScale);
    ctx.drawImage(sprite, -31, -61 + floatBob);
    if (boss.hitFlash > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.45;
      ctx.drawImage(sprite, -31, -61 + floatBob);
    }
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
  const nowSec = Date.now() * 0.006;
  for (const pr of projectiles) {
    const sx = Math.round(pr.x - camX);
    const sy = Math.round(pr.y);
    if (sx < -40 || sx > PIXEL_W + 40) continue;

    if (pr.kind === 'knife') {
      pRect(ctx, sx - 6, sy - 1, 12, 2, '#e2e8f0');
      pRect(ctx, sx - 6, sy - 2, 3, 4, '#f59e0b');
    } else if (pr.kind === 'arrow') {
      const dir = pr.vx >= 0 ? 1 : -1;
      pRect(ctx, sx - 7, sy - 1, 14, 2, '#92400e');
      pRect(ctx, sx + dir * 5, sy - 2, 3, 4, '#e2e8f0');
      pRect(ctx, sx - dir * 7, sy - 2, 3, 4, '#ef4444');
    } else if (pr.kind === 'gyro_ball') {
      const spin = (Date.now() * 0.025) % (Math.PI * 2);
      ctx.save();
      ctx.fillStyle = 'rgba(34, 197, 94, 0.35)';
      ctx.beginPath();
      ctx.arc(sx, sy, pr.radius + 5, 0, Math.PI * 2);
      ctx.fill();
      pRect(ctx, sx - 6, sy - 6, 12, 12, '#15803d');
      pRect(ctx, sx - 4, sy - 4, 8, 8, '#22c55e');
      pRect(ctx, sx + Math.cos(spin) * 3 - 1, sy + Math.sin(spin) * 3 - 1, 3, 3, '#fef08a');
      ctx.restore();
    } else if (pr.kind === 'succubus_orb') {
      pRect(ctx, sx - 4, sy - 4, 8, 8, '#f43f5e');
      pRect(ctx, sx - 2, sy - 2, 4, 4, '#fbcfe8');
    } else if (pr.kind === 'purple_flame' || pr.kind === 'purple_meteor') {
      const r = pr.kind === 'purple_meteor' ? 12 : Math.max(9, pr.radius);
      ctx.save();
      const grad = ctx.createRadialGradient(sx, sy, 2, sx, sy, r + 9);
      grad.addColorStop(0, '#fdf4ff');
      grad.addColorStop(0.35, pr.color || '#c084fc');
      grad.addColorStop(0.75, 'rgba(126, 34, 206, 0.55)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sx, sy, r + 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f0abfc';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(sx, sy, r + 2, nowSec, nowSec + Math.PI * 1.3);
      ctx.stroke();
      ctx.restore();
    } else if (pr.kind === 'slash_wave' || pr.kind === 'jjk_split_slash') {
      const dir = pr.vx >= 0 ? 1 : -1;
      ctx.save();
      const g = ctx.createLinearGradient(sx - dir * 16, sy - 16, sx + dir * 12, sy + 16);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.55, pr.color);
      g.addColorStop(1, '#ffffff');
      ctx.strokeStyle = g;
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(sx - dir * 6, sy, Math.max(12, pr.radius + 4), dir === 1 ? -1.1 : Math.PI - 1.1, dir === 1 ? 1.1 : Math.PI + 1.1);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(sx - dir * 5, sy, Math.max(11, pr.radius + 3), dir === 1 ? -0.9 : Math.PI - 0.9, dir === 1 ? 0.9 : Math.PI + 0.9);
      ctx.stroke();
      ctx.restore();
    } else if (pr.kind === 'jjk_black_flash_orb') {
      ctx.save();
      const grad = ctx.createRadialGradient(sx, sy, 2, sx, sy, pr.radius + 8);
      grad.addColorStop(0, '#09090b');
      grad.addColorStop(0.42, '#ef4444');
      grad.addColorStop(0.75, 'rgba(244, 63, 94, 0.45)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sx, sy, pr.radius + 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fb7185';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const a = nowSec * 1.4 + i * (Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(sx + Math.cos(a) * 5, sy + Math.sin(a) * 5);
        ctx.lineTo(sx + Math.cos(a + 0.35) * (pr.radius + 7), sy + Math.sin(a + 0.35) * (pr.radius + 7));
        ctx.stroke();
      }
      ctx.restore();
    } else if (pr.kind === 'jjk_uzumaki') {
      ctx.save();
      const grad = ctx.createRadialGradient(sx, sy, 2, sx, sy, pr.radius + 10);
      grad.addColorStop(0, '#09020f');
      grad.addColorStop(0.45, '#7e22ce');
      grad.addColorStop(0.78, '#e879f9');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sx, sy, pr.radius + 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f5d0fe';
      ctx.lineWidth = 1.6;
      for (let r = 5; r <= pr.radius + 4; r += 4) {
        ctx.beginPath();
        ctx.arc(sx, sy, r, nowSec + r, nowSec + r + Math.PI * 1.3);
        ctx.stroke();
      }
      ctx.restore();
    } else if (pr.kind === 'jjk_pachinko_ball') {
      ctx.save();
      const rainbow = ['#22c55e', '#fde047', '#ec4899', '#38bdf8'][Math.floor(nowSec * 3) % 4];
      const grad = ctx.createRadialGradient(sx, sy, 1, sx, sy, pr.radius + 6);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.45, rainbow);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sx, sy, pr.radius + 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (pr.kind === 'jjk_lightning_bolt') {
      ctx.save();
      const dir = pr.vx >= 0 ? 1 : -1;
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(sx - dir * 16, sy - 4);
      ctx.lineTo(sx - dir * 5, sy + 5);
      ctx.lineTo(sx + dir * 4, sy - 5);
      ctx.lineTo(sx + dir * 16, sy + 2);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
    } else if (pr.kind === 'jjk_transfig_orb') {
      ctx.save();
      const grad = ctx.createRadialGradient(sx, sy, 2, sx, sy, pr.radius + 7);
      grad.addColorStop(0, '#f0fdfa');
      grad.addColorStop(0.45, '#2dd4bf');
      grad.addColorStop(0.8, '#a855f7');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sx, sy, pr.radius + 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(sx - 6, sy - 3);
      ctx.lineTo(sx + 6, sy + 3);
      ctx.stroke();
      ctx.restore();
    } else if (pr.kind === 'jjk_magma_meteor') {
      ctx.save();
      const grad = ctx.createRadialGradient(sx, sy, 2, sx, sy, pr.radius + 8);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.45, '#f97316');
      grad.addColorStop(0.82, '#dc2626');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sx, sy, pr.radius + 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (pr.kind === 'jjk_piercing_blood') {
      const dir = pr.vx >= 0 ? 1 : -1;
      ctx.save();
      const g = ctx.createLinearGradient(sx - dir * 24, sy, sx + dir * 24, sy);
      g.addColorStop(0, 'rgba(190, 18, 60, 0)');
      g.addColorStop(0.4, '#e11d48');
      g.addColorStop(0.85, '#fb7185');
      g.addColorStop(1, '#ffffff');
      ctx.fillStyle = g;
      ctx.fillRect(sx - 24, sy - 4, 48, 8);
      ctx.fillStyle = '#fff1f2';
      ctx.fillRect(sx - 18, sy - 1.5, 36, 3);
      ctx.restore();
    } else if (pr.kind === 'jjk_exec_blade') {
      const dir = pr.vx >= 0 ? 1 : -1;
      ctx.save();
      ctx.shadowColor = '#fde047';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.moveTo(sx - dir * 16, sy - 4);
      ctx.lineTo(sx + dir * 18, sy);
      ctx.lineTo(sx - dir * 16, sy + 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx - 8, sy - 1, 16, 2);
      ctx.restore();
    } else if (pr.kind === 'jjk_cursed_nail') {
      const dir = pr.vx >= 0 ? 1 : -1;
      ctx.save();
      const grad = ctx.createRadialGradient(sx, sy, 1, sx, sy, pr.radius + 6);
      grad.addColorStop(0, '#fbcfe8');
      grad.addColorStop(0.5, '#f43f5e');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sx, sy, pr.radius + 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(sx - 10, sy - 1.5, 20, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx + dir * 7, sy - 1, 4, 2);
      ctx.restore();
    } else {
      ctx.save();
      const grad = ctx.createRadialGradient(sx, sy, 1, sx, sy, pr.radius + 5);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, pr.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sx, sy, pr.radius + 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

export function drawPeer(
  ctx: CanvasRenderingContext2D,
  peer: MultiplayerPeer,
  camX: number,
  time: number,
  labelCtx?: CanvasRenderingContext2D | null,
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
    peer.customization,
    0,
    false,
    time,
    labelCtx,
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

  const [pal0, pal1, pal2] = fx.palette ?? [fx.color, fx.accentColor, '#fde047'];

  const drawColoredSword = (sx: number, sy: number, angle: number, length: number, bladeColor: string, edgeColor: string) => {
    ctx.save();
    ctx.translate(Math.round(sx), Math.round(sy));
    ctx.rotate(angle);
    pRect(ctx, -3, -Math.round(length * 0.5), 6, length, bladeColor);
    pRect(ctx, -1, -Math.round(length * 0.48), 2, length - 2, '#ffffff');
    pRect(ctx, -7, Math.round(length * 0.25), 14, 3, edgeColor);
    pRect(ctx, -2, Math.round(length * 0.28), 4, 8, '#fbbf24');
    ctx.restore();
  };

  if (fx.style === 'mega_cross_swords') {
    const s = Math.min(1, p * 1.45);
    drawColoredSword(cx - 28 + s * 28, cy - 26 + s * 26, Math.PI * 0.25, 58, pal0, pal2);
    drawColoredSword(cx + 28 - s * 28, cy - 26 + s * 26, -Math.PI * 0.25, 58, pal1, pal2);
    drawDiagSlash(-6, 0, 1, Math.min(1, p * 1.8), 68);
    if (p > 0.2) drawDiagSlash(6, 0, -1, Math.min(1, (p - 0.2) * 1.8), 68);
  } else if (fx.style === 'mega_prism_knives') {
    const cols = [pal0, pal1, pal2, '#34d399', '#f472b6'];
    for (let i = 0; i < 7; i++) {
      const ang = (i / 7) * Math.PI * 2 + p * 2.5;
      const dist = (1 - Math.min(1, p * 1.35)) * 46;
      drawColoredSword(cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist, ang + Math.PI / 2, 22, cols[i % cols.length], '#ffffff');
    }
    if (p > 0.45) drawPixelSparkle(ctx, cx, cy, Math.round((p - 0.45) * 32), pal1);
  } else if (fx.style === 'mega_clock_shatter') {
    const rad = 16 + Math.round(p * 32);
    ctx.strokeStyle = pal1;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = pal2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(p * 10) * rad, cy + Math.sin(p * 10) * rad);
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + p * 1.5;
      pRect(ctx, cx + Math.cos(a) * rad * 0.8 - 2, cy + Math.sin(a) * rad * 0.8 - 2, 5, 5, pal0);
    }
  } else if (fx.style === 'mega_rainbow_barrage') {
    const cols = ['#f43f5e', '#fb923c', '#fde047', '#34d399', '#38bdf8', '#a855f7'];
    cols.forEach((c, idx) => {
      const start = idx * 0.09;
      if (p > start) {
        const t = Math.min(1, (p - start) * 2.3);
        const dir: 1 | -1 = idx % 2 === 0 ? 1 : -1;
        const ox = (idx - 2.5) * 9;
        const oy = ((idx % 3) - 1) * 10;
        ctx.strokeStyle = c;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(cx + ox - dir * 24, cy + oy - 22);
        ctx.lineTo(cx + ox - dir * 24 + dir * 48 * t, cy + oy - 22 + 44 * t);
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });
  } else if (fx.style === 'mega_guillotine') {
    const drop = Math.min(1, p * 1.65);
    const bladeY = cy - 64 + drop * 68;
    drawColoredSword(cx, bladeY, 0, 74, pal0, pal1);
    if (drop >= 0.85) {
      const shock = Math.round((p - 0.5) * 110);
      pRect(ctx, cx - shock / 2, cy + 14, shock, 6, pal1);
      pRect(ctx, cx - shock / 3, cy + 12, (shock * 2) / 3, 3, pal2);
    }
  } else if (fx.style === 'mega_sword_vortex') {
    const ring = [pal0, pal1, pal2, '#f43f5e'];
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2 + p * 8;
      const rx = 24 + Math.sin(p * Math.PI) * 14;
      drawColoredSword(cx + Math.cos(ang) * rx, cy + Math.sin(ang) * rx * 0.65, ang, 24, ring[i % ring.length], '#ffffff');
    }
  } else if (fx.style === 'mega_soulfire_pillars') {
    [-26, 0, 26].forEach((ox, idx) => {
      const h = Math.round(Math.sin(Math.min(1, p * 1.35) * Math.PI) * 76);
      pRect(ctx, cx + ox - 8, cy + 28 - h, 16, h, idx % 2 === 0 ? pal0 : pal1);
      pRect(ctx, cx + ox - 4, cy + 28 - h, 8, h, pal2);
      pRect(ctx, cx + ox - 2, cy + 28 - Math.round(h * 0.8), 4, Math.round(h * 0.8), '#ffffff');
    });
  } else if (fx.style === 'mega_cross_execution') {
    const cList = [pal0, pal1, pal2];
    [-16, 0, 16].forEach((ox, idx) => {
      const t = Math.min(1, Math.max(0, (p - idx * 0.12) * 1.8));
      if (t > 0) {
        drawColoredSword(cx + ox, cy - 30 + t * 34, (idx - 1) * 0.55, 54, cList[idx], '#ffffff');
      }
    });
  } else if (fx.style === 'sword') {
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
  } else if (fx.style === 'ora_barrage') {
    const frame: 0 | 1 = Math.floor(p * 26) % 2 === 0 ? 0 : 1;
    const sp = getBakedStarPlatinumSprite(frame);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sp, Math.round(cx - 56), Math.round(cy - 26 + Math.sin(p * 30) * 3));
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + p * 14;
      const rx = cx + Math.cos(ang) * 14;
      const ry = cy + Math.sin(ang) * 16;
      pRect(ctx, rx - 4, ry - 2, 9, 4, i % 2 === 0 ? '#a78bfa' : '#fbbf24');
      pRect(ctx, rx + 2, ry - 1, 3, 2, '#ffffff');
    }
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ORA ORA!', cx, cy - 26);
  } else if (fx.style === 'gyro_green_ball') {
    // Gyro Zeppeli throws a spinning green Steel Ball wreathed in blazing emerald flames!
    const t = Math.min(1, p * 1.25);
    const bx = Math.round(cx + 80 - t * 88);
    const by = Math.round(cy - 16 + Math.sin(p * Math.PI) * -12);
    const spin = p * 22;
    // Green flame trail
    for (let f = 0; f < 6; f++) {
      const fxPos = bx + 6 + f * 9;
      const fyPos = by + Math.round(Math.sin(p * 30 + f) * 5);
      pRect(ctx, fxPos, fyPos - 5, 8, 10, f % 2 === 0 ? '#15803d' : '#22c55e');
      pRect(ctx, fxPos + 2, fyPos - 2, 4, 4, '#86efac');
    }
    // Blazing green flame aura & spinning Steel Ball core
    ctx.fillStyle = 'rgba(34, 197, 94, 0.35)';
    ctx.beginPath();
    ctx.arc(bx, by, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(bx, by, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(bx, by, 9, 0, Math.PI * 2);
    ctx.fill();
    // Golden Spin crosshair spheres on ball
    pRect(ctx, bx + Math.cos(spin) * 5 - 2, by + Math.sin(spin) * 5 - 2, 4, 4, '#fef08a');
    pRect(ctx, bx - Math.cos(spin) * 5 - 2, by - Math.sin(spin) * 5 - 2, 4, 4, '#bbf7d0');
    ctx.fillStyle = '#86efac';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('NYO HO!!', bx, by - 22);
  } else if (fx.style === 'orb_flame') {
    const r = 10 + Math.round(p * 34);
    ctx.fillStyle = 'rgba(249, 115, 22, 0.35)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2 + p * 5;
      const fxPos = cx + Math.cos(ang) * r * 0.72;
      const fyPos = cy + Math.sin(ang) * r * 0.72;
      pRect(ctx, fxPos - 4, fyPos - 4, 8, 8, i % 2 === 0 ? '#f97316' : '#fde047');
    }
    pRect(ctx, cx - 7, cy - 7, 14, 14, '#fef08a');
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('-25% MAX HP!', cx, cy - 28);
  } else if (fx.style === 'orb_wind') {
    for (let ring = 0; ring < 3; ring++) {
      const rx = 18 + ring * 10 + Math.round(Math.sin(p * Math.PI) * 12);
      ctx.strokeStyle = ring % 2 === 0 ? '#2dd4bf' : '#ccfbf1';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy + (ring - 1) * 10, rx, Math.round(rx * 0.35), p * 4 + ring, 0, Math.PI * 1.65);
      ctx.stroke();
    }
    ctx.fillStyle = '#5eead4';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('+30% DMG VULN!', cx, cy - 28);
  } else if (fx.style === 'orb_electric') {
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    for (let b = -1; b <= 1; b++) {
      ctx.beginPath();
      ctx.moveTo(cx + b * 14, cy - 48);
      ctx.lineTo(cx + b * 8 - 8, cy - 16);
      ctx.lineTo(cx + b * 10 + 9, cy + 4);
      ctx.lineTo(cx + b * 6, cy + 28);
      ctx.stroke();
    }
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 24, cy - 28, 48, 56);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('STUNNED 1T!', cx, cy - 32);
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
  windVulnerable = false,
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
  if (windVulnerable) {
    ctx.save();
    ctx.strokeStyle = '#2dd4bf';
    ctx.globalAlpha = 0.72;
    ctx.lineWidth = 2;
    const spin = time * 4;
    ctx.beginPath();
    ctx.ellipse(bossDaisX, bossDaisY - 28, 34, 11, Math.sin(spin) * 0.15, 0, Math.PI * 1.7);
    ctx.stroke();
    ctx.restore();
  }

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
  const warriorSprite = getBakedWarriorBattleSprite(
    player.equippedWeapon,
    playerIsSlashing,
    player.customization,
  );
  const warriorBob = Math.round(Math.sin(time * 4) * 1.5);
  const wx = Math.round(playerDaisX + playerLunge + playerRunOff + playerHitJitter - 28);
  const wy = Math.round(playerDaisY - 63 + warriorBob);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(warriorSprite, wx, wy);
  if (playerHurtFlash) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.5;
    ctx.drawImage(warriorSprite, wx, wy);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
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

/**
 * Atmospheric darkness & warm torchlight mask when stepping backwards into the Dark Hidden Sanctum (x < 0).
 */
export function drawDarkSanctumLighting(
  ctx: CanvasRenderingContext2D,
  camX: number,
  playerX: number,
  playerY: number,
  time: number,
) {
  if (camX >= 40) return;
  const darkStrength = Math.max(0, Math.min(0.84, ((40 - camX) / 140) * 0.84));
  const playerScreenX = Math.round(playerX - camX + 8);
  const playerScreenY = Math.round(playerY + 12);

  ctx.save();
  // Dark shadow veil across sanctum region
  const veilWidth = Math.max(0, Math.min(PIXEL_W, Math.round(0 - camX + 40)));
  if (veilWidth > 0) {
    ctx.fillStyle = `rgba(4, 2, 6, ${darkStrength})`;
    ctx.fillRect(0, 0, veilWidth, PIXEL_H);
  }
  // Flickering warm torchlight halos around player + sanctum braziers + Fire Sword altar
  const torches = [
    { x: playerScreenX, y: playerScreenY, r: 78 },
    { x: Math.round(-120 - camX), y: FLOOR_Y - 16, r: 54 },
    { x: Math.round(-320 - camX), y: FLOOR_Y - 16, r: 54 },
    { x: Math.round(-520 - camX), y: FLOOR_Y - 22, r: 68 },
  ];
  for (const t of torches) {
    if (t.x < -t.r || t.x > PIXEL_W + t.r) continue;
    const pulse = t.r + Math.sin(time * 7 + t.x) * 3;
    const g = ctx.createRadialGradient(t.x, t.y, 4, t.x, t.y, pulse);
    g.addColorStop(0, 'rgba(251, 146, 60, 0.24)');
    g.addColorStop(0.55, 'rgba(220, 38, 38, 0.1)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(Math.round(t.x - pulse), Math.round(t.y - pulse), Math.round(pulse * 2), Math.round(pulse * 2));
  }
  ctx.restore();
}

/**
 * Molten Volcano Pit Chasm lava pool rendered under the Chunk 41 slipping bridge entry!
 */
export function drawVolcanoPitChasm(
  ctx: CanvasRenderingContext2D,
  pitStartX: number,
  pitWidth: number,
  camX: number,
  time: number,
) {
  const sx = Math.round(pitStartX - camX);
  if (sx + pitWidth < 0 || sx > PIXEL_W) return;

  pRect(ctx, sx, FLOOR_Y, pitWidth, PIXEL_H - FLOOR_Y, '#140303');
  pRect(ctx, sx, FLOOR_Y + 12, pitWidth, PIXEL_H - FLOOR_Y - 12, '#991b1b');
  pRect(ctx, sx, FLOOR_Y + 18, pitWidth, PIXEL_H - FLOOR_Y - 18, '#ea580c');
  for (let lx = 0; lx < pitWidth; lx += 16) {
    const wave = Math.round(Math.sin(time * 5 + lx * 0.25) * 2);
    pRect(ctx, sx + lx, FLOOR_Y + 14 + wave, 14, 4, '#fb923c');
    pRect(ctx, sx + lx + 3, FLOOR_Y + 15 + wave, 8, 2, '#fef08a');
  }
}

/**
 * Colossal Dimensional Glitch-Crash & Mega Boss Introduction Cutscene rendered directly onto the Pixel Canvas!
 */
export function drawMegaBossCutscene(
  ctx: CanvasRenderingContext2D,
  cutscene: MegaCutsceneHud,
  pendingBoss: ActiveBoss,
  time: number,
) {
  ctx.save();
  if (cutscene.phase === 'glitch') {
    // Reality chromatic tear & glitch bands
    ctx.fillStyle = 'rgba(12, 4, 24, 0.72)';
    ctx.fillRect(0, 0, PIXEL_W, PIXEL_H);
    const barColors = ['#22d3ee', '#f43f5e', '#fde047', '#8b5cf6'];
    for (let i = 0; i < 18; i++) {
      const y = ((i * 19 + Math.floor(time * 90) * 11) % PIXEL_H);
      const h = 3 + (i % 5) * 2;
      const offset = Math.round(Math.sin(time * 48 + i) * 34);
      ctx.fillStyle = barColors[i % barColors.length];
      ctx.globalAlpha = 0.65;
      ctx.fillRect(Math.max(0, offset), y, PIXEL_W - Math.abs(offset), h);
    }
    ctx.globalAlpha = 1;
    pRect(ctx, 74, 108, PIXEL_W - 148, 48, '#09060b');
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2;
    ctx.strokeRect(74, 108, PIXEL_W - 148, 48);
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('!! DIMENSIONAL GLITCH BREACH !!', PIXEL_W / 2, 130);
    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('A COLOSSAL MEGA BOSS IS CRASHING INTO YOUR WORLD...', PIXEL_W / 2, 146);
  } else {
    // Dramatic Dark Dimensional Portal + Scaled Mega Boss Portrait & Full Sprite Reveal
    const p = Math.min(1, cutscene.progress * 1.4);
    ctx.fillStyle = 'rgba(7, 3, 15, 0.88)';
    ctx.fillRect(0, 0, PIXEL_W, PIXEL_H);

    const accent =
      cutscene.archetype === 'gyro_zeppeli'
        ? '#22c55e'
        : cutscene.archetype === 'mega_dio'
          ? '#facc15'
          : '#8b5cf6';
    const subAccent =
      cutscene.archetype === 'gyro_zeppeli'
        ? '#fef08a'
        : cutscene.archetype === 'mega_dio'
          ? '#22d3ee'
          : '#34d399';

    // Diagonal speed lines behind Mega Boss
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.42;
    for (let s = 0; s < 16; s++) {
      const sx = ((s * 44 - time * 140) % (PIXEL_W + 90)) - 30;
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx - 60, PIXEL_H);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Radiant vortex ring behind boss
    ctx.strokeStyle = subAccent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(PIXEL_W / 2, 118, 52 + Math.sin(time * 8) * 4, 0, Math.PI * 2);
    ctx.stroke();

    // Draw zoomed crisp Mega Boss Sprite centered dramatically
    const sprite = getBakedJoJoBossSprite(pendingBoss.def, 'attack', true);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    const scale = 1.2 + p * 0.25;
    const drawW = Math.round(sprite.width * scale);
    const drawH = Math.round(sprite.height * scale);
    ctx.drawImage(
      sprite,
      Math.round(PIXEL_W / 2 - drawW / 2),
      Math.round(124 - drawH / 2),
      drawW,
      drawH,
    );
    ctx.restore();

    // Dramatic lower nameplate banner
    pRect(ctx, 44, 186, PIXEL_W - 88, 62, '#09060b');
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(44, 186, PIXEL_W - 88, 62);
    pRect(ctx, 48, 190, 48, 48, '#140c1e');
    ctx.save();
    ctx.translate(48, 190);
    drawBossPortrait(ctx, pendingBoss.def, 'wryyy', 48);
    ctx.restore();
  }
  ctx.restore();
}

/**
 * Renders the Bastera-armored Pixel Star Platinum Guardian beside the Knight during ORA ORA barrage (2.5s)!
 */
export function drawStarPlatinumGuardian(
  ctx: CanvasRenderingContext2D,
  playerX: number,
  playerY: number,
  facing: 1 | -1,
  camX: number,
  time: number,
  remainingSec: number,
) {
  const frame: 0 | 1 = Math.floor(time * 20) % 2 === 0 ? 0 : 1;
  const sp = getBakedStarPlatinumSprite(frame);
  const sx = Math.round(playerX - camX + 8);
  const sy = Math.round(playerY - 12 + Math.sin(time * 18) * 2);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = Math.min(0.95, remainingSec * 2);
  ctx.translate(sx, sy);
  ctx.scale(facing, 1);
  ctx.drawImage(sp, -10, -8);

  // Rapid floating impact bursts in front of fists
  for (let i = 0; i < 3; i++) {
    const t = (time * 9 + i * 0.33) % 1;
    const fx = Math.round(28 + t * 32);
    const fy = Math.round(6 + ((i * 11) % 18));
    pRect(ctx, fx, fy, 7, 3, i % 2 === 0 ? '#a78bfa' : '#fbbf24');
    pRect(ctx, fx + 4, fy + 1, 3, 2, '#ffffff');
  }
  ctx.restore();
}



