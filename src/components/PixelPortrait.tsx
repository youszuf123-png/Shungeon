import React, { useEffect, useRef } from 'react';
import { getBossDef } from '../game/data';
import { createMegaBossDef } from '../game/megaBoss';
import {
  AnimeExpression,
  drawBossPortrait,
  drawWarriorPortrait,
  getBakedItemIcon,
  getBakedSkillIcon,
  getBakedWeaponIcon,
} from '../game/pixelArtAtlas';
import type { MegaBossArchetype, SkillId, WarriorCustomization, WeaponId } from '../game/types';

interface BossPortraitProps {
  bossIndex: number;
  megaArchetype?: MegaBossArchetype;
  expression: AnimeExpression;
  size?: number;
  className?: string;
}

export const PixelBossPortrait: React.FC<BossPortraitProps> = ({
  bossIndex,
  megaArchetype,
  expression,
  size = 56,
  className = '',
}) => {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 48, 48);
    const def = megaArchetype
      ? createMegaBossDef(megaArchetype, Math.max(1, bossIndex % 100), 'castle')
      : getBossDef(bossIndex);
    drawBossPortrait(ctx, def, expression, 48);
  }, [bossIndex, megaArchetype, expression]);

  return (
    <canvas
      ref={ref}
      width={48}
      height={48}
      style={{ width: size, height: size }}
      className={`pixel-canvas shrink-0 border border-amber-400/80 bg-[#09060b] ${className}`}
      aria-label={`Boss portrait showing ${expression} expression`}
    />
  );
};

interface WarriorPortraitProps {
  weaponId: WeaponId;
  customization?: WarriorCustomization;
  size?: number;
  className?: string;
}

export const PixelWarriorPortrait: React.FC<WarriorPortraitProps> = ({
  weaponId,
  customization,
  size = 44,
  className = '',
}) => {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 32, 32);
    drawWarriorPortrait(ctx, weaponId, 32, customization);
  }, [
    weaponId,
    customization?.cloakColor,
    customization?.armorColor,
    customization?.visorColor,
    customization?.plumeColor,
  ]);

  return (
    <canvas
      ref={ref}
      width={32}
      height={32}
      style={{ width: size, height: size }}
      className={`pixel-canvas shrink-0 border border-amber-400/80 bg-[#140b12] ${className}`}
      aria-label="Warrior portrait"
    />
  );
};

export const PixelItemIcon: React.FC<{
  itemId: string;
  size?: number;
  className?: string;
}> = ({ itemId, size = 44, className = '' }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 32, 32);
    ctx.drawImage(getBakedItemIcon(itemId), 0, 0);
  }, [itemId]);
  return (
    <canvas
      ref={ref}
      width={32}
      height={32}
      style={{ width: size, height: size }}
      className={`pixel-canvas shrink-0 border border-amber-500/60 bg-[#120a0e] ${className}`}
      aria-label={`${itemId} icon`}
    />
  );
};

export const PixelWeaponIcon: React.FC<{
  weaponId: WeaponId;
  size?: number;
  className?: string;
}> = ({ weaponId, size = 44, className = '' }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 32, 32);
    ctx.drawImage(getBakedWeaponIcon(weaponId), 0, 0);
  }, [weaponId]);
  return (
    <canvas
      ref={ref}
      width={32}
      height={32}
      style={{ width: size, height: size }}
      className={`pixel-canvas shrink-0 border border-amber-500/60 bg-[#120a0e] ${className}`}
      aria-label={`${weaponId} weapon icon`}
    />
  );
};

export const PixelSkillIcon: React.FC<{
  skillId: SkillId;
  size?: number;
  className?: string;
}> = ({ skillId, size = 40, className = '' }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 32, 32);
    ctx.drawImage(getBakedSkillIcon(skillId), 0, 0);
  }, [skillId]);
  return (
    <canvas
      ref={ref}
      width={32}
      height={32}
      style={{ width: size, height: size }}
      className={`pixel-canvas shrink-0 border border-amber-500/50 bg-[#100a14] ${className}`}
      aria-label={`${skillId} skill icon`}
    />
  );
};
