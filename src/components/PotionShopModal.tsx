import React from 'react';
import { POTION_SHOP_IDS } from '../game/data';
import type { HudSnapshot } from '../game/types';
import { PixelItemIcon } from './PixelPortrait';

interface PotionShopModalProps {
  hud: HudSnapshot;
  onClose: () => void;
  onBuyPotion: (itemId: string, drinkNow: boolean) => void;
}

export const PotionShopModal: React.FC<PotionShopModalProps> = ({
  hud,
  onClose,
  onBuyPotion,
}) => {
  const shopItems = POTION_SHOP_IDS.map((id) => hud.inventory.find((it) => it.id === id)).filter(
    (it): it is NonNullable<typeof it> => Boolean(it),
  );
  const hpPotions = shopItems.filter((it) => (it.healAmount ?? 0) > 0);
  const boostPotions = shopItems.filter((it) => (it.attackBoostMult ?? 1) > 1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/82"
      role="dialog"
      aria-modal="true"
      aria-label="Solaris Alchemist Potion Shop"
      data-testid="potion-shop-modal"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#120b1c] border-2 border-emerald-400/85 text-amber-50 shadow-[0_12px_40px_rgba(0,0,0,0.92)] overflow-hidden">
        <span className="absolute top-0 left-0 w-2 h-2 bg-emerald-300" />
        <span className="absolute top-0 right-0 w-2 h-2 bg-emerald-300" />
        <span className="absolute bottom-0 left-0 w-2 h-2 bg-emerald-300" />
        <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-300" />

        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-[#1b102c] border-b border-emerald-400/45">
          <div>
            <div className="font-pixel-mono text-[10px] tracking-[0.18em] text-emerald-300 uppercase">
              ARCANE ALCHEMIST APOTHECARY
            </div>
            <h2 className="font-display text-lg font-bold text-amber-50">
              Solaris Glowing Potion Dispensary
            </h2>
            <p className="font-pixel-mono text-[11px] text-emerald-200/80 mt-0.5">
              HP Elixirs &amp; Damage-Boosting Tonics brewed in luminous crystal vats
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right font-pixel-mono text-xs">
              <div className="text-yellow-300 font-bold">{hud.gold}G</div>
              <div className="text-[10px] text-rose-300">
                HP {hud.hp}/{hud.maxHp}
              </div>
            </div>
            <button
              type="button"
              tabIndex={-1}
              data-testid="potion-shop-close-btn"
              onClick={(e) => {
                e.currentTarget.blur();
                onClose();
              }}
              className="px-3 py-1.5 bg-[#291740] hover:bg-[#3a205c] border border-emerald-300/80 font-pixel-mono text-xs text-emerald-50 cursor-pointer"
            >
              Close [Esc]
            </button>
          </div>
        </div>

        {/* Active Boost Banner */}
        {hud.damageBoostSeconds > 0 && (
          <div className="px-5 py-2 bg-[#2a0f3b] border-b border-fuchsia-400/50 flex items-center justify-between font-pixel-mono text-xs text-fuchsia-200">
            <span>
              ⚡ ACTIVE DAMAGE BOOST: +{Math.round((hud.damageBoostMultiplier - 1) * 100)}% ATK
            </span>
            <span className="text-yellow-300 font-bold">{Math.ceil(hud.damageBoostSeconds)}s left</span>
          </div>
        )}

        {/* Potion Shelves */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* HP Potions */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-rose-500/35 pb-1.5">
              <h3 className="font-display text-sm font-bold text-rose-200">
                Vitality &amp; Healing Elixirs (HP)
              </h3>
              <span className="font-pixel-mono text-[10px] text-rose-300/80">
                Instant Battle &amp; Dungeon Recovery
              </span>
            </div>
            <div className="space-y-2">
              {hpPotions.map((item) => {
                const price = item.shopPrice ?? 80;
                const canAfford = hud.gold >= price;
                return (
                  <div
                    key={item.id}
                    data-testid={`potion-card-${item.id}`}
                    className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 p-3 bg-[#1a0f26] border border-rose-500/40"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <PixelItemIcon itemId={item.id} size={46} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display text-sm font-bold text-amber-50">
                            {item.name}
                          </span>
                          <span className="px-1.5 py-0.5 bg-rose-950 border border-rose-400/60 font-pixel-mono text-[9px] text-rose-200">
                            +{item.healAmount} HP
                          </span>
                          <span className="font-pixel-mono text-[10px] text-emerald-300">
                            Owned: x{item.count}
                          </span>
                        </div>
                        <p className="text-xs text-amber-100/80 mt-0.5">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        tabIndex={-1}
                        disabled={!canAfford}
                        data-testid={`buy-potion-${item.id}`}
                        onClick={(e) => {
                          e.currentTarget.blur();
                          onBuyPotion(item.id, false);
                        }}
                        className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-40 border border-emerald-300 font-pixel-mono text-[10px] font-bold text-white cursor-pointer"
                      >
                        Buy · {price}G
                      </button>
                      <button
                        type="button"
                        tabIndex={-1}
                        disabled={!canAfford}
                        onClick={(e) => {
                          e.currentTarget.blur();
                          onBuyPotion(item.id, true);
                        }}
                        className="px-2.5 py-1.5 bg-rose-900 hover:bg-rose-700 disabled:opacity-40 border border-rose-300 font-pixel-mono text-[10px] text-rose-50 cursor-pointer"
                      >
                        Buy &amp; Drink
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Damage-Boost Potions */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-fuchsia-500/35 pb-1.5">
              <h3 className="font-display text-sm font-bold text-fuchsia-200">
                Arcane Damage-Boosting Draughts (ATK)
              </h3>
              <span className="font-pixel-mono text-[10px] text-fuchsia-300/80">
                Boosts Sword &amp; Skill Output Across All Battles
              </span>
            </div>
            <div className="space-y-2">
              {boostPotions.map((item) => {
                const price = item.shopPrice ?? 180;
                const canAfford = hud.gold >= price;
                const pct = Math.round(((item.attackBoostMult ?? 1) - 1) * 100);
                return (
                  <div
                    key={item.id}
                    data-testid={`potion-card-${item.id}`}
                    className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 p-3 bg-[#1a0f26] border border-fuchsia-500/45"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <PixelItemIcon itemId={item.id} size={46} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display text-sm font-bold text-amber-50">
                            {item.name}
                          </span>
                          <span className="px-1.5 py-0.5 bg-fuchsia-950 border border-fuchsia-400/70 font-pixel-mono text-[9px] text-fuchsia-200">
                            +{pct}% DMG / {item.boostDuration}s
                          </span>
                          <span className="font-pixel-mono text-[10px] text-cyan-300">
                            Owned: x{item.count}
                          </span>
                        </div>
                        <p className="text-xs text-amber-100/80 mt-0.5">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        tabIndex={-1}
                        disabled={!canAfford}
                        data-testid={`buy-potion-${item.id}`}
                        onClick={(e) => {
                          e.currentTarget.blur();
                          onBuyPotion(item.id, false);
                        }}
                        className="px-3 py-1.5 bg-violet-800 hover:bg-violet-700 disabled:opacity-40 border border-violet-300 font-pixel-mono text-[10px] font-bold text-white cursor-pointer"
                      >
                        Buy · {price}G
                      </button>
                      <button
                        type="button"
                        tabIndex={-1}
                        disabled={!canAfford}
                        data-testid={`buy-drink-potion-${item.id}`}
                        onClick={(e) => {
                          e.currentTarget.blur();
                          onBuyPotion(item.id, true);
                        }}
                        className="px-2.5 py-1.5 bg-cyan-900 hover:bg-cyan-700 disabled:opacity-40 border border-cyan-300 font-pixel-mono text-[10px] text-cyan-50 cursor-pointer"
                      >
                        Buy &amp; Drink
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
