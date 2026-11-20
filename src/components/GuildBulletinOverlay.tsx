import React, { useEffect, useState } from 'react';
import type { GuildBulletinSnapshot, GuildRank } from '../game/types';

interface GuildBulletinOverlayProps {
  bulletin: GuildBulletinSnapshot;
  playerRank: GuildRank;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const RANK_BADGE_COLORS: Record<GuildRank, string> = {
  F: 'bg-slate-700 border-slate-400 text-slate-100',
  E: 'bg-amber-900 border-amber-500 text-amber-100',
  D: 'bg-sky-900 border-sky-400 text-sky-100',
  C: 'bg-emerald-900 border-emerald-400 text-emerald-100',
  B: 'bg-indigo-900 border-indigo-400 text-indigo-100',
  A: 'bg-rose-900 border-rose-400 text-rose-100',
  S: 'bg-yellow-700 border-yellow-300 text-yellow-100',
};

export const GuildBulletinOverlay: React.FC<GuildBulletinOverlayProps> = ({
  bulletin,
  playerRank,
  collapsed,
  onToggleCollapse,
}) => {
  const [highlightIdx, setHighlightIdx] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setHighlightIdx((v) => v + 1);
    }, 2600);
    return () => window.clearInterval(id);
  }, []);

  if (collapsed) {
    return (
      <div className="pointer-events-auto" data-testid="guild-bulletin-collapsed">
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.currentTarget.blur();
            onToggleCollapse();
          }}
          className="px-3 py-1.5 bg-[#2a170c]/95 border-2 border-amber-400 text-amber-200 font-pixel-mono text-[10px] font-bold shadow-[3px_3px_0_rgba(0,0,0,0.85)] cursor-pointer"
        >
          📜 OPEN GUILD BULLETIN ({bulletin.popularMissions.length})
        </button>
      </div>
    );
  }

  const popularCount = Math.max(1, bulletin.popularMissions.length);
  const featuredIdx = highlightIdx % popularCount;

  return (
    <aside
      aria-label="Adventure Guild Live Bulletin"
      data-testid="guild-bulletin-overlay"
      className="pointer-events-auto w-[285px] sm:w-[315px] bg-[#24130b]/95 border-2 border-amber-400/90 text-amber-50 shadow-[5px_5px_0_rgba(0,0,0,0.9)] overflow-hidden"
    >
      {/* Corkboard Wooden Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-[#3d1e0e] border-b border-amber-400/60">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 bg-emerald-400 animate-pulse" />
          <span className="font-display text-xs font-bold tracking-wider text-amber-200">
            SOLARIS GUILD BULLETIN
          </span>
        </div>
        <button
          type="button"
          tabIndex={-1}
          aria-label="Minimize Guild Bulletin"
          onClick={(e) => {
            e.currentTarget.blur();
            onToggleCollapse();
          }}
          className="px-1.5 py-0.5 bg-[#1e0e06] border border-amber-500/50 text-[9px] font-pixel-mono text-amber-200 cursor-pointer"
        >
          HIDE
        </button>
      </div>

      {/* Animated Scrolling Marquee Wire */}
      <div className="bg-[#120905] border-b border-amber-500/40 py-1 overflow-hidden whitespace-nowrap">
        <div className="guild-bulletin-marquee inline-block font-pixel-mono text-[10px] text-amber-300">
          ✦ {bulletin.tickerText} &nbsp;&nbsp;&nbsp; ✦ Rank Badge: {playerRank}-Rank &nbsp;&nbsp;&nbsp; ✦{' '}
          {bulletin.tickerText}
        </div>
      </div>

      <div className="p-2.5 space-y-2.5 max-h-[420px] overflow-y-auto">
        {/* Global Adventurer Rankings */}
        <div>
          <div className="flex items-center justify-between text-[9px] font-pixel-mono text-amber-300/90 uppercase tracking-wider mb-1">
            <span>Global Guild Rankings</span>
            <span>Pts</span>
          </div>
          <div className="space-y-1">
            {bulletin.rankings.slice(0, 4).map((entry, idx) => (
              <div
                key={`${entry.name}_${idx}`}
                className="flex items-center justify-between gap-2 px-2 py-1 bg-[#180c07] border border-amber-700/45 text-[10px] font-pixel-mono"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-amber-400 font-bold">#{idx + 1}</span>
                  <span className={`px-1 border text-[9px] font-bold ${RANK_BADGE_COLORS[entry.rank]}`}>
                    {entry.rank}
                  </span>
                  <span className="truncate text-amber-50">{entry.name}</span>
                </div>
                <span className="text-amber-300 shrink-0">{entry.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Active Quests */}
        <div>
          <div className="flex items-center justify-between text-[9px] font-pixel-mono text-amber-300/90 uppercase tracking-wider mb-1">
            <span>Popular Active Missions</span>
            <span>Parties</span>
          </div>
          <div className="space-y-1">
            {bulletin.popularMissions.map((m, i) => {
              const activeHighlight = i === featuredIdx;
              return (
                <div
                  key={m.missionId}
                  className={`flex items-center justify-between gap-2 px-2 py-1 border text-[10px] font-pixel-mono transition-colors ${
                    activeHighlight
                      ? 'bg-[#361b0c] border-amber-300/90'
                      : 'bg-[#180c07] border-amber-800/40'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`px-1 border text-[9px] font-bold ${RANK_BADGE_COLORS[m.rankReq]}`}>
                      {m.rankReq}
                    </span>
                    <span className="truncate text-amber-100">{m.title}</span>
                  </div>
                  <span className="text-emerald-300 shrink-0">{m.activeParties} live</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};
