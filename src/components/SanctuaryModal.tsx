import React, { useState } from 'react';
import { SKILLS, WEAPONS } from '../game/data';
import { DEFAULT_WARRIOR_CUSTOMIZATION } from '../game/rules';
import type {
  HudSnapshot,
  SkillId,
  StatKey,
  WarriorCustomization,
  WeaponId,
} from '../game/types';
import {
  PixelItemIcon,
  PixelSkillIcon,
  PixelWarriorPortrait,
  PixelWeaponIcon,
} from './PixelPortrait';

interface SanctuaryModalProps {
  hud: HudSnapshot;
  onClose: () => void;
  onAllocateStat: (statKey: StatKey, amount?: number) => void;
  onUpdateCustomization: (patch: Partial<WarriorCustomization>) => void;
  onEquipOrCraftWeapon: (weaponId: WeaponId) => void;
  onAssignSkill: (slot: 0 | 1 | 2, skillId: SkillId) => void;
  onUseItem: (itemId: string) => void;
}

const COLOR_SWATCHES: {
  key: keyof WarriorCustomization;
  label: string;
  options: { color: string; name: string }[];
}[] = [
  {
    key: 'cloakColor',
    label: 'Cloak & Scarf',
    options: [
      { color: '#b91c1c', name: 'Crimson' },
      { color: '#1d4ed8', name: 'Cobalt' },
      { color: '#6d28d9', name: 'Royal Violet' },
      { color: '#047857', name: 'Emerald' },
      { color: '#d97706', name: 'Solar Gold' },
      { color: '#18181b', name: 'Obsidian' },
    ],
  },
  {
    key: 'armorColor',
    label: 'Armor Plate',
    options: [
      { color: '#94a3b8', name: 'Tempered Steel' },
      { color: '#cbd5e1', name: 'Silver Knight' },
      { color: '#475569', name: 'Dark Iron' },
      { color: '#ca8a04', name: 'Gilded Brass' },
      { color: '#991b1b', name: 'Blood Plate' },
      { color: '#312e81', name: 'Starlight Indigo' },
    ],
  },
  {
    key: 'visorColor',
    label: 'Visor Glow',
    options: [
      { color: '#fde047', name: 'Golden Flame' },
      { color: '#38bdf8', name: 'Arcane Cyan' },
      { color: '#ef4444', name: 'Crimson Gaze' },
      { color: '#34d399', name: 'Jade Spirit' },
      { color: '#e879f9', name: 'Stand Magenta' },
      { color: '#fb923c', name: 'Ember Orange' },
    ],
  },
  {
    key: 'plumeColor',
    label: 'Helm Plume',
    options: [
      { color: '#fbbf24', name: 'Imperial Gold' },
      { color: '#ef4444', name: 'Scarlet Crest' },
      { color: '#38bdf8', name: 'Frost Crest' },
      { color: '#a855f7', name: 'Phantom Crest' },
      { color: '#f8fafc', name: 'Ivory Feather' },
      { color: '#fb923c', name: 'Inferno Crest' },
    ],
  },
];

const STAT_ROWS: {
  key: StatKey;
  code: string;
  label: string;
  effect: (v: number) => string;
}[] = [
  {
    key: 'attack',
    code: 'STR',
    label: 'Attack Power',
    effect: (v) => `+${v * 3} Flat · +${v * 4}% Slash`,
  },
  {
    key: 'skillDmg',
    code: 'INT',
    label: 'Skill Damage',
    effect: (v) => `+${v * 8}% Skill Power`,
  },
  {
    key: 'hp',
    code: 'VIT',
    label: 'Max Health',
    effect: (v) => `+${v * 15} Max HP`,
  },
  {
    key: 'speed',
    code: 'AGI',
    label: 'Speed & Reflex',
    effect: (v) => `+${v * 6} SPD · +${v * 4} ST · -${Math.min(25, Math.round(v * 1.5))}% DMG Taken`,
  },
];

export const SanctuaryModal: React.FC<SanctuaryModalProps> = ({
  hud,
  onClose,
  onAllocateStat,
  onUpdateCustomization,
  onEquipOrCraftWeapon,
  onAssignSkill,
  onUseItem,
}) => {
  const [tab, setTab] = useState<'character' | 'arsenal' | 'items'>('character');
  const [selectedSlot, setSelectedSlot] = useState<0 | 1 | 2>(0);

  const equippedWeapon = WEAPONS[hud.equippedWeapon];

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/82 p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Main Sanctuary Interface"
      data-testid="sanctuary-modal"
    >
      <div className="relative w-full max-w-3xl bg-[#0e0910] border-2 border-amber-400 text-amber-50 p-4 sm:p-5 max-h-[90vh] flex flex-col shadow-[0_0_32px_rgba(251,191,36,0.2)]">
        {/* Corner Pixel Brackets */}
        <span className="absolute top-0 left-0 w-2 h-2 bg-amber-300" />
        <span className="absolute top-0 right-0 w-2 h-2 bg-amber-300" />
        <span className="absolute bottom-0 left-0 w-2 h-2 bg-amber-300" />
        <span className="absolute bottom-0 right-0 w-2 h-2 bg-amber-300" />

        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-amber-500/30 pb-3 mb-3">
          <div>
            <div className="font-pixel-mono text-[10px] tracking-[0.2em] text-amber-400 uppercase">
              KNIGHT SANCTUARY HUB
            </div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-amber-50">
              Main Sanctuary Interface
            </h2>
            <p className="font-pixel-mono text-[11px] text-amber-200/80">
              LV.{hud.level} · Gold {hud.gold}G · Stat Pts: {hud.statPoints} · Secrets {hud.secretsFound}/{hud.totalSecrets}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="sanctuary-close-btn"
            className="px-3 py-1.5 bg-[#26141b] border border-amber-400/70 hover:border-amber-200 font-pixel-mono text-xs text-amber-100 cursor-pointer shrink-0"
          >
            Return to Citadel [C]
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {(
            [
              ['character', 'Customize & Stat Points'],
              ['arsenal', 'Weapons & 3 Skill Slots'],
              ['items', 'Stored Items & Relics'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              data-testid={`sanctuary-tab-${id}`}
              onClick={() => setTab(id)}
              className={`px-3.5 py-1.5 text-xs font-pixel-mono border transition-colors cursor-pointer ${
                tab === id
                  ? 'bg-[#991b1b] border-amber-300 text-amber-50 font-bold'
                  : 'bg-[#191016] border-amber-500/30 text-amber-200/80 hover:text-amber-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 pr-1 space-y-3">
          {tab === 'character' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Left: Live Character Customizer */}
              <div className="md:col-span-6 bg-[#150d13] border border-amber-500/35 p-3 space-y-3">
                <div className="flex items-center gap-3 pb-2 border-b border-amber-500/20">
                  <PixelWarriorPortrait
                    weaponId={hud.equippedWeapon}
                    customization={hud.customization}
                    size={76}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-display font-bold text-sm text-amber-100">
                      Bastera Knight
                    </div>
                    <div className="font-pixel-mono text-[11px] text-amber-300 truncate">
                      {equippedWeapon.name}
                    </div>
                    {equippedWeapon.damageMultiplier && equippedWeapon.damageMultiplier > 1 && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 bg-orange-600/90 border border-yellow-300 font-pixel-mono text-[10px] font-bold text-white">
                        {equippedWeapon.damageMultiplier}x OP DAMAGE
                      </span>
                    )}
                    <div className="mt-1.5">
                      <button
                        type="button"
                        onClick={() => onUpdateCustomization(DEFAULT_WARRIOR_CUSTOMIZATION)}
                        className="px-2 py-0.5 bg-[#23141c] border border-amber-500/40 hover:border-amber-300 font-pixel-mono text-[10px] text-amber-200 cursor-pointer"
                      >
                        Reset Colors
                      </button>
                    </div>
                  </div>
                </div>

                {COLOR_SWATCHES.map((group) => (
                  <div key={group.key}>
                    <div className="font-pixel-mono text-[10px] text-amber-300 mb-1">
                      {group.label}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {group.options.map((opt) => {
                        const active = hud.customization[group.key] === opt.color;
                        return (
                          <button
                            key={opt.color}
                            type="button"
                            title={opt.name}
                            aria-label={`${group.label}: ${opt.name}`}
                            data-testid={`swatch-${group.key}-${opt.color}`}
                            onClick={() => onUpdateCustomization({ [group.key]: opt.color })}
                            className={`w-7 h-7 border-2 cursor-pointer transition-transform ${
                              active
                                ? 'border-white scale-110 shadow-[0_0_8px_rgba(255,255,255,0.5)]'
                                : 'border-black/80 hover:border-amber-300'
                            }`}
                            style={{ backgroundColor: opt.color }}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Right: Stat Point Distribution */}
              <div className="md:col-span-6 bg-[#07142b] border border-sky-400/55 p-3 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between border-b border-sky-400/35 pb-2 mb-2.5">
                    <span className="font-pixel-mono text-xs font-bold text-cyan-200">
                      ABILITY STAT DISTRIBUTION
                    </span>
                    <span
                      className="font-pixel-mono text-sm font-bold text-yellow-300"
                      data-testid="sanctuary-stat-points"
                    >
                      PTS: {hud.statPoints}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {STAT_ROWS.map((row) => {
                      const val = hud.stats[row.key];
                      return (
                        <div
                          key={row.key}
                          className="flex items-center justify-between gap-2 bg-[#0a1b38] border border-sky-400/35 px-2.5 py-2"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="px-1 py-0.5 bg-sky-950 border border-sky-400/50 font-pixel-mono text-[9px] text-cyan-300">
                                {row.code}
                              </span>
                              <span className="font-display text-xs font-bold text-white">
                                {row.label}
                              </span>
                              <span className="font-pixel-mono text-xs font-bold text-cyan-200">
                                {val}
                              </span>
                            </div>
                            <div className="font-pixel-mono text-[10px] text-sky-200/75 truncate mt-0.5">
                              {row.effect(val)}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              disabled={hud.statPoints <= 0}
                              data-testid={`sanctuary-add-${row.key}`}
                              onClick={() => onAllocateStat(row.key, 1)}
                              className="px-2 py-1 bg-sky-800 hover:bg-sky-700 disabled:opacity-35 border border-cyan-300 font-pixel-mono text-[10px] font-bold text-white cursor-pointer"
                            >
                              +1
                            </button>
                            <button
                              type="button"
                              disabled={hud.statPoints < 5}
                              onClick={() => onAllocateStat(row.key, 5)}
                              className="px-2 py-1 bg-sky-950 hover:bg-sky-800 disabled:opacity-30 border border-sky-400/70 font-pixel-mono text-[10px] text-cyan-200 cursor-pointer"
                            >
                              +5
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-[#050f20] border border-sky-500/30 px-2.5 py-2 font-pixel-mono text-[10px] text-sky-200/85 flex items-center justify-between">
                  <span>HP {hud.hp}/{hud.maxHp}</span>
                  <span>STAMINA {hud.stamina}/{hud.maxStamina}</span>
                  <span>SLAIN {hud.monstersSlain}</span>
                </div>
              </div>
            </div>
          )}

          {tab === 'arsenal' && (
            <div className="space-y-4">
              <div className="space-y-2">
                {(Object.keys(WEAPONS) as WeaponId[]).map((wid) => {
                  const w = WEAPONS[wid];
                  const unlocked = hud.unlockedWeapons.includes(wid);
                  const equipped = hud.equippedWeapon === wid;
                  const isOp = (w.damageMultiplier ?? 1) > 1;
                  return (
                    <div
                      key={wid}
                      className={`flex items-center justify-between gap-3 p-2.5 border ${
                        equipped
                          ? 'bg-[#281319] border-amber-400'
                          : isOp
                            ? 'bg-[#220e0c] border-orange-500/50'
                            : 'bg-[#170f14] border-amber-500/25'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <PixelWeaponIcon weaponId={wid} size={42} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-amber-100">{w.name}</span>
                            <span className="font-pixel-mono text-[10px] text-amber-400">
                              · DMG {w.damage}{isOp ? ` (x${w.damageMultiplier}!)` : ''}
                            </span>
                            {isOp && (
                              <span className="px-1.5 py-0.5 bg-orange-600 text-[9px] font-pixel-mono font-bold text-white">
                                SECRET OP
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-amber-100/80 mt-0.5">{w.description}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onEquipOrCraftWeapon(wid)}
                        className={`px-3 py-1.5 text-xs font-pixel-mono shrink-0 border cursor-pointer ${
                          equipped
                            ? 'bg-amber-500 text-black border-amber-200 font-bold'
                            : unlocked
                              ? 'bg-[#2a1820] text-amber-100 border-amber-400/50 hover:border-amber-200'
                              : w.craftCost
                                ? 'bg-[#1a1317] text-amber-300 border-amber-500/40 hover:border-amber-300'
                                : 'bg-[#181115] text-orange-300 border-orange-500/40'
                        }`}
                      >
                        {equipped
                          ? 'Equipped'
                          : unlocked
                            ? 'Equip'
                            : w.craftCost
                              ? `Forge (${w.craftCost.amount} ${w.craftCost.resourceId.replace('_', ' ')})`
                              : w.shopPrice
                                ? `Armory (${w.shopPrice}G)`
                                : 'Hidden Behind CP1'}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-amber-500/25 pt-3 space-y-2">
                <div className="font-pixel-mono text-xs text-amber-300">
                  3-SLOT ACTIVE SKILL LOADOUT (Select slot, then assign):
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {([0, 1, 2] as const).map((slotIdx) => {
                    const sid = hud.skillSlots[slotIdx];
                    const sk = SKILLS[sid];
                    return (
                      <button
                        key={slotIdx}
                        type="button"
                        onClick={() => setSelectedSlot(slotIdx)}
                        className={`p-2 text-left border flex items-center gap-2 cursor-pointer ${
                          selectedSlot === slotIdx
                            ? 'bg-[#2b141a] border-amber-300'
                            : 'bg-[#191015] border-amber-500/30'
                        }`}
                      >
                        <PixelSkillIcon skillId={sid} size={28} />
                        <div className="min-w-0">
                          <div className="font-pixel-mono text-[9px] text-amber-400">
                            Slot [{slotIdx + 1}]
                          </div>
                          <div className="text-xs font-semibold text-amber-50 truncate">{sk.name}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(Object.keys(SKILLS) as SkillId[]).map((sid) => {
                    const sk = SKILLS[sid];
                    const activeIn = hud.skillSlots.indexOf(sid);
                    return (
                      <div
                        key={sid}
                        className="flex items-center justify-between gap-2 p-2 bg-[#181014] border border-amber-500/25"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <PixelSkillIcon skillId={sid} size={34} />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-amber-100 truncate">{sk.name}</div>
                            <div className="font-pixel-mono text-[10px] text-amber-300/80">
                              {sk.cooldown}s CD · {sk.staminaCost} ST
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onAssignSkill(selectedSlot, sid)}
                          className="px-2 py-1 text-[10px] font-pixel-mono bg-[#2a1820] border border-amber-400/50 hover:border-amber-200 shrink-0 cursor-pointer"
                        >
                          {activeIn !== -1 ? `Slot ${activeIn + 1}` : `-> Slot ${selectedSlot + 1}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'items' && (
            <div className="space-y-2">
              {hud.inventory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 p-3 bg-[#170f14] border border-amber-500/25"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <PixelItemIcon itemId={item.id} size={44} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-amber-100">{item.name}</span>
                        <span className="font-pixel-mono text-xs text-amber-400">x{item.count}</span>
                      </div>
                      <p className="text-xs text-amber-100/80 mt-0.5">{item.description}</p>
                    </div>
                  </div>
                  {item.category === 'potion' && (
                    <button
                      type="button"
                      disabled={item.count <= 0}
                      onClick={() => onUseItem(item.id)}
                      className="px-3 py-1.5 text-xs font-pixel-mono bg-[#991b1b] disabled:opacity-40 border border-amber-400/60 hover:border-amber-200 shrink-0 cursor-pointer"
                    >
                      Drink
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
