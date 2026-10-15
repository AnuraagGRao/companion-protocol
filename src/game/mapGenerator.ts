import type { SanctuaryBase, MapObstacle, CaptureNode } from "./types";

export const BASE_RADIUS = 340;
export const CHUNK_SIZE = 600;

export interface GeneratedChunk {
  chunkX: number;
  chunkY: number;
  obstacles: MapObstacle[];
  nodes: CaptureNode[];
}

export class ProceduralMap {
  base: SanctuaryBase;
  activeChunks: Map<string, GeneratedChunk> = new Map();

  constructor() {
    this.base = {
      x: 0,
      y: 0,
      radius: BASE_RADIUS,
      health: 1000,
      maxHealth: 1000,
      shieldRadius: BASE_RADIUS + 30,
      isUnderAttack: false,
      level: 1,
    };
  }

  // Deterministic seed noise
  private pseudoRandom(x: number, y: number): number {
    const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return s - Math.floor(s);
  }

  // Check if position is within the sanctuary base safe zone
  isInsideBase(x: number, y: number): boolean {
    const dx = x - this.base.x;
    const dy = y - this.base.y;
    return dx * dx + dy * dy <= this.base.radius * this.base.radius;
  }

  // Generate or retrieve chunk for world coordinates
  getChunk(chunkX: number, chunkY: number): GeneratedChunk {
    const key = `${chunkX},${chunkY}`;
    if (this.activeChunks.has(key)) {
      return this.activeChunks.get(key)!;
    }

    const chunkWorldX = chunkX * CHUNK_SIZE;
    const chunkWorldY = chunkY * CHUNK_SIZE;
    const distFromOrigin = Math.hypot(chunkWorldX, chunkWorldY);

    const obstacles: MapObstacle[] = [];
    const nodes: CaptureNode[] = [];

    // Never place solid obstacles inside the base sanctuary
    if (distFromOrigin > BASE_RADIUS + 80) {
      // Determine sector theme based on angle
      const angle = Math.atan2(chunkWorldY, chunkWorldX);
      const rand = this.pseudoRandom(chunkX, chunkY);

      // Generate 2 to 4 obstacles per chunk
      const numObstacles = Math.floor(rand * 3) + 1;
      for (let i = 0; i < numObstacles; i++) {
        const ox = chunkWorldX + this.pseudoRandom(chunkX + i * 3, chunkY) * (CHUNK_SIZE - 120) + 60;
        const oy = chunkWorldY + this.pseudoRandom(chunkX, chunkY + i * 3) * (CHUNK_SIZE - 120) + 60;

        let type: MapObstacle["type"] = "server_rack";
        let w = 60, h = 60;

        if (angle >= -Math.PI / 3 && angle < Math.PI / 3) {
          // East: Cyber Bamboo Grove
          type = "bamboo_pillar";
          w = 35;
          h = 35;
        } else if (angle >= Math.PI / 3 && angle < Math.PI) {
          // South: Onsen Thermal
          type = "thermal_rock";
          w = 70;
          h = 50;
        } else {
          // West & North: Arcade District
          type = "data_monolith";
          w = 55;
          h = 80;
        }

        obstacles.push({
          x: ox,
          y: oy,
          width: w,
          height: h,
          type,
          health: 100,
          destructible: type === "bamboo_pillar",
        });
      }

      // 25% chance of spawning a Data Node Capture Shrine in this chunk
      if (rand > 0.75) {
        const nodeTypes: CaptureNode["type"][] = ["overclock", "emp", "heal", "shield"];
        const nodeType = nodeTypes[Math.floor(this.pseudoRandom(chunkX * 7, chunkY * 11) * nodeTypes.length)];
        nodes.push({
          id: `node_${chunkX}_${chunkY}`,
          x: chunkWorldX + CHUNK_SIZE / 2,
          y: chunkWorldY + CHUNK_SIZE / 2,
          radius: 55,
          type: nodeType,
          charge: 0,
          isCharged: false,
          cooldownTimer: 0,
        });
      }
    }

    const chunk: GeneratedChunk = { chunkX, chunkY, obstacles, nodes };
    this.activeChunks.set(key, chunk);
    return chunk;
  }

  // Ensure chunks around player camera viewport are loaded
  updateVisibleChunks(centerX: number, centerY: number, viewWidth: number, viewHeight: number) {
    const minChunkX = Math.floor((centerX - viewWidth / 2 - 100) / CHUNK_SIZE);
    const maxChunkX = Math.floor((centerX + viewWidth / 2 + 100) / CHUNK_SIZE);
    const minChunkY = Math.floor((centerY - viewHeight / 2 - 100) / CHUNK_SIZE);
    const maxChunkY = Math.floor((centerY + viewHeight / 2 + 100) / CHUNK_SIZE);

    for (let cx = minChunkX; cx <= maxChunkX; cx++) {
      for (let cy = minChunkY; cy <= maxChunkY; cy++) {
        this.getChunk(cx, cy);
      }
    }
  }

  // Draw procedural world background, base sanctuary, obstacles, and shrines
  draw(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    viewWidth: number,
    viewHeight: number,
    time: number
  ) {
    // 1. Cyber Grid Floor
    const gridSize = 80;
    const startX = Math.floor((cameraX - viewWidth / 2) / gridSize) * gridSize;
    const endX = cameraX + viewWidth / 2;
    const startY = Math.floor((cameraY - viewHeight / 2) / gridSize) * gridSize;
    const endY = cameraY + viewHeight / 2;

    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();

    // 2. Central Sanctuary Base
    this.drawSanctuaryBase(ctx, time);

    // 3. Render Obstacles & Shrines from loaded visible chunks
    this.activeChunks.forEach((chunk) => {
      // Shrines
      chunk.nodes.forEach((node) => {
        this.drawCaptureNode(ctx, node, time);
      });

      // Obstacles
      chunk.obstacles.forEach((obs) => {
        this.drawObstacle(ctx, obs, time);
      });
    });
  }

  private drawSanctuaryBase(ctx: CanvasRenderingContext2D, time: number) {
    const { x, y, radius, health, maxHealth } = this.base;

    ctx.save();
    ctx.translate(x, y);

    // Base Floor Plate (Octagonal dark cyber metal)
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(10, 15, 26, 0.75)";
    ctx.fill();
    ctx.strokeStyle = "rgba(6, 182, 212, 0.4)";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Perimeter Shield Barrier Ring (Pulsing neon)
    const pulse = Math.sin(time * 3) * 0.15 + 0.85;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(6, 182, 212, ${0.4 * pulse})`;
    ctx.lineWidth = 4;
    ctx.shadowColor = "#06b6d4";
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Healing Safe Zone Floor Glyph
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(6, 182, 212, 0.06)";
    ctx.fill();
    ctx.strokeStyle = "rgba(6, 182, 212, 0.25)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 8 Defensive Laser Pylons at Base Perimeter
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;

      ctx.beginPath();
      ctx.arc(px, py, 14, 0, Math.PI * 2);
      ctx.fillStyle = "#0f172a";
      ctx.fill();
      ctx.strokeStyle = "#06b6d4";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#06b6d4";
      ctx.fill();
    }

    // Central Core Conduit Crystal
    const crystalColor = health / maxHealth > 0.4 ? "#06b6d4" : "#ef4444";
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.fillStyle = "#0f172a";
    ctx.fill();
    ctx.strokeStyle = crystalColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 18 + Math.sin(time * 4) * 3, 0, Math.PI * 2);
    ctx.fillStyle = crystalColor;
    ctx.shadowColor = crystalColor;
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Sanctuary Label
    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "center";
    ctx.fillText("SANCTUARY CORE", 0, -45);

    ctx.restore();
  }

  private drawObstacle(ctx: CanvasRenderingContext2D, obs: MapObstacle, time: number) {
    ctx.save();
    ctx.translate(obs.x, obs.y);

    if (obs.type === "bamboo_pillar") {
      // Cyber Bamboo Stalk (cyan glowing tech stalk)
      ctx.beginPath();
      ctx.arc(0, 0, obs.width / 2, 0, Math.PI * 2);
      ctx.fillStyle = "#0f2027";
      ctx.fill();
      ctx.strokeStyle = "#06b6d4";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, obs.width * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = "#22d3ee";
      ctx.fill();

    } else if (obs.type === "thermal_rock") {
      // Thermal Geyser Rock (Amber glowing vent)
      ctx.beginPath();
      ctx.roundRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height, 12);
      ctx.fillStyle = "#1e130a";
      ctx.fill();
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Steam vent ring
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(245, 158, 11, 0.4)";
      ctx.fill();

    } else {
      // Server Monolith (Dark tower with LED rack strips)
      ctx.beginPath();
      ctx.roundRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height, 8);
      ctx.fillStyle = "#090d16";
      ctx.fill();
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Blinking rack status LED bars
      for (let i = -obs.height / 2 + 15; i < obs.height / 2 - 10; i += 18) {
        ctx.fillStyle = Math.sin(time * 5 + i) > 0 ? "#a855f7" : "#06b6d4";
        ctx.fillRect(-obs.width / 2 + 8, i, obs.width - 16, 4);
      }
    }

    ctx.restore();
  }

  private drawCaptureNode(ctx: CanvasRenderingContext2D, node: CaptureNode, _time: number) {
    ctx.save();
    ctx.translate(node.x, node.y);

    let color = "#38bdf8";
    let icon = "⚡";
    if (node.type === "emp") { color = "#a855f7"; icon = "💥"; }
    else if (node.type === "heal") { color = "#10b981"; icon = "💚"; }
    else if (node.type === "shield") { color = "#f59e0b"; icon = "🛡️"; }

    // Outer Capture Zone Ring
    ctx.beginPath();
    ctx.arc(0, 0, node.radius, 0, Math.PI * 2);
    ctx.fillStyle = `${color}15`;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Charging Arc
    if (node.charge > 0) {
      const chargeAngle = (node.charge / 100) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(0, 0, node.radius, -Math.PI / 2, -Math.PI / 2 + chargeAngle);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Center Node Icon
    ctx.font = "20px 'Nunito Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(icon, 0, 0);

    ctx.restore();
  }
}
