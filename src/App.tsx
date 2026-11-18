import { useCallback, useEffect, useRef, useState } from 'react';
import { BossBattleOverlay } from './components/BossBattleOverlay';
import { CheckpointMapModal } from './components/CheckpointMapModal';
import { GameHud } from './components/GameHud';
import { InventoryModal } from './components/InventoryModal';
import { SoloLevelingStatusModal } from './components/SoloLevelingStatusModal';
import { StatusModals } from './components/StatusModals';
import { TitleScreen } from './components/TitleScreen';
import { TOTAL_BOSSES, TOTAL_HIDDEN_PASSAGES } from './game/data';
import { BasteraGameEngine } from './game/engine';
import { createInitialInventory } from './game/rules';
import type { HudSnapshot, SkillId, StatKey, WeaponId } from './game/types';

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
  inventory: createInitialInventory(),
  dialogue: null,
  activeBoss: null,
  bossBattle: null,
  checkpoints: [],
  onlineCount: 1,
  announcement: null,
  nearbyPrompt: null,
  muted: false,
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<BasteraGameEngine | null>(null);

  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [showInventory, setShowInventory] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);
  const [rotatedPerspective, setRotatedPerspective] = useState(false);

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
    const engine = new BasteraGameEngine(canvas, (snapshot) => {
      setHud(snapshot);
    }, autostart ? 'playing' : 'title');

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

  const handleStartGame = useCallback((name?: string) => {
    const eng = engineRef.current;
    if (!eng) return;
    if (name) eng.setPlayerName(name);
    setShowInventory(false);
    setShowMap(false);
    setShowStatus(false);
    eng.startNewGame();
  }, []);

  // Global modal & shell keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        if (e.code === 'Enter' && hud.status === 'title') {
          e.preventDefault();
          target.blur();
          handleStartGame();
        }
        return;
      }

      if (hud.status === 'title' && (e.code === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        handleStartGame();
        return;
      }

      if (e.code === 'Escape' || e.code === 'KeyP') {
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
      } else if (e.code === 'KeyI' && hud.status === 'playing') {
        setShowMap(false);
        setShowStatus(false);
        setShowInventory((v) => !v);
      } else if (e.code === 'KeyM' && hud.status === 'playing') {
        setShowInventory(false);
        setShowStatus(false);
        setShowMap((v) => !v);
      } else if (e.code === 'KeyK' && hud.status === 'playing') {
        setShowInventory(false);
        setShowMap(false);
        setShowStatus((v) => !v);
      } else if (e.code === 'KeyU') {
        engineRef.current?.toggleMute();
      } else if (e.code === 'KeyV') {
        setRotatedPerspective((v) => !v);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hud.status, showInventory, showMap, showStatus, handleStartGame]);

  useEffect(() => {
    engineRef.current?.setModalPaused(showInventory || showMap || showStatus);
  }, [showInventory, showMap, showStatus]);

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
          onStart={(name) => handleStartGame(name)}
          onToggleRotate={() => setRotatedPerspective((v) => !v)}
          rotatedMobile={rotatedPerspective}
        />
      )}

      {/* Active Gameplay HUD OR Pokemon-Style Boss Encounter */}
      {hud.status === 'playing' && hud.bossBattle && (
        <BossBattleOverlay
          hud={hud}
          battle={hud.bossBattle}
          onAttackWeapon={() => engineRef.current?.battleAttackWeapon()}
          onUseSkill={(slot) => engineRef.current?.battleUseSkill(slot)}
          onUsePotion={(itemId) => engineRef.current?.battleUsePotion(itemId)}
          onRun={() => engineRef.current?.battleRun()}
          onEscape={() => engineRef.current?.battleEscape()}
          onReplayVoice={() => engineRef.current?.battleReplayVoice()}
          onOpenStatus={() => {
            setShowInventory(false);
            setShowMap(false);
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
            setShowMap(false);
            setShowStatus(false);
            setShowInventory(true);
          }}
          onOpenMap={() => {
            setShowInventory(false);
            setShowStatus(false);
            setShowMap(true);
          }}
          onOpenStatus={() => {
            setShowInventory(false);
            setShowMap(false);
            setShowStatus(true);
          }}
          onAllocateStat={(key: StatKey) => engineRef.current?.allocatePlayerStat(key, 1)}
          onTogglePause={() => engineRef.current?.setStatus('paused')}
          onToggleMute={() => engineRef.current?.toggleMute()}
          onToggleRotate={() => setRotatedPerspective((v) => !v)}
          onTriggerSkill={(slot) => engineRef.current?.triggerSkillButton(slot)}
          onCycleWeapon={handleCycleWeapon}
          onAdvanceDialogue={() => engineRef.current?.advanceDialogue()}
          onVirtualKey={(action, pressed) => engineRef.current?.triggerVirtualKey(action, pressed)}
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

      {/* Checkpoint Warp & 120 JoJo Boss Codex */}
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

      {/* Pause / Victory / Game Over Modals */}
      <StatusModals
        hud={hud}
        onResume={() => engineRef.current?.setStatus('playing')}
        onRestartCheckpoint={() => engineRef.current?.restartFromCheckpoint()}
        onNewGame={() => handleStartGame()}
        onTitle={() => engineRef.current?.setStatus('title')}
      />
    </main>
  );
}
