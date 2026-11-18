import { SKILLS, WEAPONS } from './data';
import { applyDamageToBoss, calculateAttackDamage, useInventoryItem } from './rules';
import type {
  ActiveBoss,
  BossBattlePhase,
  BossBattleSlashFx,
  BossBattleSnapshot,
  InventoryItem,
  PlayerState,
  SkillId,
} from './types';

export interface BossBattleState {
  boss: ActiveBoss;
  phase: BossBattlePhase;
  phaseTimer: number;
  phaseDuration: number;
  turnCount: number;
  message: string;
  speaker: string;
  lastPlayerDamage: number | null;
  lastBossDamage: number | null;
  guardActive: boolean;
  evadeBoost: boolean;
  bossFrozenTurns: number;
  slashFx: BossBattleSlashFx | null;
  playerLunge: number;
  bossLunge: number;
  pendingOutcome: 'continue' | 'victory' | 'defeat' | 'run' | 'escape';
  jotaroLine: string | null;
  jotaroVoiceStatus: 'idle' | 'generating' | 'ready' | 'error';
  jotaroVoiceError: string | null;
}

const BOSS_BATTLE_SHOUTS = [
  'MUDA MUDA MUDA! Taste my Stand slash!',
  'WRYYYY! Stand Crimson Cleave!',
  'You are already within my Stand range!',
  'Time accelerates—witness my lethal arc!',
  'ORA?! No—MY Stand strikes faster!',
];

export function createBossBattleState(boss: ActiveBoss): BossBattleState {
  return {
    boss,
    phase: 'intro',
    phaseTimer: 1.15,
    phaseDuration: 1.15,
    turnCount: 1,
    message: boss.def.voiceLine,
    speaker: `${boss.def.name} [${boss.def.standName}]`,
    lastPlayerDamage: null,
    lastBossDamage: null,
    guardActive: false,
    evadeBoost: false,
    bossFrozenTurns: 0,
    slashFx: null,
    playerLunge: 0,
    bossLunge: 0,
    pendingOutcome: 'continue',
    jotaroLine: null,
    jotaroVoiceStatus: 'idle',
    jotaroVoiceError: null,
  };
}

export function toBossBattleSnapshot(b: BossBattleState): BossBattleSnapshot {
  return {
    bossIndex: b.boss.def.index,
    bossName: b.boss.def.name,
    bossTitle: b.boss.def.title,
    standName: b.boss.def.standName,
    biome: b.boss.def.biome,
    climateLabel: b.boss.def.climateLabel,
    attackName: b.boss.def.attackName,
    bossHp: Math.round(b.boss.hp),
    bossMaxHp: Math.round(b.boss.maxHp),
    phase: b.phase,
    message: b.message,
    speaker: b.speaker,
    lastPlayerDamage: b.lastPlayerDamage,
    lastBossDamage: b.lastBossDamage,
    guardActive: b.guardActive,
    bossFrozenTurns: b.bossFrozenTurns,
    primaryColor: b.boss.def.primaryColor,
    secondaryColor: b.boss.def.secondaryColor,
    auraColor: b.boss.def.auraColor,
    jotaroLine: b.jotaroLine,
    jotaroVoiceStatus: b.jotaroVoiceStatus,
    jotaroVoiceError: b.jotaroVoiceError,
  };
}

export function resolvePlayerBattleSword(
  battle: BossBattleState,
  player: PlayerState,
): { ok: boolean; damage: number; defeated: boolean } {
  if (battle.phase !== 'menu') {
    return { ok: false, damage: 0, defeated: false };
  }
  const weapon = WEAPONS[player.equippedWeapon];
  // Slight battle scaling so 1v1 Pokemon duels feel crisp and rewarding
  const baseDmg = calculateAttackDamage(player, 1.15);
  const res = applyDamageToBoss(battle.boss, baseDmg, 0);

  // Restore small stamina on standard sword strike
  player.stamina = Math.min(player.maxStamina, player.stamina + 14);

  const slashStyle: BossBattleSlashFx['style'] =
    weapon.id === 'crescent'
      ? 'cross'
      : weapon.id === 'runeblade' || weapon.id === 'fire_sword'
        ? 'fire'
        : 'sword';

  battle.phase = 'player_anim';
  battle.phaseDuration = 0.92;
  battle.phaseTimer = 0.92;
  battle.lastPlayerDamage = baseDmg;
  battle.lastBossDamage = null;
  battle.speaker = 'Warrior';
  battle.message = `${weapon.styleName}! Slashed ${battle.boss.def.name} for ${baseDmg} DMG!`;
  battle.slashFx = {
    target: 'boss',
    style: slashStyle,
    color: weapon.color,
    accentColor: weapon.accentColor,
    progress: 0,
  };
  battle.pendingOutcome = res.defeatedNow ? 'victory' : 'continue';
  return { ok: true, damage: baseDmg, defeated: res.defeatedNow };
}

export function resolvePlayerBattleSkill(
  battle: BossBattleState,
  player: PlayerState,
  slotIndex: 0 | 1 | 2,
): { ok: boolean; skillId: SkillId; damage: number; defeated: boolean; reason?: string } {
  const skillId = player.skillSlots[slotIndex];
  const skill = SKILLS[skillId];
  if (battle.phase !== 'menu') {
    return { ok: false, skillId, damage: 0, defeated: false, reason: 'Wait for current turn.' };
  }
  if (player.stamina < skill.staminaCost) {
    return {
      ok: false,
      skillId,
      damage: 0,
      defeated: false,
      reason: `Need ${skill.staminaCost} Stamina for ${skill.name}!`,
    };
  }

  player.stamina -= skill.staminaCost;
  const dmg = calculateAttackDamage(player, skill.damageMultiplier * 1.15, true);
  let defeated = false;
  let slashStyle: BossBattleSlashFx['style'] = 'sword';

  if (skillId === 'parry_guard') {
    battle.guardActive = true;
    const chip = Math.round(dmg * 0.45);
    defeated = applyDamageToBoss(battle.boss, chip, 0).defeatedNow;
    battle.lastPlayerDamage = chip;
    battle.message = `Royal Deflect stance raised! Glancing riposte dealt ${chip} DMG!`;
    slashStyle = 'cross';
  } else if (skillId === 'chrono_freeze') {
    battle.bossFrozenTurns = 1;
    defeated = applyDamageToBoss(battle.boss, dmg, 0).defeatedNow;
    battle.lastPlayerDamage = dmg;
    battle.message = `TOKI WO TOMARE! ${battle.boss.def.name} is frozen for 1 turn! (${dmg} DMG)`;
    slashStyle = 'cross';
  } else if (skillId === 'stand_rush') {
    defeated = applyDamageToBoss(battle.boss, dmg, 0).defeatedNow;
    battle.lastPlayerDamage = dmg;
    battle.message = `ORA ORA ORA! Spirit Knight 5-hit barrage carved ${dmg} DMG!`;
    slashStyle = 'barrage';
  } else if (skillId === 'candlefire_wave') {
    defeated = applyDamageToBoss(battle.boss, dmg, 0).defeatedNow;
    battle.lastPlayerDamage = dmg;
    battle.message = `Candlefire Arc! Blazing slash scorched ${battle.boss.def.name} for ${dmg} DMG!`;
    slashStyle = 'fire';
  } else if (skillId === 'sunburst_cleave') {
    defeated = applyDamageToBoss(battle.boss, dmg, 0).defeatedNow;
    battle.lastPlayerDamage = dmg;
    battle.message = `Hamon Sunburst! Golden solar cleave dealt ${dmg} DMG!`;
    slashStyle = 'solar';
  } else {
    // blade_dash
    battle.evadeBoost = true;
    defeated = applyDamageToBoss(battle.boss, dmg, 0).defeatedNow;
    battle.lastPlayerDamage = dmg;
    battle.message = `Phantom Lunge! Piercing flash dealt ${dmg} DMG (+35% Evasion)!`;
    slashStyle = 'sword';
  }

  battle.phase = 'player_anim';
  battle.phaseDuration = 0.82;
  battle.phaseTimer = 0.82;
  battle.lastBossDamage = null;
  battle.speaker = 'Warrior';
  battle.slashFx = {
    target: 'boss',
    style: slashStyle,
    color: skill.color,
    accentColor: '#ffffff',
    progress: 0,
  };
  battle.pendingOutcome = defeated ? 'victory' : 'continue';
  return { ok: true, skillId, damage: dmg, defeated };
}

export function resolveBattlePotion(
  battle: BossBattleState,
  player: PlayerState,
  inventory: InventoryItem[],
  itemId: string,
): { ok: boolean; message: string } {
  if (battle.phase !== 'menu') {
    return { ok: false, message: 'Cannot use a potion mid-animation.' };
  }
  const res = useInventoryItem(player, inventory, itemId);
  if (!res.ok) {
    battle.message = res.message;
    battle.speaker = 'Warrior';
    return res;
  }

  player.stamina = Math.min(player.maxStamina, player.stamina + 20);
  battle.phase = 'potion_anim';
  battle.phaseDuration = 0.65;
  battle.phaseTimer = 0.65;
  battle.speaker = 'Warrior';
  battle.message = `Drank potion! ${res.message} (+20 Stamina)`;
  battle.slashFx = null;
  battle.pendingOutcome = 'continue';
  return res;
}

export function startBattleRun(battle: BossBattleState): boolean {
  if (battle.phase !== 'menu') return false;
  battle.phase = 'run_anim';
  battle.phaseDuration = 0.6;
  battle.phaseTimer = 0.6;
  battle.speaker = 'Warrior';
  battle.message = 'NIGERUNDAYO! Tactical sprint out of Stand range!';
  battle.slashFx = null;
  battle.pendingOutcome = 'run';
  return true;
}

export function startBattleEscape(battle: BossBattleState): boolean {
  if (battle.phase !== 'menu') return false;
  battle.phase = 'escape_anim';
  battle.phaseDuration = 0.65;
  battle.phaseTimer = 0.65;
  battle.speaker = 'Warrior';
  battle.message = 'Tossed a royal smoke vial! Escaping back to last Checkpoint!';
  battle.slashFx = null;
  battle.pendingOutcome = 'escape';
  return true;
}

export function triggerBossCounterTurn(
  battle: BossBattleState,
  player: PlayerState,
): { skippedByFreeze: boolean; damageTaken: number; playerDefeated: boolean; shout: string } {
  if (battle.bossFrozenTurns > 0) {
    battle.bossFrozenTurns -= 1;
    battle.phase = 'enemy_anim';
    battle.phaseDuration = 0.7;
    battle.phaseTimer = 0.7;
    battle.speaker = battle.boss.def.name;
    battle.message = `${battle.boss.def.name} is frozen in Stopped Time and could not slash!`;
    battle.slashFx = null;
    battle.lastBossDamage = 0;
    battle.pendingOutcome = 'continue';
    return {
      skippedByFreeze: true,
      damageTaken: 0,
      playerDefeated: false,
      shout: 'Frozen in time!',
    };
  }

  const pattern = battle.boss.def.attackPattern;
  const patternMult =
    pattern === 'gravity_orb' || pattern === 'magma_eruption'
      ? 1.18
      : pattern === 'pillar_slam' || pattern === 'chrono_shear'
        ? 1.12
        : pattern === 'stand_barrage'
          ? 1.08
          : 1.0;

  const rawDamage = Math.round(
    (13 + Math.floor(battle.boss.def.index * 0.45) + (battle.turnCount % 3) * 2) * patternMult,
  );
  // Speed stat passively shaves off incoming boss grazing damage (up to 25%)
  const speedReduction = Math.min(0.25, player.stats.speed * 0.015);
  let finalDamage = Math.max(2, Math.round(rawDamage * (1 - speedReduction)));

  if (battle.guardActive) {
    finalDamage = Math.max(2, Math.round(finalDamage * (pattern === 'gravity_orb' ? 0.4 : 0.25)));
    battle.guardActive = false;
  } else if (battle.evadeBoost) {
    finalDamage = Math.max(3, Math.round(finalDamage * 0.6));
    battle.evadeBoost = false;
  }

  let extraNote = '';
  if (pattern === 'lightning_overdrive') {
    player.stamina = Math.max(0, player.stamina - 8);
    extraNote = ' · -8 ST Shock';
  }

  player.hp = Math.max(0, player.hp - finalDamage);
  player.hitFlash = 0.16;

  const bossStyleMap: Record<typeof pattern, BossBattleSlashFx['style']> = {
    time_knives: 'knife_volley',
    stand_barrage: 'barrage',
    pillar_slam: 'seismic',
    gravity_orb: 'void_crush',
    blood_scythe: 'cross',
    lightning_overdrive: 'lightning',
    magma_eruption: 'fire',
    chrono_shear: 'stand_claw',
  };

  const shout = battle.boss.def.battleShout;

  battle.phase = 'enemy_anim';
  battle.phaseDuration = 0.95;
  battle.phaseTimer = 0.95;
  battle.lastBossDamage = finalDamage;
  battle.speaker = `${battle.boss.def.name} [${battle.boss.def.standName}]`;
  battle.message = `${shout} (-${finalDamage} HP${extraNote})`;
  battle.slashFx = {
    target: 'player',
    style: bossStyleMap[pattern],
    color: battle.boss.def.auraColor,
    accentColor: battle.boss.def.secondaryColor,
    progress: 0,
  };
  battle.pendingOutcome = player.hp <= 0 ? 'defeat' : 'continue';

  return {
    skippedByFreeze: false,
    damageTaken: finalDamage,
    playerDefeated: player.hp <= 0,
    shout,
  };
}
