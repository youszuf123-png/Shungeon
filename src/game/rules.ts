import {
  INITIAL_INVENTORY,
  ORB_DROP_CHANCE,
  ORB_IDS,
  SKILLS,
  TOTAL_HIDDEN_PASSAGES,
  WEAPONS,
} from './data';
import type {
  ActiveBoss,
  EnemyState,
  InventoryItem,
  OrbId,
  Platform,
  PlayerState,
  SkillId,
  StatKey,
  WarriorCustomization,
  WeaponId,
} from './types';

export const GRAVITY = 620;
export const MOVE_SPEED = 148;
export const JUMP_VELOCITY = -325;
export const COYOTE_TIME = 0.13;
export const JUMP_BUFFER_TIME = 0.14;

export const DEFAULT_WARRIOR_CUSTOMIZATION: WarriorCustomization = {
  cloakColor: '#be123c',
  armorColor: '#cbd5e1',
  visorColor: '#38bdf8',
  plumeColor: '#fbbf24',
};

export function createInitialPlayer(): PlayerState {
  return {
    x: 68,
    y: 186,
    vx: 0,
    vy: 0,
    w: 16,
    h: 26,
    facing: 1,
    onGround: false,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    hp: 115,
    maxHp: 115,
    stamina: 100,
    maxStamina: 100,
    gold: 25,
    equippedWeapon: 'claymore',
    unlockedWeapons: ['claymore', 'rapier'],
    skillSlots: ['blade_dash', 'candlefire_wave', 'stand_rush'],
    skillCooldowns: [0, 0, 0],
    dashCooldown: 0,
    attackPhase: 'none',
    attackTimer: 0,
    comboStep: 0,
    comboWindowTimer: 0,
    invulnTimer: 0,
    parryTimer: 0,
    chronoFreezeTimer: 0,
    hitFlash: 0,
    squashX: 1,
    squashY: 1,
    walkCycle: 0,
    idleTimer: 0,
    bossesDefeated: 0,
    monstersSlain: 0,
    secretsFound: 0,
    level: 1,
    statPoints: 0,
    stats: {
      skillDmg: 0,
      attack: 0,
      hp: 0,
      speed: 0,
    },
    customization: { ...DEFAULT_WARRIOR_CUSTOMIZATION },
    highestCheckpointX: 68,
    highestCheckpointIndex: 0,
  };
}

export function createInitialInventory(): InventoryItem[] {
  return INITIAL_INVENTORY.map((item) => ({ ...item }));
}

export function rectsOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function stepPlayerPhysics(
  player: PlayerState,
  input: { left: boolean; right: boolean; jumpJustPressed: boolean; jumpHeld: boolean },
  platforms: Platform[],
  dt: number,
  minX = -616,
): { jumped: boolean; landed: boolean } {
  let jumped = false;
  let landed = false;

  const moveDir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (moveDir !== 0 && player.attackPhase === 'none') {
    player.facing = moveDir > 0 ? 1 : -1;
  }

  // Smooth horizontal acceleration & momentum preservation for long dashes
  const moveSpeed = MOVE_SPEED + player.stats.speed * 6;
  const targetVx = moveDir * moveSpeed;
  const isDashing =
    Math.abs(player.vx) > moveSpeed + 20 &&
    (moveDir === 0 || Math.sign(player.vx) === moveDir);
  const accel = isDashing ? 2.4 : player.onGround ? 14 : 9;
  player.vx += (targetVx - player.vx) * Math.min(1, accel * dt);
  if (Math.abs(player.vx) < 2 && moveDir === 0) {
    player.vx = 0;
  }

  // Coyote time & jump buffer
  if (player.onGround) {
    player.coyoteTimer = COYOTE_TIME;
  } else {
    player.coyoteTimer = Math.max(0, player.coyoteTimer - dt);
  }

  if (input.jumpJustPressed) {
    player.jumpBufferTimer = JUMP_BUFFER_TIME;
  } else {
    player.jumpBufferTimer = Math.max(0, player.jumpBufferTimer - dt);
  }

  if (player.jumpBufferTimer > 0 && player.coyoteTimer > 0) {
    player.vy = JUMP_VELOCITY;
    player.onGround = false;
    player.coyoteTimer = 0;
    player.jumpBufferTimer = 0;
    player.squashX = 0.84;
    player.squashY = 1.18;
    jumped = true;
  }

  // Variable jump height cut
  if (!input.jumpHeld && player.vy < -65) {
    player.vy *= 0.55;
  }

  // Gravity
  player.vy = Math.min(460, player.vy + GRAVITY * dt);

  // Move X (allows entering the dark hidden passage backwards past x=0!)
  player.x += player.vx * dt;
  if (player.x < minX) {
    player.x = minX;
    player.vx = 0;
  }

  // Move Y & resolve platforms (top-surface one-way ledges + solid floors)
  const prevBottom = player.y + player.h;
  const wasOnGround = player.onGround;
  player.y += player.vy * dt;
  player.onGround = false;

  for (const plat of platforms) {
    if (player.x + player.w <= plat.x || player.x >= plat.x + plat.w) continue;

    if (plat.kind === 'floor') {
      if (player.vy >= 0 && prevBottom <= plat.y + 8 && player.y + player.h >= plat.y) {
        player.y = plat.y - player.h;
        player.vy = 0;
        player.onGround = true;
      }
    } else {
      // One-way brick / carpet ledge
      if (player.vy >= 0 && prevBottom <= plat.y + 6 && player.y + player.h >= plat.y) {
        player.y = plat.y - player.h;
        player.vy = 0;
        player.onGround = true;
      }
    }
  }

  if (!wasOnGround && player.onGround) {
    player.squashX = 1.2;
    player.squashY = 0.8;
    landed = true;
  }

  // Exponentially damp squash-and-stretch back to 1
  const damp = Math.min(1, 14 * dt);
  player.squashX += (1 - player.squashX) * damp;
  player.squashY += (1 - player.squashY) * damp;

  // Walk cycle synced to distance traveled
  if (player.onGround && Math.abs(player.vx) > 8) {
    player.walkCycle += Math.abs(player.vx) * dt * 0.14;
    player.idleTimer = 0;
  } else {
    player.idleTimer += dt;
  }

  // Timers
  player.invulnTimer = Math.max(0, player.invulnTimer - dt);
  player.parryTimer = Math.max(0, player.parryTimer - dt);
  player.chronoFreezeTimer = Math.max(0, player.chronoFreezeTimer - dt);
  player.hitFlash = Math.max(0, player.hitFlash - dt);
  player.comboWindowTimer = Math.max(0, player.comboWindowTimer - dt);
  if (player.comboWindowTimer === 0 && player.attackPhase === 'none') {
    player.comboStep = 0;
  }

  for (let i = 0; i < 3; i++) {
    player.skillCooldowns[i] = Math.max(0, player.skillCooldowns[i] - dt);
  }
  player.dashCooldown = Math.max(0, player.dashCooldown - dt);
  const staminaRegen = 20 + player.stats.speed * 1.6;
  player.stamina = Math.min(player.maxStamina, player.stamina + staminaRegen * dt);

  return { jumped, landed };
}

export const DASH_COOLDOWN_SECONDS = 1.0;
export const DASH_STAMINA_COST = 10;

export function triggerPlayerDash(player: PlayerState): boolean {
  if (player.dashCooldown > 0 || player.stamina < DASH_STAMINA_COST) return false;
  player.stamina -= DASH_STAMINA_COST;
  player.dashCooldown = DASH_COOLDOWN_SECONDS;
  player.invulnTimer = Math.max(player.invulnTimer, 0.28);
  player.vx = player.facing * (430 + player.stats.speed * 8);
  player.vy = Math.min(player.vy, 0);
  player.squashX = 1.25;
  player.squashY = 0.8;
  return true;
}

export function getMonsterLevelMultiplier(level: number): number {
  return Number((1 + Math.max(0, level - 1) * 0.4).toFixed(2));
}

export const BOSS_STREAK_FOR_COOLDOWN = 5;
export const BOSS_COOLDOWN_DURATION = 60;

export function recordBossFightProgress(currentStreak: number): {
  nextStreak: number;
  cooldownSeconds: number;
  triggeredCooldown: boolean;
} {
  const next = currentStreak + 1;
  if (next >= BOSS_STREAK_FOR_COOLDOWN) {
    return {
      nextStreak: 0,
      cooldownSeconds: BOSS_COOLDOWN_DURATION,
      triggeredCooldown: true,
    };
  }
  return {
    nextStreak: next,
    cooldownSeconds: 0,
    triggeredCooldown: false,
  };
}

export function startWeaponAttack(player: PlayerState): boolean {
  if (player.attackPhase !== 'none') return false;
  const weapon = WEAPONS[player.equippedWeapon];
  player.attackPhase = 'windup';
  player.attackTimer = weapon.windup;
  player.comboStep = (player.comboStep % weapon.comboHits) + 1;
  player.comboWindowTimer = 0.65;

  // Style-specific forward step
  if (weapon.id === 'rapier' || weapon.id === 'katana') {
    player.vx += player.facing * 95;
  } else if (weapon.id === 'crescent') {
    player.vx += player.facing * 60;
  }
  return true;
}

export function computeWeaponHitbox(player: PlayerState) {
  const weapon = WEAPONS[player.equippedWeapon];
  const isSpin = weapon.id === 'crescent';
  const w = isSpin ? weapon.range * 1.7 : weapon.range;
  const h = weapon.arcHeight;
  const x = isSpin
    ? player.x + player.w / 2 - w / 2
    : player.facing === 1
      ? player.x + player.w - 2
      : player.x - w + 2;
  const y = player.y + player.h / 2 - h / 2;
  return { x, y, w, h };
}

export function calculateAttackDamage(
  player: PlayerState,
  isSkillMultiplier = 1,
  isSkill = false,
): number {
  const weapon = WEAPONS[player.equippedWeapon];
  const weaponOpMult = weapon.damageMultiplier ?? 1;
  const comboBonus = 1 + (Math.max(1, player.comboStep) - 1) * 0.14;
  const bossScaling = 1 + player.bossesDefeated * 0.06;
  const attackBonus = player.stats.attack * 3;
  const attackMult = 1 + player.stats.attack * 0.04;
  const skillStatMult = isSkill ? 1 + player.stats.skillDmg * 0.08 : 1;
  return Math.round(
    (weapon.damage + attackBonus) *
      weaponOpMult *
      comboBonus *
      bossScaling *
      attackMult *
      isSkillMultiplier *
      skillStatMult,
  );
}

export function canTriggerSkillSlot(player: PlayerState, slotIndex: 0 | 1 | 2): boolean {
  const skillId = player.skillSlots[slotIndex];
  const skill = SKILLS[skillId];
  return player.skillCooldowns[slotIndex] <= 0 && player.stamina >= skill.staminaCost;
}

export function triggerSkillSlot(
  player: PlayerState,
  slotIndex: 0 | 1 | 2,
): { ok: boolean; skillId: SkillId } {
  const skillId = player.skillSlots[slotIndex];
  if (!canTriggerSkillSlot(player, slotIndex)) {
    return { ok: false, skillId };
  }
  const skill = SKILLS[skillId];
  player.stamina -= skill.staminaCost;
  player.skillCooldowns[slotIndex] = skill.cooldown;
  return { ok: true, skillId };
}

export function assignSkillToSlot(
  player: PlayerState,
  slotIndex: 0 | 1 | 2,
  newSkillId: SkillId,
): [SkillId, SkillId, SkillId] {
  const next: [SkillId, SkillId, SkillId] = [...player.skillSlots];
  const existingIdx = next.indexOf(newSkillId);
  if (existingIdx !== -1 && existingIdx !== slotIndex) {
    next[existingIdx] = next[slotIndex];
  }
  next[slotIndex] = newSkillId;
  player.skillSlots = next;
  return next;
}

export function equipWeapon(player: PlayerState, weaponId: WeaponId): boolean {
  if (!player.unlockedWeapons.includes(weaponId)) return false;
  player.equippedWeapon = weaponId;
  player.attackPhase = 'none';
  player.comboStep = 0;
  return true;
}

export function craftWeapon(
  player: PlayerState,
  inventory: InventoryItem[],
  weaponId: WeaponId,
): { ok: boolean; reason?: string } {
  if (player.unlockedWeapons.includes(weaponId)) {
    equipWeapon(player, weaponId);
    return { ok: true };
  }
  const def = WEAPONS[weaponId];
  if (!def.craftCost) {
    player.unlockedWeapons.push(weaponId);
    equipWeapon(player, weaponId);
    return { ok: true };
  }
  const res = inventory.find((i) => i.id === def.craftCost!.resourceId);
  if (!res || res.count < def.craftCost.amount) {
    return {
      ok: false,
      reason: `Need ${def.craftCost.amount} ${res ? res.name : def.craftCost.resourceId}`,
    };
  }
  res.count -= def.craftCost.amount;
  player.unlockedWeapons.push(weaponId);
  equipWeapon(player, weaponId);
  return { ok: true };
}

export function useInventoryItem(
  player: PlayerState,
  inventory: InventoryItem[],
  itemId: string,
): { ok: boolean; message: string } {
  const item = inventory.find((i) => i.id === itemId);
  if (!item || item.count <= 0) {
    return { ok: false, message: 'None left in your pouch.' };
  }
  if (item.category !== 'potion' || !item.healAmount) {
    return { ok: false, message: item.sarcasticQuote };
  }
  if (player.hp >= player.maxHp) {
    return { ok: false, message: 'Already at full health. Stop hoarding heals.' };
  }
  item.count -= 1;
  player.hp = Math.min(player.maxHp, player.hp + item.healAmount);
  return { ok: true, message: `Restored +${item.healAmount} HP.` };
}

export function applyDamageToEnemy(
  enemy: EnemyState,
  damage: number,
  knockbackX: number,
): { killed: boolean } {
  if (enemy.state === 'ko') return { killed: false };
  enemy.hp = Math.max(0, enemy.hp - damage);
  enemy.hitFlash = 0.1;
  enemy.vx = knockbackX;
  enemy.vy = -70;
  if (enemy.hp <= 0) {
    enemy.state = 'ko';
    enemy.koTimer = 0.32;
    return { killed: true };
  }
  return { killed: false };
}

export function applyDamageToBoss(
  boss: ActiveBoss,
  damage: number,
  knockbackX: number,
): { defeatedNow: boolean } {
  if (boss.defeated || boss.state === 'ko') return { defeatedNow: false };
  boss.hp = Math.max(0, boss.hp - damage);
  boss.hitFlash = 0.09;
  boss.vx = knockbackX * 0.4;
  if (boss.hp <= 0) {
    boss.state = 'ko';
    boss.stateTimer = 0.65;
    boss.defeated = true;
    return { defeatedNow: true };
  }
  return { defeatedNow: false };
}

export function addInventoryResource(
  inventory: InventoryItem[],
  itemId: string,
  amount: number,
): void {
  const found = inventory.find((i) => i.id === itemId);
  if (found) {
    found.count += amount;
  }
}

export const FLAME_ORB_HP_RATIO = 0.25;
export const WIND_ORB_DAMAGE_BONUS = 0.3;

/**
 * Every monster kill across Citadel and Isekai has an 8% chance to drop
 * one of the three Elemental Orbs (Flame, Wind, or Electrical).
 */
export function rollMonsterOrbDrop(rng: () => number = Math.random): OrbId | null {
  if (rng() >= ORB_DROP_CHANCE) return null;
  const idx = Math.min(ORB_IDS.length - 1, Math.max(0, Math.floor(rng() * ORB_IDS.length)));
  return ORB_IDS[idx];
}

export function clampSecretsCount(count: number): number {
  return Math.min(TOTAL_HIDDEN_PASSAGES, Math.max(0, count));
}

export function allocateStatPoint(
  player: PlayerState,
  statKey: StatKey,
  requested = 1,
): { ok: boolean; applied: number } {
  if (player.statPoints <= 0 || requested <= 0) {
    return { ok: false, applied: 0 };
  }
  const applied = Math.min(player.statPoints, requested);
  player.statPoints -= applied;
  player.stats[statKey] += applied;

  if (statKey === 'hp') {
    const gain = 15 * applied;
    player.maxHp += gain;
    player.hp = Math.min(player.maxHp, player.hp + gain);
  } else if (statKey === 'speed') {
    const stGain = 4 * applied;
    player.maxStamina += stGain;
    player.stamina = Math.min(player.maxStamina, player.stamina + stGain);
  }

  return { ok: true, applied };
}

export function grantKillStatPoints(
  player: PlayerState,
  kind: 'monster' | 'boss',
): number {
  const pts = kind === 'boss' ? 10 : 1;
  player.statPoints += pts;
  if (kind === 'monster') {
    player.monstersSlain += 1;
  }
  player.level = 1 + player.bossesDefeated * 2 + Math.floor(player.monstersSlain / 3);
  return pts;
}

export function updateWarriorCustomization(
  player: PlayerState,
  patch: Partial<WarriorCustomization>,
): WarriorCustomization {
  player.customization = {
    ...player.customization,
    ...patch,
  };
  return player.customization;
}
