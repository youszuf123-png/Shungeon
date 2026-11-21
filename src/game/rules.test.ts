import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BOSSES_PER_BIOME,
  ORB_DROP_CHANCE,
  POTION_SHOP_IDS,
  TOTAL_BOSSES,
  TOTAL_HIDDEN_PASSAGES,
  WEAPONS,
  WEAPON_SHOP_ORDER,
  createGyroZeppeliBossDef,
  getBiomeForBossIndex,
  getBossDef,
  getBossDifficultyMultiplier,
} from './data';
import { CHUNK_WIDTH, generateChunk, getBiomeForChunk } from './worldGen';
import {
  addInventoryResource,
  allocateStatPoint,
  applyDamageToBoss,
  assignSkillToSlot,
  calculateAttackDamage,
  computeWeaponHitbox,
  craftWeapon,
  createInitialInventory,
  createInitialPlayer,
  equipWeapon,
  getMonsterLevelMultiplier,
  grantKillStatPoints,
  recordBossFightProgress,
  rollMonsterOrbDrop,
  startWeaponAttack,
  stepPlayerPhysics,
  triggerPlayerDash,
  triggerSkillSlot,
  triggerSpinPokeDash,
  updateWarriorCustomization,
  useInventoryItem,
} from './rules';
import {
  createBossBattleState,
  resolveBattleOrb,
  resolveBattlePotion,
  resolvePlayerBattleSkill,
  resolvePlayerBattleSword,
  startBattleEscape,
  startBattleRun,
  triggerBossCounterTurn,
} from './battle';
import {
  MEGA_BOSS_SPAWN_CHANCE,
  createMegaBossDef,
  createMegaBossInstance,
  shouldTriggerMegaBossGlitch,
} from './megaBoss';
import {
  canPlayerEngageBoss,
  createSavePayload,
  normalizeLoadedSave,
  toSaveSummary,
} from './saveSystem';
import {
  GUILD_MISSIONS,
  ISEKAI_IDLE_TRANSPORT_SECONDS,
  PURPLE_FLAME_SKILLS,
  buyOrEquipWardrobeItem,
  buyOrEquipWeaponShopItem,
  buyPotionShopItem,
  canAccessGuildFloor2,
  canStartGuildMission,
  createBanditWave,
  createDemonKingPurpleFlameCast,
  createDemonRealmWave,
  createGoblinDungeonWave,
  createGuildNpcs,
  createThreeDemonKingsInit,
  createTownNpcs,
  promoteGuildRankAfterMission,
  resetPlayerForIsekai,
  shouldIdleTriggerIsekai,
  stepIsekaiNpcs,
} from './isekai';

test('world generates 120 unique bosses across 3 biomes (1-40 castle, 41-80 volcano, 81-120 forest)', () => {
  const names = new Set<string>();
  const voiceLines = new Set<string>();
  const climates = new Set<string>();
  const attackPatterns = new Set<string>();

  for (let i = 1; i <= TOTAL_BOSSES; i++) {
    const boss = getBossDef(i);
    names.add(`${boss.index}:${boss.name}:${boss.standName}`);
    voiceLines.add(boss.voiceLine);
    climates.add(boss.climate);
    attackPatterns.add(boss.attackPattern);
    if (i <= BOSSES_PER_BIOME) {
      assert.equal(boss.biome, 'castle');
      assert.equal(getBiomeForBossIndex(i), 'castle');
    } else if (i <= BOSSES_PER_BIOME * 2) {
      assert.equal(boss.biome, 'volcano');
      assert.equal(getBiomeForBossIndex(i), 'volcano');
    } else {
      assert.equal(boss.biome, 'forest');
      assert.equal(getBiomeForBossIndex(i), 'forest');
    }
    assert.ok(boss.music.bpm >= 120);
    assert.ok(boss.voiceLine.length > 10);
    assert.ok(boss.battleShout.length > 4);
    assert.ok(boss.scaleFactor >= 1.4);
  }
  assert.equal(names.size, TOTAL_BOSSES);
  assert.equal(voiceLines.size, TOTAL_BOSSES);
  assert.equal(climates.size, 12);
  assert.equal(attackPatterns.size, 8);
  assert.equal(getBiomeForChunk(1), 'castle');
  assert.equal(getBiomeForChunk(41), 'volcano');
  assert.equal(getBiomeForChunk(81), 'forest');
});

test('endless dungeon contains 108 hidden passages with puzzle mechanics starting in chunk 0', () => {
  let passageCount = 0;
  const puzzleTypes = new Set<string>();
  for (let c = 0; c < TOTAL_BOSSES; c++) {
    const chunk = generateChunk(c);
    if (chunk.hiddenPassage) {
      passageCount += 1;
      puzzleTypes.add(chunk.hiddenPassage.puzzleType);
    }
  }
  assert.equal(passageCount, TOTAL_HIDDEN_PASSAGES);
  assert.equal(puzzleTypes.size, 4);

  const chunk0 = generateChunk(0);
  assert.ok(chunk0.hiddenPassage !== null);
  assert.ok(chunk0.interactables.some((p) => p.kind === 'throne'));
  assert.ok(chunk0.interactables.some((p) => p.kind === 'checkpoint'));
  assert.ok(chunk0.candles.length >= 4);
  assert.equal(chunk0.startX, 0);
  assert.equal(chunk0.endX, CHUNK_WIDTH);
});

test('systematic weapon styles and 3-slot special skill system behave distinctly', () => {
  const player = createInitialPlayer();
  const inv = createInitialInventory();

  assert.equal(player.skillSlots.length, 3);
  assert.equal(player.equippedWeapon, 'claymore');
  const claymoreDmg = calculateAttackDamage(player);

  assert.equal(equipWeapon(player, 'rapier'), true);
  const rapierDmg = calculateAttackDamage(player);
  assert.notEqual(claymoreDmg, rapierDmg);
  assert.ok(WEAPONS.rapier.windup < WEAPONS.claymore.windup);

  // Crafting locked weapon fails without enough resources, succeeds when sufficient
  const failCraft = craftWeapon(player, inv, 'crescent');
  assert.equal(failCraft.ok, false);
  const ember = inv.find((i) => i.id === 'royal_ember')!;
  ember.count = 5;
  const okCraft = craftWeapon(player, inv, 'crescent');
  assert.equal(okCraft.ok, true);
  assert.equal(player.equippedWeapon, 'crescent');

  // Skill slot swap and trigger
  assignSkillToSlot(player, 2, 'chrono_freeze');
  assert.equal(player.skillSlots[2], 'chrono_freeze');
  const cast = triggerSkillSlot(player, 2);
  assert.equal(cast.ok, true);
  assert.equal(cast.skillId, 'chrono_freeze');
  assert.ok(player.skillCooldowns[2] > 0);
  // Cannot immediately recast on cooldown
  assert.equal(triggerSkillSlot(player, 2).ok, false);

  // Attack phase starts cleanly
  assert.equal(startWeaponAttack(player), true);
  assert.equal(player.attackPhase, 'windup');
});

test('platform physics, potion healing, and boss defeat logic work deterministically', () => {
  const player = createInitialPlayer();
  const inv = createInitialInventory();
  const chunk0 = generateChunk(0);

  // Drop player onto floor
  for (let i = 0; i < 40; i++) {
    stepPlayerPhysics(
      player,
      { left: false, right: false, jumpJustPressed: false, jumpHeld: false },
      chunk0.platforms,
      0.016,
    );
  }
  assert.equal(player.onGround, true);

  // Jump takeoff
  const jumpRes = stepPlayerPhysics(
    player,
    { left: false, right: true, jumpJustPressed: true, jumpHeld: true },
    chunk0.platforms,
    0.016,
  );
  assert.equal(jumpRes.jumped, true);
  assert.ok(player.vy < 0);

  // Healing potion
  player.hp = 50;
  const heal = useInventoryItem(player, inv, 'crimson_vial');
  assert.equal(heal.ok, true);
  assert.equal(player.hp, 95);

  // Boss defeat
  const chunk1 = generateChunk(1);
  assert.ok(chunk1.boss !== null);
  const boss = chunk1.boss!;
  const res = applyDamageToBoss(boss, boss.maxHp + 10, 40);
  assert.equal(res.defeatedNow, true);
  assert.equal(boss.defeated, true);
  assert.equal(boss.state, 'ko');
});

test('pokemon-style boss battle supports sword/skill slash attacks, boss counter-slashes, potions, run, and escape', () => {
  const player = createInitialPlayer();
  const inv = createInitialInventory();
  const chunk1 = generateChunk(1);
  const boss = chunk1.boss!;
  const battle = createBossBattleState(boss);

  assert.equal(battle.phase, 'intro');
  battle.phase = 'menu';

  // Player Sword Slash triggers slash animation on boss
  const swordHit = resolvePlayerBattleSword(battle, player);
  assert.equal(swordHit.ok, true);
  assert.ok(swordHit.damage > 0);
  assert.equal(battle.phase, 'player_anim');
  assert.equal(battle.slashFx?.target, 'boss');

  // Boss counter-attack slashes player with pattern-matched style
  const counter = triggerBossCounterTurn(battle, player);
  assert.equal(counter.skippedByFreeze, false);
  assert.ok(counter.damageTaken > 0);
  assert.equal(battle.phase, 'enemy_anim');
  assert.equal(battle.slashFx?.target, 'player');
  assert.ok(
    [
      'stand_claw',
      'knife_volley',
      'seismic',
      'void_crush',
      'lightning',
      'fire',
    ].includes(battle.slashFx?.style ?? ''),
  );

  // Potion heals player inside battle menu
  battle.phase = 'menu';
  const hpBefore = player.hp;
  const pot = resolveBattlePotion(battle, player, inv, 'crimson_vial');
  assert.equal(pot.ok, true);
  assert.ok(player.hp > hpBefore);
  assert.equal(battle.phase, 'potion_anim');

  // Chrono Freeze skill skips boss turn
  battle.phase = 'menu';
  assignSkillToSlot(player, 0, 'chrono_freeze');
  const freezeRes = resolvePlayerBattleSkill(battle, player, 0);
  assert.equal(freezeRes.ok, true);
  assert.equal(battle.bossFrozenTurns, 1);
  const frozenCounter = triggerBossCounterTurn(battle, player);
  assert.equal(frozenCounter.skippedByFreeze, true);
  assert.equal(frozenCounter.damageTaken, 0);

  // Run and Escape state transitions
  battle.phase = 'menu';
  assert.equal(startBattleRun(battle), true);
  assert.equal(battle.phase, 'run_anim');
  assert.equal(battle.pendingOutcome, 'run');

  battle.phase = 'menu';
  assert.equal(startBattleEscape(battle), true);
  assert.equal(battle.phase, 'escape_anim');
  assert.equal(battle.pendingOutcome, 'escape');
});

test('Solo Leveling stat points grant +1 per monster and +10 per boss and scale skillDmg, attack, hp, and speed', () => {
  const player = createInitialPlayer();
  assert.equal(player.statPoints, 0);

  // +1 per monster kill, +10 per boss kill
  assert.equal(grantKillStatPoints(player, 'monster'), 1);
  assert.equal(player.statPoints, 1);
  assert.equal(player.monstersSlain, 1);

  assert.equal(grantKillStatPoints(player, 'boss'), 10);
  assert.equal(player.statPoints, 11);

  const baseSword = calculateAttackDamage(player, 1, false);
  const baseSkill = calculateAttackDamage(player, 1.5, true);
  const baseMaxHp = player.maxHp;
  const baseMaxStamina = player.maxStamina;

  // Allocate into attack, skillDmg, hp, speed
  assert.deepEqual(allocateStatPoint(player, 'attack', 3), { ok: true, applied: 3 });
  assert.deepEqual(allocateStatPoint(player, 'skillDmg', 4), { ok: true, applied: 4 });
  assert.deepEqual(allocateStatPoint(player, 'hp', 2), { ok: true, applied: 2 });
  assert.deepEqual(allocateStatPoint(player, 'speed', 2), { ok: true, applied: 2 });

  assert.equal(player.statPoints, 0);
  assert.equal(allocateStatPoint(player, 'attack', 1).ok, false);

  assert.ok(calculateAttackDamage(player, 1, false) > baseSword);
  assert.ok(calculateAttackDamage(player, 1.5, true) > baseSkill);
  assert.equal(player.maxHp, baseMaxHp + 30);
  assert.equal(player.maxStamina, baseMaxStamina + 8);
});

import { getBossFacialTraits } from './bossFaces';

test('all 120 bosses have unique deterministic facial trait designs', () => {
  const signatures = new Set<string>();
  for (let i = 1; i <= TOTAL_BOSSES; i++) {
    const traits = getBossFacialTraits(i);
    signatures.add(traits.signatureKey);
  }
  assert.equal(signatures.size, TOTAL_BOSSES);
});

test('extended jump arc reaches higher apex and blade dash glides significantly farther', () => {
  const chunk0 = generateChunk(0);

  // Measure full sustained jump apex height above floor
  const jumper = createInitialPlayer();
  for (let i = 0; i < 40; i++) {
    stepPlayerPhysics(
      jumper,
      { left: false, right: false, jumpJustPressed: false, jumpHeld: false },
      chunk0.platforms,
      0.016,
    );
  }
  const floorPlayerY = jumper.y;
  let minJumpY = floorPlayerY;
  stepPlayerPhysics(
    jumper,
    { left: false, right: false, jumpJustPressed: true, jumpHeld: true },
    chunk0.platforms,
    0.016,
  );
  for (let i = 0; i < 45; i++) {
    stepPlayerPhysics(
      jumper,
      { left: false, right: false, jumpJustPressed: false, jumpHeld: true },
      chunk0.platforms,
      0.016,
    );
    if (jumper.y < minJumpY) minJumpY = jumper.y;
  }
  const jumpApexHeight = floorPlayerY - minJumpY;
  assert.ok(jumpApexHeight >= 75, `Expected jump apex >= 75px, got ${jumpApexHeight}`);

  // Measure Phantom Lunge dash glide distance over 0.40s
  const dasher = createInitialPlayer();
  const startX = dasher.x;
  dasher.vx = 465;
  for (let i = 0; i < 25; i++) {
    stepPlayerPhysics(
      dasher,
      { left: false, right: false, jumpJustPressed: false, jumpHeld: false },
      chunk0.platforms,
      0.016,
    );
  }
  const dashDist = dasher.x - startX;
  assert.ok(dashDist >= 110, `Expected dash distance >= 110px, got ${dashDist}`);
});

test('dark hidden passage behind Checkpoint 1 grants OP Fire Sword with 2x damage and supports knight customization', () => {
  const darkChunk = generateChunk(-1);
  assert.equal(darkChunk.startX, -CHUNK_WIDTH);
  assert.equal(darkChunk.endX, 0);
  const fireChest = darkChunk.interactables.find((p) => p.id === 'chest_fire_sword_op');
  assert.ok(fireChest !== undefined);
  assert.equal(fireChest.rewardWeaponId, 'fire_sword');

  // Walking backwards past x = 0 enters chunk -1
  const walker = createInitialPlayer();
  for (let i = 0; i < 90; i++) {
    stepPlayerPhysics(
      walker,
      { left: true, right: false, jumpJustPressed: false, jumpHeld: false },
      [...darkChunk.platforms, ...generateChunk(0).platforms],
      0.016,
    );
  }
  assert.ok(walker.x < 0, `Expected walker.x < 0, got ${walker.x}`);

  // OP Fire Sword applies true 2x damageMultiplier
  assert.equal(WEAPONS.fire_sword.damageMultiplier, 2);
  const p = createInitialPlayer();
  p.unlockedWeapons.push('fire_sword');
  equipWeapon(p, 'fire_sword');
  const fireDmg = calculateAttackDamage(p, 1, false);
  assert.equal(fireDmg, WEAPONS.fire_sword.damage * 2);

  // Knight appearance customization updates cloak/armor/visor/plume colors
  updateWarriorCustomization(p, { cloakColor: '#1d4ed8', visorColor: '#38bdf8' });
  assert.equal(p.customization.cloakColor, '#1d4ed8');
  assert.equal(p.customization.visorColor, '#38bdf8');
});

test('mega boss triggers at exact 10% threshold, features DIO & Undead Knight with 4 vibrant skills and higher HP', () => {
  assert.equal(MEGA_BOSS_SPAWN_CHANCE, 0.1);
  assert.equal(shouldTriggerMegaBossGlitch(() => 0.0), true);
  assert.equal(shouldTriggerMegaBossGlitch(() => 0.099), true);
  assert.equal(shouldTriggerMegaBossGlitch(() => 0.1), false);
  assert.equal(shouldTriggerMegaBossGlitch(() => 0.95), false);

  const regular10 = getBossDef(10);
  const dio = createMegaBossDef('mega_dio', 10, 'castle');
  const knight = createMegaBossDef('mega_undead_knight', 10, 'volcano');

  assert.equal(dio.isMegaBoss, true);
  assert.equal(knight.isMegaBoss, true);
  assert.ok(dio.maxHp > regular10.maxHp);
  assert.ok(knight.maxHp > regular10.maxHp);
  assert.equal(dio.megaSkills?.length, 4);
  assert.equal(knight.megaSkills?.length, 4);

  const player = createInitialPlayer();
  player.maxHp = 500;
  player.hp = 500;
  const megaInst = createMegaBossInstance('mega_dio', 10, 'castle', 400, 224);
  const battle = createBossBattleState(megaInst);
  assert.equal(battle.boss.def.isMegaBoss, true);

  const seenSkills = new Set<string>();
  const seenStyles = new Set<string>();
  for (let turn = 0; turn < 4; turn++) {
    battle.turnCount = turn + 1;
    battle.phase = 'menu';
    const counter = triggerBossCounterTurn(battle, player);
    assert.equal(counter.skippedByFreeze, false);
    assert.ok(counter.damageTaken > 0);
    assert.ok(battle.activeSkillName);
    seenSkills.add(battle.activeSkillName!);
    seenStyles.add(battle.slashFx?.style ?? '');
  }
  assert.equal(seenSkills.size, 4);
  assert.equal(seenStyles.size, 4);
});

test('chunk 41 spawns breakable bridge over volcano pit and transitions cleanly to volcano floor', () => {
  const chunk41 = generateChunk(41);
  assert.equal(chunk41.biome, 'volcano');
  const slipBridge = chunk41.platforms.find((p) => p.id === 'bridge_41_slip');
  assert.ok(slipBridge !== undefined);
  assert.equal(slipBridge.breakable, true);
  assert.equal(slipBridge.kind, 'bridge');
  assert.ok(chunk41.platforms.some((p) => p.id === 'ledge_41_pit_escape'));
  assert.ok(chunk41.platforms.some((p) => p.id === 'ledge_41_forge_catwalk'));
});

test('save system roundtrips full player progress and guest co-op boss lock prevents boss engagement', () => {
  const player = createInitialPlayer();
  player.x = 1420;
  player.gold = 345;
  player.level = 6;
  player.bossesDefeated = 5;
  player.unlockedWeapons.push('fire_sword');
  player.equippedWeapon = 'fire_sword';
  allocateStatPoint(player, 'attack', 0);
  updateWarriorCustomization(player, { cloakColor: '#1e3a8a', visorColor: '#22d3ee' });

  const inv = createInitialInventory();
  const payload = createSavePayload({
    saveId: 'slot alpha',
    playerName: 'Arthur',
    biome: 'volcano',
    player,
    inventory: inv,
    defeatedBosses: new Set([1, 2, 3, 4, 5]),
    discoveredSecrets: new Set(['dark_sanctum_fire_sword', 'sec_1']),
    openedChests: new Set(['chest_fire_sword_op']),
    volcanoBridgeFallTriggered: true,
    darkSanctumDiscovered: true,
  });

  const summary = toSaveSummary(payload);
  assert.equal(summary.saveId, 'slot_alpha');
  assert.equal(summary.gold, 345);
  assert.equal(summary.bossesDefeated, 5);

  const parsed = normalizeLoadedSave(JSON.parse(JSON.stringify(payload)));
  assert.ok(parsed !== null);
  assert.equal(parsed.playerName, 'Arthur');
  assert.equal(parsed.biome, 'volcano');
  assert.equal(parsed.player.equippedWeapon, 'fire_sword');
  assert.equal(parsed.player.customization.visorColor, '#22d3ee');
  assert.equal(parsed.player.vx, 0);
  assert.deepEqual(parsed.defeatedBosses, [1, 2, 3, 4, 5]);
  assert.equal(parsed.volcanoBridgeFallTriggered, true);
  assert.equal(parsed.darkSanctumDiscovered, true);

  assert.equal(canPlayerEngageBoss('host'), true);
  assert.equal(canPlayerEngageBoss('guest'), false);
});

test('knight remains completely stationary after bossfight ends with idle inputs', () => {
  const chunk0 = generateChunk(0);
  const player = createInitialPlayer();
  player.vx = 0;
  player.vy = 0;
  const xBefore = player.x;
  for (let i = 0; i < 30; i++) {
    stepPlayerPhysics(
      player,
      { left: false, right: false, jumpJustPressed: false, jumpHeld: false },
      chunk0.platforms,
      0.016,
    );
  }
  assert.equal(player.vx, 0);
  assert.equal(player.x, xBefore);
});

test('dash bursts forward with cooldown, monsters scale x1.4 per level, and 5 boss fights trigger 60s cooldown', () => {
  const player = createInitialPlayer();
  player.facing = 1;
  const startStam = player.stamina;
  assert.equal(triggerPlayerDash(player), true);
  assert.ok(player.vx >= 430);
  assert.ok(player.dashCooldown > 0.9);
  assert.equal(player.stamina, startStam - 10);
  // Cannot immediately double-dash while on cooldown
  assert.equal(triggerPlayerDash(player), false);

  // Monsters x1.4 per level
  assert.equal(getMonsterLevelMultiplier(1), 1);
  assert.equal(getMonsterLevelMultiplier(2), 1.4);
  assert.equal(getMonsterLevelMultiplier(3), 1.8);

  // 5 boss fights trigger 60s boss cooldown
  let streak = 0;
  for (let fight = 1; fight <= 4; fight++) {
    const step = recordBossFightProgress(streak);
    assert.equal(step.triggeredCooldown, false);
    assert.equal(step.nextStreak, fight);
    streak = step.nextStreak;
  }
  const fifth = recordBossFightProgress(streak);
  assert.equal(fifth.triggeredCooldown, true);
  assert.equal(fifth.cooldownSeconds, 60);
  assert.equal(fifth.nextStreak, 0);
});

test('boss difficulty scales +40% every 10 bosses and Gyro Zeppeli matches 3x player HP and exact player ATK', () => {
  assert.equal(getBossDifficultyMultiplier(1), 1);
  assert.equal(getBossDifficultyMultiplier(10), 1);
  assert.equal(getBossDifficultyMultiplier(11), 1.4);
  assert.equal(getBossDifficultyMultiplier(21), 1.8);
  assert.equal(getBossDifficultyMultiplier(100), 4.6);

  const player = createInitialPlayer();
  player.maxHp = 220;
  player.hp = 220;
  allocateStatPoint(player, 'attack', 0);
  const playerAtk = calculateAttackDamage(player, 1, false);
  const gyroDef = createGyroZeppeliBossDef(player.maxHp, playerAtk);

  assert.equal(gyroDef.index, 101);
  assert.equal(gyroDef.name, 'Gyro Zeppeli');
  assert.equal(gyroDef.isGyroBoss, true);
  assert.equal(gyroDef.maxHp, 660);
  assert.equal(gyroDef.gyroAttackDamage, playerAtk);
  assert.ok((gyroDef.emotes?.length ?? 0) >= 3);

  const gyroBoss = {
    def: gyroDef,
    x: 500,
    y: 180,
    vx: 0,
    vy: 0,
    w: 44,
    h: 64,
    hp: gyroDef.maxHp,
    maxHp: gyroDef.maxHp,
    facing: -1 as const,
    state: 'idle' as const,
    stateTimer: 0,
    hitFlash: 0,
    posePhase: 0,
    arenaMinX: 400,
    arenaMaxX: 600,
    defeated: false,
  };
  const battle = createBossBattleState(gyroBoss);
  battle.phase = 'menu';
  const counter = triggerBossCounterTurn(battle, player);
  assert.equal(counter.skippedByFreeze, false);
  assert.equal(counter.damageTaken, playerAtk);
  assert.equal(battle.slashFx?.style, 'gyro_green_ball');
  assert.ok(battle.gyroEmote && battle.gyroEmote.length > 0);
});

test('2-minute idle trigger and Isekai arrival reset stats while keeping combat, weapons, skills & F-Rank badge', () => {
  assert.equal(ISEKAI_IDLE_TRANSPORT_SECONDS, 120);
  assert.equal(shouldIdleTriggerIsekai('citadel', 119.9, true, false), false);
  assert.equal(shouldIdleTriggerIsekai('citadel', 120, true, false), true);
  assert.equal(shouldIdleTriggerIsekai('citadel', 150, true, true), false);
  assert.equal(shouldIdleTriggerIsekai('isekai_town', 150, true, false), false);

  const player = createInitialPlayer();
  player.level = 18;
  player.statPoints = 12;
  player.stats = { attack: 5, skillDmg: 4, hp: 6, speed: 3 };
  player.maxHp = 205;
  player.hp = 180;
  player.unlockedWeapons.push('fire_sword');
  equipWeapon(player, 'fire_sword');
  assignSkillToSlot(player, 1, 'chrono_freeze');
  const inv = createInitialInventory();

  const res = resetPlayerForIsekai(player, inv);
  assert.equal(res.rank, 'F');
  assert.equal(player.level, 1);
  assert.equal(player.statPoints, 0);
  assert.deepEqual(player.stats, { skillDmg: 0, attack: 0, hp: 0, speed: 0 });
  assert.equal(player.maxHp, 115);
  assert.equal(player.hp, 115);
  // Combat weapon and skills remain intact
  assert.equal(player.equippedWeapon, 'fire_sword');
  assert.equal(player.skillSlots[1], 'chrono_freeze');
  assert.ok(inv.some((it) => it.id === 'rank_badge_f' && it.count >= 1));
});

test('Isekai guild rank progression (F -> S), NPC forward/back patrolling, Wardrobe Shop & Demon King purple flames', () => {
  const inv = createInitialInventory();
  const player = createInitialPlayer();
  resetPlayerForIsekai(player, inv);
  player.gold = 200;

  assert.equal(canStartGuildMission('F', 'f_goblin_warren'), true);
  assert.equal(canStartGuildMission('F', 'b_princess_carriage'), false);
  assert.equal(canAccessGuildFloor2('F'), false);
  assert.equal(canAccessGuildFloor2('C'), false);
  assert.equal(canAccessGuildFloor2('B'), true);

  let rank: 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S' = 'F';
  const floor1Sequence: typeof GUILD_MISSIONS[number]['id'][] = [
    'f_goblin_warren',
    'e_hobgoblin_caves',
    'd_deep_goblin_keep',
    'c_demon_vanguard',
  ];
  for (const mId of floor1Sequence) {
    assert.equal(canStartGuildMission(rank, mId), true);
    const promo = promoteGuildRankAfterMission(rank, mId, inv, 0);
    assert.equal(promo.promoted, true);
    rank = promo.nextRank;
  }
  assert.equal(rank, 'B');
  assert.equal(canAccessGuildFloor2(rank), true);

  // B-Rank requires 3 different bandit-gang Princess Escorts to advance to A-Rank
  let escorts = 0;
  for (let i = 1; i <= 2; i++) {
    const p = promoteGuildRankAfterMission(rank, 'b_princess_carriage', inv, escorts);
    assert.equal(p.promoted, false);
    assert.equal(p.nextRank, 'B');
    assert.equal(p.nextBRankEscorts, i);
    escorts = p.nextBRankEscorts;
  }
  const thirdEscort = promoteGuildRankAfterMission(rank, 'b_princess_carriage', inv, escorts);
  assert.equal(thirdEscort.promoted, true);
  assert.equal(thirdEscort.nextRank, 'A');
  rank = thirdEscort.nextRank;

  const finalPromo = promoteGuildRankAfterMission(rank, 'a_three_demon_kings', inv, thirdEscort.nextBRankEscorts);
  assert.equal(finalPromo.promoted, true);
  rank = finalPromo.nextRank;
  assert.equal(rank, 'S');
  assert.ok(inv.some((it) => it.id === 'rank_badge_s'));

  // NPCs walk forward and backward smoothly & tavern drinkers animate drinking
  const townNpcs = createTownNpcs(false);
  const guildNpcs = createGuildNpcs(false);
  const walker = townNpcs[0];
  walker.x = walker.maxX - 1;
  walker.speed = 30;
  stepIsekaiNpcs(townNpcs, 0.2);
  assert.ok(walker.speed < 0);
  assert.equal(walker.facing, -1);
  const drinker = guildNpcs.find((n) => n.sitting)!;
  const phaseBefore = drinker.drinkingPhase ?? 0;
  stepIsekaiNpcs(guildNpcs, 0.5);
  assert.ok((drinker.drinkingPhase ?? 0) > phaseBefore);

  // Wardrobe purchase & Royal Crown gating
  const unlocked = ['outfit_knight_plate', 'hat_helm'];
  assert.equal(buyOrEquipWardrobeItem(player, unlocked, 'toggle_crown', false).ok, false);
  const buyCoat = buyOrEquipWardrobeItem(player, unlocked, 'outfit_guild_coat', false);
  assert.equal(buyCoat.ok, true);
  assert.equal(player.customization.outfitStyle, 'guild_coat');
  assert.equal(buyOrEquipWardrobeItem(player, unlocked, 'toggle_crown', true).ok, true);
  assert.equal(player.customization.crownEquipped, true);

  // Mission enemy rosters & 3 Demon Kings purple flame cycle
  const gobs = createGoblinDungeonWave('f_goblin_warren', 0);
  assert.ok(gobs.some((e) => e.archetype === 'goblin_normal'));
  assert.ok(gobs.some((e) => e.archetype === 'hobgoblin'));
  const bandits = createBanditWave(160, 0);
  assert.ok(bandits.some((e) => e.archetype === 'bandit_fighter'));
  assert.ok(bandits.some((e) => e.archetype === 'bandit_archer'));
  const demons = createDemonRealmWave();
  assert.ok(demons.some((e) => e.archetype === 'demon_succubus'));
  assert.ok(demons.some((e) => e.archetype === 'demon_tank'));
  assert.ok(demons.some((e) => e.archetype === 'demon_lightning'));

  const { demonKings, minions } = createThreeDemonKingsInit(['goblin_normal', 'bandit_archer', 'demon_succubus']);
  assert.equal(demonKings.length, 3);
  assert.equal(minions.length, 3);
  const seenPurpleSkills = new Set<string>();
  for (let i = 0; i < PURPLE_FLAME_SKILLS.length; i++) {
    const cast = createDemonKingPurpleFlameCast(demonKings[0], i, 180);
    seenPurpleSkills.add(cast.skillName);
    assert.ok(cast.zones.length + cast.projectiles.length >= 2);
  }
  assert.equal(seenPurpleSkills.size, PURPLE_FLAME_SKILLS.length);
});

test('save system roundtrips Isekai realm, guild rank, crown, wardrobe & badge', () => {
  const player = createInitialPlayer();
  const inv = createInitialInventory();
  resetPlayerForIsekai(player, inv);
  promoteGuildRankAfterMission('F', 'f_goblin_warren', inv);

  const payload = createSavePayload({
    saveId: 'isekai_slot',
    playerName: 'KazumaKnight',
    biome: 'forest',
    player,
    inventory: inv,
    defeatedBosses: new Set([100, 101]),
    discoveredSecrets: new Set(),
    openedChests: new Set(),
    volcanoBridgeFallTriggered: false,
    darkSanctumDiscovered: false,
    realm: 'isekai_town',
    guildRank: 'E',
    unlockedWardrobe: ['outfit_knight_plate', 'hat_helm', 'outfit_adventurer_tunic'],
    foughtIsekaiEnemies: ['goblin_normal', 'hobgoblin'],
    crownUnlocked: true,
    gyroDefeated: true,
    isekaiCompleted: true,
  });

  const restored = normalizeLoadedSave(JSON.parse(JSON.stringify(payload)));
  assert.ok(restored !== null);
  assert.equal(restored.realm, 'isekai_town');
  assert.equal(restored.guildRank, 'E');
  assert.equal(restored.crownUnlocked, true);
  assert.equal(restored.gyroDefeated, true);
  assert.equal(restored.isekaiCompleted, true);
  assert.deepEqual(restored.foughtIsekaiEnemies, ['goblin_normal', 'hobgoblin']);
  assert.ok(restored.inventory.some((it) => it.id === 'rank_badge_e'));
});

test('elemental orbs drop at 8% chance, apply Flame 25% HP / Wind +30% DMG / Electrical 1-turn stun, and persist in saves', () => {
  assert.equal(ORB_DROP_CHANCE, 0.08);
  assert.equal(rollMonsterOrbDrop(() => 0.08), null);
  assert.equal(rollMonsterOrbDrop(() => 0.5), null);

  let step = 0;
  const seqFlame = () => [0.02, 0.1][step++];
  assert.equal(rollMonsterOrbDrop(seqFlame), 'orb_flame');
  step = 0;
  const seqWind = () => [0.05, 0.5][step++];
  assert.equal(rollMonsterOrbDrop(seqWind), 'orb_wind');
  step = 0;
  const seqElec = () => [0.07, 0.9][step++];
  assert.equal(rollMonsterOrbDrop(seqElec), 'orb_electric');

  const inv = createInitialInventory();
  addInventoryResource(inv, 'orb_flame', 1);
  addInventoryResource(inv, 'orb_wind', 1);
  addInventoryResource(inv, 'orb_electric', 1);

  const player = createInitialPlayer();
  const baseSword = calculateAttackDamage(player, 1.15, false);

  const chunk1 = generateChunk(1);
  const boss = chunk1.boss!;
  boss.maxHp = 400;
  boss.hp = 400;
  const battle = createBossBattleState(boss);

  // 1. Electrical Orb stuns boss for 1 turn
  battle.phase = 'menu';
  const elecRes = resolveBattleOrb(battle, inv, 'orb_electric');
  assert.equal(elecRes.ok, true);
  assert.equal(battle.bossFrozenTurns, 1);
  assert.equal(battle.bossStunReason, 'electric');
  const stunnedCounter = triggerBossCounterTurn(battle, player);
  assert.equal(stunnedCounter.skippedByFreeze, true);
  assert.equal(stunnedCounter.damageTaken, 0);

  // 2. Wind Orb increases boss damage taken by +30%
  battle.phase = 'menu';
  const windRes = resolveBattleOrb(battle, inv, 'orb_wind');
  assert.equal(windRes.ok, true);
  assert.equal(battle.windVulnerable, true);

  battle.phase = 'menu';
  const boostedSword = resolvePlayerBattleSword(battle, player);
  assert.equal(boostedSword.ok, true);
  assert.equal(boostedSword.damage, Math.round(baseSword * 1.3));

  // 3. Flame Orb deals 25% of boss total Max HP (100 out of 400)
  const hpBeforeFlame = boss.hp;
  battle.phase = 'menu';
  const flameRes = resolveBattleOrb(battle, inv, 'orb_flame');
  assert.equal(flameRes.ok, true);
  assert.equal(flameRes.damage, 100);
  assert.equal(boss.hp, hpBeforeFlame - 100);

  // Save/load preserves orb inventory counts
  addInventoryResource(inv, 'orb_flame', 2);
  addInventoryResource(inv, 'orb_wind', 3);
  const payload = createSavePayload({
    saveId: 'orb_slot',
    playerName: 'OrbKnight',
    biome: 'castle',
    player,
    inventory: inv,
    defeatedBosses: new Set(),
    discoveredSecrets: new Set(),
    openedChests: new Set(),
    volcanoBridgeFallTriggered: false,
    darkSanctumDiscovered: false,
  });
  const restored = normalizeLoadedSave(JSON.parse(JSON.stringify(payload)));
  assert.ok(restored !== null);
  assert.equal(restored.inventory.find((i) => i.id === 'orb_flame')?.count, 2);
  assert.equal(restored.inventory.find((i) => i.id === 'orb_wind')?.count, 3);
  assert.equal(restored.inventory.find((i) => i.id === 'orb_electric')?.count, 0);
});

test('deeper dungeons spawn stronger dungeon bosses, Potion Shop boosts ATK, Weapons Shop stocks unique blades, and sword combo choreography works', () => {
  // Deeper dungeon waves spawn strong Dungeon Bosses at Depth >= 2
  const gobsD1 = createGoblinDungeonWave('f_goblin_warren', 0, 1);
  assert.equal(gobsD1.some((e) => e.isDungeonBoss), false);
  const gobsD2 = createGoblinDungeonWave('f_goblin_warren', 0, 2);
  const gobBoss = gobsD2.find((e) => e.isDungeonBoss);
  assert.ok(gobBoss !== undefined);
  assert.ok(gobBoss.maxHp >= 400);

  const demD2 = createDemonRealmWave(2);
  assert.ok(demD2.some((e) => e.isDungeonBoss));

  // Potion Shop HP & Damage-Boost Potions
  const player = createInitialPlayer();
  const inv = createInitialInventory();
  player.gold = 300;
  const baseDmg = calculateAttackDamage(player, 1, false);
  const buyBoost = buyPotionShopItem(player, inv, 'fury_draught');
  assert.equal(buyBoost.ok, true);
  const drinkBoost = useInventoryItem(player, inv, 'fury_draught');
  assert.equal(drinkBoost.ok, true);
  assert.ok(player.damageBoostMultiplier > 1);
  const boostedDmg = calculateAttackDamage(player, 1, false);
  assert.ok(boostedDmg > baseDmg);
  assert.ok(POTION_SHOP_IDS.includes('titan_crimson_tonic'));

  // Weapons Shop: unique colors, sizes, specials, and paid unlock guard
  const armoryColors = new Set(WEAPON_SHOP_ORDER.map((id) => WEAPONS[id].color));
  assert.equal(armoryColors.size, WEAPON_SHOP_ORDER.length);
  const craftBlocked = craftWeapon(player, inv, 'venom_twinblade');
  assert.equal(craftBlocked.ok, false);
  player.gold = 1000;
  const buyWep = buyOrEquipWeaponShopItem(player, 'azure_glaive');
  assert.equal(buyWep.ok, true);
  assert.equal(player.equippedWeapon, 'azure_glaive');

  // Sword Combo Choreography: Click 1 -> Click 2 (Double Poke 1.48x range) -> Click 3 (Triple Slash) -> Spin Dash Poke (1.85x range)
  const wRange = WEAPONS[player.equippedWeapon].range;
  assert.equal(startWeaponAttack(player), true);
  assert.equal(player.comboStep, 1);
  const hb1 = computeWeaponHitbox(player);

  player.attackPhase = 'none';
  assert.equal(startWeaponAttack(player), true);
  assert.equal(player.comboStep, 2);
  const hb2 = computeWeaponHitbox(player);
  assert.equal(hb2.w, Math.round(wRange * 1.48));
  assert.ok(hb2.w > hb1.w);

  player.attackPhase = 'none';
  assert.equal(startWeaponAttack(player), true);
  assert.equal(player.comboStep, 3);

  assert.equal(triggerSpinPokeDash(player), true);
  assert.equal(player.isSpinDashAttack, true);
  const hbSpin = computeWeaponHitbox(player);
  assert.equal(hbSpin.w, Math.round(wRange * 1.85));
});




