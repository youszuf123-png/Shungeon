import React, { useMemo, useState } from 'react';
import { TOTAL_BOSSES, getBiomeDisplayName, getBossDef } from '../game/data';
import type { HudSnapshot } from '../game/types';

interface CheckpointMapModalProps {
  hud: HudSnapshot;
  onClose: () => void;
  onWarpCheckpoint: (cpIndex: number) => void;
}

export const CheckpointMapModal: React.FC<CheckpointMapModalProps> = ({
  hud,
  onClose,
  onWarpCheckpoint,
}) => {
  const [view, setView] = useState<'checkpoints' | 'codex'>('checkpoints');
  const [biomeFilter, setBiomeFilter] = useState<'castle' | 'forest' | 'volcano'>('castle');

  const bossesInBiome = useMemo(() => {
    const start = biomeFilter === 'castle' ? 1 : biomeFilter === 'forest' ? 41 : 81;
    return Array.from({ length: 40 }, (_, i) => getBossDef(start + i));
  }, [biomeFilter]);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/75">
      <div className="w-full max-w-2xl bg-[#130c10] border-2 border-amber-500/60 p-5 text-amber-50 max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-amber-500/25 pb-3 mb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-amber-100">
              Citadel Checkpoints & 120 JoJo Codex
            </h2>
            <p className="font-pixel-mono text-xs text-amber-300/80">
              Biome shifts every 40 Bosses · Bosses: {hud.bossesDefeated}/{TOTAL_BOSSES} · Secrets: {hud.secretsFound}/{hud.totalSecrets}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-pixel-mono bg-[#24161e] border border-amber-500/40 hover:border-amber-300 cursor-pointer"
          >
            Close [M]
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => setView('checkpoints')}
            className={`px-4 py-1.5 text-xs font-semibold border cursor-pointer ${
              view === 'checkpoints'
                ? 'bg-[#991b1b] border-amber-300 text-amber-50'
                : 'bg-[#1c1117] border-amber-500/25 text-amber-200/75'
            }`}
          >
            Checkpoints
          </button>
          <button
            type="button"
            onClick={() => setView('codex')}
            className={`px-4 py-1.5 text-xs font-semibold border cursor-pointer ${
              view === 'codex'
                ? 'bg-[#991b1b] border-amber-300 text-amber-50'
                : 'bg-[#1c1117] border-amber-500/25 text-amber-200/75'
            }`}
          >
            120 JoJo Bosses
          </button>
        </div>

        <div className="overflow-y-auto flex-1 pr-1">
          {view === 'checkpoints' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {hud.checkpoints.map((cp) => (
                <div
                  key={cp.index}
                  className={`flex items-center justify-between p-2.5 border ${
                    cp.reached
                      ? 'bg-[#1c1218] border-amber-500/45'
                      : 'bg-[#110b0e] border-amber-900/30 opacity-55'
                  }`}
                >
                  <div>
                    <div className="text-xs font-pixel-mono font-bold text-amber-200">
                      {cp.label}
                    </div>
                    <div className="text-[11px] text-amber-100/70">
                      {getBiomeDisplayName(cp.biome)}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!cp.reached}
                    onClick={() => onWarpCheckpoint(cp.index)}
                    className="px-3 py-1 text-xs font-pixel-mono bg-[#2d1820] border border-amber-400/50 disabled:opacity-40 cursor-pointer"
                  >
                    {cp.reached ? 'Warp' : 'Locked'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-3">
                {(['castle', 'forest', 'volcano'] as const).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBiomeFilter(b)}
                    className={`px-3 py-1 text-xs font-pixel-mono border cursor-pointer ${
                      biomeFilter === b
                        ? 'bg-amber-500 text-black border-amber-200 font-bold'
                        : 'bg-[#1a1015] text-amber-200 border-amber-500/30'
                    }`}
                  >
                    {b === 'castle' ? '1-40 Castle' : b === 'forest' ? '41-80 Ruins' : '81-120 Volcano'}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {bossesInBiome.map((b) => {
                  const slain = b.index <= hud.bossesDefeated;
                  return (
                    <div
                      key={b.index}
                      className="p-2.5 bg-[#181014] border border-amber-500/25 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-amber-100 truncate">
                          #{b.index} {b.name}
                        </div>
                        <div className="font-pixel-mono text-[10px] text-amber-300/80 truncate">
                          Stand: {b.standName} · {b.music.bpm} BPM
                        </div>
                      </div>
                      <span
                        className={`font-pixel-mono text-[10px] shrink-0 ${
                          slain ? 'text-emerald-400' : 'text-amber-500/70'
                        }`}
                      >
                        {slain ? 'SLAIN' : `${b.maxHp} HP`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
