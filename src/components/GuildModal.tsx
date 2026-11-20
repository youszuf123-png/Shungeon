import React, { useState } from 'react';
import { GUILD_MISSIONS, RANK_TITLES, canStartGuildMission } from '../game/isekai';
import type { GuildMissionId, GuildRank, HudSnapshot } from '../game/types';
import { PixelItemIcon } from './PixelPortrait';

interface GuildModalProps {
  hud: HudSnapshot;
  onClose: () => void;
  onStartMission: (missionId: GuildMissionId, broadcastToParty: boolean) => void;
  onInviteAdventurer: (targetPeerId: string, missionId: GuildMissionId) => void;
  onReturnToCitadel: () => void;
}

const RANK_PILL_STYLE: Record<GuildRank, string> = {
  F: 'bg-slate-800 border-slate-400 text-slate-100',
  E: 'bg-amber-950 border-amber-500 text-amber-200',
  D: 'bg-sky-950 border-sky-400 text-sky-200',
  C: 'bg-emerald-950 border-emerald-400 text-emerald-200',
  B: 'bg-indigo-950 border-indigo-400 text-indigo-200',
  A: 'bg-rose-950 border-rose-400 text-rose-200',
  S: 'bg-yellow-800 border-yellow-300 text-yellow-100',
};

export const GuildModal: React.FC<GuildModalProps> = ({
  hud,
  onClose,
  onStartMission,
  onInviteAdventurer,
  onReturnToCitadel,
}) => {
  const unlockedMissions = GUILD_MISSIONS.filter((m) => canStartGuildMission(hud.guildRank, m.id));
  const defaultMission = unlockedMissions[unlockedMissions.length - 1]?.id ?? 'f_goblin_warren';
  const [selectedMission, setSelectedMission] = useState<GuildMissionId>(defaultMission);

  const badgeId = `rank_badge_${hud.guildRank.toLowerCase()}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      data-testid="guild-reception-modal"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#1a0f0a] border-2 border-amber-400/85 text-amber-50 shadow-[0_10px_36px_rgba(0,0,0,0.92)] overflow-hidden">
        <span className="absolute top-0 left-0 w-2 h-2 bg-amber-300" />
        <span className="absolute top-0 right-0 w-2 h-2 bg-amber-300" />
        <span className="absolute bottom-0 left-0 w-2 h-2 bg-amber-300" />
        <span className="absolute bottom-0 right-0 w-2 h-2 bg-amber-300" />

        {/* Reception Counter Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-[#2a170e] border-b border-amber-500/45">
          <div className="flex items-center gap-3">
            <PixelItemIcon itemId={badgeId} size={42} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-bold text-amber-100">
                  Solaris Adventure Guild Reception
                </h2>
                <span className={`px-2 py-0.5 border font-pixel-mono text-[10px] font-bold ${RANK_PILL_STYLE[hud.guildRank]}`}>
                  {hud.guildRank}-RANK · {RANK_TITLES[hud.guildRank]}
                </span>
              </div>
              <p className="font-pixel-mono text-[11px] text-amber-200/80 mt-0.5">
                Collect F→S Rank quests through the Human &amp; Demon Realms, or invite online adventurers!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onReturnToCitadel();
                onClose();
              }}
              className="px-2.5 py-1.5 bg-[#1b1224] hover:bg-[#2c1d3d] border border-purple-400/70 font-pixel-mono text-[10px] text-purple-200 cursor-pointer"
            >
              Return to Citadel
            </button>
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
        </div>

        {/* Body: Left Mission Board + Right Online Adventurers Party List */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-5 overflow-y-auto">
          {/* Mission Board */}
          <div className="lg:col-span-8 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-pixel-mono text-amber-300">
              <span>OFFICIAL GUILD QUEST CONTRACTS</span>
              <span>Gold: {hud.gold}G</span>
            </div>

            {GUILD_MISSIONS.map((m) => {
              const unlocked = canStartGuildMission(hud.guildRank, m.id);
              const isSelected = selectedMission === m.id;
              return (
                <div
                  key={m.id}
                  className={`p-3 border transition-colors ${
                    unlocked
                      ? isSelected
                        ? 'bg-[#2a180e] border-amber-300'
                        : 'bg-[#150c08] border-amber-500/45'
                      : 'bg-[#100907] border-slate-700/50 opacity-65'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 border font-pixel-mono text-[10px] font-bold ${RANK_PILL_STYLE[m.rankReq]}`}>
                        {m.rankReq}-RANK
                      </span>
                      <span className="font-display text-sm font-bold text-amber-50">{m.title}</span>
                    </div>
                    <span className="font-pixel-mono text-[11px] text-amber-300">
                      +{m.rewardGold}G · Promotes to {m.promoteToRank}-Rank
                    </span>
                  </div>

                  <p className="font-pixel-mono text-[11px] text-amber-100/80 mt-1.5">{m.summary}</p>

                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-pixel-mono text-[10px] text-sky-300">{m.regionLabel}</span>
                    <div className="flex items-center gap-2">
                      {unlocked ? (
                        <>
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setSelectedMission(m.id)}
                            className={`px-2.5 py-1 border font-pixel-mono text-[10px] cursor-pointer ${
                              isSelected
                                ? 'bg-amber-800/70 border-amber-300 text-amber-100'
                                : 'bg-[#22140c] border-amber-600/60 text-amber-200 hover:border-amber-300'
                            }`}
                          >
                            {isSelected ? 'Selected for Party' : 'Select for Party'}
                          </button>
                          <button
                            type="button"
                            data-testid={`start-mission-${m.id}`}
                            tabIndex={-1}
                            onClick={(e) => {
                              e.currentTarget.blur();
                              onStartMission(m.id, false);
                              onClose();
                            }}
                            className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 border border-emerald-300 font-pixel-mono text-[10px] font-bold text-white cursor-pointer"
                          >
                            DEPART QUEST ▶
                          </button>
                        </>
                      ) : (
                        <span className="px-2.5 py-1 bg-slate-900 border border-slate-700 font-pixel-mono text-[10px] text-slate-400">
                          Locked (Need {m.rankReq}-Rank Badge)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Online Adventurers & Co-op Quest Invites */}
          <div className="lg:col-span-4 flex flex-col gap-3 bg-[#130a07] border border-amber-500/40 p-3.5">
            <div>
              <h3 className="font-display text-sm font-bold text-cyan-200">
                Online Adventurers ({hud.onlineAdventurers.length})
              </h3>
              <p className="font-pixel-mono text-[10px] text-amber-100/75 mt-1">
                Invite anyone online in Bastera to join your selected Guild Quest party!
              </p>
            </div>

            {hud.onlineAdventurers.length === 0 ? (
              <div className="p-3 bg-[#1c100a] border border-amber-800/40 font-pixel-mono text-[10px] text-amber-200/75 leading-relaxed">
                No other players are connected right now. Open another browser tab to test co-op Guild Quest invites, or click{' '}
                <strong className="text-emerald-300">DEPART QUEST</strong> to run solo!
              </div>
            ) : (
              <div className="space-y-2 flex-1 overflow-y-auto">
                {hud.onlineAdventurers.map((adv) => (
                  <div
                    key={adv.id}
                    className="p-2.5 bg-[#1e110b] border border-cyan-500/45 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 border font-pixel-mono text-[9px] font-bold ${RANK_PILL_STYLE[adv.guildRank]}`}>
                          {adv.guildRank}
                        </span>
                        <span className="font-pixel-mono text-xs font-bold text-amber-50 truncate">
                          {adv.name}
                        </span>
                      </div>
                      <div className="font-pixel-mono text-[9px] text-cyan-300/80 mt-0.5 truncate">
                        In: {adv.realm}
                      </div>
                    </div>
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={(e) => {
                        e.currentTarget.blur();
                        onInviteAdventurer(adv.id, selectedMission);
                      }}
                      className="px-2 py-1 bg-cyan-900 hover:bg-cyan-700 border border-cyan-300 font-pixel-mono text-[10px] font-bold text-white shrink-0 cursor-pointer"
                    >
                      Invite
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onStartMission(selectedMission, true);
                onClose();
              }}
              className="mt-auto w-full py-2 bg-[#7c2d12] hover:bg-[#9a3412] border border-amber-300 font-pixel-mono text-[11px] font-bold text-amber-50 cursor-pointer"
            >
              LAUNCH PARTY MISSION ▶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
