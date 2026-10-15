import type { CompanionData, CompanionId, PlayerState } from "./types";

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
 * Draw character on canvas with procedural vector graphics
 */
export function drawCompanion(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  time: number
) {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.facingAngle);

  const id = player.companion.id;

  // Invulnerability flicker
  if (player.isInvulnerable && Math.floor(time * 20) % 2 === 0) {
    ctx.globalAlpha = 0.4;
  }

  if (id === "koji") {
    // ── KOJI (Cyber Panda) ──────────────────────────────────────────────────
    // Shadow / Pedestal Aura
    ctx.beginPath();
    ctx.arc(0, 0, player.radius + 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(6, 182, 212, 0.25)";
    ctx.fill();

    // Body (Techwear Hoodie)
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#111827";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#06b6d4";
    ctx.stroke();

    // Panda Ears
    ctx.beginPath();
    ctx.arc(-player.radius * 0.75, -player.radius * 0.75, player.radius * 0.4, 0, Math.PI * 2);
    ctx.arc(-player.radius * 0.75, player.radius * 0.75, player.radius * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = "#030712";
    ctx.fill();

    // White Panda Face
    ctx.beginPath();
    ctx.arc(player.radius * 0.2, 0, player.radius * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = "#f8fafc";
    ctx.fill();

    // Cyber Visor (Cyan glowing bar)
    ctx.beginPath();
    ctx.roundRect(player.radius * 0.3, -player.radius * 0.45, player.radius * 0.35, player.radius * 0.9, 4);
    ctx.fillStyle = "#06b6d4";
    ctx.shadowColor = "#06b6d4";
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Railgun Barrel
    ctx.beginPath();
    ctx.rect(player.radius * 0.6, -player.radius * 0.15, player.radius * 0.8, player.radius * 0.3);
    ctx.fillStyle = "#1e293b";
    ctx.fill();
    ctx.strokeStyle = "#06b6d4";
    ctx.stroke();

  } else if (id === "mochi") {
    // ── MOCHI (Zen Capybara) ────────────────────────────────────────────────
    // Earthy Aura
    ctx.beginPath();
    ctx.arc(0, 0, player.radius + 5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(245, 158, 11, 0.25)";
    ctx.fill();

    // Chunky Capybara Loaf Body
    ctx.beginPath();
    ctx.ellipse(0, 0, player.radius * 1.15, player.radius * 0.9, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#855027";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#f59e0b";
    ctx.stroke();

    // Snout
    ctx.beginPath();
    ctx.roundRect(player.radius * 0.4, -player.radius * 0.4, player.radius * 0.65, player.radius * 0.8, 6);
    ctx.fillStyle = "#5c3311";
    ctx.fill();

    // Golden Balancing Yuzu on Head
    ctx.beginPath();
    ctx.arc(0, 0, player.radius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = "#f59e0b";
    ctx.shadowColor = "#f59e0b";
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Yuzu Leaf Stem
    ctx.beginPath();
    ctx.ellipse(-player.radius * 0.2, 0, player.radius * 0.2, player.radius * 0.1, -0.4, 0, Math.PI * 2);
    ctx.fillStyle = "#10b981";
    ctx.fill();

  } else {
    // ── KAI (Kitsune Fox) ───────────────────────────────────────────────────
    // Neon Violet Aura
    ctx.beginPath();
    ctx.arc(0, 0, player.radius + 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(168, 85, 247, 0.25)";
    ctx.fill();

    // Fox Body
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#df5018";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#a855f7";
    ctx.stroke();

    // Fluffy Bushy Tail swaying behind
    const tailWag = Math.sin(time * 8) * 0.35;
    ctx.beginPath();
    ctx.ellipse(-player.radius * 1.1, 0, player.radius * 0.7, player.radius * 0.35, tailWag, 0, Math.PI * 2);
    ctx.fillStyle = "#ea580c";
    ctx.fill();

    // White Tail Tip
    ctx.beginPath();
    ctx.arc(-player.radius * 1.6, Math.sin(time * 8) * 4, player.radius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = "#fff7ed";
    ctx.fill();

    // Pointed Kitsune Ears
    ctx.beginPath();
    ctx.moveTo(-player.radius * 0.2, -player.radius * 0.8);
    ctx.lineTo(player.radius * 0.2, -player.radius * 1.3);
    ctx.lineTo(player.radius * 0.5, -player.radius * 0.7);
    ctx.closePath();
    ctx.fillStyle = "#0f172a";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-player.radius * 0.2, player.radius * 0.8);
    ctx.lineTo(player.radius * 0.2, player.radius * 1.3);
    ctx.lineTo(player.radius * 0.5, player.radius * 0.7);
    ctx.closePath();
    ctx.fillStyle = "#0f172a";
    ctx.fill();

    // RGB Streamer Headset
    ctx.beginPath();
    ctx.arc(0, 0, player.radius * 1.15, -Math.PI * 0.45, Math.PI * 0.45, true);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#a855f7";
    ctx.shadowColor = "#a855f7";
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}
