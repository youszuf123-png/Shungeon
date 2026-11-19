import { useCallback, useEffect, useRef, useState } from 'react';
import { BossBattleOverlay } from './components/BossBattleOverlay';
import { CheckpointMapModal } from './components/CheckpointMapModal';
import { GameHud } from './components/GameHud';
import { InventoryModal } from './components/InventoryModal';
import { SanctuaryModal } from './components/SanctuaryModal';
import { SaveLoadModal } from './components/SaveLoadModal';
import { SoloLevelingStatusModal } from './components/SoloLevelingStatusModal';
import { StatusModals } from './components/StatusModals';
import { TitleScreen } from './components/TitleScreen';
import { WorldsModal } from './components/WorldsModal';
import { TOTAL_BOSSES, TOTAL_HIDDEN_PASSAGES } from './game/data';
import { BasteraGameEngine } from './game/engine';
import {
  DEFAULT_WARRIOR_CUSTOMIZATION,
  createInitialInventory,
} from './game/rules';
import {
  BasteraSaveData,
  deleteLocalSave,
  listLocalSaves,
  loadLocalSave,
  normalizeLoadedSave,
} from './game/saveSystem';
import type {
  BasteraSaveSummary,
  HudSnapshot,
  SkillId,
  StatKey,
  WarriorCustomization,
  WeaponId,
} from './game/types';

const INITIAL_HUD: HudSnapshot = {
  status: 'title',
  hp: 115,
  maxHp: 115,
  stamina: 100,
  maxStamina: 100,
  gold: 25,
  level: 1,
  statPoints: 0,
  stats: { skillDmg: 0, attack: 0, hp: 0, speed: 0 },
  monstersSlain: 0,
  customization: { ...DEFAULT_WARRIOR_CUSTOMIZATION },
  biome: 'castle',
  biomeLabel: 'Abandoned Royal Castle',
  distanceMeters: 0,
  bossesDefeated: 0,
  totalBosses: TOTAL_BOSSES,
  secretsFound: 0,
  totalSecrets: TOTAL_HIDDEN_PASSAGES,
  equippedWeapon: 'claymore',
  unlockedWeapons: ['claymore', 'rapier'],
  skillSlots: ['blade_dash', 'candlefire_wave', 'stand_rush'],
  skillCooldowns: [0, 0, 0],
  dashCooldown: 0,
  starPlatinumActive: false,
  bossCooldownSeconds: 0,
  bossFoughtStreak: 0,
  inventory: createInitialInventory(),
  dialogue: null,
  activeBoss: null,
  bossBattle: null,
  megaCutscene: null,
  checkpoints: [],
  onlineCount: 1,
  worldId: 'LOCAL',
  worldRole: 'host',
  worldHostName: null,
  isWorldPublic: true,
  onlineWorlds: [],
  worldPlayerCount: 1,
  lastSavedAt: null,
  announcement: null,
  secretCaption: null,
  nearbyPrompt: null,
  muted: false,
};

function mergeSaveSummaries(
  remote: BasteraSaveSummary[],
  local: BasteraSaveSummary[],
): BasteraSaveSummary[] {
  const byId = new Map<string, BasteraSaveSummary>();
  for (const s of local) byId.set(s.saveId, s);
  for (const s of remote) {
    const prev = byId.get(s.saveId);
    if (!prev || s.savedAt >= prev.savedAt) {
      byId.set(s.saveId, s);
    }
  }
  return Array.from(byId.values()).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<BasteraGameEngine | null>(null);

  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [showInventory, setShowInventory] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showSanctuary, setShowSanctuary] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showWorldsModal, setShowWorldsModal] = useState(false);
  const [saves, setSaves] = useState<BasteraSaveSummary[]>(() => listLocalSaves());
  const [savesLoading, setSavesLoading] = useState(false);
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);
  const [rotatedPerspective, setRotatedPerspective] = useState(false);

  const closeAllModals = useCallback(() => {
    setShowInventory(false);
    setShowMap(false);
    setShowStatus(false);
    setShowSanctuary(false);
    setShowSaveModal(false);
    setShowWorldsModal(false);
  }, []);

  const refreshSaves = useCallback(async () => {
    setSavesLoading(true);
    const local = listLocalSaves();
    try {
      const resp = await fetch('/api/saves');
      if (resp.ok) {
        const data = (await resp.json()) as { saves?: BasteraSaveSummary[] };
        setSaves(mergeSaveSummaries(data.saves ?? [], local));
      } else {
        setSaves(local);
      }
    } catch {
      setSaves(local);
    } finally {
      setSavesLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSaves();
  }, [refreshSaves]);

  // Detect mobile portrait screens for rotated landscape perspective
  useEffect(() => {
    const checkViewport = () => {
      const portraitMobile = window.innerWidth < 768 && window.innerHeight > window.innerWidth;
      setIsMobilePortrait(portraitMobile);
      if (portraitMobile) {
        setRotatedPerspective(true);
      }
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Initialize isolated 60fps canvas engine once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const autostart = new URLSearchParams(window.location.search).get('autostart') === '1';
    const engine = new BasteraGameEngine(
      canvas,
      (snapshot) => {
        setHud(snapshot);
      },
      autostart ? 'playing' : 'title',
    );

    engineRef.current = engine;
    if (autostart) {
      engine.startNewGame();
    }
    engine.startLoop();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const handleStartGame = useCallback(
    (name?: string) => {
      const eng = engineRef.current;
      if (!eng) return;
      if (name) eng.setPlayerName(name);
      closeAllModals();
      eng.startNewGame();
    },
    [closeAllModals],
  );

  const handleSaveSlot = useCallback(
    async (saveId: string) => {
      const eng = engineRef.current;
      if (!eng) return;
      await eng.saveCurrentGame(saveId, false);
      await refreshSaves();
    },
    [refreshSaves],
  );

  const handleLoadSlot = useCallback(
    async (saveId: string) => {
      const eng = engineRef.current;
      if (!eng) return;
      let loaded: BasteraSaveData | null = null;
      try {
        const resp = await fetch(`/api/saves/${encodeURIComponent(saveId)}`);
        if (resp.ok) {
          const data = (await resp.json()) as { save?: unknown };
          loaded = normalizeLoadedSave(data.save);
        }
      } catch {
        // Fallback to localStorage below
      }
      if (!loaded) {
        loaded = loadLocalSave(saveId);
      }
      if (loaded && eng.loadFromSave(loaded)) {
        closeAllModals();
      }
    },
    [closeAllModals],
  );

  const handleDeleteSlot = useCallback(
    async (saveId: string) => {
      deleteLocalSave(saveId);
      try {
        await fetch(`/api/saves/${encodeURIComponent(saveId)}`, { method: 'DELETE' });
      } catch {
        // Offline delete already removed local copy
      }
      await refreshSaves();
    },
    [refreshSaves],
  );

  const openSaveModal = useCallback(() => {
    closeAllModals();
    setShowSaveModal(true);
    void refreshSaves();
  }, [closeAllModals, refreshSaves]);

  const openWorldsModal = useCallback(() => {
    closeAllModals();
    engineRef.current?.refreshOnlineWorlds();
    setShowWorldsModal(true);
  }, [closeAllModals]);

  // Global modal & shell keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        if (e.code === 'Enter' && hud.status === 'title' && !showSaveModal && !showWorldsModal) {
          e.preventDefault();
          target.blur();
          handleStartGame();
        }
        return;
      }

      if (
        hud.status === 'title' &&
        !showSaveModal &&
        !showWorldsModal &&
        (e.code === 'Enter' || e.code === 'Space')
      ) {
        e.preventDefault();
        handleStartGame();
        return;
      }

      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (showSaveModal) {
          setShowSaveModal(false);
          return;
        }
        if (showWorldsModal) {
          setShowWorldsModal(false);
          return;
        }
        if (showSanctuary) {
          setShowSanctuary(false);
          return;
        }
        if (showInventory) {
          setShowInventory(false);
          return;
        }
        if (showMap) {
          setShowMap(false);
          return;
        }
        if (showStatus) {
          setShowStatus(false);
          return;
        }
        if (hud.status === 'playing') {
          engineRef.current?.setStatus('paused');
        } else if (hud.status === 'paused') {
          engineRef.current?.setStatus('playing');
        }
      } else if (e.code === 'KeyC' && hud.status === 'playing') {
        closeAllModals();
        setShowSanctuary((v) => !v);
      } else if (e.code === 'KeyI' && hud.status === 'playing') {
        closeAllModals();
        setShowInventory((v) => !v);
      } else if (e.code === 'KeyM' && hud.status === 'playing') {
        closeAllModals();
        setShowMap((v) => !v);
      } else if (e.code === 'KeyK' && hud.status === 'playing') {
        closeAllModals();
        setShowStatus((v) => !v);
      } else if (e.code === 'KeyU') {
        engineRef.current?.toggleMute();
      } else if (e.code === 'KeyV') {
        setRotatedPerspective((v) => !v);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    hud.status,
    showInventory,
    showMap,
    showStatus,
    showSanctuary,
    showSaveModal,
    showWorldsModal,
    handleStartGame,
    closeAllModals,
  ]);

  useEffect(() => {
    engineRef.current?.setModalPaused(
      showInventory || showMap || showStatus || showSanctuary || showSaveModal || showWorldsModal,
    );
  }, [showInventory, showMap, showStatus, showSanctuary, showSaveModal, showWorldsModal]);

  const handleCycleWeapon = useCallback(() => {
    const unlocked = hud.unlockedWeapons;
    if (unlocked.length <= 1) return;
    const idx = unlocked.indexOf(hud.equippedWeapon);
    const next = unlocked[(idx + 1) % unlocked.length];
    engineRef.current?.equipWeaponById(next);
  }, [hud.unlockedWeapons, hud.equippedWeapon]);

  const shellClass = rotatedPerspective
    ? 'rotated-mobile-shell bg-[#0b080a] overflow-hidden'
    : 'relative w-full h-full bg-[#0b080a] overflow-hidden';

  const showTouchControls = isMobilePortrait || rotatedPerspective;

  return (
    <main className={shellClass} data-testid="bastera-shell">
      {/* Isolated Pixel-Art Canvas Viewport */}
      <div className="absolute inset-0 flex items-center justify-center bg-[#090608]">
        <canvas
          ref={canvasRef}
          data-testid="game-canvas"
          className="pixel-canvas w-full h-full object-contain"
        />
      </div>

      {/* Title Screen */}
      {hud.status === 'title' && (
        <TitleScreen
          onlineCount={hud.onlineCount}
          savedCount={saves.length}
          onStart={(name) => handleStartGame(name)}
          onOpenSaves={openSaveModal}
          onOpenWorlds={openWorldsModal}
          onToggleRotate={() => setRotatedPerspective((v) => !v)}
          rotatedMobile={rotatedPerspective}
        />
      )}

      {/* Active Gameplay HUD OR Boss Encounter */}
      {hud.status === 'playing' && hud.bossBattle && (
        <BossBattleOverlay
          hud={hud}
          battle={hud.bossBattle}
          onAttackWeapon={() => engineRef.current?.battleAttackWeapon()}
          onUseSkill={(slot) => engineRef.current?.battleUseSkill(slot)}
          onUsePotion={(itemId) => engineRef.current?.battleUsePotion(itemId)}
          onRetreat={() =>
            engineRef.current?.battleRetreatToSanctuary(() => {
              closeAllModals();
              setShowSanctuary(true);
            })
          }
          onEscape={() => engineRef.current?.battleEscape()}
          onOpenStatus={() => {
            closeAllModals();
            setShowStatus(true);
          }}
          onToggleMute={() => engineRef.current?.toggleMute()}
          onTogglePause={() => engineRef.current?.setStatus('paused')}
        />
      )}

      {hud.status === 'playing' && !hud.bossBattle && (
        <GameHud
          hud={hud}
          isTouchLayout={showTouchControls}
          onOpenInventory={() => {
            closeAllModals();
            setShowInventory(true);
          }}
          onOpenSanctuary={() => {
            closeAllModals();
            setShowSanctuary(true);
          }}
          onOpenMap={() => {
            closeAllModals();
            setShowMap(true);
          }}
          onOpenStatus={() => {
            closeAllModals();
            setShowStatus(true);
          }}
          onOpenSaves={openSaveModal}
          onOpenWorlds={openWorldsModal}
          onAllocateStat={(key: StatKey) => engineRef.current?.allocatePlayerStat(key, 1)}
          onTogglePause={() => engineRef.current?.setStatus('paused')}
          onToggleMute={() => engineRef.current?.toggleMute()}
          onToggleRotate={() => setRotatedPerspective((v) => !v)}
          onTriggerSkill={(slot) => engineRef.current?.triggerSkillButton(slot)}
          onDash={() => engineRef.current?.performDash()}
          onCycleWeapon={handleCycleWeapon}
          onAdvanceDialogue={() => engineRef.current?.advanceDialogue()}
          onVirtualKey={(action, pressed) => engineRef.current?.triggerVirtualKey(action, pressed)}
        />
      )}

      {/* Main Sanctuary Interface: Character Customization, Stat Points, Items & Arsenal */}
      {showSanctuary && hud.status === 'playing' && (
        <SanctuaryModal
          hud={hud}
          onClose={() => setShowSanctuary(false)}
          onAllocateStat={(key: StatKey, amount = 1) =>
            engineRef.current?.allocatePlayerStat(key, amount)
          }
          onUpdateCustomization={(patch: Partial<WarriorCustomization>) =>
            engineRef.current?.setWarriorCustomization(patch)
          }
          onEquipOrCraftWeapon={(wid: WeaponId) => engineRef.current?.craftOrEquipWeapon(wid)}
          onAssignSkill={(slot, sid: SkillId) => engineRef.current?.swapSkillSlot(slot, sid)}
          onUseItem={(itemId) => engineRef.current?.useItem(itemId)}
        />
      )}

      {/* Inventory & 3-Slot Skill Configurator */}
      {showInventory && hud.status === 'playing' && (
        <InventoryModal
          hud={hud}
          onClose={() => setShowInventory(false)}
          onEquipOrCraftWeapon={(wid: WeaponId) => engineRef.current?.craftOrEquipWeapon(wid)}
          onAssignSkill={(slot, sid: SkillId) => engineRef.current?.swapSkillSlot(slot, sid)}
          onUseItem={(itemId) => engineRef.current?.useItem(itemId)}
        />
      )}

      {/* Checkpoint Warp & 120 Boss Codex */}
      {showMap && hud.status === 'playing' && (
        <CheckpointMapModal
          hud={hud}
          onClose={() => setShowMap(false)}
          onWarpCheckpoint={(cpIndex) => {
            setShowMap(false);
            engineRef.current?.warpToCheckpoint(cpIndex);
          }}
        />
      )}

      {/* Solo Leveling System Status Window */}
      {showStatus && hud.status === 'playing' && (
        <SoloLevelingStatusModal
          hud={hud}
          onClose={() => setShowStatus(false)}
          onAllocateStat={(key: StatKey, amount = 1) =>
            engineRef.current?.allocatePlayerStat(key, amount)
          }
        />
      )}

      {/* Game Saving System Modal (Accessible from Title, HUD, and Pause) */}
      {showSaveModal && (
        <SaveLoadModal
          canSaveCurrent={hud.status === 'playing' || hud.status === 'paused'}
          saves={saves}
          loading={savesLoading}
          lastSavedAt={hud.lastSavedAt}
          onClose={() => setShowSaveModal(false)}
          onSaveSlot={handleSaveSlot}
          onLoadSlot={handleLoadSlot}
          onDeleteSlot={handleDeleteSlot}
          onRefresh={refreshSaves}
        />
      )}

      {/* Online Co-op Bastera Worlds Modal */}
      {showWorldsModal && (
        <WorldsModal
          worldId={hud.worldId}
          worldRole={hud.worldRole}
          worldHostName={hud.worldHostName}
          isWorldPublic={hud.isWorldPublic}
          worldPlayerCount={hud.worldPlayerCount}
          onlineWorlds={hud.onlineWorlds}
          onClose={() => setShowWorldsModal(false)}
          onJoinWorld={(targetId) => {
            engineRef.current?.joinWorld(targetId);
            if (hud.status === 'title') {
              engineRef.current?.startNewGame();
            }
            setShowWorldsModal(false);
          }}
          onLeaveWorld={() => engineRef.current?.leaveJoinedWorld()}
          onTogglePublic={(isPublic) => engineRef.current?.setWorldPublic(isPublic)}
          onRefreshWorlds={() => engineRef.current?.refreshOnlineWorlds()}
        />
      )}

      {/* Pause / Victory / Game Over Modals */}
      <StatusModals
        hud={hud}
        onResume={() => engineRef.current?.setStatus('playing')}
        onRestartCheckpoint={() => engineRef.current?.restartFromCheckpoint()}
        onNewGame={() => handleStartGame()}
        onTitle={() => engineRef.current?.setStatus('title')}
        onQuickSave={() => {
          void handleSaveSlot('autosave');
        }}
        onOpenSaves={openSaveModal}
      />
    </main>
  );
}
