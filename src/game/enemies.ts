import type { Enemy, EnemyType, PlayerState, SanctuaryBase } from "./types";

export class EnemySpawner {
  wave: number = 1;
  waveTimer: number = 0;
  spawnTimer: number = 0;
  spawnInterval: number = 1.6; // Seconds between spawns

  update(delta: number, player: PlayerState, _base: SanctuaryBase, _enemies?: Enemy[]): Enemy[] {
    this.waveTimer += delta;
    this.spawnTimer += delta;

    // Advance wave every 45 seconds
    if (this.waveTimer > 45) {
      this.wave++;
      this.waveTimer = 0;
      this.spawnInterval = Math.max(0.4, 1.6 - this.wave * 0.12);
    }

    const spawned: Enemy[] = [];

    // Spawn regular swarm
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      const count = Math.min(3 + this.wave, 12);
      for (let i = 0; i < count; i++) {
        spawned.push(this.createEnemy(player));
      }
    }

    return spawned;
  }

  private createEnemy(player: PlayerState): Enemy {
    // Spawn around player at 700-900 distance
    const angle = Math.random() * Math.PI * 2;
    const distance = 720 + Math.random() * 200;
    const x = player.x + Math.cos(angle) * distance;
    const y = player.y + Math.sin(angle) * distance;

    // Pick enemy type based on wave
    const roll = Math.random();
    let type: EnemyType = "glitch";

    if (this.wave >= 4 && roll < 0.18) {
      type = "phantom";
    } else if (this.wave >= 3 && roll < 0.35) {
      type = "brute";
    } else if (this.wave >= 2 && roll < 0.65) {
      type = "crawler";
    }

    // 40% of enemies target the Sanctuary base, 60% hunt the player
    const targetMode: "player" | "base" = Math.random() < 0.4 ? "base" : "player";

    switch (type) {
      case "crawler":
        return {
          id: Math.random().toString(36).substring(2, 9),
          type: "crawler",
          x,
          y,
          vx: 0,
          vy: 0,
          radius: 16,
          health: 45 + this.wave * 12,
          maxHealth: 45 + this.wave * 12,
          speed: 2.8 + Math.random() * 0.5,
          damage: 14,
          color: "#f43f5e",
          xpValue: 15,
          targetMode,
        };

      case "brute":
        return {
          id: Math.random().toString(36).substring(2, 9),
          type: "brute",
          x,
          y,
          vx: 0,
          vy: 0,
          radius: 26,
          health: 140 + this.wave * 35,
          maxHealth: 140 + this.wave * 35,
          speed: 1.5,
          damage: 28,
          color: "#ea580c",
          xpValue: 45,
          targetMode,
          shootCooldown: 3.0,
        };

      case "phantom":
        return {
          id: Math.random().toString(36).substring(2, 9),
          type: "phantom",
          x,
          y,
          vx: 0,
          vy: 0,
          radius: 18,
          health: 70 + this.wave * 18,
          maxHealth: 70 + this.wave * 18,
          speed: 4.2,
          damage: 20,
          color: "#c084fc",
          xpValue: 30,
          targetMode: "player",
        };

      default:
        // Glitch Mite
        return {
          id: Math.random().toString(36).substring(2, 9),
          type: "glitch",
          x,
          y,
          vx: 0,
          vy: 0,
          radius: 11,
          health: 20 + this.wave * 6,
          maxHealth: 20 + this.wave * 6,
          speed: 3.6 + Math.random() * 0.8,
          damage: 8,
          color: "#ef4444",
          xpValue: 8,
          targetMode,
        };
    }
  }

  // Draw enemy with cyber glitch aesthetics
  drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy, time: number) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);

    if (enemy.type === "crawler") {
      // Hexagonal Daemon Crawler
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const px = Math.cos(a) * enemy.radius;
        const py = Math.sin(a) * enemy.radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = enemy.color;
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();

    } else if (enemy.type === "brute") {
      // Buffer Overflow Brute (Chunky square with pulsating core)
      ctx.beginPath();
      ctx.roundRect(-enemy.radius, -enemy.radius, enemy.radius * 2, enemy.radius * 2, 6);
      ctx.fillStyle = enemy.color;
      ctx.fill();
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, enemy.radius * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#ea580c";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

    } else if (enemy.type === "phantom") {
      // Phasing Phantom (Ghostly triangle)
      ctx.globalAlpha = 0.5 + Math.sin(time * 8) * 0.35;
      ctx.beginPath();
      ctx.moveTo(enemy.radius * 1.2, 0);
      ctx.lineTo(-enemy.radius, -enemy.radius);
      ctx.lineTo(-enemy.radius, enemy.radius);
      ctx.closePath();
      ctx.fillStyle = enemy.color;
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = 1.0;

    } else {
      // Glitch Mite (Small diamond)
      ctx.beginPath();
      ctx.moveTo(0, -enemy.radius);
      ctx.lineTo(enemy.radius, 0);
      ctx.lineTo(0, enemy.radius);
      ctx.lineTo(-enemy.radius, 0);
      ctx.closePath();
      ctx.fillStyle = enemy.color;
      ctx.fill();
    }

    // Health Bar overhead if damaged
    if (enemy.health < enemy.maxHealth) {
      const barW = enemy.radius * 2;
      const barH = 3;
      const pct = Math.max(0, enemy.health / enemy.maxHealth);
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(-barW / 2, -enemy.radius - 8, barW, barH);
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(-barW / 2, -enemy.radius - 8, barW * pct, barH);
    }

    ctx.restore();
  }
}
