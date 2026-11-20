import { DEFAULT_WARRIOR_CUSTOMIZATION } from './rules';
import { PIXEL_H, PIXEL_W } from './pixelSprites';
import type {
  CarriageEscortState,
  CoronationCutsceneHud,
  DemonKingEntity,
  IsekaiNpc,
  PurpleFlameZone,
  RealmMode,
  WarriorCustomization,
} from './types';

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

/**
 * Bright sunny medieval fantasy Japanese Isekai Town (Axel / Solaris Kingdom inspired):
 * Cerulean sky, fluffy anime clouds, royal spire & misty mountains, timber-framed Fachwerk masonry houses,
 * red-tile Adventure Guild Hall with azure crest, pastel Wardrobe Boutique, cobblestone plaza, and marble fountain.
 */
export function drawIsekaiTownBackdrop(
  ctx: CanvasRenderingContext2D,
  camX: number,
  time: number,
  isCelebration: boolean,
) {
  // Sunny blue sky gradient
  const grad = ctx.createLinearGradient(0, 0, 0, PIXEL_H);
  grad.addColorStop(0, '#38bdf8');
  grad.addColorStop(0.55, '#bae6fd');
  grad.addColorStop(1, '#fef9c3');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, PIXEL_W, PIXEL_H);

  // Warm anime sunbeams + clouds drifting gently
  ctx.fillStyle = 'rgba(254, 240, 138, 0.45)';
  ctx.beginPath();
  ctx.arc(78, 42, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(78, 42, 13, 0, Math.PI * 2);
  ctx.fill();

  const drift = (time * 8) % 640;
  drawAnimeCloud(ctx, 130 - drift * 0.3, 28, 62);
  drawAnimeCloud(ctx, 310 - drift * 0.25, 42, 74);
  drawAnimeCloud(ctx, 490 - drift * 0.3, 22, 54);

  // Distant emerald hills & snowy anime mountain peak + Royal Solaris Castle silhouette
  const pxOff = Math.floor(camX * 0.25);
  for (let i = -1; i <= 2; i++) {
    const mx = i * 320 - (pxOff % 320);
    // Mountains
    pRect(ctx, mx + 20, 118, 96, 80, '#64748b');
    pRect(ctx, mx + 44, 96, 48, 30, '#94a3b8');
    pRect(ctx, mx + 54, 92, 28, 12, '#f8fafc'); // Snow cap
    // Royal Solaris Citadel spires on distant hill
    pRect(ctx, mx + 178, 86, 54, 80, '#cbd5e1');
    pRect(ctx, mx + 172, 68, 16, 42, '#94a3b8');
    pRect(ctx, mx + 172, 54, 16, 14, '#2563eb'); // Blue spire roof
    pRect(ctx, mx + 222, 68, 16, 42, '#94a3b8');
    pRect(ctx, mx + 222, 54, 16, 14, '#2563eb');
    pRect(ctx, mx + 196, 52, 20, 56, '#e2e8f0');
    pRect(ctx, mx + 194, 34, 24, 18, '#1d4ed8');
    pRect(ctx, mx + 205, 22, 2, 12, '#fbbf24');
  }

  // Rolling sunlit green foothills & Cypress trees
  pRect(ctx, 0, 152, PIXEL_W, 76, '#4ade80');
  pRect(ctx, 0, 168, PIXEL_W, 60, '#22c55e');

  const bxOff = Math.floor(camX);

  // Background Medieval Town Houses (scenic timber-frame homes along plaza)
  const houseXs = [70, 210, 535, 845];
  for (const hx of houseXs) {
    const sx = Math.round(hx - bxOff);
    if (sx < -110 || sx > PIXEL_W + 20) continue;
    // Fachwerk cream plaster & oak timber beams + diagonal braces
    pRect(ctx, sx, 134, 86, 92, '#fef3c7');
    pRect(ctx, sx, 134, 6, 92, '#78350f');
    pRect(ctx, sx + 80, 134, 6, 92, '#78350f');
    pRect(ctx, sx, 174, 86, 5, '#78350f');
    pRect(ctx, sx + 40, 134, 5, 92, '#92400e');
    pRect(ctx, sx + 12, 139, 4, 35, '#92400e');
    pRect(ctx, sx + 68, 139, 4, 35, '#92400e');
    // Steep terracotta shingle gable roof
    pRect(ctx, sx - 6, 114, 98, 22, '#dc2626');
    pRect(ctx, sx - 4, 130, 94, 4, '#7f1d1d');
    pRect(ctx, sx + 4, 102, 78, 14, '#b91c1c');
    pRect(ctx, sx + 18, 92, 50, 12, '#991b1b');
    pRect(ctx, sx + 64, 86, 10, 18, '#64748b'); // Stone chimney
    // Warm sunlit windows, shutters & flowerboxes
    pRect(ctx, sx + 14, 146, 16, 18, '#38bdf8');
    pRect(ctx, sx + 21, 146, 2, 18, '#78350f');
    pRect(ctx, sx + 56, 146, 16, 18, '#38bdf8');
    pRect(ctx, sx + 63, 146, 2, 18, '#78350f');
    pRect(ctx, sx + 12, 164, 20, 4, '#78350f');
    pRect(ctx, sx + 14, 161, 4, 3, '#f43f5e');
    pRect(ctx, sx + 22, 161, 4, 3, '#fde047');
    // Wooden street barrels & sunlit bushes at street level
    pRect(ctx, sx + 6, 208, 12, 16, '#92400e');
    pRect(ctx, sx + 6, 211, 12, 2, '#64748b');
    pRect(ctx, sx + 62, 212, 20, 12, '#16a34a');
    pRect(ctx, sx + 66, 209, 12, 6, '#22c55e');
  }

  // Sunlit Market Stall beside Merchant Lena (x=140..195)
  const msx = Math.round(145 - bxOff);
  if (msx > -80 && msx < PIXEL_W + 20) {
    pRect(ctx, msx, 198, 52, 26, '#78350f');
    pRect(ctx, msx + 4, 174, 4, 50, '#451a03');
    pRect(ctx, msx + 44, 174, 4, 50, '#451a03');
    for (let a = 0; a < 6; a++) {
      pRect(ctx, msx - 2 + a * 9, 166, 9, 10, a % 2 === 0 ? '#ea580c' : '#fef3c7');
    }
    pRect(ctx, msx + 10, 192, 10, 6, '#ef4444'); // Apples
    pRect(ctx, msx + 24, 192, 10, 6, '#facc15'); // Lemons / Bread
  }

  // Grand Marble Town Fountain in Center-Left Plaza (x=285..345)
  const fx = Math.round(295 - bxOff);
  if (fx > -60 && fx < PIXEL_W + 40) {
    pRect(ctx, fx - 24, 208, 60, 18, '#cbd5e1');
    pRect(ctx, fx - 20, 210, 52, 6, '#38bdf8');
    pRect(ctx, fx - 2, 182, 16, 28, '#e2e8f0');
    pRect(ctx, fx - 10, 188, 32, 6, '#cbd5e1');
    const jet = Math.round(Math.sin(time * 9) * 3);
    pRect(ctx, fx + 3, 164 + jet, 6, 18, '#7dd3fc');
    pRect(ctx, fx - 6, 174 + jet, 4, 14, '#bae6fd');
    pRect(ctx, fx + 14, 174 + jet, 4, 14, '#bae6fd');
  }

  // Hero Building 1: ADVENTURE GUILD HALL (x=370..505) — Grand timber-and-masonry lodge!
  const gx = Math.round(370 - bxOff);
  if (gx > -150 && gx < PIXEL_W + 20) {
    pRect(ctx, gx, 108, 134, 118, '#fde68a');
    pRect(ctx, gx, 108, 134, 6, '#78350f');
    pRect(ctx, gx, 164, 134, 6, '#78350f');
    pRect(ctx, gx, 108, 8, 118, '#451a03');
    pRect(ctx, gx + 126, 108, 8, 118, '#451a03');
    // Ornate deep cobalt-gold peaked roof + fluttering azure Guild Pennants
    pRect(ctx, gx - 8, 84, 150, 26, '#1e3a8a');
    pRect(ctx, gx + 6, 68, 122, 18, '#1d4ed8');
    pRect(ctx, gx + 28, 54, 78, 16, '#2563eb');
    const flagSway = Math.round(Math.sin(time * 6) * 2);
    pRect(ctx, gx + 66, 36, 2, 18, '#fbbf24');
    pRect(ctx, gx + 68, 36 + flagSway, 16, 8, '#38bdf8');
    // Crossed Guild Sword Heraldic Signboard!
    pRect(ctx, gx + 40, 118, 54, 24, '#451a03');
    pRect(ctx, gx + 42, 120, 50, 20, '#92400e');
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GUILD', gx + 67, 133);
    // Stained windows & lantern porch
    pRect(ctx, gx + 16, 122, 16, 22, '#60a5fa');
    pRect(ctx, gx + 102, 122, 16, 22, '#60a5fa');
    pRect(ctx, gx + 14, 178, 20, 22, '#fbbf24');
    pRect(ctx, gx + 100, 178, 20, 22, '#fbbf24');
  }

  // Hero Building 2: WARDROBE BOUTIQUE SHOP (x=665..795) — Pastel rose-cream tailor atelier!
  const wx = Math.round(665 - bxOff);
  if (wx > -150 && wx < PIXEL_W + 20) {
    pRect(ctx, wx, 118, 126, 108, '#fff1f2');
    pRect(ctx, wx, 118, 7, 108, '#831843');
    pRect(ctx, wx + 119, 118, 7, 108, '#831843');
    pRect(ctx, wx - 6, 94, 138, 26, '#be185d');
    pRect(ctx, wx + 8, 80, 110, 16, '#db2777');
    // Striped boutique shop awning!
    for (let a = 0; a < 12; a++) {
      pRect(ctx, wx + 4 + a * 10, 152, 10, 12, a % 2 === 0 ? '#f43f5e' : '#ffffff');
    }
    // Display mannequin window
    pRect(ctx, wx + 16, 172, 34, 34, '#bae6fd');
    pRect(ctx, wx + 26, 180, 14, 24, '#a855f7');
    pRect(ctx, wx + 36, 126, 56, 20, '#831843');
    ctx.fillStyle = '#fbcfe8';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('WARDROBE', wx + 64, 139);
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
      const off = (bxOff + row * 14) % 28;
      for (let cx = -off; cx < PIXEL_W; cx += 28) {
        pRect(ctx, cx, sy, 25, 8, (row + Math.floor(cx / 28)) % 2 === 0 ? '#cbd5e1' : '#94a3b8');
      }
    }
  } else if (realm === 'isekai_guild' || realm === 'isekai_wardrobe') {
    pRect(ctx, 0, 224, PIXEL_W, 46, realm === 'isekai_guild' ? '#5c2810' : '#4a1930');
    pRect(ctx, 0, 224, PIXEL_W, 3, realm === 'isekai_guild' ? '#b45309' : '#f472b6');
    for (let px = -(bxOff % 32); px < PIXEL_W; px += 32) {
      pRect(ctx, px, 227, 2, 42, '#29150c');
    }
  } else if (realm === 'goblin_dungeon') {
    pRect(ctx, 0, 224, PIXEL_W, 46, '#334155');
    pRect(ctx, 0, 224, PIXEL_W, 4, '#64748b');
    for (let gx = -(bxOff % 24); gx < PIXEL_W; gx += 24) {
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
    for (let lx = -(bxOff % 44); lx < PIXEL_W; lx += 44) {
      ctx.fillRect(lx, 234, 22, 3);
    }
  }
}

/**
 * Cozy warm Japanese Isekai Adventure Guild Interior:
 * Timber trusses, stone fireplace hearth, tavern bar stools with NPCs drinking ale, Reception counter, & quest board.
 */
export function drawIsekaiGuildInterior(ctx: CanvasRenderingContext2D, camX: number, time: number) {
  pRect(ctx, 0, 0, PIXEL_W, PIXEL_H, '#29150c');
  const ox = Math.floor(camX * 0.5);

  // Warm plank timber paneling & overhead oak beams
  for (let x = - (ox % 48); x < PIXEL_W; x += 48) {
    pRect(ctx, x, 0, 8, 226, '#451a03');
    pRect(ctx, x + 8, 12, 40, 214, '#5c2810');
  }
  pRect(ctx, 0, 0, PIXEL_W, 18, '#3f1d0b');

  // Sunlit arched leaded windows
  for (let wx = 60 - Math.floor(camX); wx <= 520 - Math.floor(camX); wx += 140) {
    if (wx < -60 || wx > PIXEL_W + 20) continue;
    pRect(ctx, wx, 42, 44, 62, '#1c1008');
    pRect(ctx, wx + 4, 46, 36, 54, '#7dd3fc');
    pRect(ctx, wx + 20, 46, 4, 54, '#451a03');
    pRect(ctx, wx + 4, 70, 36, 4, '#451a03');
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
  for (const cxWorld of [160, 340]) {
    const sx = Math.round(cxWorld - camX);
    pRect(ctx, sx, 0, 2, 24, '#1e293b');
    pRect(ctx, sx - 24, 24, 50, 4, '#78350f');
    ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
    ctx.beginPath();
    ctx.arc(sx, 24, 34, 0, Math.PI * 2);
    ctx.fill();
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
 * Demon Realm Invasion Backdrop:
 * Mixed Purple-Red Sky + Animated Erupting Volcanoes spewing glowing crimson lava plumes & volcanic sparks!
 */
export function drawDemonRealmBackdrop(ctx: CanvasRenderingContext2D, camX: number, time: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, PIXEL_H);
  grad.addColorStop(0, '#4c1d95'); // Deep purple upper sky
  grad.addColorStop(0.45, '#9d174d'); // Violet-crimson mix
  grad.addColorStop(0.82, '#dc2626'); // Blazing volcanic red horizon
  grad.addColorStop(1, '#1c0506');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, PIXEL_W, PIXEL_H);

  // Swirling demonic storm clouds
  ctx.fillStyle = 'rgba(30, 10, 46, 0.55)';
  for (let c = 0; c < 5; c++) {
    const cx = ((c * 125 - time * 18) % (PIXEL_W + 120)) - 40;
    ctx.fillRect(Math.round(cx), 22 + (c % 2) * 18, 96, 14);
  }

  // Animated Erupting Volcanoes across the Demon Realm horizon!
  const pxOff = Math.floor(camX * 0.3) % 240;
  for (let vx = -pxOff; vx < PIXEL_W + 240; vx += 240) {
    // Main obsidian volcano cone
    pRect(ctx, vx + 30, 128, 120, 98, '#1e0712');
    pRect(ctx, vx + 52, 98, 76, 40, '#2b0918');
    pRect(ctx, vx + 68, 82, 44, 24, '#3b0d1f');
    // Glowing crater rim
    pRect(ctx, vx + 72, 80, 36, 5, '#ef4444');
    pRect(ctx, vx + 78, 80, 24, 3, '#fde047');

    // Animated Volcanic Eruption Plume & Lava Fountains!
    const erupt = Math.sin(time * 4 + vx) * 0.5 + 0.5;
    const plumeH = Math.round(28 + erupt * 32);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.78)';
    ctx.fillRect(Math.round(vx + 78), 80 - plumeH, 24, plumeH);
    ctx.fillStyle = 'rgba(251, 146, 60, 0.85)';
    ctx.fillRect(Math.round(vx + 83), 82 - Math.round(plumeH * 0.75), 14, Math.round(plumeH * 0.75));
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(Math.round(vx + 87), 82 - Math.round(plumeH * 0.45), 6, Math.round(plumeH * 0.45));

    // Flying lava embers bursting upward from crater
    for (let e = 0; e < 7; e++) {
      const p = (time * 1.4 + e * 0.19) % 1;
      const ex = vx + 90 + Math.cos(e * 2.1) * (10 + p * 38);
      const ey = 76 - p * 54 + p * p * 38;
      pRect(ctx, ex, ey, 3, 3, e % 2 === 0 ? '#ef4444' : '#fde047');
    }

    // Molten lava streams running down volcano slopes
    pRect(ctx, vx + 84, 85, 8, 96, '#dc2626');
    pRect(ctx, vx + 86, 85, 4, 96, '#fb923c');
  }

  // Scorched obsidian Demon Realm earth
  pRect(ctx, 0, 224, PIXEL_W, 46, '#270917');
  pRect(ctx, 0, 224, PIXEL_W, 4, '#ef4444');
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

    // High-contrast floating NPC name tag
    ctx.font = 'bold 6px monospace';
    ctx.textAlign = 'center';
    const labelW = Math.min(76, npc.name.length * 4 + 6);
    ctx.fillStyle = 'rgba(10, 7, 14, 0.78)';
    ctx.fillRect(Math.round(sx + 8 - labelW / 2), Math.round(npc.y - 15), labelW, 9);
    ctx.fillStyle = isCelebration ? '#fef08a' : '#f8fafc';
    ctx.fillText(npc.name, sx + 8, Math.round(npc.y - 8));
  }
}

/**
 * Renders the 3 towering A-Rank Demon Kings in normal real-time canvas combat + their demonic purple flame skills!
 */
export function drawDemonKings(
  ctx: CanvasRenderingContext2D,
  kings: DemonKingEntity[],
  camX: number,
  time: number,
  frozen: boolean,
) {
  for (const dk of kings) {
    if (dk.hp <= 0) continue;
    const sx = Math.round(dk.x - camX);
    if (sx < -60 || sx > PIXEL_W + 60) continue;

    ctx.save();
    ctx.translate(sx + dk.w / 2, Math.round(dk.y + dk.h));
    ctx.scale(dk.facing, 1);

    const flash = dk.hitFlash > 0;
    const bob = Math.round(Math.sin(time * 4 + dk.index) * 2);

    // Swirling demonic purple flame aura behind each Demon King
    ctx.fillStyle = 'rgba(168, 85, 247, 0.32)';
    ctx.beginPath();
    ctx.arc(0, -dk.h * 0.5, 28 + Math.sin(time * 9) * 3, 0, Math.PI * 2);
    ctx.fill();

    // Flowing Demon King Mantle & Heavy Armored Frame
    pRect(ctx, -15, -42 + bob, 30, 38, flash ? '#ffffff' : '#1e1b4b');
    pRect(ctx, -12, -38 + bob, 24, 28, flash ? '#ffffff' : dk.primaryColor);
    pRect(ctx, -17, -40 + bob, 9, 10, '#fbbf24'); // Gold pauldrons
    pRect(ctx, 8, -40 + bob, 9, 10, '#fbbf24');
    // Head + Crown + Demon Horns
    pRect(ctx, -8, -54 + bob, 16, 13, flash ? '#ffffff' : '#4c1d95');
    pRect(ctx, -13, -62 + bob, 4, 10, '#e2e8f0'); // Sweeping horns
    pRect(ctx, 9, -62 + bob, 4, 10, '#e2e8f0');
    pRect(ctx, -7, -58 + bob, 14, 4, '#fbbf24'); // Dark Sovereign Crown
    pRect(ctx, -4, -49 + bob, 3, 2, '#f0abfc'); // Blazing eyes
    pRect(ctx, 2, -49 + bob, 3, 2, '#f0abfc');
    // Purple Flame Staff / Runeblade
    pRect(ctx, 12, -52 + bob, 4, 46, '#9333ea');
    pRect(ctx, 10, -58 + bob, 8, 8, '#f0abfc');

    if (frozen) {
      ctx.strokeStyle = '#34d399';
      ctx.strokeRect(-16, -58, 32, 60);
    }
    ctx.restore();

    // Name & HP bar above Demon King
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    const nameW = Math.min(118, dk.name.length * 4 + 8);
    ctx.fillStyle = 'rgba(10, 6, 16, 0.82)';
    ctx.fillRect(Math.round(sx + dk.w / 2 - nameW / 2), Math.round(dk.y - 18), nameW, 10);
    ctx.fillStyle = '#f0abfc';
    ctx.fillText(dk.name, sx + dk.w / 2, Math.round(dk.y - 10));
    pRect(ctx, sx - 6, Math.round(dk.y - 6), dk.w + 12, 4, '#09060b');
    pRect(
      ctx,
      sx - 5,
      Math.round(dk.y - 5),
      Math.round(((dk.w + 10) * dk.hp) / Math.max(1, dk.maxHp)),
      2,
      '#c084fc',
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
