# Audio Assets Directory

Drop your generated background music tracks here:
- `menu.mp3` - Main Menu & Sanctuary Base Theme (Cyberpunk lofi / techwear ambient)
- `combat.mp3` - The Neon Wilds Theme (130-140 BPM driving synthwave)
- `boss.mp3` - Overdrive Chaos Theme (High swarm / buffer overflow darksynth)

The SoundEngine in `src/game/sound.ts` will automatically load and loop these tracks seamlessly, and falls back to real-time Web Audio procedural synth drones if files are missing.
