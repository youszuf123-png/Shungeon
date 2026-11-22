import React from 'react';
import { ARENA_CHALLENGERS } from '../game/isekai';
import { calculateAttackDamage } from '../game/rules';
import type { ArenaChallengerId, HudSnapshot } from '../game/types';

interface DuelingArenaModalProps {
  hud: HudSnapshot;
  onClose: () => void;
  onSelectChallenger: (challengerId: ArenaChallengerId) => void;
}

export const DuelingArenaModal: React.FC<DuelingArenaModalProps> = ({
  hud,
  onClose,
  onSelectChallenger,
}) => {
  // Approximate live player ATK preview from HUD stats/boost
  const estAtk = Math.round(
    calculateAttackDamage(
      {
        equippedWeapon: hud.equippedWeapon,
        stats: hud.stats,
        damageBoostMultiplier: hud.damageBoostMultiplier,
        damageBoostTimer: hud.damageBoostSeconds,
      } as Parameters<typeof calculateAttackDamage>[0],
      1,
      false,
    ),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/82"
      role="dialog"
      aria-modal="true"
      aria-label="Solaris Grand Colosseum Challengers"
      data-testid="dueling-arena-modal"
    >
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-[#140c16] border-2 border-amber-400 text-amber-50 shadow-[0_14px_40px_rgba(0,0,0,0.95)] overflow-hidden">
        <span className="absolute top-0 left-0 w-2 h-2 bg-amber-300" />
        <span className="absolute top-0 right-0 w-2 h-2 bg-amber-300" />
        <span className="absolute bottom-0 left-0 w-2 h-2 bg-amber-300" />
        <span className="absolute bottom-0 right-0 w-2 h-2 bg-amber-300" />

        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-[#241328] border-b border-amber-500/45">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-lg font-bold text-amber-100">
                Solaris Grand Colosseum · Jujutsu Kaisen Challengers
              </h2>
              <span className="px-2 py-0.5 bg-amber-900/75 border border-amber-300 font-pixel-mono text-[10px] font-bold text-amber-100">
                Arena Wins: {hud.arenaWins}
              </span>
            </div>
            <p className="font-pixel-mono text-[11px] text-amber-200/80 mt-0.5">
              Normal Real-Time Combat · Opponents scale to YOUR exact Stats ({hud.maxHp} HP · ~{estAtk} ATK · Matched Speed) with OP Tactical AI!
            </p>
          </div>
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onClose();
            }}
            className="px-3 py-1.5 bg-[#361d2e] hover:bg-[#4b2740] border border-amber-400/75 font-pixel-mono text-xs text-amber-100 cursor-pointer"
          >
            Close [Esc]
          </button>
        </div>

        {/* Fighter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 p-5 overflow-y-auto">
          {ARENA_CHALLENGERS.map((ch) => (
            <div
              key={ch.id}
              data-testid={`arena-challenger-card-${ch.id}`}
              className="flex flex-col justify-between gap-3 p-4 bg-[#1b1020] border border-amber-500/45 hover:border-amber-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="inline-block w-3 h-3 border border-white/70 shrink-0"
                        style={{ backgroundColor: ch.auraColor }}
                      />
                      <h3 className="font-display text-base font-bold text-amber-50">
                        {ch.name}
                      </h3>
                    </div>
                    <div className="font-pixel-mono text-[10px] text-cyan-300 mt-0.5">
                      {ch.title} · {ch.worldOrigin}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-[#110915] border border-purple-400/60 font-pixel-mono text-[9px] font-bold text-purple-200 shrink-0">
                    MATCHED STATS · OP AI
                  </span>
                </div>

                <div className="mt-2 font-pixel-mono text-[10px] text-amber-300">
                  Weapon: <span className="text-amber-100">{ch.weaponName}</span> · HP {hud.maxHp} · Matched ATK &amp; Speed
                </div>

                <p className="font-pixel-mono text-[10px] text-amber-100/80 mt-2 leading-relaxed">
                  {ch.description}
                </p>

                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {ch.skills.map((sk) => (
                    <span
                      key={sk.id}
                      className="px-2 py-0.5 bg-[#120a18] border border-amber-500/40 font-pixel-mono text-[9px] text-amber-200"
                      style={{ borderColor: sk.color }}
                    >
                      ✦ {sk.name}
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                tabIndex={-1}
                data-testid={`challenge-fighter-${ch.id}`}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onSelectChallenger(ch.id);
                  onClose();
                }}
                className="w-full py-2 bg-[#7c2d12] hover:bg-[#9a3412] border-2 border-amber-300 font-pixel-mono text-xs font-bold text-amber-50 cursor-pointer"
              >
                CHALLENGE {ch.name.toUpperCase()} ⚔
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
