import React from 'react';
import { WEAPONS, WEAPON_SHOP_ORDER } from '../game/data';
import type { HudSnapshot, WeaponId } from '../game/types';
import { PixelWeaponIcon } from './PixelPortrait';

interface WeaponShopModalProps {
  hud: HudSnapshot;
  onClose: () => void;
  onBuyOrEquipWeapon: (weaponId: WeaponId) => void;
}

export const WeaponShopModal: React.FC<WeaponShopModalProps> = ({
  hud,
  onClose,
  onBuyOrEquipWeapon,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/82"
      role="dialog"
      aria-modal="true"
      aria-label="Grand Solaris Weapons Armory"
      data-testid="weapons-shop-modal"
    >
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-[#160f0d] border-2 border-amber-400/90 text-amber-50 shadow-[0_12px_42px_rgba(0,0,0,0.94)] overflow-hidden">
        <span className="absolute top-0 left-0 w-2 h-2 bg-amber-300" />
        <span className="absolute top-0 right-0 w-2 h-2 bg-amber-300" />
        <span className="absolute bottom-0 left-0 w-2 h-2 bg-amber-300" />
        <span className="absolute bottom-0 right-0 w-2 h-2 bg-amber-300" />

        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-[#251610] border-b border-amber-500/45">
          <div>
            <div className="font-pixel-mono text-[10px] tracking-[0.2em] text-amber-400 uppercase">
              GRAND SOLARIS ARMORY HALL
            </div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-amber-50">
              Masterwork Weapons Gallery ({WEAPON_SHOP_ORDER.length} Signature Blades)
            </h2>
            <p className="font-pixel-mono text-[11px] text-amber-200/80 mt-0.5">
              Every weapon has its own custom blade color, physical length/width scale, and passive special effect.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right font-pixel-mono text-xs">
              <div className="text-yellow-300 font-bold">{hud.gold}G</div>
              <div className="text-[10px] text-amber-200/80">
                Equipped: {WEAPONS[hud.equippedWeapon].name}
              </div>
            </div>
            <button
              type="button"
              tabIndex={-1}
              data-testid="weapons-shop-close-btn"
              onClick={(e) => {
                e.currentTarget.blur();
                onClose();
              }}
              className="px-3 py-1.5 bg-[#3a1f14] hover:bg-[#522b1b] border border-amber-300 font-pixel-mono text-xs text-amber-50 cursor-pointer"
            >
              Close [Esc]
            </button>
          </div>
        </div>

        {/* Wide Multi-Column Weapon Rack Grid */}
        <div className="p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {WEAPON_SHOP_ORDER.map((wid) => {
            const w = WEAPONS[wid];
            const unlocked = hud.unlockedWeapons.includes(wid);
            const equipped = hud.equippedWeapon === wid;
            const price = w.shopPrice ?? 0;
            const canAfford = hud.gold >= price;
            const lengthPct = Math.min(100, Math.round((w.visualLength / 32) * 100));

            return (
              <div
                key={wid}
                data-testid={`armory-weapon-${wid}`}
                className={`p-2.5 border flex flex-col justify-between gap-2 ${
                  equipped
                    ? 'bg-[#2a1712] border-amber-300'
                    : unlocked
                      ? 'bg-[#1b1210] border-amber-500/45'
                      : 'bg-[#130d0b] border-amber-800/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <PixelWeaponIcon weaponId={wid} size={52} />
                    <span
                      title={`Blade Color ${w.color}`}
                      className="absolute -bottom-1 -right-1 w-3.5 h-3.5 border border-black"
                      style={{ backgroundColor: w.color }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-sm font-bold text-amber-50 truncate">
                        {w.name}
                      </span>
                      <span
                        className="px-1.5 py-0.5 border font-pixel-mono text-[9px] font-bold shrink-0"
                        style={{
                          borderColor: w.color,
                          color: w.color,
                          backgroundColor: '#0e090a',
                        }}
                      >
                        {w.specialLabel}
                      </span>
                    </div>
                    <div className="font-pixel-mono text-[10px] text-amber-300 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>DMG {w.damage}{w.damageMultiplier ? ` (×${w.damageMultiplier})` : ''}</span>
                      <span>· RNG {w.range}px</span>
                      <span>· SIZE {w.visualLength}×{w.visualWidth}</span>
                    </div>
                    <p className="text-xs text-amber-100/80 mt-1 leading-snug">{w.description}</p>
                  </div>
                </div>

                {/* Weapon Blade Size / Color Bar + Action */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-amber-500/20">
                  <div className="flex-1">
                    <div className="flex items-center justify-between font-pixel-mono text-[9px] text-amber-200/70 mb-1">
                      <span>Blade Scale</span>
                      <span>{w.styleName}</span>
                    </div>
                    <div className="w-full h-2 bg-[#0a0607] border border-amber-900/60 overflow-hidden">
                      <div
                        className="h-full"
                        style={{
                          width: `${lengthPct}%`,
                          backgroundColor: w.color,
                        }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    tabIndex={-1}
                    disabled={!unlocked && !canAfford}
                    data-testid={`armory-action-${wid}`}
                    onClick={(e) => {
                      e.currentTarget.blur();
                      onBuyOrEquipWeapon(wid);
                    }}
                    className={`px-3 py-1.5 font-pixel-mono text-[10px] font-bold border shrink-0 cursor-pointer ${
                      equipped
                        ? 'bg-amber-400 text-black border-amber-100'
                        : unlocked
                          ? 'bg-[#2e1b16] hover:bg-[#3f251e] text-amber-100 border-amber-300'
                          : canAfford
                            ? 'bg-emerald-800 hover:bg-emerald-700 text-white border-emerald-300'
                            : 'bg-slate-900 text-slate-400 border-slate-700 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    {equipped ? 'EQUIPPED' : unlocked ? 'EQUIP' : `BUY · ${price}G`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
