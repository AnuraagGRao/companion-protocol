/**
 * Web Audio DSP Synthesizer & BGM Manager
 * Generates arcade SFX in real-time and manages background music.
 */

export interface BgmTrackInfo {
  id: "menu" | "combat" | "boss";
  title: string;
  artist: string;
  bpm: number;
  genre: string;
  src: string;
}

export const SOUNDTRACK: Record<string, BgmTrackInfo> = {
  menu: {
    id: "menu",
    title: "Midnight at the Bamboo Gate",
    artist: "Anuraag Rao",
    bpm: 86,
    genre: "Neo-Tokyo Lofi",
    src: "/audio/menu.mp3"
  },
  combat: {
    id: "combat",
    title: "Turbo Arcade Runner",
    artist: "Anuraag Rao",
    bpm: 130,
    genre: "Synthwave Electro",
    src: "/audio/combat.mp3"
  },
  boss: {
    id: "boss",
    title: "Hardline Extraction",
    artist: "Anuraag Rao",
    bpm: 144,
    genre: "Darksynth Breakbeat",
    src: "/audio/boss.mp3"
  }
};

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private bgmAudio: HTMLAudioElement | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  public isMuted: boolean = false;

  // High-Fidelity BGM Manager
  public currentTrack: BgmTrackInfo | null = null;
  public onTrackChange?: (track: BgmTrackInfo) => void;
  private fadeInterval: number | null = null;

  constructor() {
    this.isMuted = localStorage.getItem("cp_muted") === "true";
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // Laser shoot (Koji railgun / Kai blade)
  playLaser(freq: number = 600) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  // Yuzu bomb / Enemy explosion
  playExplosion(isBig: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(isBig ? 120 : 180, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + (isBig ? 0.35 : 0.2));

    gain.gain.setValueAtTime(isBig ? 0.25 : 0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isBig ? 0.35 : 0.2));

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + (isBig ? 0.36 : 0.22));
  }

  // XP gem pickup chime
  playXpChime() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    const notes = [523, 659, 784, 1046];
    const freq = notes[Math.floor(Math.random() * notes.length)];
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Level Up Fanfare
  playLevelUp() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const chords = [440, 554, 659, 880];
    chords.forEach((freq, idx) => {
      const now = this.ctx!.currentTime + idx * 0.08;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    });
  }

  // Player hurt / hit
  playHurt() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(60, now + 0.1);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Ambient procedural synth drone (plays if no custom BGM MP3 is found)
  startAmbientDrone() {
    if (this.isMuted || this.ambientOsc) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      this.ambientOsc = this.ctx.createOscillator();
      this.ambientGain = this.ctx.createGain();

      this.ambientOsc.type = "sine";
      this.ambientOsc.frequency.setValueAtTime(75, this.ctx.currentTime);
      this.ambientGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      this.ambientOsc.connect(this.ambientGain);
      this.ambientGain.connect(this.ctx.destination);
      this.ambientOsc.start();
    } catch {
      // Audio safety
    }
  }

  stopAmbientDrone() {
    if (this.ambientOsc) {
      try {
        this.ambientOsc.stop();
        this.ambientOsc.disconnect();
      } catch {}
      this.ambientOsc = null;
    }
  }

  // ── High-Fidelity BGM Manager ───────────────────────────────────────────
  playTrack(key: "menu" | "combat" | "boss") {
    const track = SOUNDTRACK[key];
    if (!track) return;
    if (this.currentTrack?.id === key && this.bgmAudio && !this.bgmAudio.paused) {
      return; // Already playing
    }

    this.currentTrack = track;
    if (this.onTrackChange) {
      this.onTrackChange(track);
    }

    if (this.isMuted) return;
    this.stopAmbientDrone();

    if (!this.bgmAudio) {
      this.bgmAudio = new Audio();
      this.bgmAudio.loop = true;
      this.bgmAudio.volume = 0.45;
    }

    // Smooth quick volume crossfade
    if (this.fadeInterval) clearInterval(this.fadeInterval);
    const audio = this.bgmAudio;

    if (!audio.paused && audio.volume > 0.05) {
      let vol = audio.volume;
      this.fadeInterval = window.setInterval(() => {
        vol = Math.max(0, vol - 0.1);
        audio.volume = vol;
        if (vol <= 0.02) {
          if (this.fadeInterval) clearInterval(this.fadeInterval);
          this.fadeInterval = null;
          this.loadAndStartTrack(track.src);
        }
      }, 35);
    } else {
      this.loadAndStartTrack(track.src);
    }
  }

  private loadAndStartTrack(src: string) {
    if (!this.bgmAudio) return;
    this.bgmAudio.src = src;
    this.bgmAudio.volume = 0.45;
    this.bgmAudio.play().catch(() => {
      // Fallback to procedural synth drone if audio file fails or browser blocks autoplay
      this.startAmbientDrone();
    });
  }

  playMenuTheme() {
    this.playTrack("menu");
  }

  playCombatTheme() {
    this.playTrack("combat");
  }

  playBossTheme() {
    this.playTrack("boss");
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem("cp_muted", this.isMuted.toString());
    if (this.isMuted) {
      this.stopAmbientDrone();
      if (this.bgmAudio) this.bgmAudio.pause();
    } else {
      if (this.currentTrack) {
        this.playTrack(this.currentTrack.id);
      } else {
        this.playMenuTheme();
      }
    }
    return this.isMuted;
  }
}

export const sounds = new SoundEngine();
