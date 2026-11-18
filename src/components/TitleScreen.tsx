import React, { useState } from 'react';

interface TitleScreenProps {
  onlineCount: number;
  onStart: (playerName: string) => void;
  onToggleRotate: () => void;
  rotatedMobile: boolean;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onlineCount,
  onStart,
  onToggleRotate,
  rotatedMobile,
}) => {
  const [name, setName] = useState('BasteraKnight');

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-between p-6 sm:p-10 pointer-events-none bg-gradient-to-r from-[#0b070a]/85 via-[#0b070a]/45 to-transparent">
      {/* Top right quiet multiplayer & rotate toggle */}
      <div className="flex items-center justify-end gap-4 pointer-events-auto">
        <span className="font-pixel-mono text-xs text-amber-200/80 tracking-wide">
          {onlineCount} {onlineCount === 1 ? 'Warrior' : 'Warriors'} in Citadel
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.currentTarget.blur();
            onToggleRotate();
          }}
          className="px-3 py-1.5 text-xs font-medium text-amber-100 bg-[#1a1116] border border-amber-500/35 hover:border-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {rotatedMobile ? 'Standard View' : 'Rotate Perspective'}
        </button>
      </div>

      {/* Left-third negative-space anchor with bespoke SVG title lockup */}
      <div className="relative max-w-lg my-auto pointer-events-auto border-l-2 border-amber-400/60 pl-4 py-2">
        <span className="absolute -top-0.5 -left-0.5 w-2 h-2 bg-amber-400" />
        <span className="absolute -bottom-0.5 -left-0.5 w-2 h-2 bg-amber-400" />
        <svg
          viewBox="0 0 380 112"
          className="w-full max-w-[380px] h-auto mb-3 drop-shadow-[0_4px_0_rgba(0,0,0,0.9)]"
          role="img"
          aria-label="Bastera Endless Citadel"
        >
          {/* Royal crown & crossed swords crest */}
          <path
            d="M24 38 L32 16 L46 28 L60 12 L74 28 L88 16 L96 38 Z"
            fill="#d97706"
            stroke="#fef08a"
            strokeWidth="2"
          />
          <rect x="24" y="40" width="72" height="6" fill="#991b1b" stroke="#fbbf24" strokeWidth="1.5" />
          <path d="M18 52 L102 22 M102 52 L18 22" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="square" />
          {/* Title lettering */}
          <text
            x="116"
            y="50"
            fill="#fef3c7"
            fontFamily="Cinzel, Georgia, serif"
            fontWeight="700"
            fontSize="40"
            letterSpacing="4"
          >
            BASTERA
          </text>
          <line x1="116" y1="62" x2="366" y2="62" stroke="#b91c1c" strokeWidth="2" />
          <text
            x="118"
            y="82"
            fill="#fbbf24"
            fontFamily="JetBrains Mono, monospace"
            fontWeight="600"
            fontSize="12"
            letterSpacing="2.5"
          >
            ENDLESS CANDLE-LIT CITADEL
          </text>
        </svg>

        <div className="flex flex-wrap items-center gap-3 mt-5">
          <label className="sr-only" htmlFor="warrior-name-input">
            Warrior Name
          </label>
          <input
            id="warrior-name-input"
            type="text"
            value={name}
            maxLength={18}
            onChange={(e) => setName(e.target.value)}
            placeholder="Warrior Name"
            className="w-44 px-3 py-2.5 text-sm font-pixel-mono bg-[#140d11] text-amber-100 border border-amber-500/40 focus:outline-none focus:border-amber-300"
          />
          <button
            type="button"
            data-start="true"
            onClick={(e) => {
              e.currentTarget.blur();
              onStart(name);
            }}
            className="px-7 py-2.5 text-sm font-semibold tracking-wider text-amber-50 bg-[#991b1b] border-2 border-amber-400 hover:bg-[#b91c1c] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Enter Castle
          </button>
        </div>
      </div>

      {/* Single flat control hint line */}
      <div className="font-pixel-mono text-xs text-amber-100/75 tracking-wide">
        A/D Move · Space Jump · J Sword · 1/2/3 Skills · F Interact · I Bag · Esc Pause
      </div>
    </div>
  );
};
