import { SKILLS, WEAPONS } from './data';
import {
  FLAME_ORB_HP_RATIO,
  WIND_ORB_DAMAGE_BONUS,
  applyDamageToBoss,
  calculateAttackDamage,
  useInventoryItem,
} from './rules';
import type {
  ActiveBoss,
  BossBattlePhase,
  BossBattleSlashFx,
  BossBattleSnapshot,
  InventoryItem,
  OrbId,
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
  bossStunReason: 'freeze' | 'electric' | null;
  windVulnerable: boolean;
  slashFx: BossBattleSlashFx | null;
  playerLunge: number;
  bossLunge: number;
  activeSkillName: string | null;
  activeSkillPalette: [string, string, string] | null;
  gyroEmote: string | null;
  pendingOutcome: 'continue' | 'victory' | 'defeat' | 'run' | 'escape';
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
    bossStunReason: null,
    windVulnerable: false,
    slashFx: null,
    playerLunge: 0,
    bossLunge: 0,
    activeSkillName: null,
    activeSkillPalette: null,
    gyroEmote: boss.def.isGyroBoss ? (boss.def.emotes?.[0] ?? null) : null,
    pendingOutcome: 'continue',
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
    bossStunReason: b.bossStunReason,
    windVulnerable: b.windVulnerable,
    primaryColor: b.boss.def.primaryColor,
    secondaryColor: b.boss.def.secondaryColor,
    auraColor: b.boss.def.auraColor,
    isMegaBoss: Boolean(b.boss.def.isMegaBoss),
    isGyroBoss: Boolean(b.boss.def.isGyroBoss),
    gyroEmote: b.gyroEmote,
    megaArchetype: b.boss.def.megaArchetype,
    activeSkillName: b.activeSkillName,
    activeSkillPalette: b.activeSkillPalette,
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
  const rawDmg = calculateAttackDamage(player, 1.15);
  const baseDmg = battle.windVulnerable
    ? Math.round(rawDmg * (1 + WIND_ORB_DAMAGE_BONUS))
    : rawDmg;
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
  battle.message = `${weapon.styleName}! Slashed ${battle.boss.def.name} for ${baseDmg} DMG${battle.windVulnerable ? ' (+30% Wind Vuln!)' : ''}!`;
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
): {
  ok: boolean;
  skillId: SkillId;
  damage: number;
  defeated: boolean;
  reason?: string;
} {
  const skillId = player.skillSlots[slotIndex];
  const skill = SKILLS[skillId];
  if (battle.phase !== 'menu') {
    return {
      ok: false,
      skillId,
      damage: 0,
      defeated: false,
      reason: 'Wait for current turn.',
    };
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
  const rawDmg = calculateAttackDamage(player, skill.damageMultiplier * 1.15, true);
  const dmg = battle.windVulnerable
    ? Math.round(rawDmg * (1 + WIND_ORB_DAMAGE_BONUS))
    : rawDmg;
  const windNote = battle.windVulnerable ? ' [+30% Wind!]' : '';
  let defeated = false;
  let slashStyle: BossBattleSlashFx['style'] = 'sword';

  if (skillId === 'parry_guard') {
    battle.guardActive = true;
    const chip = Math.round(dmg * 0.45);
    defeated = applyDamageToBoss(battle.boss, chip, 0).defeatedNow;
    battle.lastPlayerDamage = chip;
    battle.message = `Royal Deflect stance raised! Glancing riposte dealt ${chip} DMG${windNote}!`;
    slashStyle = 'cross';
  } else if (skillId === 'chrono_freeze') {
    battle.bossFrozenTurns += 1;
    battle.bossStunReason = battle.bossStunReason ?? 'freeze';
    defeated = applyDamageToBoss(battle.boss, dmg, 0).defeatedNow;
    battle.lastPlayerDamage = dmg;
    battle.message = `TOKI WO TOMARE! ${battle.boss.def.name} is frozen for 1 turn! (${dmg} DMG${windNote})`;
    slashStyle = 'cross';
  } else if (skillId === 'stand_rush') {
    defeated = applyDamageToBoss(battle.boss, dmg, 0).defeatedNow;
    battle.lastPlayerDamage = dmg;
    battle.message = `ORA ORA ORA! Pixel Star Platinum punches ${battle.boss.def.name} for ${dmg} DMG${windNote}!`;
    slashStyle = 'ora_barrage';
  } else if (skillId === 'candlefire_wave') {
    defeated = applyDamageToBoss(battle.boss, dmg, 0).defeatedNow;
    battle.lastPlayerDamage = dmg;
    battle.message = `Candlefire Arc! Blazing slash scorched ${battle.boss.def.name} for ${dmg} DMG${windNote}!`;
    slashStyle = 'fire';
  } else if (skillId === 'sunburst_cleave') {
    defeated = applyDamageToBoss(battle.boss, dmg, 0).defeatedNow;
    battle.lastPlayerDamage = dmg;
    battle.message = `Hamon Sunburst! Golden solar cleave dealt ${dmg} DMG${windNote}!`;
    slashStyle = 'solar';
  } else {
    // blade_dash
    battle.evadeBoost = true;
    defeated = applyDamageToBoss(battle.boss, dmg, 0).defeatedNow;
    battle.lastPlayerDamage = dmg;
    battle.message = `Phantom Lunge! Piercing flash dealt ${dmg} DMG${windNote} (+35% Evasion)!`;
    slashStyle = 'sword';
  }

  battle.phase = 'player_anim';
  const animDur = skillId === 'stand_rush' ? 2.0 : 0.82;
  battle.phaseDuration = animDur;
  battle.phaseTimer = animDur;
  battle.lastBossDamage = null;
  battle.speaker = skillId === 'stand_rush' ? 'Star Platinum [ORA]' : 'Warrior';
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

export function resolveBattleOrb(
  battle: BossBattleState,
  inventory: InventoryItem[],
  orbId: OrbId,
): { ok: boolean; damage: number; defeated: boolean; message: string } {
  if (battle.phase !== 'menu') {
    return { ok: false, damage: 0, defeated: false, message: 'Wait for your turn.' };
  }
  const orbItem = inventory.find((i) => i.id === orbId);
  if (!orbItem || orbItem.count <= 0) {
    return { ok: false, damage: 0, defeated: false, message: 'No orbs of that element left!' };
  }

  orbItem.count -= 1;
  battle.lastBossDamage = null;

  if (orbId === 'orb_flame') {
    const dmg = Math.max(1, Math.round(battle.boss.maxHp * FLAME_ORB_HP_RATIO));
    const res = applyDamageToBoss(battle.boss, dmg, 0);
    battle.phase = 'player_anim';
    battle.phaseDuration = 0.85;
    battle.phaseTimer = 0.85;
    battle.lastPlayerDamage = dmg;
    battle.speaker = 'Flame Orb';
    battle.message = `Flame Orb detonated! Scorched ${battle.boss.def.name} for ${dmg} DMG (25% Max HP)!`;
    battle.slashFx = {
      target: 'boss',
      style: 'orb_flame',
      color: '#f97316',
      accentColor: '#fef08a',
      progress: 0,
    };
    battle.pendingOutcome = res.defeatedNow ? 'victory' : 'continue';
    return { ok: true, damage: dmg, defeated: res.defeatedNow, message: battle.message };
  }

  if (orbId === 'orb_wind') {
    battle.windVulnerable = true;
    battle.phase = 'player_anim';
    battle.phaseDuration = 0.78;
    battle.phaseTimer = 0.78;
    battle.lastPlayerDamage = null;
    battle.speaker = 'Wind Orb';
    battle.message = `Gale Vortex! ${battle.boss.def.name} now takes +30% EXTRA DMG from all attacks!`;
    battle.slashFx = {
      target: 'boss',
      style: 'orb_wind',
      color: '#2dd4bf',
      accentColor: '#ccfbf1',
      progress: 0,
    };
    battle.pendingOutcome = 'continue';
    return { ok: true, damage: 0, defeated: false, message: battle.message };
  }

  // orb_electric
  battle.bossFrozenTurns += 1;
  battle.bossStunReason = 'electric';
  battle.phase = 'player_anim';
  battle.phaseDuration = 0.82;
  battle.phaseTimer = 0.82;
  battle.lastPlayerDamage = null;
  battle.speaker = 'Electrical Orb';
  battle.message = `High-Voltage Surge! ${battle.boss.def.name} is STUNNED for 1 turn!`;
  battle.slashFx = {
    target: 'boss',
    style: 'orb_electric',
    color: '#facc15',
    accentColor: '#38bdf8',
    progress: 0,
  };
  battle.pendingOutcome = 'continue';
  return { ok: true, damage: 0, defeated: false, message: battle.message };
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
    const isElectric = battle.bossStunReason === 'electric';
    battle.bossFrozenTurns -= 1;
    if (battle.bossFrozenTurns === 0) {
      battle.bossStunReason = null;
    }
    battle.phase = 'enemy_anim';
    battle.phaseDuration = 0.7;
    battle.phaseTimer = 0.7;
    battle.speaker = battle.boss.def.name;
    battle.message = isElectric
      ? `${battle.boss.def.name} is STUNNED by Electrical Orb lightning and loses their turn!`
      : `${battle.boss.def.name} is frozen in Stopped Time and could not slash!`;
    battle.slashFx = null;
    battle.lastBossDamage = 0;
    battle.pendingOutcome = 'continue';
    return {
      skippedByFreeze: true,
      damageTaken: 0,
      playerDefeated: false,
      shout: isElectric ? 'Stunned by lightning!' : 'Frozen in time!',
    };
  }

  if (battle.boss.def.isGyroBoss) {
    const skills = battle.boss.def.megaSkills ?? [];
    const skill = skills.length > 0
      ? skills[(battle.turnCount - 1) % skills.length]
      : {
          id: 'gyro_emerald_spin',
          name: 'Emerald Flame Steel Ball',
          animStyle: 'gyro_green_ball' as const,
          palette: ['#22c55e', '#86efac', '#fde047'] as [string, string, string],
          damageMult: 1,
          shout: 'Nyo-ho! Catch this spinning green-flaming Steel Ball!',
        };
    const emotes = battle.boss.def.emotes ?? [];
    const emote = emotes.length > 0 ? emotes[(battle.turnCount - 1) % emotes.length] : 'Nyo-ho!';
    battle.gyroEmote = emote;

    // Exact player's attack damage! Guard/Evade still mitigate strategically if chosen
    const baseGyroAtk = battle.boss.def.gyroAttackDamage ?? calculateAttackDamage(player, 1, false);
    let finalDamage = Math.max(1, Math.round(baseGyroAtk));
    if (battle.guardActive) {
      finalDamage = Math.max(1, Math.round(finalDamage * 0.35));
      battle.guardActive = false;
    } else if (battle.evadeBoost) {
      finalDamage = Math.max(1, Math.round(finalDamage * 0.65));
      battle.evadeBoost = false;
    }

    player.hp = Math.max(0, player.hp - finalDamage);
    player.hitFlash = 0.22;

    battle.phase = 'enemy_anim';
    battle.phaseDuration = 1.1;
    battle.phaseTimer = 1.1;
    battle.lastBossDamage = finalDamage;
    battle.activeSkillName = skill.name;
    battle.activeSkillPalette = skill.palette;
    battle.speaker = 'Gyro Zeppeli [BALL BREAKER]';
    battle.message = `${emote} ${skill.name.toUpperCase()}! (-${finalDamage} HP)`;
    battle.slashFx = {
      target: 'player',
      style: 'gyro_green_ball',
      color: skill.palette[0],
      accentColor: skill.palette[1],
      palette: skill.palette,
      skillName: skill.name,
      progress: 0,
    };
    battle.pendingOutcome = player.hp <= 0 ? 'defeat' : 'continue';

    return {
      skippedByFreeze: false,
      damageTaken: finalDamage,
      playerDefeated: player.hp <= 0,
      shout: skill.shout,
    };
  }

  if (battle.boss.def.isMegaBoss && battle.boss.def.megaSkills && battle.boss.def.megaSkills.length > 0) {
    const skills = battle.boss.def.megaSkills;
    const skill = skills[(battle.turnCount - 1) % skills.length];
    const effectiveFloor = Math.max(1, battle.boss.def.index % 100);
    const rawDamage = Math.round(
      (18 + Math.floor(effectiveFloor * 0.55) + (battle.turnCount % 2) * 3) * skill.damageMult,
    );
    const speedReduction = Math.min(0.25, player.stats.speed * 0.015);
    let finalDamage = Math.max(4, Math.round(rawDamage * (1 - speedReduction)));

    if (battle.guardActive) {
      finalDamage = Math.max(3, Math.round(finalDamage * 0.35));
      battle.guardActive = false;
    } else if (battle.evadeBoost) {
      finalDamage = Math.max(4, Math.round(finalDamage * 0.65));
      battle.evadeBoost = false;
    }

    player.hp = Math.max(0, player.hp - finalDamage);
    player.hitFlash = 0.2;

    battle.phase = 'enemy_anim';
    battle.phaseDuration = 1.05;
    battle.phaseTimer = 1.05;
    battle.lastBossDamage = finalDamage;
    battle.activeSkillName = skill.name;
    battle.activeSkillPalette = skill.palette;
    battle.speaker = `${battle.boss.def.name} [MEGA BOSS]`;
    battle.message = `${skill.name.toUpperCase()}! ${skill.shout} (-${finalDamage} HP)`;
    battle.slashFx = {
      target: 'player',
      style: skill.animStyle,
      color: skill.palette[0],
      accentColor: skill.palette[1],
      palette: skill.palette,
      skillName: skill.name,
      progress: 0,
    };
    battle.pendingOutcome = player.hp <= 0 ? 'defeat' : 'continue';

    return {
      skippedByFreeze: false,
      damageTaken: finalDamage,
      playerDefeated: player.hp <= 0,
      shout: skill.shout,
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
  const diffMult = battle.boss.def.difficultyMultiplier ?? 1;

  const rawDamage = Math.round(
    (13 + Math.floor(battle.boss.def.index * 0.45) + (battle.turnCount % 3) * 2) *
      patternMult *
      diffMult,
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
    gyro_spin: 'gyro_green_ball',
  };

  const shout = battle.boss.def.battleShout;

  battle.phase = 'enemy_anim';
  battle.phaseDuration = 0.95;
  battle.phaseTimer = 0.95;
  battle.lastBossDamage = finalDamage;
  battle.activeSkillName = battle.boss.def.attackName;
  battle.activeSkillPalette = null;
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
