import React, { useState } from 'react';
import type { OnlineWorldSummary, WorldRole } from '../game/types';

interface WorldsModalProps {
  worldId: string;
  worldRole: WorldRole;
  worldHostName: string | null;
  isWorldPublic: boolean;
  worldPlayerCount: number;
  onlineWorlds: OnlineWorldSummary[];
  onClose: () => void;
  onJoinWorld: (targetWorldId: string) => void;
  onLeaveWorld: () => void;
  onTogglePublic: (isPublic: boolean) => void;
  onRefreshWorlds: () => void;
}

export const WorldsModal: React.FC<WorldsModalProps> = ({
  worldId,
  worldRole,
  worldHostName,
  isWorldPublic,
  worldPlayerCount,
  onlineWorlds,
  onClose,
  onJoinWorld,
  onLeaveWorld,
  onTogglePublic,
  onRefreshWorlds,
}) => {
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(worldId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard unavailable in restricted contexts
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      data-testid="worlds-modal"
    >
      <div className="relative w-full max-w-2xl bg-[#110c14] border-2 border-cyan-400/80 p-5 text-amber-50 shadow-[0_8px_32px_rgba(0,0,0,0.9)]">
        <span className="absolute top-0 left-0 w-2 h-2 bg-cyan-300" />
        <span className="absolute top-0 right-0 w-2 h-2 bg-cyan-300" />
        <span className="absolute bottom-0 left-0 w-2 h-2 bg-cyan-300" />
        <span className="absolute bottom-0 right-0 w-2 h-2 bg-cyan-300" />

        <div className="flex items-start justify-between gap-3 border-b border-cyan-500/30 pb-3 mb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-cyan-100">
              Online Bastera Worlds · Co-op Citadel
            </h2>
            <p className="font-pixel-mono text-[11px] text-cyan-200/80 mt-0.5">
              Explore, fight citadel monsters &amp; share torches side-by-side.{' '}
              <span className="text-amber-300 font-bold">
                Joined guests cannot fight bosses (Host only).
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onRefreshWorlds}
              data-testid="refresh-worlds-btn"
              className="px-2.5 py-1 bg-[#142236] border border-cyan-400/60 hover:border-cyan-200 font-pixel-mono text-[11px] text-cyan-100 cursor-pointer"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 bg-[#291318] border border-amber-400/70 hover:bg-[#3b1b22] font-pixel-mono text-xs text-amber-100 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Current Session Status */}
        <div className="bg-[#17121e] border border-cyan-500/40 p-3 mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-pixel-mono text-xs text-cyan-200">
                {worldRole === 'host' ? (
                  <>
                    Hosting World <strong className="text-amber-300">{worldId}</strong> ·{' '}
                    {worldPlayerCount} {worldPlayerCount === 1 ? 'Knight' : 'Knights'} present
                  </>
                ) : (
                  <>
                    Co-op Guest in{' '}
                    <strong className="text-amber-300">
                      {worldHostName ? `${worldHostName}'s` : worldId}
                    </strong>{' '}
                    World (<span className="text-rose-300 font-bold">Bosses Locked</span>)
                  </>
                )}
              </div>
              <div className="font-pixel-mono text-[10px] text-amber-200/70 mt-1">
                {worldRole === 'host'
                  ? 'Share your World ID so friends can join your Bastera realm.'
                  : 'You can hunt monsters, use skills, and explore safely alongside the host.'}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {worldRole === 'host' ? (
                <>
                  <button
                    type="button"
                    onClick={() => void handleCopyId()}
                    className="px-2.5 py-1.5 bg-[#1e293b] border border-cyan-400/60 hover:border-cyan-200 font-pixel-mono text-[11px] text-cyan-100 cursor-pointer"
                  >
                    {copied ? 'Copied!' : `Copy ${worldId}`}
                  </button>
                  <button
                    type="button"
                    data-testid="toggle-world-public-btn"
                    onClick={() => onTogglePublic(!isWorldPublic)}
                    className={`px-2.5 py-1.5 border font-pixel-mono text-[11px] cursor-pointer ${
                      isWorldPublic
                        ? 'bg-[#14532d] border-emerald-400 text-emerald-100'
                        : 'bg-[#3b151e] border-rose-400 text-rose-100'
                    }`}
                  >
                    {isWorldPublic ? 'Public: ON' : 'Private'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  data-testid="leave-world-btn"
                  onClick={onLeaveWorld}
                  className="px-3 py-1.5 bg-[#7f1d1d] hover:bg-[#991b1b] border border-amber-300 font-pixel-mono text-xs font-bold text-amber-50 cursor-pointer"
                >
                  Return to My World
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Direct Join by World ID */}
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            value={joinCode}
            maxLength={20}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Enter World ID (e.g. W-ABCD)"
            aria-label="World ID"
            data-testid="join-world-input"
            className="flex-1 px-3 py-2 bg-[#09070d] border border-cyan-500/45 text-xs font-pixel-mono text-cyan-100 focus:outline-none focus:border-cyan-300"
          />
          <button
            type="button"
            data-testid="join-world-code-btn"
            disabled={!joinCode.trim()}
            onClick={() => {
              if (!joinCode.trim()) return;
              onJoinWorld(joinCode.trim());
            }}
            className="px-4 py-2 bg-[#0e7490] hover:bg-[#0891b2] disabled:opacity-45 border border-cyan-300 font-pixel-mono text-xs font-bold text-white cursor-pointer whitespace-nowrap"
          >
            Join by ID
          </button>
        </div>

        {/* Active Public Worlds Browser */}
        <div className="max-h-[270px] overflow-y-auto space-y-2 pr-1">
          {onlineWorlds.length === 0 ? (
            <div className="py-8 text-center bg-[#0c0810] border border-cyan-900/50 font-pixel-mono text-xs text-cyan-200/70">
              No active online Bastera worlds listed right now. Click Refresh or share your World ID!
            </div>
          ) : (
            onlineWorlds.map((w) => {
              const isCurrent = w.worldId === worldId;
              return (
                <div
                  key={w.worldId}
                  data-testid={`world-row-${w.worldId}`}
                  className="flex flex-wrap items-center justify-between gap-3 bg-[#15101c] border border-cyan-500/35 hover:border-cyan-300/80 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-bold text-sm text-amber-100">
                        {w.hostName}&apos;s Citadel
                      </span>
                      <span className="font-pixel-mono text-[10px] px-1.5 py-0.5 bg-[#102235] border border-cyan-400/50 text-cyan-200">
                        {w.worldId}
                      </span>
                      {isCurrent && (
                        <span className="font-pixel-mono text-[10px] text-emerald-300 font-bold">
                          [CURRENT]
                        </span>
                      )}
                    </div>
                    <div className="font-pixel-mono text-[10px] text-amber-200/80 mt-1 flex flex-wrap gap-x-3">
                      <span>Biome: {String(w.biome).toUpperCase()}</span>
                      <span>Bosses: {w.bossesDefeated}/120</span>
                      <span>Knights: {w.playerCount}</span>
                    </div>
                  </div>
                  {isCurrent ? (
                    worldRole === 'guest' ? (
                      <button
                        type="button"
                        onClick={onLeaveWorld}
                        className="px-3 py-1.5 bg-[#7f1d1d] hover:bg-[#991b1b] border border-amber-300 font-pixel-mono text-xs text-amber-50 cursor-pointer"
                      >
                        Leave
                      </button>
                    ) : (
                      <span className="font-pixel-mono text-[11px] text-cyan-300 px-2">
                        Your World
                      </span>
                    )
                  ) : (
                    <button
                      type="button"
                      data-testid={`join-world-${w.worldId}`}
                      onClick={() => onJoinWorld(w.worldId)}
                      className="px-3.5 py-1.5 bg-[#0e7490] hover:bg-[#0891b2] border border-cyan-300 font-pixel-mono text-xs font-bold text-white cursor-pointer"
                    >
                      Join Co-op
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
