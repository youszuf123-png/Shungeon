import React, { useEffect, useRef, useState } from 'react';
import { GUILD_MISSIONS } from '../game/isekai';
import type { HudSnapshot } from '../game/types';

interface CaravanRiderModalProps {
  hud: HudSnapshot;
  onClose: () => void;
  onRideDestination: (rawDestination: string) => { ok: boolean; message: string };
}

export const CaravanRiderModal: React.FC<CaravanRiderModalProps> = ({
  hud,
  onClose,
  onRideDestination,
}) => {
  const [destination, setDestination] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 30);
    return () => window.clearTimeout(timer);
  }, []);

  const acceptedDef = hud.acceptedMissionId
    ? GUILD_MISSIONS.find((m) => m.id === hud.acceptedMissionId) ?? null
    : null;

  const isAtDungeonExterior = hud.realm === 'dungeon_exterior';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = onRideDestination(destination);
    if (!res.ok) {
      setErrorMsg(res.message);
      return;
    }
    setErrorMsg(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      role="dialog"
      aria-modal="true"
      aria-label="Caravan Rider Vance"
      data-testid="caravan-rider-modal"
    >
      <div className="relative w-full max-w-lg bg-[#19100a] border-2 border-amber-400 text-amber-50 shadow-[0_12px_36px_rgba(0,0,0,0.94)] overflow-hidden">
        <span className="absolute top-0 left-0 w-2 h-2 bg-amber-300" />
        <span className="absolute top-0 right-0 w-2 h-2 bg-amber-300" />
        <span className="absolute bottom-0 left-0 w-2 h-2 bg-amber-300" />
        <span className="absolute bottom-0 right-0 w-2 h-2 bg-amber-300" />

        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-[#29170d] border-b border-amber-500/45">
          <div>
            <div className="font-pixel-mono text-[10px] tracking-widest text-amber-300 uppercase">
              {isAtDungeonExterior
                ? 'Dungeon Forest Camp · Return Carriage'
                : 'Solaris Guild Outpost · Armored Caravan'}
            </div>
            <h2 className="font-display text-lg font-bold text-amber-100 mt-0.5">
              Caravan Rider Vance
            </h2>
          </div>
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onClose();
            }}
            className="px-3 py-1.5 bg-[#3a1f12] hover:bg-[#4e2a18] border border-amber-400/75 font-pixel-mono text-xs text-amber-100 cursor-pointer"
          >
            Close [Esc]
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-[#120b07] border border-amber-600/45 space-y-1.5">
            <p className="font-pixel-mono text-xs text-amber-100 leading-relaxed">
              &ldquo;
              {isAtDungeonExterior
                ? 'Waiting right here by the forest trees! Where shall I drive the wagon next — back to Solaris Town or straight to another dungeon?'
                : 'Horses are fed and ready! Type where you want to ride — I will drop you in the green forest right outside the dungeon entrance.'}
              &rdquo;
            </p>
            {acceptedDef && (
              <div
                data-testid="caravan-accepted-contract-hint"
                className="pt-1 border-t border-amber-700/40 font-pixel-mono text-[11px] text-emerald-300 font-bold"
              >
                Active Guild Contract: [{acceptedDef.rankReq}-Rank] {acceptedDef.title} ({acceptedDef.regionLabel})
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="caravan-destination-input"
              className="block font-pixel-mono text-[11px] font-bold text-amber-200 uppercase tracking-wide"
            >
              Type Destination Name
            </label>
            <input
              ref={inputRef}
              id="caravan-destination-input"
              data-testid="caravan-destination-input"
              type="text"
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder={
                isAtDungeonExterior
                  ? 'e.g. Solaris Town, Goblin Dungeon, Demon Realm...'
                  : 'e.g. Goblin Dungeon, Demon Realm, Princess Escort...'
              }
              className="w-full px-3 py-2.5 bg-[#0e0805] border-2 border-amber-500/75 focus:border-amber-300 focus:outline-none font-pixel-mono text-sm text-amber-50 placeholder:text-amber-200/35"
            />
          </div>

          <div className="p-2.5 bg-[#140d09] border border-amber-700/40 font-pixel-mono text-[10px] text-amber-200/85 space-y-1 leading-relaxed">
            <div className="text-amber-300 font-bold">Known Caravan Routes ({hud.guildRank}-Rank):</div>
            <div>
              • <span className="text-emerald-300">Goblin Dungeon</span> (F+ Rank) ·{' '}
              <span className={hud.guildRank === 'F' || hud.guildRank === 'E' || hud.guildRank === 'D' ? 'text-slate-400' : 'text-rose-300'}>
                Demon Realm
              </span>{' '}
              (C+ Rank)
            </div>
            <div>
              • <span className={hud.guildRank === 'B' || hud.guildRank === 'A' || hud.guildRank === 'S' ? 'text-yellow-300' : 'text-slate-400'}>
                Princess Escort
              </span>{' '}
              (B+ Rank) ·{' '}
              <span className={hud.guildRank === 'A' || hud.guildRank === 'S' ? 'text-purple-300' : 'text-slate-400'}>
                Demon King Citadel
              </span>{' '}
              (A+ Rank)
            </div>
            <div>
              • <span className="text-sky-300">Solaris Town</span> (Return from Dungeon Forest Outskirts)
            </div>
          </div>

          {errorMsg && (
            <div
              data-testid="caravan-error-banner"
              className="p-2.5 bg-[#2a0e14] border border-rose-400 font-pixel-mono text-[11px] text-rose-100"
            >
              {errorMsg}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onClose();
              }}
              className="px-4 py-2 bg-[#23150d] hover:bg-[#352014] border border-amber-600/60 font-pixel-mono text-xs text-amber-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="caravan-depart-btn"
              className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 border-2 border-emerald-300 font-pixel-mono text-xs font-bold text-white cursor-pointer"
            >
              RIDE CARAVAN ▶
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
