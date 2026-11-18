import React from 'react';
import { SKILLS, WEAPONS } from '../game/data';
import type { HudSnapshot, SkillId, StatKey } from '../game/types';
import { PixelBossPortrait, PixelWarriorPortrait } from './PixelPortrait';

interface GameHudProps {
  hud: HudSnapshot;
  isTouchLayout: boolean;
  onOpenInventory: () => void;
  onOpenMap: () => void;
  onOpenStatus: () => void;
  onAllocateStat: (statKey: StatKey) => void;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onToggleRotate: () => void;
  onTriggerSkill: (slot: 0 | 1 | 2) => void;
  onCycleWeapon: () => void;
  onAdvanceDialogue: () => void;
  onVirtualKey: (
    action: 'left' | 'right' | 'jump' | 'attack' | 'interact' | 'skill0' | 'skill1' | 'skill2',
    pressed: boolean,
  ) => void;
}

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  isTouchLayout,
  onOpenInventory,
  onOpenMap,
  onOpenStatus,
  onAllocateStat,
  onTogglePause,
  onToggleMute,
  onToggleRotate,
  onTriggerSkill,
  onCycleWeapon,
  onAdvanceDialogue,
  onVirtualKey,
}) => {
  const hpPct = Math.max(0, Math.min(100, (hud.hp / Math.max(1, hud.maxHp)) * 100));
  const stamPct = Math.max(0, Math.min(100, (hud.stamina / Math.max(1, hud.maxStamina)) * 100));
  const weapon = WEAPONS[hud.equippedWeapon];

  const currentLine = hud.dialogue
    ? (hud.dialogue.lines[hud.dialogue.lineIndex] || '').slice(0, hud.dialogue.charIndex)
    : '';

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 sm:p-4">
      {/* Top Row: Perimeter Clusters + Boss Bar */}
      <div className="flex items-start justify-between gap-3">
        {/* Top-Left: HP, Stamina, Progress + Solo Leveling Status Bar */}
        <div className="flex flex-col gap-1.5">
          <div className="relative bg-[#120b0f]/92 border border-amber-500/45 px-3 py-2 min-w-[200px] sm:min-w-[245px]">
            <span className="absolute top-0 left-0 w-1 h-1 bg-amber-300" />
            <span className="absolute top-0 right-0 w-1 h-1 bg-amber-300" />
            <span className="absolute bottom-0 left-0 w-1 h-1 bg-amber-300" />
            <span className="absolute bottom-0 right-0 w-1 h-1 bg-amber-300" />
            <div className="flex items-center justify-between text-[11px] font-pixel-mono text-amber-200 mb-1">
              <span>HP {hud.hp}/{hud.maxHp}</span>
              <span className="text-amber-400">{hud.gold}G</span>
            </div>
            <div className="relative w-full h-2.5 bg-[#271820] border border-amber-900/60 overflow-hidden mb-1.5">
              <div
                className="absolute inset-y-0 left-0 bg-amber-100/80 transition-[width] duration-500"
                style={{ width: `${hpPct}%` }}
              />
              <div
                className="relative h-full bg-[#dc2626] transition-[width] duration-150"
                style={{ width: `${hpPct}%` }}
              />
            </div>
            <div className="w-full h-1.5 bg-[#1e1726] overflow-hidden mb-1.5">
              <div
                className="h-full bg-[#eab308] transition-[width] duration-75"
                style={{ width: `${stamPct}%` }}
              />
            </div>
            <div className="flex items-center gap-2 text-[10px] font-pixel-mono text-amber-100/80 whitespace-nowrap">
              <span>{hud.biomeLabel}</span>
              <span aria-hidden="true">·</span>
              <span>Boss {hud.bossesDefeated}/{hud.totalBosses}</span>
              <span aria-hidden="true">·</span>
              <span>Secrets {hud.secretsFound}/{hud.totalSecrets}</span>
            </div>
          </div>

          {/* Solo Leveling Quick Status Bar */}
          <div
            className="pointer-events-auto relative bg-[#051024]/92 border border-sky-400/65 px-2.5 py-1.5 flex items-center justify-between gap-2"
            data-testid="hud-status-bar"
          >
            <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-pixel-mono">
              <span className="text-cyan-300 font-bold">LV.{hud.level}</span>
              <span className={hud.statPoints > 0 ? 'text-yellow-300 font-bold' : 'text-sky-200/70'}>
                PTS:{hud.statPoints}
              </span>
              {(
                [
                  ['skillDmg', 'SKL'],
                  ['attack', 'ATK'],
                  ['hp', 'HP'],
                  ['speed', 'SPD'],
                ] as const
              ).map(([key, tag]) => (
                <button
                  key={key}
                  type="button"
                  tabIndex={-1}
                  disabled={hud.statPoints <= 0}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onAllocateStat(key);
                  }}
                  title={hud.statPoints > 0 ? `Add +1 to ${tag}` : `${tag} Level ${hud.stats[key]}`}
                  className={`px-1 py-0.5 border text-[9px] font-pixel-mono whitespace-nowrap ${
                    hud.statPoints > 0
                      ? 'bg-sky-900/90 border-cyan-300 text-white hover:bg-sky-700 cursor-pointer'
                      : 'bg-[#081730]/80 border-sky-700/50 text-sky-200/80 cursor-default'
                  }`}
                >
                  {tag}:{hud.stats[key]}
                  {hud.statPoints > 0 ? '+' : ''}
                </button>
              ))}
            </div>
            <button
              type="button"
              tabIndex={-1}
              data-testid="open-status-btn"
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenStatus();
              }}
              className="px-2 py-0.5 bg-sky-950 hover:bg-sky-800 border border-cyan-300/80 text-[9px] font-pixel-mono font-bold text-cyan-200 whitespace-nowrap shrink-0 cursor-pointer"
            >
              STATUS [K]
            </button>
          </div>
        </div>

        {/* Top-Center: Active JoJo Boss Health Bar */}
        {hud.activeBoss && (
          <div className="relative flex flex-col items-center bg-[#180a10]/94 border-2 border-amber-400/75 px-3 py-1 min-w-[210px] sm:min-w-[280px] max-w-[340px]">
            <span className="absolute top-0 left-0 w-1 h-1 bg-amber-300" />
            <span className="absolute top-0 right-0 w-1 h-1 bg-amber-300" />
            <div className="flex items-center justify-between w-full gap-2 text-[11px] sm:text-xs font-display font-bold text-amber-100">
              <span className="truncate">{hud.activeBoss.name}</span>
              <span className="font-pixel-mono text-[10px] text-amber-300 shrink-0">
                [{hud.activeBoss.standName}]
              </span>
            </div>
            <div className="w-full h-2 bg-[#2a1219] border border-amber-500/40 mt-1">
              <div
                className="h-full bg-[#e11d48] transition-[width] duration-200"
                style={{
                  width: `${Math.max(0, (hud.activeBoss.hp / hud.activeBoss.maxHp) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Top-Right: Utility Icon Buttons & Online Count */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <span className="hidden md:inline-block font-pixel-mono text-[11px] text-amber-200/80 mr-1.5">
            Online: {hud.onlineCount}
          </span>
          <button
            type="button"
            aria-label="Open Inventory"
            title="Inventory [I]"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenInventory();
            }}
            className="w-9 h-9 flex items-center justify-center bg-[#180f14] border border-amber-500/40 hover:border-amber-300 text-amber-100 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 7h12l1 13H5L6 7z" />
              <path d="M9 7V5a3 3 0 0 1 6 0v2" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Checkpoints and Boss Codex"
            title="Checkpoints & Codex [M]"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenMap();
            }}
            className="w-9 h-9 flex items-center justify-center bg-[#180f14] border border-amber-500/40 hover:border-amber-300 text-amber-100 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z" />
              <path d="M9 4v14M15 6v14" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Rotate Screen Perspective"
            title="Rotate Perspective [V]"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleRotate();
            }}
            className="w-9 h-9 flex items-center justify-center bg-[#180f14] border border-amber-500/40 hover:border-amber-300 text-amber-100 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="7" y="3" width="10" height="18" rx="1" />
              <path d="M3 12a9 9 0 0 1 9-9" />
            </svg>
          </button>
          <button
            type="button"
            aria-label={hud.muted ? 'Unmute Audio' : 'Mute Audio'}
            title="Mute [U]"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            className="w-9 h-9 flex items-center justify-center bg-[#180f14] border border-amber-500/40 hover:border-amber-300 text-amber-100 cursor-pointer"
          >
            {hud.muted ? (
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <path d="M22 9l-6 6M16 9l6 6" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <path d="M15.5 8.5a5 5 0 0 1 0 7" />
              </svg>
            )}
          </button>
          <button
            type="button"
            aria-label="Pause Game"
            title="Pause [Esc]"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onTogglePause();
            }}
            className="w-9 h-9 flex items-center justify-center bg-[#180f14] border border-amber-500/40 hover:border-amber-300 text-amber-100 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" />
              <rect x="14" y="5" width="4" height="14" />
            </svg>
          </button>
        </div>
      </div>

      {/* Transient World / Loot / Multiplayer Announcement */}
      <div className="flex flex-col items-center gap-1 my-auto pointer-events-none">
        {hud.announcement && (
          <div className="px-3 py-1 bg-[#120a0e]/90 border border-amber-400/60 font-pixel-mono text-xs text-amber-200">
            {hud.announcement}
          </div>
        )}
        {hud.nearbyPrompt && !hud.dialogue && (
          <div className="px-2.5 py-0.5 bg-black/85 border border-white/60 font-pixel-mono text-[11px] text-amber-200">
            {hud.nearbyPrompt}
          </div>
        )}
      </div>

      {/* Bottom Row: Very Small Undertale-Style Dialogue Bubble + Combat Weapon/3-Skill Bar */}
      <div className="flex items-end justify-between gap-3">
        {/* Mobile Touch Left/Right D-Pad when touch/rotated layout active */}
        {isTouchLayout ? (
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              type="button"
              aria-label="Move Left"
              onPointerDown={() => onVirtualKey('left', true)}
              onPointerUp={() => onVirtualKey('left', false)}
              onPointerLeave={() => onVirtualKey('left', false)}
              className="w-11 h-11 bg-[#160e12]/90 border border-amber-400/50 text-amber-100 font-pixel-mono text-base active:bg-amber-900/60"
            >
              ◀
            </button>
            <button
              type="button"
              aria-label="Move Right"
              onPointerDown={() => onVirtualKey('right', true)}
              onPointerUp={() => onVirtualKey('right', false)}
              onPointerLeave={() => onVirtualKey('right', false)}
              className="w-11 h-11 bg-[#160e12]/90 border border-amber-400/50 text-amber-100 font-pixel-mono text-base active:bg-amber-900/60"
            >
              ▶
            </button>
          </div>
        ) : (
          <div className="hidden sm:block text-[11px] font-pixel-mono text-amber-100/65">
            {hud.distanceMeters}m · CP {hud.checkpoints.filter((c) => c.reached).length}
          </div>
        )}

        {/* Very Small Undertale-Style Sarcastic Dialogue Bubble */}
        {hud.dialogue ? (
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onAdvanceDialogue();
            }}
            aria-label="Advance Dialogue"
            className="pointer-events-auto flex items-start gap-2 w-full max-w-[295px] bg-black border-2 border-white px-2 py-1.5 text-left shadow-[0_3px_0_rgba(0,0,0,0.85)] cursor-pointer"
          >
            {/* Miniature Pixel Portrait Box */}
            {hud.dialogue.portraitKind === 'warrior' ? (
              <PixelWarriorPortrait weaponId={hud.equippedWeapon} size={28} />
            ) : hud.dialogue.portraitKind === 'boss' && hud.activeBoss ? (
              <PixelBossPortrait bossIndex={hud.activeBoss.index} expression="smirk" size={28} />
            ) : (
              <div
                className="w-7 h-7 shrink-0 border border-white/60 flex items-center justify-center font-pixel-mono text-[10px] font-bold text-black mt-0.5"
                style={{ backgroundColor: hud.dialogue.portraitColor }}
              >
                {hud.dialogue.portraitKind === 'boss'
                  ? '★'
                  : hud.dialogue.portraitKind === 'throne'
                    ? '♛'
                    : hud.dialogue.portraitKind === 'secret'
                      ? '✦'
                      : '⚔'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 text-[9px] font-pixel-mono text-amber-300 leading-none mb-0.5">
                <span className="truncate">* {hud.dialogue.speaker}</span>
                <span className="text-white/60 shrink-0">[F]</span>
              </div>
              <p className="font-pixel-mono text-[10px] leading-tight text-white">
                * {currentLine}
              </p>
            </div>
          </button>
        ) : (
          <div />
        )}

        {/* Bottom-Right: Weapon Style + 3-Slot Special Skill Loadout */}
        <div className="flex flex-col items-end gap-1.5 pointer-events-auto">
          {isTouchLayout && (
            <div className="flex items-center gap-1.5 mb-1">
              <button
                type="button"
                aria-label="Interact"
                onPointerDown={() => onVirtualKey('interact', true)}
                onPointerUp={() => onVirtualKey('interact', false)}
                className="px-3 h-10 bg-[#180f14]/90 border border-amber-400/50 text-xs font-pixel-mono text-amber-200"
              >
                Use
              </button>
              <button
                type="button"
                aria-label="Jump"
                onPointerDown={() => onVirtualKey('jump', true)}
                onPointerUp={() => onVirtualKey('jump', false)}
                onPointerLeave={() => onVirtualKey('jump', false)}
                className="px-3 h-10 bg-[#180f14]/90 border border-amber-400/50 text-xs font-pixel-mono text-amber-100"
              >
                Jump
              </button>
              <button
                type="button"
                aria-label="Sword Attack"
                onPointerDown={() => onVirtualKey('attack', true)}
                onPointerUp={() => onVirtualKey('attack', false)}
                className="px-4 h-10 bg-[#991b1b]/95 border border-amber-300 text-xs font-pixel-mono font-bold text-amber-50"
              >
                Slash
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onCycleWeapon();
              }}
              tabIndex={-1}
              title="Click to cycle unlocked Sword Style"
              className="px-2.5 py-1.5 bg-[#160e13]/95 border border-amber-500/45 hover:border-amber-300 text-left cursor-pointer"
            >
              <div className="text-[10px] font-pixel-mono text-amber-300 leading-none">
                [J] {weapon.styleName}
              </div>
              <div className="text-[11px] font-semibold text-amber-50 whitespace-nowrap mt-0.5">
                {weapon.name.split(' ').slice(-2).join(' ')}
              </div>
            </button>

            {([0, 1, 2] as const).map((slotIdx) => {
              const skillId: SkillId = hud.skillSlots[slotIdx];
              const skill = SKILLS[skillId];
              const cd = hud.skillCooldowns[slotIdx];
              const ready = cd <= 0 && hud.stamina >= skill.staminaCost;
              return (
                <button
                  key={slotIdx}
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onTriggerSkill(slotIdx);
                  }}
                  title={`${skill.name} (${skill.staminaCost} Stam)`}
                  className={`relative w-14 h-11 flex flex-col items-center justify-center border transition-colors cursor-pointer ${
                    ready
                      ? 'bg-[#1a1016]/95 border-amber-400/70 hover:border-amber-200 text-amber-50'
                      : 'bg-[#100a0e]/85 border-amber-900/40 text-amber-200/45'
                  }`}
                >
                  <span className="text-[9px] font-pixel-mono text-amber-300 leading-none">
                    [{slotIdx + 1}] {skill.shortTag}
                  </span>
                  <span className="text-[10px] font-pixel-mono mt-1">
                    {cd > 0 ? `${cd.toFixed(1)}s` : `${skill.staminaCost}ST`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
