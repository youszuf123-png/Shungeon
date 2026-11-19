import React from 'react';
import type { HudSnapshot } from '../game/types';

interface StatusModalsProps {
  hud: HudSnapshot;
  onResume: () => void;
  onRestartCheckpoint: () => void;
  onNewGame: () => void;
  onTitle: () => void;
  onQuickSave: () => void;
  onOpenSaves: () => void;
}

export const StatusModals: React.FC<StatusModalsProps> = ({
  hud,
  onResume,
  onRestartCheckpoint,
  onNewGame,
  onTitle,
  onQuickSave,
  onOpenSaves,
}) => {
  if (hud.status !== 'paused' && hud.status !== 'gameover' && hud.status !== 'victory') {
    return null;
  }

  const isVictory = hud.status === 'victory';
  const isPause = hud.status === 'paused';

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/75">
      <div className="w-full max-w-md bg-[#140c10] border-2 border-amber-400/75 p-6 text-amber-50">
        <h2 className="font-display text-2xl font-bold text-amber-100 mb-1">
          {isPause
            ? 'Citadel Paused'
            : isVictory
              ? 'Escaped the Endless Citadel!'
              : 'Fallen on the Royal Carpet'}
        </h2>
        <p className="font-pixel-mono text-xs text-amber-300/80 mb-5">
          {isPause
            ? 'Even citadel guardians wait politely while you catch your breath.'
            : isVictory
              ? 'You survived 120 dramatic villains and a terrifying wax budget.'
              : 'Your bones decorate the royal carpet. Try again from the last brazier.'}
        </p>

        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-[#1e1218] border border-amber-500/30 p-2.5 text-center">
            <div className="font-pixel-mono text-[10px] text-amber-300">BOSSES</div>
            <div className="font-pixel-mono text-lg font-bold text-amber-50">
              {hud.bossesDefeated}/{hud.totalBosses}
            </div>
          </div>
          <div className="bg-[#1e1218] border border-amber-500/30 p-2.5 text-center">
            <div className="font-pixel-mono text-[10px] text-amber-300">SECRETS</div>
            <div className="font-pixel-mono text-lg font-bold text-amber-50">
              {hud.secretsFound}/{hud.totalSecrets}
            </div>
          </div>
          <div className="bg-[#1e1218] border border-amber-500/30 p-2.5 text-center">
            <div className="font-pixel-mono text-[10px] text-amber-300">DISTANCE</div>
            <div className="font-pixel-mono text-lg font-bold text-amber-50">
              {hud.distanceMeters}m
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {isPause ? (
            <button
              type="button"
              onClick={onResume}
              className="w-full py-2.5 text-sm font-semibold bg-[#991b1b] border-2 border-amber-400 hover:bg-[#b91c1c] cursor-pointer"
            >
              Resume Escape
            </button>
          ) : (
            <button
              type="button"
              data-start="true"
              onClick={isVictory ? onNewGame : onRestartCheckpoint}
              className="w-full py-2.5 text-sm font-semibold bg-[#991b1b] border-2 border-amber-400 hover:bg-[#b91c1c] cursor-pointer"
            >
              {isVictory ? 'Play Again' : 'Respawn at Checkpoint'}
            </button>
          )}
          {isPause && (
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                data-testid="pause-save-btn"
                onClick={onQuickSave}
                className="py-2 text-xs font-pixel-mono bg-[#143326] border border-emerald-400/70 hover:border-emerald-200 text-emerald-100 cursor-pointer"
              >
                Quick Save
              </button>
              <button
                type="button"
                data-testid="pause-load-btn"
                onClick={onOpenSaves}
                className="py-2 text-xs font-pixel-mono bg-[#10263a] border border-cyan-400/70 hover:border-cyan-200 text-cyan-100 cursor-pointer"
              >
                Save / Load Slots
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onNewGame}
              className="py-2 text-xs font-pixel-mono bg-[#1f1319] border border-amber-500/40 hover:border-amber-300 cursor-pointer"
            >
              New Run
            </button>
            <button
              type="button"
              onClick={onTitle}
              className="py-2 text-xs font-pixel-mono bg-[#1f1319] border border-amber-500/40 hover:border-amber-300 cursor-pointer"
            >
              Title Screen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
