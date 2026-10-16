import { useState, useEffect, useRef } from "react";
import { GameEngine } from "./game/engine";
import type { CompanionId, UpgradeCard, PlayerState } from "./game/types";
import { COMPANIONS } from "./game/companions";
import { sounds, type BgmTrackInfo } from "./game/sound";
import { 
  Shield, Zap, Volume2, VolumeX, Play, RotateCw, 
  Sparkles, Trophy, Flame, ChevronRight
} from "lucide-react";

export default function App() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [selectedCompanion, setSelectedCompanion] = useState<CompanionId>("koji");
  const [pendingUpgrades, setPendingUpgrades] = useState<UpgradeCard[] | null>(null);
  const [isMuted, setIsMuted] = useState(sounds.isMuted);
  const [currentBgm, setCurrentBgm] = useState<BgmTrackInfo | null>(sounds.currentTrack);

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
  const engineRef = useRef<GameEngine | null>(null);

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

  const startGame = (comp: CompanionId) => {
    setGameState("playing");
    setPendingUpgrades(null);

    setTimeout(() => {
      if (!canvasRef.current) return;
      const engine = new GameEngine(canvasRef.current, comp);

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

  const currentCompData = COMPANIONS[selectedCompanion];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* ── Game Canvas ──────────────────────────────────────────────────────── */}
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${gameState === "playing" ? "block" : "hidden"}`}
      />

      {/* ── Persistent Soundtrack Indicator & Menu Mute ──────────────────────── */}
      <div className="absolute top-4 right-4 z-40 flex items-center gap-2 pointer-events-auto">
        {currentBgm && !isMuted && (
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
          <button
            onClick={toggleSound}
            className="glass-panel p-2.5 text-slate-300 hover:text-white transition-all rounded-xl cursor-pointer"
            title={isMuted ? "Unmute Audio" : "Mute Audio"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        )}
      </div>

      {/* ── Main Menu / Character Select Screen ─────────────────────────────── */}
      {gameState === "menu" && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-6 sm:p-12 overflow-y-auto">
          {/* Header Title */}
          <div className="flex flex-col items-center text-center space-y-3 mt-4">
            <div className="glass-pill px-4 py-1.5 flex items-center gap-2 text-xs font-mono text-cyan-400">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>EDGE PROTOCOL // SURVIVOR ROGUELITE</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white">
              COMPANION <span className="text-cyan-400">PROTOCOL</span>
            </h1>
            <p className="text-xs sm:text-sm font-mono text-slate-400 max-w-lg">
              Defend the Sanctuary Base Core against swarming glitch daemons. Explore infinite procedural sectors, capture shrines, and survive.
            </p>
          </div>

          {/* Companion Selection Roster */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full my-6">
            {(Object.values(COMPANIONS)).map((c) => {
              const isSelected = c.id === selectedCompanion;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCompanion(c.id)}
                  className={`glass-panel p-6 flex flex-col items-center text-center cursor-pointer transition-all duration-300 relative ${
                    isSelected
                      ? "ring-2 scale-105 shadow-2xl"
                      : "opacity-70 hover:opacity-100 hover:scale-100"
                  }`}
                  style={{
                    borderColor: isSelected ? c.accentHex : "rgba(255,255,255,0.12)",
                    boxShadow: isSelected ? `0 20px 50px -10px ${c.accentHex}40` : "none",
                  }}
                >
                  <div className="text-5xl mb-3">{c.emoji}</div>
                  <h3 className="text-xl font-extrabold text-white">{c.name}</h3>
                  <p className="text-xs font-mono text-slate-400 mb-4">{c.species} · {c.title}</p>

                  <div className="w-full space-y-2 text-left text-xs font-mono border-t border-white/10 pt-3">
                    <div className="flex justify-between text-slate-300">
                      <span>Weapon:</span>
                      <span className="font-bold text-white">{c.weaponName}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Special:</span>
                      <span className="font-bold text-white">{c.abilityName}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Base HP:</span>
                      <span className="font-bold text-emerald-400">{c.baseHealth}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Controls & Launch Bar */}
          <div className="flex flex-col items-center space-y-4 mb-4">
            <div className="flex items-center gap-6 text-xs font-mono text-slate-400">
              <span>⌨️ WASD / Arrows to Move</span>
              <span>⚡ Spacebar for Special Ability</span>
              <span>🎯 Auto-Targeting Laser Weapons</span>
            </div>

            <button
              onClick={() => startGame(selectedCompanion)}
              className="px-8 py-4 rounded-2xl font-mono font-bold text-sm text-slate-950 uppercase tracking-wider flex items-center gap-3 shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                backgroundColor: currentCompData.accentHex,
                boxShadow: `0 15px 40px -10px ${currentCompData.accentHex}`,
              }}
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Deploy {currentCompData.name} ({currentCompData.species})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── In-Game Glassmorphic HUD ────────────────────────────────────────── */}
      {gameState === "playing" && (
        <div className="absolute inset-0 z-20 pointer-events-none p-4 sm:p-6 flex flex-col justify-between">
          {/* Top Status Bar */}
          <div className="flex items-start justify-between w-full">
            {/* Operator HP & Level */}
            <div className="glass-panel p-3.5 space-y-2 pointer-events-auto min-w-[220px]">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span>{currentCompData.emoji}</span>
                  <span>{currentCompData.name}</span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-bold">
                  LVL {level}
                </span>
              </div>

              {/* Player HP Bar */}
              <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-200"
                  style={{ width: `${Math.max(0, (playerHp / playerMaxHp) * 100)}%` }}
                />
              </div>

              {/* XP Progress Bar */}
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-150"
                  style={{ width: `${Math.min(100, (playerXp / nextXp) * 100)}%` }}
                />
              </div>
            </div>

            {/* Sanctuary Base Core Health */}
            <div className="glass-panel p-3.5 flex flex-col items-center pointer-events-auto min-w-[200px]">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold">
                <Shield className="w-4 h-4" />
                <span>SANCTUARY BASE CORE</span>
              </div>
              <div className="w-full mt-2 bg-slate-900 rounded-full h-3 overflow-hidden border border-white/15">
                <div
                  className={`h-full transition-all duration-200 ${
                    baseHp / 1000 > 0.4 ? "bg-cyan-500" : "bg-red-500 animate-pulse"
                  }`}
                  style={{ width: `${Math.max(0, (baseHp / 1000) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-slate-400 mt-1">
                {Math.round(baseHp)} / 1000 HP
              </span>
            </div>

            {/* Wave & Score Pills */}
            <div className="flex items-center gap-3 pointer-events-auto">
              <div className="glass-panel px-4 py-2 flex items-center gap-2 text-xs font-mono text-white font-bold">
                <Flame className="w-4 h-4 text-orange-400" />
                <span>WAVE {wave}</span>
              </div>

              <div className="glass-panel px-4 py-2 flex items-center gap-2 text-xs font-mono text-white font-bold">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>{score.toLocaleString()}</span>
              </div>

              <button
                onClick={toggleSound}
                className="glass-panel p-2.5 text-slate-300 hover:text-white transition-all"
                title="Mute / Unmute"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Bottom Controls / Special Ability Trigger */}
          <div className="flex items-end justify-between w-full">
            <div className="hidden sm:block text-[11px] font-mono text-slate-400 glass-pill px-3 py-1">
              💡 Stand in Sanctuary Base to regenerate HP
            </div>

            {/* Ability Button */}
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

      {/* ── Game Over Screen ─────────────────────────────────────────────────── */}
      {gameState === "gameover" && (
        <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-lg flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="glass-panel p-8 sm:p-12 max-w-lg w-full flex flex-col items-center space-y-6">
            <div className="text-5xl">💀</div>
            <div className="space-y-1">
              <h2 className="text-3xl sm:text-4xl font-black text-rose-500 uppercase tracking-tight">
                SIGNAL TERMINATED
              </h2>
              <p className="text-xs font-mono text-slate-400">
                The Sanctuary Core or Operator has fallen to the glitch swarm.
              </p>
            </div>

            <div className="w-full grid grid-cols-3 gap-3 font-mono text-center">
              <div className="glass-panel p-3">
                <div className="text-[10px] text-slate-400">SCORE</div>
                <div className="text-base font-bold text-white">{gameStats.score.toLocaleString()}</div>
              </div>
              <div className="glass-panel p-3">
                <div className="text-[10px] text-slate-400">WAVES</div>
                <div className="text-base font-bold text-orange-400">{gameStats.wave}</div>
              </div>
              <div className="glass-panel p-3">
                <div className="text-[10px] text-slate-400">TIME</div>
                <div className="text-base font-bold text-cyan-400">{gameStats.time}s</div>
              </div>
            </div>

            <button
              onClick={() => setGameState("menu")}
              className="w-full py-4 rounded-xl font-mono font-bold text-sm text-slate-950 bg-cyan-400 hover:bg-cyan-300 uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl hover:scale-105 transition-all"
            >
              <RotateCw className="w-4 h-4" />
              <span>Return to Sanctuary Deck</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
