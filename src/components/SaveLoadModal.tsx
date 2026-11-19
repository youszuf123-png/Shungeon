import React, { useState } from 'react';
import type { BasteraSaveSummary } from '../game/types';

interface SaveLoadModalProps {
  canSaveCurrent: boolean;
  saves: BasteraSaveSummary[];
  loading: boolean;
  lastSavedAt: string | null;
  onClose: () => void;
  onSaveSlot: (saveId: string) => Promise<void>;
  onLoadSlot: (saveId: string) => Promise<void>;
  onDeleteSlot: (saveId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

function formatSavedTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export const SaveLoadModal: React.FC<SaveLoadModalProps> = ({
  canSaveCurrent,
  saves,
  loading,
  lastSavedAt,
  onClose,
  onSaveSlot,
  onLoadSlot,
  onDeleteSlot,
  onRefresh,
}) => {
  const [slotName, setSlotName] = useState('slot_1');
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleSave = async (id: string) => {
    const clean = id.trim() || 'autosave';
    setBusyId(clean);
    try {
      await onSaveSlot(clean);
    } finally {
      setBusyId(null);
    }
  };

  const handleLoad = async (id: string) => {
    setBusyId(id);
    try {
      await onLoadSlot(id);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      await onDeleteSlot(id);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      data-testid="save-load-modal"
    >
      <div className="relative w-full max-w-2xl bg-[#120b10] border-2 border-amber-400/80 p-5 text-amber-50 shadow-[0_8px_32px_rgba(0,0,0,0.9)]">
        <span className="absolute top-0 left-0 w-2 h-2 bg-amber-300" />
        <span className="absolute top-0 right-0 w-2 h-2 bg-amber-300" />
        <span className="absolute bottom-0 left-0 w-2 h-2 bg-amber-300" />
        <span className="absolute bottom-0 right-0 w-2 h-2 bg-amber-300" />

        <div className="flex items-start justify-between gap-3 border-b border-amber-500/30 pb-3 mb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-amber-100">
              Citadel Chronicle · Save &amp; Load
            </h2>
            <p className="font-pixel-mono text-[11px] text-amber-300/80 mt-0.5">
              Saves persist stats, arsenal, secrets, custom armor &amp; boss progression across sessions.
              {lastSavedAt ? ` · Last saved ${formatSavedTime(lastSavedAt)}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void onRefresh()}
              className="px-2.5 py-1 bg-[#1e1219] border border-amber-500/45 hover:border-amber-300 font-pixel-mono text-[11px] text-amber-200 cursor-pointer"
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

        {/* Create / Quick Save Bar */}
        {canSaveCurrent ? (
          <div className="bg-[#1b1017] border border-amber-500/40 p-3 mb-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="quick-save-btn"
              disabled={busyId !== null}
              onClick={() => void handleSave('autosave')}
              className="px-3.5 py-2 bg-[#7f1d1d] hover:bg-[#991b1b] disabled:opacity-50 border border-amber-300 font-pixel-mono text-xs font-bold text-amber-50 cursor-pointer whitespace-nowrap"
            >
              {busyId === 'autosave' ? 'Saving...' : 'Quick Save (Autosave)'}
            </button>
            <div className="flex items-center gap-2 flex-1 min-w-[210px]">
              <input
                type="text"
                value={slotName}
                maxLength={32}
                onChange={(e) => setSlotName(e.target.value)}
                placeholder="Save slot name..."
                aria-label="Save Slot Name"
                data-testid="save-slot-input"
                className="flex-1 px-2.5 py-2 bg-[#0d070b] border border-amber-500/40 text-xs font-pixel-mono text-amber-100 focus:outline-none focus:border-amber-300"
              />
              <button
                type="button"
                data-testid="save-slot-btn"
                disabled={busyId !== null}
                onClick={() => void handleSave(slotName)}
                className="px-3.5 py-2 bg-[#14532d] hover:bg-[#166534] disabled:opacity-50 border border-emerald-400/80 font-pixel-mono text-xs font-bold text-emerald-50 cursor-pointer whitespace-nowrap"
              >
                Save Slot
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#1b1017] border border-amber-500/30 p-3 mb-4 font-pixel-mono text-[11px] text-amber-200/80">
            Select a chronicle below to resume your saved Knight, or enter the castle to create a new save.
          </div>
        )}

        {/* Saved Chronicles List */}
        <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
          {loading && saves.length === 0 ? (
            <div className="py-8 text-center font-pixel-mono text-xs text-amber-200/70">
              Loading saved chronicles...
            </div>
          ) : saves.length === 0 ? (
            <div className="py-8 text-center bg-[#0d080b] border border-amber-900/50 font-pixel-mono text-xs text-amber-200/70">
              No saved games found yet. Use Quick Save or Save Slot while exploring!
            </div>
          ) : (
            saves.map((s) => (
              <div
                key={s.saveId}
                data-testid={`save-row-${s.saveId}`}
                className="flex flex-wrap items-center justify-between gap-3 bg-[#190f15] border border-amber-500/35 hover:border-amber-400/75 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-bold text-sm text-amber-100">
                      {s.playerName}
                    </span>
                    <span className="font-pixel-mono text-[10px] px-1.5 py-0.5 bg-[#2a1721] border border-amber-500/40 text-amber-300">
                      {s.saveId}
                    </span>
                    <span className="font-pixel-mono text-[10px] text-cyan-300">
                      LV.{s.level}
                    </span>
                  </div>
                  <div className="font-pixel-mono text-[10px] text-amber-200/80 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                    <span>Biome: {s.biome.toUpperCase()}</span>
                    <span>Bosses: {s.bossesDefeated}/120</span>
                    <span>Dist: {s.distanceMeters}m</span>
                    <span>Gold: {s.gold}G</span>
                    <span className="text-amber-300/70">{formatSavedTime(s.savedAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    data-testid={`load-save-${s.saveId}`}
                    disabled={busyId !== null}
                    onClick={() => void handleLoad(s.saveId)}
                    className="px-3 py-1.5 bg-[#0e7490] hover:bg-[#0891b2] disabled:opacity-50 border border-cyan-300/80 font-pixel-mono text-xs font-bold text-white cursor-pointer"
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    data-testid={`delete-save-${s.saveId}`}
                    disabled={busyId !== null}
                    onClick={() => void handleDelete(s.saveId)}
                    className="px-2.5 py-1.5 bg-[#3f1118] hover:bg-[#5c1923] disabled:opacity-50 border border-rose-500/60 font-pixel-mono text-xs text-rose-200 cursor-pointer"
                  >
                    Del
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
