import { useState, useEffect, useRef } from "react";
import { GameEngine } from "./game/engine";
import type { CompanionId, OperatorId, UpgradeCard, PlayerState } from "./game/types";
import { COMPANIONS, HUMAN_OPERATORS, drawSadCompanion } from "./game/companions";
import { sounds, type BgmTrackInfo } from "./game/sound";
import { 
  Shield, Zap, Volume2, VolumeX, Play, 
  Sparkles, Trophy, Flame, ChevronRight, User, Heart, AlertOctagon
} from "lucide-react";

export default function App() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [selectedOperator, setSelectedOperator] = useState<OperatorId>("ren");
  const [selectedCompanion, setSelectedCompanion] = useState<CompanionId>("koji");
  const [pendingUpgrades, setPendingUpgrades] = useState<UpgradeCard[] | null>(null);
  const [isMuted, setIsMuted] = useState(sounds.isMuted);
  const [volume, setVolumeState] = useState(sounds.volume);
  const [currentBgm, setCurrentBgm] = useState<BgmTrackInfo | null>(sounds.currentTrack);
  const [isHoveringAbandon, setIsHoveringAbandon] = useState(false);

  // Live HUD States
  const [playerHp, setPlayerHp] = useState(160);
  const [playerMaxHp, setPlayerMaxHp] = useState(160);
  const [baseHp, setBaseHp] = useState(1000);
  const [playerXp, setPlayerXp] = useState(0);
  const [nextXp, setNextXp] = useState(50);
  const [level, setLevel] = useState(1);
  const [wave, setWave] = useState(1);
  const [score, setScore] = useState(0);
  const [abilityCooldown, setAbilityCooldown] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameStats, setGameStats] = useState({ score: 0, wave: 1, time: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sadCanvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Mobile Virtual Joystick State & Pointer Handlers
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });
  const isDraggingJoystickRef = useRef(false);

  const updateJoystickPosition = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const maxRadius = 38;

    const clampedDist = Math.min(dist, maxRadius);
    const normX = dist > 0 ? (dx / dist) * (clampedDist / maxRadius) : 0;
    const normY = dist > 0 ? (dy / dist) * (clampedDist / maxRadius) : 0;

    const knobX = dist > 0 ? (dx / dist) * clampedDist : 0;
    const knobY = dist > 0 ? (dy / dist) * clampedDist : 0;

    setKnobOffset({ x: knobX, y: knobY });
    if (engineRef.current) {
      engineRef.current.joystickVector = { x: normX, y: normY };
    }
  };

  const handleJoystickStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    isDraggingJoystickRef.current = true;
    updateJoystickPosition(e.clientX, e.clientY);
  };

  const handleJoystickMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingJoystickRef.current) return;
    e.preventDefault();
    updateJoystickPosition(e.clientX, e.clientY);
  };

  const handleJoystickEnd = () => {
    isDraggingJoystickRef.current = false;
    setKnobOffset({ x: 0, y: 0 });
    if (engineRef.current) {
      engineRef.current.joystickVector = { x: 0, y: 0 };
    }
  };

  // Load High Score & Initialize Soundtrack Listeners
  useEffect(() => {
    const saved = localStorage.getItem("cp_highscore");
    if (saved) setHighScore(parseInt(saved, 10));

    sounds.onTrackChange = (track) => {
      setCurrentBgm({ ...track });
    };

    // Auto-engage menu theme on user interaction
    const handleFirstInteraction = () => {
      if (!sounds.currentTrack && gameState === "menu") {
        sounds.playMenuTheme();
      }
      window.removeEventListener("pointerdown", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };

    window.addEventListener("pointerdown", handleFirstInteraction);
    window.addEventListener("keydown", handleFirstInteraction);

    // Initial attempt to start menu music
    if (gameState === "menu") {
      sounds.playMenuTheme();
    }

    return () => {
      window.removeEventListener("pointerdown", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };
  }, []);

  // Sad Companion Animation on Game Over Screen
  useEffect(() => {
    if (gameState !== "gameover" || !sadCanvasRef.current) return;
    const canvas = sadCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    const renderSad = (timestamp: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawSadCompanion(ctx, selectedCompanion, canvas.width / 2, 75, isHoveringAbandon, timestamp / 1000);
      animId = requestAnimationFrame(renderSad);
    };

    animId = requestAnimationFrame(renderSad);
    return () => cancelAnimationFrame(animId);
  }, [gameState, selectedCompanion, isHoveringAbandon]);

  const startGame = (comp: CompanionId, op: OperatorId) => {
    setGameState("playing");
    setPendingUpgrades(null);

    setTimeout(() => {
      if (!canvasRef.current) return;
      const engine = new GameEngine(canvasRef.current, comp, op);

      engine.onStatsUpdate = (player: PlayerState, currentBaseHp: number, currentWave: number, currentScore: number) => {
        setPlayerHp(player.health);
        setPlayerMaxHp(player.maxHealth);
        setBaseHp(currentBaseHp);
        setPlayerXp(player.xp);
        setNextXp(player.nextXp);
        setLevel(player.level);
        setWave(currentWave);
        setScore(currentScore);
        setAbilityCooldown(player.abilityCooldownTimer);
      };

      engine.onLevelUp = (cards: UpgradeCard[]) => {
        setPendingUpgrades(cards);
      };

      engine.onGameOver = (finalScore: number, finalWave: number, finalTime: number) => {
        setGameState("gameover");
        setGameStats({ score: finalScore, wave: finalWave, time: finalTime });
        if (finalScore > highScore) {
          setHighScore(finalScore);
          localStorage.setItem("cp_highscore", finalScore.toString());
        }
      };

      engineRef.current = engine;
      engine.start();
    }, 50);
  };

  const handleSelectUpgrade = (card: UpgradeCard) => {
    if (engineRef.current) {
      engineRef.current.selectUpgrade(card);
      setPendingUpgrades(null);
    }
  };

  const toggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolumeState(newVol);
    sounds.setVolume(newVol);
    if (isMuted && newVol > 0) {
      sounds.toggleMute();
      setIsMuted(false);
    }
  };

  const currentCompData = COMPANIONS[selectedCompanion];
  const currentOpData = HUMAN_OPERATORS[selectedOperator];

  // Companion dialogues for the Game Over Screen
  const getSadCompanionQuote = () => {
    if (isHoveringAbandon) {
      if (selectedCompanion === "koji") return "Operator... please! Don't leave me alone in the glitch storm! Click Retry!";
      if (selectedCompanion === "mochi") return "Wait... you're really quitting? Please don't leave me... I'll wait right here...";
      return "No, don't leave me behind! We can reboot together... please don't quit!";
    }

    if (selectedCompanion === "koji") return "Operator... please stand back up! The Sanctuary Core is under heavy attack, and I can't hold the line without you.";
    if (selectedCompanion === "mochi") return "I kept your tea warm... please open your eyes. We can reboot the core together!";
    return "Hey... this isn't over! You promised we'd clear Sector 10! Stand back up, Operator!";
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* ── Game Canvas ──────────────────────────────────────────────────────── */}
      <canvas
        ref={canvasRef}
        className={`w-full h-full touch-none ${gameState === "playing" ? "block" : "hidden"}`}
      />

      {/* ── Persistent Soundtrack Indicator & Menu Volume Controls ─────────── */}
      <div className="absolute top-4 right-4 z-40 flex items-center gap-2 pointer-events-auto">
        {currentBgm && !isMuted && volume > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 border border-cyan-500/30 rounded-full text-xs font-mono text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)] backdrop-blur">
            <div className="flex items-end gap-0.5 h-3">
              <span className="w-0.5 bg-cyan-400 rounded-full animate-pulse h-full" />
              <span className="w-0.5 bg-cyan-400 rounded-full animate-bounce h-2/3" />
              <span className="w-0.5 bg-cyan-400 rounded-full animate-pulse h-4/5" />
            </div>
            <span className="font-semibold text-white truncate max-w-[130px] sm:max-w-none">{currentBgm.title}</span>
            <span className="text-cyan-400/60 hidden sm:inline">// {currentBgm.bpm} BPM</span>
          </div>
        )}
        {gameState !== "playing" && (
          <div className="glass-panel px-3 py-1.5 flex items-center gap-2">
            <button
              onClick={toggleSound}
              className="text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center"
              title={isMuted ? "Unmute Audio" : "Mute Audio"}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="volume-slider w-16 sm:w-20"
              title={`Master Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
            />
            <span className="text-[10px] font-mono text-cyan-300 w-7 text-right">
              {isMuted ? "0%" : `${Math.round(volume * 100)}%`}
            </span>
          </div>
        )}
      </div>

      {/* ── Main Menu / Character Select Screen ─────────────────────────────── */}
      {gameState === "menu" && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-4 sm:p-8 overflow-y-auto">
          {/* Header Title */}
          <div className="flex flex-col items-center text-center space-y-2 mt-2">
            <div className="glass-pill px-4 py-1.5 flex items-center gap-2 text-xs font-mono text-cyan-400">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>EDGE PROTOCOL // SURVIVOR ROGUELITE</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
              COMPANION <span className="text-cyan-400">PROTOCOL</span>
            </h1>
            <p className="text-xs sm:text-sm font-mono text-slate-400 max-w-xl">
              Human operators can perish under daemon assault, but guardian familiars are immortal anomalies who will protect you with their lives.
            </p>
          </div>

          <div className="max-w-4xl w-full my-4 space-y-6">
            {/* Step 1: Human Operator Selection */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-mono font-bold tracking-widest text-slate-300 uppercase">
                  STEP 1: CHOOSE HUMAN OPERATOR (MORTAL SURVIVOR)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(Object.values(HUMAN_OPERATORS)).map((op) => {
                  const isSelected = op.id === selectedOperator;
                  return (
                    <div
                      key={op.id}
                      onClick={() => setSelectedOperator(op.id)}
                      className={`glass-panel p-4 flex flex-col cursor-pointer transition-all duration-300 relative ${
                        isSelected
                          ? "ring-2 scale-102 shadow-2xl"
                          : "opacity-70 hover:opacity-100 hover:scale-100"
                      }`}
                      style={{
                        borderColor: isSelected ? op.accentHex : "rgba(255,255,255,0.12)",
                        boxShadow: isSelected ? `0 15px 40px -10px ${op.accentHex}40` : "none",
                      }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-3xl">{op.emoji}</div>
                        <div>
                          <h3 className="text-base font-extrabold text-white">{op.name}</h3>
                          <div className="text-[11px] font-mono text-slate-400">{op.identity}</div>
                        </div>
                      </div>
                      <p className="text-[11px] font-mono text-slate-300 mb-2 leading-relaxed">{op.lore}</p>
                      <div className="mt-auto border-t border-white/10 pt-2 text-[11px] font-mono">
                        <span className="text-slate-400">Trait: </span>
                        <span className="font-bold text-sky-300">{op.specialTrait}</span>
                        <div className="text-[10px] text-slate-400">{op.traitDesc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Guardian Familiar Selection */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold tracking-widest text-slate-300 uppercase">
                  STEP 2: CHOOSE GUARDIAN FAMILIAR (IMMORTAL ANOMALY)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(Object.values(COMPANIONS)).map((c) => {
                  const isSelected = c.id === selectedCompanion;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCompanion(c.id)}
                      className={`glass-panel p-4 flex flex-col cursor-pointer transition-all duration-300 relative ${
                        isSelected
                          ? "ring-2 scale-102 shadow-2xl"
                          : "opacity-70 hover:opacity-100 hover:scale-100"
                      }`}
                      style={{
                        borderColor: isSelected ? c.accentHex : "rgba(255,255,255,0.12)",
                        boxShadow: isSelected ? `0 15px 40px -10px ${c.accentHex}40` : "none",
                      }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-3xl">{c.emoji}</div>
                        <div>
                          <h3 className="text-base font-extrabold text-white">{c.name}</h3>
                          <div className="text-[11px] font-mono text-slate-400">{c.species}</div>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-left text-[11px] font-mono border-t border-white/10 pt-2">
                        <div className="flex justify-between text-slate-300">
                          <span className="text-slate-400">Weapon:</span>
                          <span className="font-bold text-white">{c.weaponName}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span className="text-slate-400">Special:</span>
                          <span className="font-bold text-white">{c.abilityName}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span className="text-slate-400">Base Shield:</span>
                          <span className="font-bold text-emerald-400">{c.baseHealth} HP</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Launch Mission Button */}
          <div className="flex flex-col items-center gap-3 w-full max-w-md my-2">
            <button
              onClick={() => startGame(selectedCompanion, selectedOperator)}
              className="w-full py-4 rounded-2xl font-mono font-black text-sm tracking-wider uppercase text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300 shadow-[0_0_35px_rgba(6,182,212,0.5)] hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>LAUNCH WITH {currentOpData.name.toUpperCase()} & {currentCompData.name.toUpperCase()}</span>
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="text-[11px] font-mono text-slate-400">
              High Score: <span className="text-cyan-400 font-bold">{highScore.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Active Game HUD ─────────────────────────────────────────────────── */}
      {gameState === "playing" && (
        <div className="absolute inset-0 z-20 pointer-events-none p-2 sm:p-6 flex flex-col justify-between">
          {/* Top Status Bar (Responsive on Mobile) */}
          <div className="flex flex-wrap items-center justify-between gap-2 w-full">
            {/* Operator HP & XP Gauge */}
            <div className="flex flex-col gap-1 max-w-[145px] sm:max-w-xs w-full pointer-events-auto">
              <div className="glass-panel p-2 sm:p-3 flex flex-col gap-1">
                <div className="flex justify-between items-center text-[10px] sm:text-xs font-mono">
                  <span className="font-bold text-white flex items-center gap-1 truncate">
                    <span>{currentOpData.emoji}</span>
                    <span className="truncate">{currentOpData.name}</span>
                  </span>
                  <span className="text-slate-400 font-bold ml-1">L{level}</span>
                </div>

                {/* HP Bar */}
                <div className="w-full h-2 sm:h-2.5 bg-slate-900 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-150"
                    style={{ width: `${Math.max(0, (playerHp / playerMaxHp) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] sm:text-[10px] font-mono text-slate-400">
                  <span>HP</span>
                  <span>{Math.round(playerHp)}/{playerMaxHp}</span>
                </div>

                {/* XP Bar */}
                <div className="w-full h-1 sm:h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-150"
                    style={{ width: `${Math.min(100, (playerXp / nextXp) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Sanctuary Base Health Indicator */}
            <div className="glass-panel px-3 py-1.5 sm:px-5 sm:py-2.5 flex flex-col items-center pointer-events-auto">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono font-bold text-cyan-400">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">SANCTUARY BASE CORE</span>
                <span className="sm:hidden">BASE CORE</span>
              </div>
              <div className="w-24 sm:w-44 h-1.5 sm:h-2 bg-slate-900 rounded-full overflow-hidden mt-1 border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-200"
                  style={{ width: `${Math.max(0, (baseHp / 1000) * 100)}%` }}
                />
              </div>
              <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 mt-0.5">
                {Math.round(baseHp)}/1000 HP
              </span>
            </div>

            {/* Wave & Score Pills */}
            <div className="flex items-center gap-1.5 sm:gap-3 pointer-events-auto">
              <div className="glass-panel px-2.5 py-1 sm:px-4 sm:py-2 flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-mono text-white font-bold">
                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400" />
                <span>W{wave}</span>
              </div>

              <div className="glass-panel px-2.5 py-1 sm:px-4 sm:py-2 flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-mono text-white font-bold">
                <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                <span>{score.toLocaleString()}</span>
              </div>

              <div className="glass-panel px-2 py-1 sm:px-3 sm:py-1.5 flex items-center gap-1.5">
                <button
                  onClick={toggleSound}
                  className="text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center"
                  title="Mute / Unmute"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="volume-slider w-12 sm:w-20 hidden xs:inline"
                  title={`Master Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                />
              </div>
            </div>
          </div>

          {/* ── Virtual Joystick for Mobile Screens ──────────────────────────── */}
          <div
            ref={joystickBaseRef}
            onPointerDown={handleJoystickStart}
            onPointerMove={handleJoystickMove}
            onPointerUp={handleJoystickEnd}
            onPointerCancel={handleJoystickEnd}
            className="fixed bottom-6 left-6 z-30 pointer-events-auto touch-none select-none w-28 h-28 rounded-full border border-cyan-500/40 bg-slate-950/70 backdrop-blur-md flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.25)] md:hidden active:border-cyan-400"
          >
            {/* Cardinal hints */}
            <span className="absolute top-1 text-[9px] text-cyan-500/50 font-mono">▲</span>
            <span className="absolute bottom-1 text-[9px] text-cyan-500/50 font-mono">▼</span>
            <span className="absolute left-1.5 text-[9px] text-cyan-500/50 font-mono">◀</span>
            <span className="absolute right-1.5 text-[9px] text-cyan-500/50 font-mono">▶</span>

            {/* Thumbstick Knob */}
            <div
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-sky-400 shadow-[0_0_15px_rgba(6,182,212,0.6)] border border-white/50 flex items-center justify-center pointer-events-none transition-transform duration-75"
              style={{
                transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
              }}
            >
              <div className="w-4 h-4 rounded-full bg-white/40" />
            </div>
          </div>

          {/* ── Mobile Ability Button ────────────────────────────────────────── */}
          <div className="fixed bottom-6 right-6 z-30 pointer-events-auto md:hidden">
            <button
              onClick={() => engineRef.current?.triggerAbility()}
              disabled={abilityCooldown > 0}
              className={`w-20 h-20 rounded-full flex flex-col items-center justify-center p-2 border transition-all shadow-xl active:scale-95 cursor-pointer ${
                abilityCooldown <= 0
                  ? "bg-cyan-950/80 border-cyan-400 text-white shadow-[0_0_25px_rgba(6,182,212,0.5)] animate-pulse"
                  : "bg-slate-900/80 border-slate-700 text-slate-500 opacity-60"
              }`}
            >
              <Zap className={`w-6 h-6 ${abilityCooldown <= 0 ? "text-cyan-400" : "text-slate-500"}`} />
              <span className="text-[10px] font-mono font-bold mt-0.5 uppercase tracking-tighter">
                {abilityCooldown > 0 ? `${abilityCooldown.toFixed(1)}s` : "SPECIAL"}
              </span>
            </button>
          </div>

          {/* ── Desktop Bottom Controls & Info ──────────────────────────────── */}
          <div className="hidden md:flex items-end justify-between w-full">
            <div className="text-[11px] font-mono text-slate-400 glass-pill px-3 py-1">
              💡 Stand in Sanctuary Base to regenerate HP · WASD/Arrows to Move · Companion Auto-Fires
            </div>

            {/* Desktop Ability Button */}
            <button
              onClick={() => engineRef.current?.triggerAbility()}
              disabled={abilityCooldown > 0}
              className={`glass-panel p-4 flex items-center gap-3 pointer-events-auto transition-all ${
                abilityCooldown <= 0
                  ? "hover:scale-105 active:scale-95 border-cyan-400 text-white cursor-pointer shadow-lg"
                  : "opacity-50 cursor-not-allowed text-slate-500"
              }`}
            >
              <Zap className="w-5 h-5 text-cyan-400" />
              <div className="text-left font-mono">
                <div className="text-xs font-bold text-white">{currentCompData.abilityName}</div>
                <div className="text-[10px] text-slate-400">
                  {abilityCooldown > 0 ? `${abilityCooldown.toFixed(1)}s` : "[SPACEBAR] READY"}
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ── Level-Up Upgrade Cards Modal ────────────────────────────────────── */}
      {pendingUpgrades && (
        <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 select-none animate-fadeIn">
          <div className="text-center space-y-2 mb-8">
            <div className="glass-pill px-4 py-1.5 text-xs font-mono text-cyan-400 inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>OPERATOR LEVEL UP</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black uppercase text-white tracking-tight">
              SELECT AN UPGRADE
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
            {pendingUpgrades.map((card) => (
              <div
                key={card.id}
                onClick={() => handleSelectUpgrade(card)}
                className="glass-panel p-6 flex flex-col items-center text-center cursor-pointer transition-all duration-200 hover:scale-105 hover:border-cyan-400 hover:shadow-2xl group"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                  {card.icon}
                </div>
                <h4 className="text-lg font-bold text-white mb-2">{card.title}</h4>
                <p className="text-xs font-mono text-slate-300 leading-relaxed mb-4">
                  {card.description}
                </p>
                <span className="mt-auto px-3 py-1 rounded-full text-[10px] font-mono uppercase font-bold bg-white/10 text-cyan-300">
                  {card.rarity} {card.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Heartbreaking Game Over & Sad Companion Screen ───────────────────── */}
      {gameState === "gameover" && (
        <div className="absolute inset-0 z-40 bg-slate-950/92 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-300">
          <div className="glass-panel p-8 sm:p-10 max-w-lg w-full flex flex-col items-center space-y-5 border border-rose-500/30">
            {/* Header Badge */}
            <div className="glass-pill px-4 py-1.5 flex items-center gap-2 text-xs font-mono text-rose-400 border border-rose-500/40">
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>OPERATOR VITALS CRITICAL</span>
            </div>

            {/* Crying / Heartbroken Companion Canvas */}
            <div className="relative w-full flex justify-center py-1">
              <canvas
                ref={sadCanvasRef}
                width={280}
                height={160}
                className="rounded-xl border border-white/5 bg-slate-900/40 shadow-inner"
              />
            </div>

            {/* Companion Dialogue Bubble */}
            <div className={`p-4 rounded-xl border text-xs font-mono transition-all duration-300 ${
              isHoveringAbandon 
                ? "bg-rose-950/60 border-rose-500/50 text-rose-200 scale-102 shadow-lg"
                : "bg-slate-900/80 border-cyan-500/30 text-slate-200"
            }`}>
              <div className="font-bold text-xs uppercase mb-1 flex items-center justify-center gap-1.5 text-cyan-300">
                <span>{currentCompData.emoji}</span>
                <span>{currentCompData.name} ({currentCompData.species})</span>
              </div>
              <p className="italic leading-relaxed">
                "{getSadCompanionQuote()}"
              </p>
            </div>

            {/* Mission Stats */}
            <div className="w-full grid grid-cols-3 gap-3 font-mono text-center">
              <div className="glass-panel p-2.5">
                <div className="text-[10px] text-slate-400">SCORE</div>
                <div className="text-base font-bold text-white">{gameStats.score.toLocaleString()}</div>
              </div>
              <div className="glass-panel p-2.5">
                <div className="text-[10px] text-slate-400">WAVE</div>
                <div className="text-base font-bold text-orange-400">{gameStats.wave}</div>
              </div>
              <div className="glass-panel p-2.5">
                <div className="text-[10px] text-slate-400">TIME</div>
                <div className="text-base font-bold text-cyan-400">{gameStats.time}s</div>
              </div>
            </div>

            {/* Action Buttons: Yes to Retry vs Leave */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={() => startGame(selectedCompanion, selectedOperator)}
                onMouseEnter={() => setIsHoveringAbandon(false)}
                className="flex-1 py-3.5 rounded-xl font-mono font-black text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 shadow-[0_0_25px_rgba(52,211,153,0.4)] hover:scale-103 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Heart className="w-4 h-4 fill-slate-950 text-slate-950" />
                <span>STAND BACK UP // RETRY</span>
              </button>

              <button
                onClick={() => setGameState("menu")}
                onMouseEnter={() => setIsHoveringAbandon(true)}
                onMouseLeave={() => setIsHoveringAbandon(false)}
                className="px-5 py-3.5 rounded-xl font-mono text-xs text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 border border-white/10 hover:border-rose-500/40 transition-all cursor-pointer"
              >
                Abandon Run
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
