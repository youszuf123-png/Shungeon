import {
  BOSSES_PER_BIOME,
  SARCASTIC_OBJECT_DIALOGUES,
  TOTAL_BOSSES,
  TOTAL_HIDDEN_PASSAGES,
  createGyroZeppeliBossDef,
  getBiomeForBossIndex,
  getBossDef,
} from './data';
import type {
  ActiveBoss,
  BiomeId,
  CandleProp,
  EnemyArchetype,
  EnemyState,
  HiddenPassage,
  InteractableProp,
  Platform,
  WeaponId,
} from './types';

export const CHUNK_WIDTH = 640;
export const FLOOR_Y = 226;

export interface GeneratedChunk {
  index: number;
  biome: BiomeId;
  startX: number;
  endX: number;
  platforms: Platform[];
  candles: CandleProp[];
  interactables: InteractableProp[];
  enemies: EnemyState[];
  hiddenPassage: HiddenPassage | null;
  boss: ActiveBoss | null;
}

function seededRand(seed: number): () => number {
  let s = (seed * 1664525 + 1013904223) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function getBiomeForChunk(chunkIndex: number): BiomeId {
  if (chunkIndex <= 0) return 'castle';
  return getBiomeForBossIndex(Math.min(TOTAL_BOSSES, chunkIndex));
}

export function generateChunk(chunkIndex: number, bossesDefeated = 0): GeneratedChunk {
  const rand = seededRand(chunkIndex * 7919 + 42);
  const startX = chunkIndex * CHUNK_WIDTH;
  const endX = startX + CHUNK_WIDTH;
  const biome = getBiomeForChunk(chunkIndex);

  const platforms: Platform[] = [];
  const candles: CandleProp[] = [];
  const interactables: InteractableProp[] = [];
  const enemies: EnemyState[] = [];

  // Chunk 41 right after 40 bosses opens with a Chasm Pit beneath the Slippery Crossing Bridge!
  if (chunkIndex === 41) {
    platforms.push(
      {
        id: 'bridge_41_slip',
        x: startX - 6,
        y: FLOOR_Y - 2,
        w: 196,
        h: 10,
        kind: 'bridge',
        breakable: true,
      },
      {
        id: `floor_${chunkIndex}`,
        x: startX + 190,
        y: FLOOR_Y,
        w: CHUNK_WIDTH - 190,
        h: 44,
        kind: 'floor',
      },
    );
  } else {
    // Main continuous floor with subtle carpeted / basalt spans
    platforms.push({
      id: `floor_${chunkIndex}`,
      x: startX,
      y: FLOOR_Y,
      w: CHUNK_WIDTH,
      h: 44,
      kind: 'floor',
    });
  }

  // Secret Dark Hidden Sanctum directly behind the 1st Checkpoint (walk backwards past x=0!)
  if (chunkIndex === -1) {
    platforms.push(
      {
        id: 'vault_ledge_1',
        x: startX + 360,
        y: FLOOR_Y - 42,
        w: 96,
        h: 12,
        kind: 'brick',
      },
      {
        id: 'vault_ledge_2',
        x: startX + 200,
        y: FLOOR_Y - 76,
        w: 96,
        h: 12,
        kind: 'bridge',
      },
      {
        id: 'vault_altar_dais',
        x: startX + 80,
        y: FLOOR_Y - 10,
        w: 96,
        h: 10,
        kind: 'secret_bridge',
      },
    );

    candles.push(
      { id: 'vault_brazier_0', x: startX + 575, y: FLOOR_Y, kind: 'brazier', phase: 0.4 },
      { id: 'vault_brazier_1', x: startX + 335, y: FLOOR_Y, kind: 'brazier', phase: 1.7 },
      { id: 'vault_brazier_2', x: startX + 128, y: FLOOR_Y - 10, kind: 'brazier', phase: 2.8 },
    );

    const hiddenPassage: HiddenPassage = {
      id: 'secret_vault_checkpoint_0',
      index: 0,
      x: -24,
      y: FLOOR_Y - 50,
      w: 36,
      h: 50,
      biome: 'castle',
      puzzleType: 'illusory_tapestry',
      discovered: true,
      hintText: 'Cold wind blows from behind the First Checkpoint...',
      discoveryText: 'Dark Abyssal Sanctum behind Checkpoint 1!',
      rewardText: 'Claim the OP Fire Sword at the far infernal altar!',
    };

    interactables.push(
      {
        id: 'chest_fire_sword_op',
        x: startX + 118,
        y: FLOOR_Y - 28,
        w: 22,
        h: 18,
        kind: 'chest',
        label: 'Claim OP Fire Sword',
        dialogue: [
          'Infernal Fire Sword unlocked & equipped! (Strong Crimson-Orange Flames · 2x TOTAL DAMAGE!)',
          'Enemies and 120 JoJo Bosses will regret leaving this behind Checkpoint 1.',
        ],
        speaker: 'Infernal Altar',
        activated: false,
        rewardItemId: 'royal_ember',
        rewardWeaponId: 'fire_sword',
      },
    );

    enemies.push({
      id: 'enemy_vault_guardian',
      archetype: 'cursed_armor',
      name: 'Sanctum Abyssal Guard',
      x: startX + 330,
      y: FLOOR_Y - 28,
      vx: 0,
      vy: 0,
      w: 22,
      h: 28,
      hp: 58 * 3,
      maxHp: 58 * 3,
      facing: 1,
      state: 'patrol',
      stateTimer: 0.9,
      patrolOriginX: startX + 330,
      hitFlash: 0,
      biome: 'volcano',
      rewardGold: 45,
      koTimer: 0,
    });

    return {
      index: -1,
      biome: 'castle',
      startX,
      endX,
      platforms,
      candles,
      interactables,
      enemies,
      hiddenPassage,
      boss: null,
    };
  }

  // Varied architectural map patterns per chunk (with bespoke Hellforge tiers in Volcano chunks 41..80!)
  if (chunkIndex === 41) {
    // Volcano Pit entry chamber ledges + braziers flanking the chasm landing
    platforms.push(
      {
        id: 'ledge_41_pit_escape',
        x: startX + 215,
        y: FLOOR_Y - 46,
        w: 98,
        h: 12,
        kind: 'brick',
      },
      {
        id: 'ledge_41_forge_catwalk',
        x: startX + 350,
        y: FLOOR_Y - 84,
        w: 112,
        h: 11,
        kind: 'bridge',
      },
    );
  } else {
    const mapPattern = chunkIndex === 0 ? 0 : chunkIndex % 4;
    if (mapPattern === 0) {
      const ledgeCount = chunkIndex === 0 ? 2 : 2 + Math.floor(rand() * 2);
      for (let i = 0; i < ledgeCount; i++) {
        const lx = startX + 115 + i * 165 + Math.floor(rand() * 26);
        const ly = i % 2 === 0 ? FLOOR_Y - 46 : FLOOR_Y - 82;
        const lw = 72 + Math.floor(rand() * 34);
        platforms.push({
          id: `ledge_${chunkIndex}_${i}`,
          x: lx,
          y: ly,
          w: lw,
          h: 12,
          kind: biome === 'castle' ? 'carpet_ledge' : 'brick',
        });
      }
    } else if (mapPattern === 1) {
      // Two-Tier Velvet/Obsidian Catwalk + High Arch Balcony
      platforms.push(
        {
          id: `ledge_${chunkIndex}_0`,
          x: startX + 108,
          y: FLOOR_Y - 44,
          w: 118,
          h: 12,
          kind: biome === 'castle' ? 'carpet_ledge' : 'brick',
        },
        {
          id: `ledge_${chunkIndex}_1`,
          x: startX + 260,
          y: FLOOR_Y - 86,
          w: 96,
          h: 12,
          kind: 'bridge',
        },
        {
          id: `ledge_${chunkIndex}_2`,
          x: startX + 390,
          y: FLOOR_Y - 48,
          w: 84,
          h: 12,
          kind: biome === 'castle' ? 'carpet_ledge' : 'brick',
        },
      );
    } else if (mapPattern === 2) {
      // Ascending Stepped Chandelier / Forge Vault
      platforms.push(
        {
          id: `ledge_${chunkIndex}_0`,
          x: startX + 120,
          y: FLOOR_Y - 36,
          w: 74,
          h: 12,
          kind: 'brick',
        },
        {
          id: `ledge_${chunkIndex}_1`,
          x: startX + 225,
          y: FLOOR_Y - 64,
          w: 82,
          h: 12,
          kind: biome === 'castle' ? 'carpet_ledge' : 'brick',
        },
        {
          id: `ledge_${chunkIndex}_2`,
          x: startX + 340,
          y: FLOOR_Y - 90,
          w: 76,
          h: 12,
          kind: 'bridge',
        },
      );
    } else {
      // Twin Suspended Bridges with Upper Sentinel Perch
      platforms.push(
        {
          id: `ledge_${chunkIndex}_0`,
          x: startX + 132,
          y: FLOOR_Y - 52,
          w: 92,
          h: 10,
          kind: 'bridge',
        },
        {
          id: `ledge_${chunkIndex}_1`,
          x: startX + 305,
          y: FLOOR_Y - 52,
          w: 92,
          h: 10,
          kind: 'bridge',
        },
        {
          id: `ledge_${chunkIndex}_2`,
          x: startX + 220,
          y: FLOOR_Y - 94,
          w: 78,
          h: 12,
          kind: biome === 'castle' ? 'carpet_ledge' : 'brick',
        },
      );
    }
  }

  // Candles / Sconces / Braziers
  const candleCount = 5;
  for (let i = 0; i < candleCount; i++) {
    const cx = startX + 55 + i * 124 + Math.floor(rand() * 18);
    const isFloorCandelabra = i % 2 === 1;
    candles.push({
      id: `candle_${chunkIndex}_${i}`,
      x: cx,
      y: isFloorCandelabra ? FLOOR_Y : FLOOR_Y - 68,
      kind:
        biome === 'castle'
          ? isFloorCandelabra
            ? 'candelabra'
            : 'wall_sconce'
          : biome === 'forest'
            ? 'rune_lantern'
            : 'brazier',
      phase: rand() * Math.PI * 2,
    });
  }

  // Royal Throne in Castle chunks (including Chunk 0!) or Ancient Shrine / Demon Throne
  if (chunkIndex === 0 || chunkIndex % 2 === 0) {
    const throneX = chunkIndex === 0 ? startX + 168 : startX + 135;
    const throneDialogue =
      SARCASTIC_OBJECT_DIALOGUES.throne[chunkIndex % SARCASTIC_OBJECT_DIALOGUES.throne.length];
    interactables.push({
      id: `throne_${chunkIndex}`,
      x: throneX,
      y: FLOOR_Y - 34,
      w: 28,
      h: 34,
      kind: 'throne',
      label: biome === 'castle' ? 'Royal Throne' : biome === 'forest' ? 'Ruin Altar' : 'Obsidian Throne',
      dialogue: throneDialogue,
      speaker: 'Narrator',
      activated: false,
    });
  }

  // Broken Brick inspectable prop in Chunk 0 & odd chunks
  if (chunkIndex === 0 || chunkIndex % 3 === 1) {
    const bx = chunkIndex === 0 ? startX + 260 : startX + 210;
    interactables.push({
      id: `brick_lore_${chunkIndex}`,
      x: bx,
      y: FLOOR_Y - 18,
      w: 22,
      h: 18,
      kind: 'broken_brick',
      label: 'Cracked Bricks',
      dialogue:
        SARCASTIC_OBJECT_DIALOGUES.broken_brick[
          chunkIndex % SARCASTIC_OBJECT_DIALOGUES.broken_brick.length
        ],
      speaker: 'Narrator',
      activated: false,
    });
  }

  // Hidden Passages (108 total across chunks 0..107, so player sees Secret #1 right in Chunk 0!)
  let hiddenPassage: HiddenPassage | null = null;
  if (chunkIndex >= 0 && chunkIndex < TOTAL_HIDDEN_PASSAGES) {
    const secretNum = chunkIndex + 1;
    const puzzleTypes: HiddenPassage['puzzleType'][] = [
      'cracked_wall',
      'royal_lever',
      'torch_plate',
      'illusory_tapestry',
    ];
    const puzzleType = puzzleTypes[chunkIndex % puzzleTypes.length];
    const secretX = chunkIndex === 0 ? startX + 292 : startX + 235 + Math.floor(rand() * 40);
    const secretY = FLOOR_Y - 46;

    const hintByType: Record<HiddenPassage['puzzleType'], string> = {
      cracked_wall: 'Suspicious hairline cracks in the royal brickwork... strike them with your sword!',
      royal_lever: 'An ornate rusty lever sits beside a sealed wall alcove.',
      torch_plate: 'A sunken golden floor tile hums softly when stepped upon.',
      illusory_tapestry: 'A velvet banner ripples despite zero wind in this dusty hall.',
    };

    const discoveryByType: Record<HiddenPassage['puzzleType'], string> = {
      cracked_wall: `Secret #${secretNum} uncovered! Turns out structural neglect is the real treasure.`,
      royal_lever: `Secret #${secretNum} unlocked! Who puts a secret vault behind a coat-rack lever?`,
      torch_plate: `Secret #${secretNum} revealed! Ancient floor pressure engineering at its pettiest.`,
      illusory_tapestry: `Secret #${secretNum} found! A classic "hide the door behind a curtain" classic.`,
    };

    hiddenPassage = {
      id: `secret_${secretNum}`,
      index: secretNum,
      x: secretX,
      y: secretY,
      w: 36,
      h: 46,
      biome,
      puzzleType,
      discovered: false,
      hintText: hintByType[puzzleType],
      discoveryText: discoveryByType[puzzleType],
      rewardText: 'Found +1 Royal Ember & +25 Gold!',
    };

    // Puzzle trigger prop
    if (puzzleType === 'royal_lever') {
      interactables.push({
        id: `lever_${secretNum}`,
        x: secretX - 36,
        y: FLOOR_Y - 22,
        w: 18,
        h: 22,
        kind: 'lever',
        label: 'Rusty Lever',
        dialogue: [discoveryByType.royal_lever, 'A hidden alcove creaks open with forgotten loot.'],
        speaker: 'Secret Vault',
        activated: false,
        secretId: hiddenPassage.id,
      });
    } else if (puzzleType === 'torch_plate') {
      interactables.push({
        id: `plate_${secretNum}`,
        x: secretX - 30,
        y: FLOOR_Y - 6,
        w: 24,
        h: 6,
        kind: 'pressure_plate',
        label: 'Floor Plate',
        dialogue: [discoveryByType.torch_plate],
        speaker: 'Secret Vault',
        activated: false,
        secretId: hiddenPassage.id,
      });
    } else if (puzzleType === 'illusory_tapestry') {
      interactables.push({
        id: `tapestry_${secretNum}`,
        x: secretX + 4,
        y: FLOOR_Y - 42,
        w: 24,
        h: 36,
        kind: 'tapestry',
        label: 'Royal Tapestry',
        dialogue: [
          ...SARCASTIC_OBJECT_DIALOGUES.tapestry[0],
          discoveryByType.illusory_tapestry,
        ],
        speaker: 'Secret Vault',
        activated: false,
        secretId: hiddenPassage.id,
      });
    } else {
      // Cracked wall breaks on sword hit OR interact
      interactables.push({
        id: `cracked_${secretNum}`,
        x: secretX,
        y: FLOOR_Y - 42,
        w: 28,
        h: 42,
        kind: 'broken_brick',
        label: 'False Wall',
        dialogue: [discoveryByType.cracked_wall],
        speaker: 'Secret Vault',
        activated: false,
        secretId: hiddenPassage.id,
      });
    }

    // Secret vault upper shelf & chest reward
    platforms.push({
      id: `secret_ledge_${chunkIndex}`,
      x: secretX - 4,
      y: FLOOR_Y - 58,
      w: 56,
      h: 10,
      kind: 'secret_bridge',
    });

    const unlockableWeapons: WeaponId[] = ['crescent', 'runeblade', 'katana'];
    const rewardWeaponId =
      secretNum === 2
        ? unlockableWeapons[0]
        : secretNum === 15
          ? unlockableWeapons[1]
          : secretNum === 42
            ? unlockableWeapons[2]
            : undefined;

    interactables.push({
      id: `chest_${secretNum}`,
      x: secretX + 12,
      y: FLOOR_Y - 76,
      w: 20,
      h: 18,
      kind: 'chest',
      label: 'Secret Chest',
      dialogue: rewardWeaponId
        ? [`Jackpot! Unlocked new Sword Style weapon in your Inventory!`]
        : [
            SARCASTIC_OBJECT_DIALOGUES.chest[0][0],
            'You pocket a gleaming relic shard and 35 Gold.',
          ],
      speaker: 'Treasure',
      activated: false,
      rewardItemId:
        biome === 'castle' ? 'royal_ember' : biome === 'forest' ? 'ruin_shard' : 'magma_core',
      rewardWeaponId,
    });
  }

  // Checkpoints at Chunk 0 and every 5 chunks
  if (chunkIndex === 0 || chunkIndex % 5 === 0) {
    const cpIndex = Math.floor(chunkIndex / 5);
    interactables.push({
      id: `checkpoint_${cpIndex}`,
      x: startX + 96,
      y: FLOOR_Y - 30,
      w: 20,
      h: 30,
      kind: 'checkpoint',
      label: `Checkpoint ${cpIndex + 1}`,
      dialogue: SARCASTIC_OBJECT_DIALOGUES.checkpoint[0],
      speaker: 'Checkpoint',
      activated: chunkIndex === 0,
      checkpointIndex: cpIndex,
    });
  }

  // Monsters: keep Chunk 0 safe near spawn (monsters start at x = startX + 405)
  const enemyStartOffset = chunkIndex === 0 ? 405 : 260;
  const archetypes: EnemyArchetype[] = [
    'skeleton_guard',
    'shadow_bat',
    'cultist_mage',
    'gargoyle_charger',
    'cursed_armor',
    'phantom_wisp',
  ];
  const monsterCount = chunkIndex === 0 ? 1 : 2 + (chunkIndex % 2);
  for (let m = 0; m < monsterCount; m++) {
    const arch = archetypes[(chunkIndex * 2 + m) % archetypes.length];
    const ex = startX + enemyStartOffset + m * 76;
    const ey =
      arch === 'shadow_bat' || arch === 'phantom_wisp' ? FLOOR_Y - 64 : FLOOR_Y - 26;
    const scaleFactor = 1 + chunkIndex * 0.08;
    const baseHp =
      arch === 'skeleton_guard'
        ? 45
        : arch === 'shadow_bat'
          ? 28
          : arch === 'cultist_mage'
            ? 34
            : arch === 'gargoyle_charger'
              ? 54
              : arch === 'cursed_armor'
                ? 64
                : 38;
    const hp = Math.round(baseHp * scaleFactor * 3);

    const names: Partial<Record<EnemyArchetype, string>> = {
      skeleton_guard:
        biome === 'castle'
          ? 'Royal Bone Sentinel'
          : biome === 'forest'
            ? 'Mossbound Warden'
            : 'Charred Praetorian',
      shadow_bat:
        biome === 'castle'
          ? 'Belfry Vampire Bat'
          : biome === 'forest'
            ? 'Spore Wisp Bat'
            : 'Cinder Wing',
      cultist_mage:
        biome === 'castle'
          ? 'Wax-Robed Hexer'
          : biome === 'forest'
            ? 'Ruin Oracle'
            : 'Magma Warlock',
      gargoyle_charger:
        biome === 'castle'
          ? 'Cracked Gargoyle'
          : biome === 'forest'
            ? 'Stone Stalker'
            : 'Basalt Charger',
      cursed_armor:
        biome === 'castle'
          ? 'Hollow Royal Knight'
          : biome === 'forest'
            ? 'Moss Sentinel Armor'
            : 'Hellforge Juggernaut',
      phantom_wisp:
        biome === 'castle'
          ? 'Candlelight Wraith'
          : biome === 'forest'
            ? 'Will-o’-Wisp Specter'
            : 'Ember Banshee',
    };

    enemies.push({
      id: `enemy_${chunkIndex}_${m}`,
      archetype: arch,
      name: names[arch] ?? arch,
      x: ex,
      y: ey,
      vx: 0,
      vy: 0,
      w: arch === 'shadow_bat' ? 18 : arch === 'cursed_armor' ? 22 : 20,
      h: arch === 'shadow_bat' ? 14 : arch === 'cursed_armor' ? 28 : 26,
      hp,
      maxHp: hp,
      facing: -1,
      state: 'patrol',
      stateTimer: 0.6 + rand() * 0.8,
      patrolOriginX: ex,
      hitFlash: 0,
      biome,
      rewardGold: 12 + Math.floor(chunkIndex * 1.5) + (arch === 'cursed_armor' ? 6 : 0),
      koTimer: 0,
    });
  }

  // Boss in chunks 1..120+ (Boss #1 right at the end of Chunk 1! Final Boss Gyro Zeppeli in Chunk 101 after Boss #100!)
  let boss: ActiveBoss | null = null;
  if (chunkIndex >= 1) {
    const def =
      chunkIndex === 101
        ? createGyroZeppeliBossDef(115, 28, bossesDefeated)
        : getBossDef(chunkIndex, bossesDefeated);
    const bossX = startX + 520;
    const bw = def.isGyroBoss ? 36 : 24;
    const bh = def.isGyroBoss ? 52 : 36;
    boss = {
      def,
      x: bossX,
      y: FLOOR_Y - bh,
      vx: 0,
      vy: 0,
      w: bw,
      h: bh,
      hp: def.maxHp,
      maxHp: def.maxHp,
      facing: -1,
      state: 'intro',
      stateTimer: 1.0,
      hitFlash: 0,
      posePhase: 0,
      arenaMinX: startX + 360,
      arenaMaxX: startX + 610,
      defeated: false,
    };
  }

  // Grand Escape Gate after Boss 120 (Chunk 120)
  if (chunkIndex === TOTAL_BOSSES) {
    interactables.push({
      id: 'escape_gate_final',
      x: startX + 595,
      y: FLOOR_Y - 54,
      w: 36,
      h: 54,
      kind: 'escape_gate',
      label: 'Citadel Escape Gate',
      dialogue: SARCASTIC_OBJECT_DIALOGUES.escape_gate[0],
      speaker: 'Freedom',
      activated: false,
    });
  }

  return {
    index: chunkIndex,
    biome,
    startX,
    endX,
    platforms,
    candles,
    interactables,
    enemies,
    hiddenPassage,
    boss,
  };
}

export function getBiomeCheckpointList(highestReachedIndex: number) {
  const list: { index: number; x: number; biome: BiomeId; label: string; reached: boolean }[] = [];
  for (let i = 0; i <= 24; i++) {
    const chunkIdx = i * 5;
    const biome = getBiomeForChunk(chunkIdx);
    const bossMarker = chunkIdx === 0 ? 'Entry Hall' : `Boss ${chunkIdx}`;
    list.push({
      index: i,
      x: chunkIdx * CHUNK_WIDTH + 96,
      biome,
      label: `CP ${i + 1} · ${bossMarker}`,
      reached: i <= highestReachedIndex,
    });
  }
  return list;
}

export function getBossMilestoneBiomeCheck(bossesDefeated: number): BiomeId {
  if (bossesDefeated < BOSSES_PER_BIOME) return 'castle';
  if (bossesDefeated < BOSSES_PER_BIOME * 2) return 'volcano';
  return 'forest';
}
