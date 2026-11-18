import React from 'react';
import { WEAPONS } from '../game/data';
import type { HudSnapshot, StatKey } from '../game/types';

interface SoloLevelingStatusModalProps {
  hud: HudSnapshot;
  onClose: () => void;
  onAllocateStat: (statKey: StatKey, amount?: number) => void;
}

const STAT_ROWS: {
  key: StatKey;
  code: string;
  label: string;
  effect: (val: number) => string;
}[] = [
  {
    key: 'attack',
    code: 'STR',
    label: 'Attack Power',
    effect: (v) => `+${v * 3} Flat DMG · +${v * 4}% Slash`,
  },
  {
    key: 'skillDmg',
    code: 'INT',
    label: 'Skill Damage',
    effect: (v) => `+${v * 8}% Skill Output`,
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

function getHunterRank(level: number, bossesDefeated: number): string {
  if (bossesDefeated >= 100) return 'S-RANK MONARCH';
  if (bossesDefeated >= 60) return 'A-RANK VANGUARD';
  if (bossesDefeated >= 30) return 'B-RANK DUELIST';
  if (bossesDefeated >= 10 || level >= 12) return 'C-RANK ESCAPEE';
  if (bossesDefeated >= 1 || level >= 4) return 'D-RANK KNIGHT';
  return 'E-RANK PRISONER';
}

export const SoloLevelingStatusModal: React.FC<SoloLevelingStatusModalProps> = ({
  hud,
  onClose,
  onAllocateStat,
}) => {
  const hpPct = Math.max(0, Math.min(100, (hud.hp / Math.max(1, hud.maxHp)) * 100));
  const stamPct = Math.max(0, Math.min(100, (hud.stamina / Math.max(1, hud.maxStamina)) * 100));
  const weapon = WEAPONS[hud.equippedWeapon];
  const rank = getHunterRank(hud.level, hud.bossesDefeated);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="System Status Window"
      data-testid="solo-leveling-status-modal"
    >
      <div className="relative w-full max-w-[540px] bg-[#040c1c] border-2 border-sky-400 text-sky-50 shadow-[0_0_28px_rgba(56,189,248,0.28)] p-4 sm:p-5">
        {/* Sharp Solo Leveling System Corner Brackets */}
        <span className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-cyan-200" />
        <span className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-cyan-200" />
        <span className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-cyan-200" />
        <span className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-cyan-200" />

        {/* Header: [ ! ] STATUS */}
        <div className="flex items-center justify-between border-b border-sky-400/45 pb-2.5 mb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 flex items-center justify-center border border-cyan-300 bg-sky-950 font-pixel-mono text-xs font-bold text-cyan-200">
              !
            </span>
            <div>
              <div className="font-pixel-mono text-[10px] tracking-[0.22em] text-cyan-300 uppercase">
                SYSTEM NOTIFICATION
              </div>
              <h2 className="font-display font-bold text-lg tracking-wider text-white leading-tight">
                STATUS WINDOW
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 bg-sky-950/90 border border-sky-400/70 hover:border-cyan-200 font-pixel-mono text-xs text-cyan-100 cursor-pointer"
          >
            CLOSE [K]
          </button>
        </div>

        {/* Top Identity Grid: Level / Job / Rank */}
        <div className="grid grid-cols-3 gap-2 bg-[#07142b] border border-sky-500/40 p-2.5 mb-3 font-pixel-mono">
          <div>
            <div className="text-[9px] text-sky-300/75 uppercase">LEVEL</div>
            <div className="text-lg font-bold text-cyan-200 leading-tight">{hud.level}</div>
          </div>
          <div>
            <div className="text-[9px] text-sky-300/75 uppercase">JOB / CLASS</div>
            <div className="text-xs font-bold text-white mt-0.5 truncate">{weapon.styleName}</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-sky-300/75 uppercase">TITLE</div>
            <div className="text-[11px] font-bold text-amber-300 mt-0.5 truncate">{rank}</div>
          </div>
        </div>

        {/* Vital Bars: HP & Stamina + Slain Tally */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-[#061126] border border-sky-500/35 p-2.5 mb-3">
          <div>
            <div className="flex justify-between font-pixel-mono text-[10px] text-sky-200 mb-1">
              <span>HP (VIT)</span>
              <span>
                {hud.hp} / {hud.maxHp}
              </span>
            </div>
            <div className="w-full h-2 bg-sky-950 border border-sky-500/40">
              <div
                className="h-full bg-cyan-400 transition-[width] duration-150"
                style={{ width: `${hpPct}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between font-pixel-mono text-[10px] text-sky-200 mb-1">
              <span>STAMINA (AGI)</span>
              <span>
                {hud.stamina} / {hud.maxStamina}
              </span>
            </div>
            <div className="w-full h-2 bg-sky-950 border border-sky-500/40">
              <div
                className="h-full bg-sky-300 transition-[width] duration-150"
                style={{ width: `${stamPct}%` }}
              />
            </div>
          </div>

          <div className="sm:col-span-2 flex items-center justify-between text-[10px] font-pixel-mono text-sky-300/85 border-t border-sky-500/25 pt-1.5">
            <span>MONSTERS SLAIN: {hud.monstersSlain} (+1 PT EACH)</span>
            <span>BOSSES FELLED: {hud.bossesDefeated} (+10 PTS EACH)</span>
          </div>
        </div>

        {/* Ability Point Allocation Rows */}
        <div className="space-y-2 mb-3">
          {STAT_ROWS.map((row) => {
            const currentVal = hud.stats[row.key];
            const hasPoints = hud.statPoints > 0;
            return (
              <div
                key={row.key}
                className="flex items-center justify-between gap-2 bg-[#07152e] border border-sky-400/40 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-pixel-mono text-[10px] font-bold text-cyan-300 bg-sky-950 border border-sky-500/50 px-1.5 py-0.5">
                      {row.code}
                    </span>
                    <span className="font-display font-bold text-sm text-white">
                      {row.label}
                    </span>
                    <span
                      className="font-pixel-mono text-sm font-bold text-cyan-200"
                      data-testid={`stat-val-${row.key}`}
                    >
                      {currentVal}
                    </span>
                  </div>
                  <div className="font-pixel-mono text-[10px] text-sky-200/75 mt-0.5 truncate">
                    {row.effect(currentVal)}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={!hasPoints}
                    data-testid={`stat-add-${row.key}`}
                    onClick={() => onAllocateStat(row.key, 1)}
                    className="px-2.5 py-1 bg-sky-900 hover:bg-sky-700 disabled:opacity-35 border border-cyan-300 font-pixel-mono text-xs font-bold text-white cursor-pointer"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    disabled={hud.statPoints < 5}
                    data-testid={`stat-add5-${row.key}`}
                    onClick={() => onAllocateStat(row.key, 5)}
                    className="px-2 py-1 bg-sky-950 hover:bg-sky-800 disabled:opacity-30 border border-sky-400/70 font-pixel-mono text-xs text-cyan-200 cursor-pointer"
                  >
                    +5
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer: Available Ability Points */}
        <div className="flex items-center justify-between bg-[#081a38] border border-cyan-300/70 px-3 py-2">
          <span className="font-pixel-mono text-xs tracking-wider text-cyan-100 uppercase">
            AVAILABLE ABILITY POINTS
          </span>
          <span
            className="font-pixel-mono text-xl font-bold text-cyan-300"
            data-testid="status-available-points"
          >
            {hud.statPoints}
          </span>
        </div>
      </div>
    </div>
  );
};
