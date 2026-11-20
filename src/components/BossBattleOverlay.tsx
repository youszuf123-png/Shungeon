import React, { useEffect, useState } from 'react';
import { SKILLS, WEAPONS } from '../game/data';
import type { AnimeExpression } from '../game/pixelArtAtlas';
import type { BossBattleSnapshot, HudSnapshot, OrbId, SkillId } from '../game/types';
import { PixelBossPortrait, PixelItemIcon, PixelWarriorPortrait } from './PixelPortrait';

interface BossBattleOverlayProps {
  hud: HudSnapshot;
  battle: BossBattleSnapshot;
  onAttackWeapon: () => void;
  onUseSkill: (slot: 0 | 1 | 2) => void;
  onUsePotion: (itemId: string) => void;
  onUseOrb: (orbId: OrbId) => void;
  onRetreat: () => void;
  onEscape: () => void;
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
  onUseOrb,
  onRetreat,
  onEscape,
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
  const orbMeta: { id: OrbId; shortName: string; tag: string; border: string; activeBg: string; tagColor: string }[] = [
    {
      id: 'orb_flame',
      shortName: 'Flame Orb',
      tag: '25% MAX HP',
      border: 'border-orange-400',
      activeBg: 'bg-[#361409] hover:bg-[#4d1d0d]',
      tagColor: 'text-orange-300',
    },
    {
      id: 'orb_wind',
      shortName: 'Wind Orb',
      tag: '+30% DMG',
      border: 'border-teal-400',
      activeBg: 'bg-[#092b28] hover:bg-[#0e3f3b]',
      tagColor: 'text-teal-300',
    },
    {
      id: 'orb_electric',
      shortName: 'Electric Orb',
      tag: 'STUN 1T',
      border: 'border-yellow-300',
      activeBg: 'bg-[#2f2506] hover:bg-[#44360a]',
      tagColor: 'text-yellow-300',
    },
  ];
  const orbs = orbMeta.map((meta) => ({
    ...meta,
    count: hud.inventory.find((item) => item.id === meta.id)?.count ?? 0,
  }));
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

          <PixelBossPortrait
            bossIndex={battle.bossIndex}
            megaArchetype={battle.megaArchetype}
            isGyroBoss={battle.isGyroBoss}
            expression={bossExpression}
            size={56}
          />

          <div className="flex-1 min-w-0">
            {battle.isGyroBoss && (
              <div
                data-testid="gyro-boss-badge"
                className="mb-1 px-1.5 py-0.5 bg-[#052e16] border border-emerald-300/90 font-pixel-mono text-[9px] font-bold tracking-wider text-emerald-200 flex items-center justify-between"
              >
                <span>✦ FINAL BOSS · LESSON 5</span>
                <span className="text-yellow-300">3x HP · =ATK</span>
              </div>
            )}
            {battle.isMegaBoss && !battle.isGyroBoss && (
              <div
                data-testid="mega-boss-badge"
                className="mb-1 px-1.5 py-0.5 bg-[#4c0519] border border-yellow-300/90 font-pixel-mono text-[9px] font-bold tracking-wider text-yellow-200 flex items-center justify-between"
              >
                <span>✦ MEGA BOSS BREACH</span>
                <span className="text-cyan-300">OVERDRIVE</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <span className="font-display font-bold text-xs sm:text-sm text-amber-50 truncate">
                {battle.bossName}
              </span>
              <span className="font-pixel-mono text-[10px] text-amber-300 shrink-0">
                {battle.isGyroBoss ? 'FINAL' : battle.isMegaBoss ? 'MEGA' : `Lv.${battle.bossIndex}`}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-pixel-mono text-amber-200/80 mt-0.5 gap-1">
              <span className="truncate">Aura: {battle.standName}</span>
              <div className="flex items-center gap-1 shrink-0">
                {battle.windVulnerable && (
                  <span
                    data-testid="boss-wind-vuln-badge"
                    className="px-1 bg-teal-950 border border-teal-400/80 text-teal-200 text-[9px] font-bold"
                  >
                    +30% DMG
                  </span>
                )}
                {battle.bossFrozenTurns > 0 && (
                  <span
                    data-testid="boss-stun-badge"
                    className={`px-1 border text-[9px] font-bold ${
                      battle.bossStunReason === 'electric'
                        ? 'bg-yellow-950 border-yellow-300 text-yellow-200'
                        : 'bg-emerald-950 border-emerald-400 text-emerald-200'
                    }`}
                  >
                    {battle.bossStunReason === 'electric' ? 'STUNNED 1T' : 'FROZEN'}
                  </span>
                )}
              </div>
            </div>
            {battle.isGyroBoss && battle.gyroEmote && (
              <div className="mt-0.5 px-1.5 py-0.5 bg-emerald-950/90 border border-emerald-400/70 font-pixel-mono text-[9px] text-emerald-200 truncate">
                💬 &ldquo;{battle.gyroEmote}&rdquo;
              </div>
            )}
            <div className="flex items-center justify-between gap-2 text-[9px] font-pixel-mono text-sky-200/90 mt-0.5">
              <span className="truncate">{battle.climateLabel}</span>
              <span
                className="shrink-0 truncate font-bold"
                style={{
                  color: battle.activeSkillPalette?.[0] ?? '#fda4af',
                }}
              >
                {battle.activeSkillName ?? battle.attackName}
              </span>
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

            <PixelWarriorPortrait
              weaponId={hud.equippedWeapon}
              customization={hud.customization}
              size={46}
            />

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

        {/* Easily Visible Bossfight Elemental Orb Bar */}
        <div
          data-testid="boss-orb-bar"
          className="pointer-events-auto flex flex-wrap items-center justify-between gap-2 bg-[#120911]/95 border-2 border-amber-400/85 px-2.5 py-1.5 shadow-[0_3px_12px_rgba(0,0,0,0.85)]"
        >
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-pixel-mono text-[10px] font-bold tracking-wider text-amber-300">
              ✦ ELEMENTAL ORB BAR
            </span>
            <span className="hidden sm:inline font-pixel-mono text-[9px] text-amber-200/70">
              (8% Monster Drop)
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 flex-1 max-w-[660px]">
            {orbs.map((orb) => {
              const disabled = !isMenuReady || orb.count <= 0;
              return (
                <button
                  key={orb.id}
                  type="button"
                  tabIndex={-1}
                  disabled={disabled}
                  data-testid={`boss-orb-${orb.id}`}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onUseOrb(orb.id);
                  }}
                  title={`${orb.shortName}: ${orb.tag}`}
                  className={`flex items-center justify-between gap-1.5 px-2 py-1 border text-left transition-colors cursor-pointer ${
                    orb.count > 0
                      ? `${orb.activeBg} ${orb.border} text-amber-50 disabled:opacity-55`
                      : 'bg-[#170f15] border-amber-900/45 text-amber-200/45 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <PixelItemIcon itemId={orb.id} size={22} />
                    <div className="min-w-0">
                      <div className="font-pixel-mono text-[10px] font-bold truncate leading-tight">
                        {orb.shortName}
                      </div>
                      <div className={`font-pixel-mono text-[9px] font-bold leading-tight ${orb.tagColor}`}>
                        {orb.tag}
                      </div>
                    </div>
                  </div>
                  <span className="font-pixel-mono text-[11px] font-bold text-amber-200 shrink-0">
                    x{orb.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Classic Pokemon Split Command Deck */}
        <div className="pointer-events-auto grid grid-cols-1 sm:grid-cols-12 gap-2 bg-[#0d070a]/95 border-2 border-white p-2.5 shadow-[0_4px_0_rgba(0,0,0,0.9)]">
          {/* Left Narration Box */}
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
                  data-testid="battle-retreat-btn"
                  title="Retreat outside boss range & open Main Sanctuary Interface"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onRetreat();
                  }}
                  className="px-3 py-2 bg-[#451a03] hover:bg-[#78350f] disabled:opacity-45 border-2 border-amber-500/75 text-amber-100 font-pixel-mono text-xs font-bold tracking-wider text-left cursor-pointer whitespace-nowrap"
                >
                  ▶ RETREAT
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
