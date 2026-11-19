import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BOSSES_PER_BIOME,
  TOTAL_BOSSES,
  TOTAL_HIDDEN_PASSAGES,
  WEAPONS,
  getBiomeForBossIndex,
  getBossDef,
} from './data';
import { CHUNK_WIDTH, generateChunk, getBiomeForChunk } from './worldGen';
import {
  allocateStatPoint,
  applyDamageToBoss,
  assignSkillToSlot,
  calculateAttackDamage,
  craftWeapon,
  createInitialInventory,
  createInitialPlayer,
  equipWeapon,
  getMonsterLevelMultiplier,
  grantKillStatPoints,
  recordBossFightProgress,
  startWeaponAttack,
  stepPlayerPhysics,
  triggerPlayerDash,
  triggerSkillSlot,
  updateWarriorCustomization,
  useInventoryItem,
} from './rules';
import {
  createBossBattleState,
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

