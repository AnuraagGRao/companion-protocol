import type { CompanionData, CompanionId, OperatorId, HumanOperator, PlayerState } from "./types";

export const HUMAN_OPERATORS: Record<OperatorId, HumanOperator> = {
  ren: {
    id: "ren",
    name: "Ren",
    identity: "Male (He/Him)",
    title: "Cyber-Grid Specialist",
    emoji: "🧑🏻‍💻",
    accentHex: "#38bdf8",
    baseHealthBonus: 0,
    baseSpeedBonus: 0.8,
    specialTrait: "Kinetic Overdrive",
    traitDesc: "+18% Sprint Velocity and +20% Critical Pierce Chance",
    lore: "A street-smart cyber runner who calibrated his cyber-implants for sheer velocity through glitch-infested neon alleyways.",
  },
  aya: {
    id: "aya",
    name: "Aya",
    identity: "Female (She/Her)",
    title: "Bio-Entropy Researcher",
    emoji: "👩🏽‍🔬",
    accentHex: "#10b981",
    baseHealthBonus: 60,
    baseSpeedBonus: -0.2,
    specialTrait: "Nano-Shield Matrix",
    traitDesc: "+60 Max Health & +25% Health Regeneration inside Sanctuary",
    lore: "A chief field scientist researching anomaly decay, wearing an experimental regenerative nanite coat.",
  },
  rowan: {
    id: "rowan",
    name: "Rowan",
    identity: "Non-Binary (They/Them)",
    title: "Void Phase Hacker",
    emoji: "🧑🏾‍🎤",
    accentHex: "#a855f7",
    baseHealthBonus: 20,
    baseSpeedBonus: 0.3,
    specialTrait: "Flux Capacitor",
    traitDesc: "+35% XP Magnet Radius & -25% Companion Special Cooldown",
    lore: "A renegade anomaly wanderer attuned to harmonic glitch frequencies, bending magnetic flux lines.",
  },
};

export const COMPANIONS: Record<CompanionId, CompanionData> = {
  koji: {
    id: "koji",
    name: "Koji",
    species: "Cyber Panda",
    emoji: "🐼",
    title: "Chief Systems Architect",
    accentHex: "#06b6d4",
    themeColor: "cyan",
    baseHealth: 160,
    baseSpeed: 4.4,
    weaponName: "Bamboo Railgun",
    weaponDesc: "High-penetration linear beam that pierces through up to 4 enemies.",
    abilityName: "Drone Overclock",
    abilityDesc: "Deploys twin autonomous orbital defense drones and triggers an EMP shockwave.",
    abilityCooldown: 12,
  },
  mochi: {
    id: "mochi",
    name: "Mochi",
    species: "Zen Capybara",
    emoji: "🦫",
    title: "High-Availability Sentinel",
    accentHex: "#f59e0b",
    themeColor: "amber",
    baseHealth: 240,
    baseSpeed: 3.5,
    weaponName: "Golden Yuzu Mortar",
    weaponDesc: "Launches explosive bouncing citrus fruits that detonate with radial shrapnel.",
    abilityName: "Zen Onsen Aura",
    abilityDesc: "Unleashes a 360° thermal shockwave, knocking back and slowing all enemies by 60%.",
    abilityCooldown: 10,
  },
  kai: {
    id: "kai",
    name: "Kai",
    species: "Kitsune Fox",
    emoji: "🦊",
    title: "Arcade 60 FPS Champion",
    accentHex: "#a855f7",
    themeColor: "violet",
    baseHealth: 110,
    baseSpeed: 5.6,
    weaponName: "Kitsune Fire Blades",
    weaponDesc: "Fires triple homing plasma blades that seek out the closest targets.",
    abilityName: "Phase Overdrive Dash",
    abilityDesc: "Teleports forward with 120 FPS speed, leaving a lingering firewall plasma trail.",
    abilityCooldown: 7,
  },
};

/**
 * Draw the Human Operator on canvas
 */
export function drawHumanOperator(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  time: number
) {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.facingAngle);

  // Invulnerability flicker
  if (player.isInvulnerable && Math.floor(time * 20) % 2 === 0) {
    ctx.globalAlpha = 0.4;
  }

  const op = player.operator;
  const isMoving = Math.hypot(player.vx, player.vy) > 0.1;
  const walkStride = isMoving ? Math.sin(time * 14) * 5 : 0;

  // Running Legs
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(-player.radius * 0.8, -player.radius * 0.5 + walkStride, 8, 12);
  ctx.fillRect(-player.radius * 0.8, player.radius * 0.5 - walkStride, 8, 12);

  // Torso / Tactical Jacket
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.fillStyle = "#1e293b";
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = op.accentHex;
  ctx.stroke();

  if (op.id === "ren") {
    // ── REN (Male Cyber Runner) ──────────────────────────────────────────
    // Bomber jacket chest plate
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(-4, -player.radius * 0.5, 8, player.radius);

    // Head & Hair
    ctx.beginPath();
    ctx.arc(player.radius * 0.2, 0, player.radius * 0.65, 0, Math.PI * 2);
    ctx.fillStyle = "#0f172a";
    ctx.fill();

    // Cyber visor / Goggles
    ctx.fillStyle = "#38bdf8";
    ctx.shadowColor = "#38bdf8";
    ctx.shadowBlur = 8;
    ctx.fillRect(player.radius * 0.4, -player.radius * 0.35, 4, player.radius * 0.7);
    ctx.shadowBlur = 0;

  } else if (op.id === "aya") {
    // ── AYA (Female Bio-Engineer) ─────────────────────────────────────────
    // Trenchcoat collar & sash
    ctx.fillStyle = "#10b981";
    ctx.fillRect(-6, -player.radius * 0.6, 6, player.radius * 1.2);

    // Head & Sleek Hair
    ctx.beginPath();
    ctx.arc(player.radius * 0.1, 0, player.radius * 0.65, 0, Math.PI * 2);
    ctx.fillStyle = "#09090b";
    ctx.fill();

    // Ponytail trailing behind
    ctx.beginPath();
    ctx.arc(-player.radius * 0.7, 0, player.radius * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = "#10b981";
    ctx.fill();

    // Holographic bio-scan visor
    ctx.fillStyle = "#34d399";
    ctx.shadowColor = "#10b981";
    ctx.shadowBlur = 8;
    ctx.fillRect(player.radius * 0.35, -player.radius * 0.3, 5, player.radius * 0.6);
    ctx.shadowBlur = 0;

  } else {
    // ── ROWAN (Non-Binary Void Nomad) ────────────────────────────────────
    // Void Shroud Cloak
    ctx.beginPath();
    ctx.moveTo(-player.radius * 0.9, -player.radius * 0.7);
    ctx.lineTo(player.radius * 0.6, 0);
    ctx.lineTo(-player.radius * 0.9, player.radius * 0.7);
    ctx.closePath();
    ctx.fillStyle = "#581c87";
    ctx.fill();

    // Head & Hood
    ctx.beginPath();
    ctx.arc(player.radius * 0.1, 0, player.radius * 0.65, 0, Math.PI * 2);
    ctx.fillStyle = "#3b0764";
    ctx.fill();

    // Glowing runic face visor
    ctx.fillStyle = "#c084fc";
    ctx.shadowColor = "#a855f7";
    ctx.shadowBlur = 10;
    ctx.fillRect(player.radius * 0.4, -player.radius * 0.25, 4, player.radius * 0.5);
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

/**
 * Draw the Immortal Guardian Companion hovering alongside the Human Operator
 */
export function drawGuardianCompanion(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  time: number
) {
  // 1. Draw glowing neural tether from Human to Companion
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(player.companionX, player.companionY);
  ctx.strokeStyle = `${player.companion.accentHex}40`;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // 2. Draw Companion body at hovering companion coordinates
  ctx.save();
  ctx.translate(player.companionX, player.companionY);
  ctx.rotate(player.facingAngle);

  const compRadius = 14;
  const id = player.companion.id;

  // Floating bobbing effect
  const hoverOffset = Math.sin(time * 5) * 3;
  ctx.translate(0, hoverOffset);

  // Immortal Energy Shield Aura
  ctx.beginPath();
  ctx.arc(0, 0, compRadius + 4, 0, Math.PI * 2);
  ctx.fillStyle = `${player.companion.accentHex}30`;
  ctx.fill();
  ctx.strokeStyle = player.companion.accentHex;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  if (id === "koji") {
    // 🐼 Mini Guardian Koji
    ctx.beginPath();
    ctx.arc(0, 0, compRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#111827";
    ctx.fill();

    // Ears
    ctx.beginPath();
    ctx.arc(-compRadius * 0.7, -compRadius * 0.7, compRadius * 0.35, 0, Math.PI * 2);
    ctx.arc(-compRadius * 0.7, compRadius * 0.7, compRadius * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = "#000";
    ctx.fill();

    // Visor
    ctx.fillStyle = "#06b6d4";
    ctx.shadowColor = "#06b6d4";
    ctx.shadowBlur = 8;
    ctx.fillRect(compRadius * 0.2, -compRadius * 0.3, compRadius * 0.4, compRadius * 0.6);
    ctx.shadowBlur = 0;

  } else if (id === "mochi") {
    // 🦫 Mini Guardian Mochi
    ctx.beginPath();
    ctx.ellipse(0, 0, compRadius * 1.1, compRadius * 0.85, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#855027";
    ctx.fill();

    // Yuzu on head
    ctx.beginPath();
    ctx.arc(0, -compRadius * 0.6, compRadius * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = "#f59e0b";
    ctx.shadowColor = "#f59e0b";
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;

  } else {
    // 🦊 Mini Guardian Kai
    ctx.beginPath();
    ctx.arc(0, 0, compRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#ea580c";
    ctx.fill();

    // Tail
    ctx.beginPath();
    ctx.ellipse(-compRadius * 1.1, 0, compRadius * 0.6, compRadius * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#ea580c";
    ctx.fill();

    // Streamer Headset
    ctx.strokeStyle = "#a855f7";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, compRadius * 1.2, -Math.PI * 0.4, Math.PI * 0.4, true);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw the heartbreaking sad/crying companion on the Game Over / Retry screen
 */
export function drawSadCompanion(
  ctx: CanvasRenderingContext2D,
  companionId: CompanionId,
  cx: number,
  cy: number,
  isHoveringAbandon: boolean,
  time: number
) {
  ctx.save();
  ctx.translate(cx, cy);

  const tearStream = (Math.sin(time * 8) + 1) * 6;
  const tremble = isHoveringAbandon ? (Math.random() - 0.5) * 3 : 0;
  ctx.translate(tremble, tremble);

  if (companionId === "koji") {
    // 🐼 SAD KOJI: Sitting down, drooping ears, wiping glowing cyan digital tears
    // Panda body sitting
    ctx.beginPath();
    ctx.arc(0, 20, 36, 0, Math.PI * 2);
    ctx.fillStyle = "#111827";
    ctx.fill();
    ctx.strokeStyle = "#06b6d4";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Head
    ctx.beginPath();
    ctx.arc(0, -18, 30, 0, Math.PI * 2);
    ctx.fillStyle = "#f8fafc";
    ctx.fill();

    // Drooping Sad Ears
    ctx.beginPath();
    ctx.arc(-26, -34, 12, 0, Math.PI * 2);
    ctx.arc(26, -34, 12, 0, Math.PI * 2);
    ctx.fillStyle = "#030712";
    ctx.fill();

    // Sad Crying Eyes (Watery Cyan)
    ctx.beginPath();
    ctx.arc(-10, -18, 6, 0, Math.PI * 2);
    ctx.arc(10, -18, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#030712";
    ctx.fill();

    // Digital Cyan Tears streaming down
    ctx.fillStyle = "#06b6d4";
    ctx.shadowColor = "#06b6d4";
    ctx.shadowBlur = 8;
    ctx.fillRect(-12, -12, 4, 16 + tearStream);
    ctx.fillRect(8, -12, 4, 16 + tearStream);
    ctx.shadowBlur = 0;

    // Quivering Sad Mouth
    ctx.beginPath();
    ctx.arc(0, -3, 8, Math.PI * 1.1, Math.PI * 1.9, false);
    ctx.strokeStyle = "#030712";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Broken bamboo stalk on the floor
    ctx.fillStyle = "#10b981";
    ctx.fillRect(-35, 48, 20, 5);
    ctx.fillRect(-10, 50, 25, 5);

  } else if (companionId === "mochi") {
    // 🦫 SAD MOCHI: Hugging yuzu, watery eyes, tiny raincloud
    // Capybara body curled up
    ctx.beginPath();
    ctx.ellipse(0, 15, 44, 34, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#78350f";
    ctx.fill();
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Snout
    ctx.beginPath();
    ctx.roundRect(-16, -10, 32, 28, 8);
    ctx.fillStyle = "#451a03";
    ctx.fill();

    // Sad Watery Eyes
    ctx.beginPath();
    ctx.arc(-16, -16, 5, 0, Math.PI * 2);
    ctx.arc(16, -16, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#38bdf8";
    ctx.shadowColor = "#38bdf8";
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Tears dripping down snout
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(-17, -10, 3, 18 + tearStream);
    ctx.fillRect(14, -10, 3, 18 + tearStream);

    // Dropped Yuzu with tear puddle
    ctx.beginPath();
    ctx.arc(0, 38, 14, 0, Math.PI * 2);
    ctx.fillStyle = "#f59e0b";
    ctx.fill();

  } else {
    // 🦊 SAD KAI: Drooping fox ears, curled tail, broken heart </3 visor
    // Fox body curled up
    ctx.beginPath();
    ctx.arc(0, 15, 34, 0, Math.PI * 2);
    ctx.fillStyle = "#c2410c";
    ctx.fill();
    ctx.strokeStyle = "#a855f7";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Drooping Fox Ears
    ctx.beginPath();
    ctx.moveTo(-25, -15);
    ctx.lineTo(-42, -5);
    ctx.lineTo(-20, 5);
    ctx.closePath();
    ctx.fillStyle = "#7c2d12";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(25, -15);
    ctx.lineTo(42, -5);
    ctx.lineTo(20, 5);
    ctx.closePath();
    ctx.fillStyle = "#7c2d12";
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(0, -14, 26, 0, Math.PI * 2);
    ctx.fillStyle = "#ea580c";
    ctx.fill();

    // Broken Heart </3 on Streamer Visor
    ctx.fillStyle = "#e11d48";
    ctx.shadowColor = "#f43f5e";
    ctx.shadowBlur = 8;
    ctx.font = "bold 13px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("</3", 0, -10);
    ctx.shadowBlur = 0;

    // Tears falling from headset
    ctx.fillStyle = "#a855f7";
    ctx.fillRect(-14, -6, 3, 16 + tearStream);
    ctx.fillRect(11, -6, 3, 16 + tearStream);
  }

  ctx.restore();
}
