import React, { useState } from 'react';
import { SKILLS, WEAPONS } from '../game/data';
import type { HudSnapshot, SkillId, WeaponId } from '../game/types';
import { PixelItemIcon, PixelSkillIcon, PixelWeaponIcon } from './PixelPortrait';

interface InventoryModalProps {
  hud: HudSnapshot;
  onClose: () => void;
  onEquipOrCraftWeapon: (weaponId: WeaponId) => void;
  onAssignSkill: (slot: 0 | 1 | 2, skillId: SkillId) => void;
  onUseItem: (itemId: string) => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  hud,
  onClose,
  onEquipOrCraftWeapon,
  onAssignSkill,
  onUseItem,
}) => {
  const [tab, setTab] = useState<'weapons' | 'skills' | 'pouch'>('weapons');
  const [selectedSlot, setSelectedSlot] = useState<0 | 1 | 2>(0);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/75">
      <div className="w-full max-w-2xl bg-[#130c10] border-2 border-amber-500/60 p-5 text-amber-50 max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-amber-500/25 pb-3 mb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-amber-100">Royal Satchel & Arsenal</h2>
            <p className="font-pixel-mono text-xs text-amber-300/80">
              Gold: {hud.gold}G · Secrets: {hud.secretsFound}/{hud.totalSecrets}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-pixel-mono bg-[#24161e] border border-amber-500/40 hover:border-amber-300 cursor-pointer"
          >
            Close [I]
          </button>
        </div>

        {/* Segmented tabs */}
        <div className="flex items-center gap-2 mb-4">
          {(['weapons', 'skills', 'pouch'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-xs font-semibold border transition-colors cursor-pointer ${
                tab === t
                  ? 'bg-[#991b1b] border-amber-300 text-amber-50'
                  : 'bg-[#1c1117] border-amber-500/25 text-amber-200/75 hover:text-amber-100'
              }`}
            >
              {t === 'weapons' ? 'Sword Styles' : t === 'skills' ? '3 Skill Slots' : 'Magic Items & Resources'}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 pr-1 space-y-2.5">
          {tab === 'weapons' &&
            (Object.keys(WEAPONS) as WeaponId[]).map((wid) => {
              const w = WEAPONS[wid];
              const unlocked = hud.unlockedWeapons.includes(wid);
              const equipped = hud.equippedWeapon === wid;
              return (
                <div
                  key={wid}
                  className={`flex items-center justify-between gap-4 p-3 border ${
                    equipped
                      ? 'bg-[#251319] border-amber-400'
                      : 'bg-[#191015] border-amber-500/25'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <PixelWeaponIcon weaponId={wid} size={46} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-amber-100">{w.name}</span>
                        <span className="font-pixel-mono text-[11px] text-amber-400">
                          · {w.styleName}
                        </span>
                      </div>
                      <p className="text-xs text-amber-100/80 mt-0.5">{w.description}</p>
                      <p className="font-pixel-mono text-[11px] text-amber-300/70 italic mt-1">
                        "{w.sarcasticNote}"
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onEquipOrCraftWeapon(wid)}
                    className={`px-3.5 py-2 text-xs font-pixel-mono shrink-0 border cursor-pointer ${
                      equipped
                        ? 'bg-amber-500 text-black border-amber-200 font-bold'
                        : unlocked
                          ? 'bg-[#2a1820] text-amber-100 border-amber-400/50 hover:border-amber-200'
                          : 'bg-[#1a1317] text-amber-300 border-amber-500/40 hover:border-amber-300'
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

          {tab === 'skills' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {([0, 1, 2] as const).map((slotIdx) => {
                  const sid = hud.skillSlots[slotIdx];
                  const sk = SKILLS[sid];
                  return (
                    <button
                      key={slotIdx}
                      type="button"
                      onClick={() => setSelectedSlot(slotIdx)}
                      className={`p-2.5 text-left border flex items-center gap-2 cursor-pointer ${
                        selectedSlot === slotIdx
                          ? 'bg-[#2b141a] border-amber-300'
                          : 'bg-[#191015] border-amber-500/30'
                      }`}
                    >
                      <PixelSkillIcon skillId={sid} size={30} />
                      <div className="min-w-0">
                        <div className="font-pixel-mono text-[10px] text-amber-400">
                          Slot [{slotIdx + 1}]
                        </div>
                        <div className="text-xs font-semibold text-amber-50 truncate mt-0.5">{sk.name}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2">
                {(Object.keys(SKILLS) as SkillId[]).map((sid) => {
                  const sk = SKILLS[sid];
                  const activeInSlot = hud.skillSlots.indexOf(sid);
                  return (
                    <div
                      key={sid}
                      className="flex items-center justify-between gap-4 p-3 bg-[#191015] border border-amber-500/25"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <PixelSkillIcon skillId={sid} size={42} />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-amber-100">
                            {sk.name}{' '}
                            <span className="font-pixel-mono text-[11px] text-amber-300">
                              · CD {sk.cooldown}s · {sk.staminaCost} ST
                            </span>
                          </div>
                          <p className="text-xs text-amber-100/75 mt-0.5">{sk.description}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onAssignSkill(selectedSlot, sid)}
                        className="px-3 py-1.5 text-xs font-pixel-mono bg-[#2a1820] border border-amber-400/50 hover:border-amber-200 shrink-0 cursor-pointer"
                      >
                        {activeInSlot !== -1
                          ? `In Slot ${activeInSlot + 1}`
                          : `Assign -> Slot ${selectedSlot + 1}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'pouch' &&
            hud.inventory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 p-3 bg-[#191015] border border-amber-500/25"
                data-testid={`inventory-item-${item.id}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <PixelItemIcon itemId={item.id} size={48} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-amber-100">{item.name}</span>
                      <span className="font-pixel-mono text-xs text-amber-400">x{item.count}</span>
                      {item.category === 'orb' && (
                        <span className="px-1.5 py-0.5 text-[9px] font-pixel-mono font-bold bg-[#28141e] border border-amber-400/50 text-amber-300">
                          BOSS ORB
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-amber-100/80 mt-0.5">{item.description}</p>
                    <p className="font-pixel-mono text-[11px] text-amber-300/70 italic mt-1">
                      "{item.sarcasticQuote}"
                    </p>
                  </div>
                </div>
                {item.category === 'potion' && (
                  <button
                    type="button"
                    disabled={item.count <= 0}
                    onClick={() => onUseItem(item.id)}
                    className="px-3.5 py-2 text-xs font-pixel-mono bg-[#991b1b] disabled:opacity-40 border border-amber-400/60 hover:border-amber-200 shrink-0 cursor-pointer"
                  >
                    Drink
                  </button>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
