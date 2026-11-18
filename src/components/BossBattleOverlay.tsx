import React, { useEffect, useState } from 'react';
import { SKILLS, WEAPONS } from '../game/data';
import type { AnimeExpression } from '../game/pixelArtAtlas';
import type { BossBattleSnapshot, HudSnapshot, SkillId } from '../game/types';
import { PixelBossPortrait, PixelItemIcon, PixelWarriorPortrait } from './PixelPortrait';

interface BossBattleOverlayProps {
  hud: HudSnapshot;
  battle: BossBattleSnapshot;
  onAttackWeapon: () => void;
  onUseSkill: (slot: 0 | 1 | 2) => void;
  onUsePotion: (itemId: string) => void;
  onRun: () => void;
  onEscape: () => void;
  onReplayVoice: () => void;
  onOpenStatus: () => void;
  onToggleMute: () => void;
  onTogglePause: () => void;
}

export const BossBattleOverlay: React.FC<BossBattleOverlayProps> = ({
  hud,
  battle,
  onAttackWeapon,
  onUseSkill,
  onUsePotion,
  onRun,
  onEscape,
  onReplayVoice,
  onOpenStatus,
  onToggleMute,
  onTogglePause,
}) => {
  const [subMenu, setSubMenu] = useState<'root' | 'fight' | 'potions'>('root');

  // Reset submenu back to root whenever it becomes the player's turn again
  useEffect(() => {
    if (battle.phase !== 'menu') {
      setSubMenu('root');
    }
  }, [battle.phase]);

  const bossHpPct = Math.max(0, Math.min(100, (battle.bossHp / Math.max(1, battle.bossMaxHp)) * 100));
  const playerHpPct = Math.max(0, Math.min(100, (hud.hp / Math.max(1, hud.maxHp)) * 100));
  const stamPct = Math.max(0, Math.min(100, (hud.stamina / Math.max(1, hud.maxStamina)) * 100));

  const bossHpColor =
    bossHpPct > 50 ? 'bg-emerald-500' : bossHpPct > 24 ? 'bg-amber-400' : 'bg-rose-600';
  const playerHpColor =
    playerHpPct > 50 ? 'bg-emerald-500' : playerHpPct > 24 ? 'bg-amber-400' : 'bg-rose-600';

  const weapon = WEAPONS[hud.equippedWeapon];
  const potions = hud.inventory.filter((item) => item.category === 'potion');
  const isMenuReady = battle.phase === 'menu';
  const bossExpression: AnimeExpression =
    battle.phase === 'enemy_anim'
      ? 'wryyy'
      : battle.phase === 'player_anim' || battle.phase === 'victory'
        ? 'grit'
        : battle.phase === 'intro'
          ? 'menacing'
          : 'smirk';

  return (
    <div
      className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-3 sm:p-5"
      data-testid="pokemon-boss-overlay"
    >
      {/* Top Row: Pokemon-style Opponent Info Card (Top-Left) + Utility Icons (Top-Right) */}
      <div className="flex items-start justify-between gap-3">
        <div className="relative flex items-center gap-2.5 bg-[#120b10]/95 border-2 border-amber-400/80 px-3 py-2.5 w-[275px] sm:w-[345px] shadow-[4px_4px_0_rgba(0,0,0,0.85)]">
          {/* Gold pixel corner ticks */}
          <span className="absolute top-0 left-0 w-1.5 h-1.5 bg-amber-300" />
          <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-amber-300" />
          <span className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-amber-300" />
          <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-amber-300" />

          <PixelBossPortrait bossIndex={battle.bossIndex} expression={bossExpression} size={56} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-display font-bold text-xs sm:text-sm text-amber-50 truncate">
                {battle.bossName}
              </span>
              <span className="font-pixel-mono text-[10px] text-amber-300 shrink-0">
                Lv.{battle.bossIndex}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-pixel-mono text-amber-200/80 mt-0.5">
              <span className="truncate">Stand: {battle.standName}</span>
              {battle.bossFrozenTurns > 0 && (
                <span className="text-emerald-300 shrink-0 ml-1">[FROZEN]</span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 text-[9px] font-pixel-mono text-sky-200/90 mt-0.5">
              <span className="truncate">{battle.climateLabel}</span>
              <span className="text-rose-300 shrink-0 truncate">{battle.attackName}</span>
            </div>

            {/* HP Bar with trailing damage ghost bar */}
            <div className="mt-1.5 flex items-center gap-2">
              <span className="font-pixel-mono text-[9px] text-amber-300 font-bold">HP</span>
              <div className="relative flex-1 h-2.5 bg-[#26141b] border border-amber-900/70 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-amber-100/80 transition-[width] duration-500"
                  style={{ width: `${bossHpPct}%` }}
                />
                <div
                  className={`relative h-full ${bossHpColor} transition-[width] duration-150`}
                  style={{ width: `${bossHpPct}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] font-pixel-mono text-amber-100/85 mt-1">
              <span>
                {battle.bossHp}/{battle.bossMaxHp}
              </span>
              {battle.lastPlayerDamage !== null && battle.phase === 'player_anim' && (
                <span className="text-yellow-300 font-bold">-{battle.lastPlayerDamage} HIT!</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenStatus();
            }}
            title="Open Solo Leveling Status Window [K]"
            className="px-2.5 h-8 bg-[#07152e] border border-cyan-400/80 hover:border-cyan-200 text-cyan-200 font-pixel-mono text-[10px] cursor-pointer whitespace-nowrap shrink-0"
          >
            STATUS{hud.statPoints > 0 ? ` (+${hud.statPoints})` : ''}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onReplayVoice();
            }}
            title="Replay Jotaro Kujo Attack Announcement"
            className="px-2.5 h-8 bg-[#180f14] border border-amber-500/50 hover:border-amber-300 text-amber-200 font-pixel-mono text-[10px] cursor-pointer whitespace-nowrap shrink-0"
          >
            ♪ Jotaro AI
          </button>
          <button
            type="button"
            aria-label={hud.muted ? 'Unmute Audio' : 'Mute Audio'}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            className="w-8 h-8 flex items-center justify-center bg-[#180f14] border border-amber-500/45 hover:border-amber-300 text-amber-100 font-pixel-mono text-xs cursor-pointer"
          >
            {hud.muted ? '🔇' : '🔊'}
          </button>
          <button
            type="button"
            aria-label="Pause Game"
            onClick={(e) => {
              e.currentTarget.blur();
              onTogglePause();
            }}
            className="w-8 h-8 flex items-center justify-center bg-[#180f14] border border-amber-500/45 hover:border-amber-300 text-amber-100 font-pixel-mono text-xs cursor-pointer"
          >
            ❚❚
          </button>
        </div>
      </div>

      {/* Bottom Area: Player Status Card (Right above deck) + Pokemon Split Command Deck */}
      <div className="flex flex-col gap-2 w-full">
        {/* Player Status Card positioned on Bottom-Right leaving Warrior sprite visible on Bottom-Left */}
        <div className="flex justify-end">
          <div className="relative flex items-center gap-2.5 bg-[#120b10]/95 border-2 border-amber-400/80 px-3 py-2 w-[260px] sm:w-[325px] shadow-[4px_4px_0_rgba(0,0,0,0.85)]">
            <span className="absolute top-0 left-0 w-1.5 h-1.5 bg-amber-300" />
            <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-amber-300" />
            <span className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-amber-300" />
            <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-amber-300" />

            <PixelWarriorPortrait weaponId={hud.equippedWeapon} size={46} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-display font-bold text-xs text-amber-50">
                  Bastera Knight
                </span>
                <span className="font-pixel-mono text-[10px] text-amber-300 truncate">
                  {weapon.styleName}
                </span>
              </div>

              <div className="mt-1 flex items-center gap-2">
                <span className="font-pixel-mono text-[9px] text-amber-300 font-bold">HP</span>
                <div className="relative flex-1 h-2.5 bg-[#26141b] border border-amber-900/70 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-amber-100/80 transition-[width] duration-500"
                    style={{ width: `${playerHpPct}%` }}
                  />
                  <div
                    className={`relative h-full ${playerHpColor} transition-[width] duration-150`}
                    style={{ width: `${playerHpPct}%` }}
                  />
                </div>
              </div>

              <div className="mt-1 flex items-center gap-2">
                <span className="font-pixel-mono text-[9px] text-yellow-400 font-bold">ST</span>
                <div className="flex-1 h-1.5 bg-[#1e1726] overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 transition-[width] duration-150"
                    style={{ width: `${stamPct}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-pixel-mono text-amber-100/85 mt-1">
                <span>
                  HP {hud.hp}/{hud.maxHp} · ST {hud.stamina}
                </span>
                {battle.guardActive && <span className="text-amber-300">[GUARD]</span>}
                {battle.lastBossDamage !== null && battle.phase === 'enemy_anim' && (
                  <span className="text-rose-400 font-bold">-{battle.lastBossDamage} HP</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Classic Pokemon Split Command Deck */}
        <div className="pointer-events-auto grid grid-cols-1 sm:grid-cols-12 gap-2 bg-[#0d070a]/95 border-2 border-white p-2.5 shadow-[0_4px_0_rgba(0,0,0,0.9)]">
          {/* Left Narration & Jotaro Kujo AI Voiceline Box */}
          <div className="sm:col-span-6 bg-black border border-amber-400/50 px-3 py-2 flex flex-col justify-between min-h-[76px]">
            <div className="flex items-center justify-between gap-2 text-[10px] font-pixel-mono text-amber-300">
              <span className="truncate">* {battle.speaker}</span>
              <span className="text-amber-200/70 shrink-0">
                {battle.phase === 'intro'
                  ? 'ENCOUNTER'
                  : battle.phase === 'player_anim'
                    ? 'SLASHING!'
                    : battle.phase === 'enemy_anim'
                      ? 'STAND ATTACK!'
                      : battle.phase === 'victory'
                        ? 'VICTORY!'
                        : 'YOUR TURN'}
              </span>
            </div>
            <p className="font-pixel-mono text-xs text-white leading-snug mt-1">
              * {battle.message}
            </p>
            {(battle.jotaroLine || battle.jotaroVoiceError) && (
              <div className="mt-1.5 pt-1 border-t border-amber-500/25 flex items-center justify-between gap-2 text-[10px] font-pixel-mono">
                <span className="text-purple-300 truncate" data-testid="jotaro-caption">
                  ★ JOTARO AI: &ldquo;{battle.jotaroLine}&rdquo;
                </span>
                {battle.jotaroVoiceStatus === 'generating' && (
                  <span className="text-amber-300 shrink-0">SYNTHESIZING...</span>
                )}
                {battle.jotaroVoiceStatus === 'ready' && (
                  <span className="text-emerald-300 shrink-0">VOICE READY</span>
                )}
                {battle.jotaroVoiceStatus === 'error' && battle.jotaroVoiceError && (
                  <span
                    className="text-rose-300 shrink-0 truncate max-w-[180px]"
                    title={battle.jotaroVoiceError}
                    data-testid="jotaro-voice-error"
                  >
                    {battle.jotaroVoiceError}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right Pokemon 2x2 Action Menu / Fight Submenu / Potions Submenu */}
          <div className="sm:col-span-6">
            {subMenu === 'root' && (
              <div className="grid grid-cols-2 gap-1.5 h-full">
                <button
                  type="button"
                  disabled={!isMenuReady}
                  data-testid="battle-fight-btn"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    setSubMenu('fight');
                  }}
                  className="px-3 py-2 bg-[#7f1d1d] hover:bg-[#991b1b] disabled:opacity-45 border-2 border-amber-400 text-amber-50 font-pixel-mono text-xs font-bold tracking-wider text-left cursor-pointer whitespace-nowrap"
                >
                  ▶ FIGHT
                </button>
                <button
                  type="button"
                  disabled={!isMenuReady}
                  data-testid="battle-potions-btn"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    setSubMenu('potions');
                  }}
                  className="px-3 py-2 bg-[#14532d] hover:bg-[#166534] disabled:opacity-45 border-2 border-emerald-400/80 text-emerald-50 font-pixel-mono text-xs font-bold tracking-wider text-left cursor-pointer whitespace-nowrap"
                >
                  ▶ POTIONS
                </button>
                <button
                  type="button"
                  disabled={!isMenuReady}
                  data-testid="battle-run-btn"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onRun();
                  }}
                  className="px-3 py-2 bg-[#451a03] hover:bg-[#78350f] disabled:opacity-45 border-2 border-amber-500/75 text-amber-100 font-pixel-mono text-xs font-bold tracking-wider text-left cursor-pointer whitespace-nowrap"
                >
                  ▶ RUN
                </button>
                <button
                  type="button"
                  disabled={!isMenuReady}
                  data-testid="battle-escape-btn"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onEscape();
                  }}
                  className="px-3 py-2 bg-[#1e293b] hover:bg-[#334155] disabled:opacity-45 border-2 border-slate-400/80 text-slate-100 font-pixel-mono text-xs font-bold tracking-wider text-left cursor-pointer whitespace-nowrap"
                >
                  ▶ ESCAPE
                </button>
              </div>
            )}

            {subMenu === 'fight' && (
              <div className="grid grid-cols-2 gap-1.5 h-full">
                <button
                  type="button"
                  disabled={!isMenuReady}
                  data-testid="battle-sword-btn"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onAttackWeapon();
                  }}
                  className="px-2.5 py-1.5 bg-[#7f1d1d] hover:bg-[#991b1b] border border-amber-300 text-left cursor-pointer"
                >
                  <div className="font-pixel-mono text-[10px] text-amber-300 font-bold">
                    ⚔ SWORD SLASH
                  </div>
                  <div className="font-pixel-mono text-[10px] text-amber-50 truncate">
                    {weapon.styleName} (+14 ST)
                  </div>
                </button>

                {([0, 1, 2] as const).map((slotIdx) => {
                  const sid: SkillId = hud.skillSlots[slotIdx];
                  const sk = SKILLS[sid];
                  const enough = hud.stamina >= sk.staminaCost;
                  return (
                    <button
                      key={slotIdx}
                      type="button"
                      disabled={!isMenuReady || !enough}
                      data-testid={`battle-skill-${slotIdx}`}
                      onClick={(e) => {
                        e.currentTarget.blur();
                        onUseSkill(slotIdx);
                      }}
                      className="px-2.5 py-1.5 bg-[#1b1018] hover:bg-[#2c1927] disabled:opacity-40 border border-amber-400/65 text-left cursor-pointer"
                    >
                      <div className="font-pixel-mono text-[10px] text-amber-300 font-bold truncate">
                        ✦ {sk.name}
                      </div>
                      <div className="font-pixel-mono text-[9px] text-amber-100/80">
                        {sk.staminaCost} ST · {sk.shortTag}
                      </div>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    setSubMenu('root');
                  }}
                  className="col-span-2 py-1 bg-[#171014] hover:bg-[#271b22] border border-white/40 font-pixel-mono text-[10px] text-amber-200 cursor-pointer"
                >
                  ← Back to Commands
                </button>
              </div>
            )}

            {subMenu === 'potions' && (
              <div className="flex flex-col justify-between gap-1.5 h-full">
                <div className="grid grid-cols-1 gap-1">
                  {potions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      disabled={!isMenuReady || item.count <= 0 || hud.hp >= hud.maxHp}
                      data-testid={`battle-potion-${item.id}`}
                      onClick={(e) => {
                        e.currentTarget.blur();
                        onUsePotion(item.id);
                      }}
                      className="px-3 py-1.5 bg-[#123823] hover:bg-[#174a2e] disabled:opacity-45 border border-emerald-400/75 flex items-center justify-between text-left cursor-pointer"
                    >
                      <span className="font-pixel-mono text-xs text-emerald-100 font-bold flex items-center gap-2">
                        <PixelItemIcon itemId={item.id} size={24} />
                        <span>{item.name} (+{item.healAmount ?? 0} HP)</span>
                      </span>
                      <span className="font-pixel-mono text-xs text-amber-300">
                        x{item.count}
                      </span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    setSubMenu('root');
                  }}
                  className="py-1 bg-[#171014] hover:bg-[#271b22] border border-white/40 font-pixel-mono text-[10px] text-amber-200 cursor-pointer"
                >
                  ← Back to Commands
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
