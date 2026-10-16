import type {
  PlayerState,
  Projectile,
  Enemy,
  Particle,
  DamageNumber,
  XpOrb,
  UpgradeCard,
  CompanionId,
} from "./types";
import { COMPANIONS, drawCompanion } from "./companions";
import { ProceduralMap } from "./mapGenerator";
import { EnemySpawner } from "./enemies";
import { getRandomUpgrades, applyUpgrade } from "./upgrades";
import { sounds } from "./sound";

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  map: ProceduralMap;
  spawner: EnemySpawner;

  player: PlayerState;
  projectiles: Projectile[] = [];
  enemies: Enemy[] = [];
  particles: Particle[] = [];
  damageNumbers: DamageNumber[] = [];
  xpOrbs: XpOrb[] = [];

  // Camera
  cameraX: number = 0;
  cameraY: number = 0;
  screenShake: number = 0;

  // Timers & Combat
  shootTimer: number = 0;
  score: number = 0;
  isRunning: boolean = false;
  isPaused: boolean = false;
  gameTime: number = 0;

  // Input State
  keys: Record<string, boolean> = {};
  mousePos: { x: number; y: number } = { x: 0, y: 0 };
  joystickVector: { x: number; y: number } = { x: 0, y: 0 };

  // Callbacks to React UI
  onLevelUp?: (cards: UpgradeCard[]) => void;
  onGameOver?: (score: number, wave: number, time: number) => void;
  onStatsUpdate?: (player: PlayerState, baseHealth: number, wave: number, score: number) => void;

  private animId: number = 0;
  private lastTimestamp: number = 0;

  constructor(canvas: HTMLCanvasElement, selectedCompanion: CompanionId) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.map = new ProceduralMap();
    this.spawner = new EnemySpawner();

    const comp = COMPANIONS[selectedCompanion];
    this.player = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 20,
      health: comp.baseHealth,
      maxHealth: comp.baseHealth,
      speed: comp.baseSpeed,
      level: 1,
      xp: 0,
      nextXp: 50,
      facingAngle: 0,
      companion: comp,
      abilityCooldownTimer: 0,
      isInvulnerable: false,
      invulnerableTimer: 0,
      damageMultiplier: 1.0,
      fireRateMultiplier: 1.0,
      projectileSpeedMultiplier: 1.0,
      pickupRange: 110,
    };

    this.bindInputs();
    this.resize();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private bindInputs() {
    window.addEventListener("keydown", (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        this.triggerAbility();
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    this.canvas.addEventListener("mousemove", (e) => {
      this.mousePos.x = e.clientX;
      this.mousePos.y = e.clientY;
    });

    window.addEventListener("resize", () => this.resize());
  }

  start() {
    this.isRunning = true;
    this.isPaused = false;
    this.lastTimestamp = performance.now();
    sounds.playCombatTheme();
    this.loop(this.lastTimestamp);
  }

  stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animId);
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
    this.lastTimestamp = performance.now();
    this.loop(this.lastTimestamp);
  }

  selectUpgrade(card: UpgradeCard) {
    applyUpgrade(card, this.player, this.map.base);
    sounds.playLevelUp();
    this.resume();
  }

  triggerAbility() {
    if (this.player.abilityCooldownTimer > 0) return;

    this.player.abilityCooldownTimer = this.player.companion.abilityCooldown;
    const id = this.player.companion.id;

    if (id === "koji") {
      // Koji EMP Shockwave + Drone Overclock
      sounds.playExplosion(true);
      this.screenShake = 14;

      // EMP blast damages and stuns all nearby enemies
      this.enemies.forEach((e) => {
        const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
        if (d < 350) {
          e.health -= 60 * this.player.damageMultiplier;
          e.vx = ((e.x - this.player.x) / d) * 14;
          e.vy = ((e.y - this.player.y) / d) * 14;
          this.addDamageNumber(e.x, e.y, Math.round(60 * this.player.damageMultiplier), "#06b6d4", true);
        }
      });

      // Spawn EMP ring particle
      this.addParticleRing(this.player.x, this.player.y, "#06b6d4", 30);

    } else if (id === "mochi") {
      // Mochi Zen Onsen Thermal Wave
      sounds.playExplosion(false);
      this.screenShake = 8;
      this.player.isInvulnerable = true;
      this.player.invulnerableTimer = 2.5;

      this.enemies.forEach((e) => {
        const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
        if (d < 450) {
          e.speed *= 0.4;
          e.vx = ((e.x - this.player.x) / d) * 18;
          e.vy = ((e.y - this.player.y) / d) * 18;
        }
      });

      this.addParticleRing(this.player.x, this.player.y, "#f59e0b", 45);

    } else if (id === "kai") {
      // Kai Phase Overdrive Dash
      sounds.playLaser(950);
      const dashAngle = this.player.facingAngle;
      this.player.vx = Math.cos(dashAngle) * 22;
      this.player.vy = Math.sin(dashAngle) * 22;
      this.player.isInvulnerable = true;
      this.player.invulnerableTimer = 0.8;

      // Firewall plasma trail behind dash
      for (let i = 0; i < 18; i++) {
        this.particles.push({
          x: this.player.x - Math.cos(dashAngle) * (i * 12),
          y: this.player.y - Math.sin(dashAngle) * (i * 12),
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          radius: Math.random() * 4 + 2,
          color: "#a855f7",
          life: 0.8,
          maxLife: 0.8,
          alpha: 1,
        });
      }
    }
  }

  private loop(timestamp: number) {
    if (!this.isRunning || this.isPaused) return;

    const delta = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1);
    this.lastTimestamp = timestamp;
    this.gameTime += delta;

    this.update(delta);
    this.render();

    this.animId = requestAnimationFrame((ts) => this.loop(ts));
  }

  private update(delta: number) {
    // 1. Player Movement & Input
    let moveX = 0;
    let moveY = 0;

    if (this.keys["w"] || this.keys["arrowup"]) moveY -= 1;
    if (this.keys["s"] || this.keys["arrowdown"]) moveY += 1;
    if (this.keys["a"] || this.keys["arrowleft"]) moveX -= 1;
    if (this.keys["d"] || this.keys["arrowright"]) moveX += 1;

    // Joystick input support
    if (this.joystickVector.x !== 0 || this.joystickVector.y !== 0) {
      moveX = this.joystickVector.x;
      moveY = this.joystickVector.y;
    }

    const moveMag = Math.hypot(moveX, moveY);
    if (moveMag > 0) {
      const speed = this.player.speed * (this.keys["shift"] ? 1.3 : 1.0);
      this.player.vx += (moveX / moveMag) * speed * 0.45;
      this.player.vy += (moveY / moveMag) * speed * 0.45;
    }

    this.player.vx *= 0.86;
    this.player.vy *= 0.86;
    this.player.x += this.player.vx;
    this.player.y += this.player.vy;

    // Player facing angle towards mouse or movement
    const worldMouseX = this.mousePos.x - this.canvas.width / 2 + this.cameraX;
    const worldMouseY = this.mousePos.y - this.canvas.height / 2 + this.cameraY;
    this.player.facingAngle = Math.atan2(worldMouseY - this.player.y, worldMouseX - this.player.x);

    // Invulnerability & Cooldowns
    if (this.player.invulnerableTimer > 0) {
      this.player.invulnerableTimer -= delta;
      if (this.player.invulnerableTimer <= 0) this.player.isInvulnerable = false;
    }

    if (this.player.abilityCooldownTimer > 0) {
      this.player.abilityCooldownTimer = Math.max(0, this.player.abilityCooldownTimer - delta);
    }

    // Sanctuary Base Healing Field
    if (this.map.isInsideBase(this.player.x, this.player.y)) {
      if (this.player.health < this.player.maxHealth) {
        this.player.health = Math.min(this.player.maxHealth, this.player.health + 12 * delta);
      }
    }

    // 2. Weapon Auto-Firing
    this.shootTimer += delta * this.player.fireRateMultiplier;
    const fireInterval = this.player.companion.id === "kai" ? 0.28 : this.player.companion.id === "koji" ? 0.45 : 0.65;

    if (this.shootTimer >= fireInterval) {
      this.shootTimer = 0;
      this.fireWeapon();
    }

    // 3. Spawner & Enemies
    const newEnemies = this.spawner.update(delta, this.player, this.map.base, this.enemies);
    this.enemies.push(...newEnemies);

    // Dynamic wave progression: Wave 5+ initiates Boss / Overdrive Darksynth
    if (this.spawner.wave >= 5 && sounds.currentTrack?.id !== "boss") {
      sounds.playBossTheme();
    }

    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      // Target selection: Player or Sanctuary Base
      let targetX = this.player.x;
      let targetY = this.player.y;

      if (e.targetMode === "base") {
        targetX = this.map.base.x;
        targetY = this.map.base.y;
      }

      const dx = targetX - e.x;
      const dy = targetY - e.y;
      const dist = Math.hypot(dx, dy) || 1;

      e.vx += (dx / dist) * e.speed * 0.25;
      e.vy += (dy / dist) * e.speed * 0.25;
      e.vx *= 0.9;
      e.vy *= 0.9;
      e.x += e.vx;
      e.y += e.vy;

      // Attack Player
      const distToPlayer = Math.hypot(this.player.x - e.x, this.player.y - e.y);
      if (distToPlayer < this.player.radius + e.radius) {
        if (!this.player.isInvulnerable) {
          this.player.health -= e.damage;
          this.player.isInvulnerable = true;
          this.player.invulnerableTimer = 0.5;
          this.screenShake = 6;
          sounds.playHurt();
          this.addDamageNumber(this.player.x, this.player.y, e.damage, "#ef4444");

          if (this.player.health <= 0) {
            this.handleGameOver();
            return;
          }
        }
      }

      // Attack Base Core
      const distToBase = Math.hypot(this.map.base.x - e.x, this.map.base.y - e.y);
      if (distToBase < this.map.base.radius) {
        this.map.base.health -= e.damage * 0.4 * delta;
        this.map.base.isUnderAttack = true;
        if (this.map.base.health <= 0) {
          this.handleGameOver();
          return;
        }
      }

      // Enemy Death
      if (e.health <= 0) {
        this.score += e.xpValue * 10;
        this.xpOrbs.push({
          id: Math.random().toString(),
          x: e.x,
          y: e.y,
          value: e.xpValue,
          color: e.color,
        });
        sounds.playExplosion(false);
        this.addDeathParticles(e.x, e.y, e.color);
        this.enemies.splice(i, 1);
      }
    }

    // 4. Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.duration -= delta;

      // Check collision with enemies
      if (!p.isEnemy) {
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          const dist = Math.hypot(p.x - e.x, p.y - e.y);
          if (dist < p.radius + e.radius) {
            e.health -= p.damage;
            p.pierce--;
            this.addDamageNumber(e.x, e.y, Math.round(p.damage), p.color);
            this.addDeathParticles(p.x, p.y, p.color, 4);

            if (p.type === "bomb") {
              // Yuzu splash damage
              sounds.playExplosion(true);
              this.screenShake = 6;
              this.enemies.forEach((other) => {
                const splashDist = Math.hypot(other.x - p.x, other.y - p.y);
                if (splashDist < 120) {
                  other.health -= p.damage * 0.7;
                  this.addDamageNumber(other.x, other.y, Math.round(p.damage * 0.7), "#f59e0b");
                }
              });
              p.pierce = 0;
            }

            if (p.pierce <= 0) {
              this.projectiles.splice(i, 1);
              break;
            }
          }
        }
      }

      if (p.duration <= 0 && i < this.projectiles.length) {
        this.projectiles.splice(i, 1);
      }
    }

    // 5. XP Gems Magnet & Collection
    for (let i = this.xpOrbs.length - 1; i >= 0; i--) {
      const orb = this.xpOrbs[i];
      const dist = Math.hypot(this.player.x - orb.x, this.player.y - orb.y);

      if (dist < this.player.pickupRange) {
        orb.x += ((this.player.x - orb.x) / dist) * 11;
        orb.y += ((this.player.y - orb.y) / dist) * 11;
      }

      if (dist < this.player.radius + 8) {
        sounds.playXpChime();
        this.player.xp += orb.value;
        this.xpOrbs.splice(i, 1);

        if (this.player.xp >= this.player.nextXp) {
          this.triggerLevelUp();
        }
      }
    }

    // 6. Camera Lerp & Screen Shake
    this.cameraX += (this.player.x - this.cameraX) * 0.1;
    this.cameraY += (this.player.y - this.cameraY) * 0.1;

    if (this.screenShake > 0) {
      this.screenShake *= 0.88;
      if (this.screenShake < 0.2) this.screenShake = 0;
    }

    // 7. Update Particles & Damage Numbers
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life -= delta;
      pt.alpha = Math.max(0, pt.life / pt.maxLife);
      if (pt.life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dn = this.damageNumbers[i];
      dn.y -= 25 * delta;
      dn.life -= delta;
      if (dn.life <= 0) this.damageNumbers.splice(i, 1);
    }

    // 8. Chunks loader around player
    this.map.updateVisibleChunks(this.cameraX, this.cameraY, this.canvas.width, this.canvas.height);

    // Notify UI
    if (this.onStatsUpdate) {
      this.onStatsUpdate(this.player, this.map.base.health, this.spawner.wave, this.score);
    }
  }

  private fireWeapon() {
    // Find closest enemy
    let closestEnemy: Enemy | null = null;
    let minDist = 700;

    for (const e of this.enemies) {
      const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
      if (d < minDist) {
        minDist = d;
        closestEnemy = e;
      }
    }

    let angle = this.player.facingAngle;
    if (closestEnemy) {
      angle = Math.atan2(closestEnemy.y - this.player.y, closestEnemy.x - this.player.x);
    }

    const id = this.player.companion.id;
    sounds.playLaser(id === "kai" ? 750 : id === "mochi" ? 380 : 580);

    if (id === "koji") {
      // Piercing Railgun
      this.projectiles.push({
        id: Math.random().toString(),
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(angle) * 16 * this.player.projectileSpeedMultiplier,
        vy: Math.sin(angle) * 16 * this.player.projectileSpeedMultiplier,
        radius: 6,
        damage: 42 * this.player.damageMultiplier,
        pierce: 4,
        duration: 1.2,
        color: "#06b6d4",
        isEnemy: false,
        type: "beam",
      });

    } else if (id === "mochi") {
      // Bouncing Yuzu Bomb
      this.projectiles.push({
        id: Math.random().toString(),
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(angle) * 10 * this.player.projectileSpeedMultiplier,
        vy: Math.sin(angle) * 10 * this.player.projectileSpeedMultiplier,
        radius: 12,
        damage: 55 * this.player.damageMultiplier,
        pierce: 1,
        duration: 1.4,
        color: "#f59e0b",
        isEnemy: false,
        type: "bomb",
      });

    } else {
      // Kai Triple Homing Blades
      [-0.25, 0, 0.25].forEach((offset) => {
        const bladeAngle = angle + offset;
        this.projectiles.push({
          id: Math.random().toString(),
          x: this.player.x,
          y: this.player.y,
          vx: Math.cos(bladeAngle) * 14 * this.player.projectileSpeedMultiplier,
          vy: Math.sin(bladeAngle) * 14 * this.player.projectileSpeedMultiplier,
          radius: 5,
          damage: 28 * this.player.damageMultiplier,
          pierce: 1,
          duration: 1.3,
          color: "#a855f7",
          isEnemy: false,
          type: "blade",
        });
      });
    }
  }

  private triggerLevelUp() {
    this.player.level++;
    this.player.xp -= this.player.nextXp;
    this.player.nextXp = Math.round(this.player.nextXp * 1.45);
    sounds.playLevelUp();
    this.pause();

    const upgradeChoices = getRandomUpgrades(3);
    if (this.onLevelUp) {
      this.onLevelUp(upgradeChoices);
    }
  }

  private handleGameOver() {
    this.stop();
    sounds.playExplosion(true);
    sounds.playMenuTheme();
    if (this.onGameOver) {
      this.onGameOver(this.score, this.spawner.wave, Math.round(this.gameTime));
    }
  }

  private addDamageNumber(x: number, y: number, value: number, color: string, isCrit: boolean = false) {
    this.damageNumbers.push({
      id: Math.random().toString(),
      x: x + (Math.random() - 0.5) * 20,
      y: y - 10,
      value,
      color,
      life: 0.75,
      maxLife: 0.75,
      isCrit,
    });
  }

  private addDeathParticles(x: number, y: number, color: string, count: number = 10) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = Math.random() * 5 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        radius: Math.random() * 3 + 1.5,
        color,
        life: 0.5,
        maxLife: 0.5,
        alpha: 1,
      });
    }
  }

  private addParticleRing(x: number, y: number, color: string, count: number = 24) {
    for (let i = 0; i < count; i++) {
      const a = (i * Math.PI * 2) / count;
      const spd = 7;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        radius: 4,
        color,
        life: 0.6,
        maxLife: 0.6,
        alpha: 1,
      });
    }
  }

  private render() {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Apply Camera & Screen Shake
    ctx.save();
    const shakeX = (Math.random() - 0.5) * this.screenShake;
    const shakeY = (Math.random() - 0.5) * this.screenShake;
    ctx.translate(w / 2 - this.cameraX + shakeX, h / 2 - this.cameraY + shakeY);

    // 1. Procedural Map & Base
    this.map.draw(ctx, this.cameraX, this.cameraY, w, h, this.gameTime);

    // 2. XP Orbs
    this.xpOrbs.forEach((orb) => {
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = orb.color;
      ctx.shadowColor = orb.color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // 3. Projectiles
    this.projectiles.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // 4. Enemies
    this.enemies.forEach((e) => {
      this.spawner.drawEnemy(ctx, e, this.gameTime);
    });

    // 5. Particles
    this.particles.forEach((pt) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = pt.alpha;
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    // 6. Player Companion
    drawCompanion(ctx, this.player, this.gameTime);

    // 7. Damage Numbers
    this.damageNumbers.forEach((dn) => {
      ctx.font = `bold ${dn.isCrit ? "16px" : "12px"} 'JetBrains Mono', monospace`;
      ctx.fillStyle = dn.color;
      ctx.textAlign = "center";
      ctx.fillText(dn.value.toString(), dn.x, dn.y);
    });

    ctx.restore();

    // 8. Overhead Screen HUD & Minimap
    this.drawMinimap(ctx, w, h);
  }

  private drawMinimap(ctx: CanvasRenderingContext2D, screenW: number, _screenH: number) {
    const size = 130;
    const pad = 18;
    const x = screenW - size - pad;
    const y = pad;
    const radarScale = 0.055;

    ctx.save();
    ctx.translate(x, y);

    // Radar Frame
    ctx.beginPath();
    ctx.rect(0, 0, size, size);
    ctx.fillStyle = "rgba(5, 8, 15, 0.85)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const center = size / 2;

    // Sanctuary Base dot
    const baseMapX = center + (this.map.base.x - this.player.x) * radarScale;
    const baseMapY = center + (this.map.base.y - this.player.y) * radarScale;
    if (baseMapX > 0 && baseMapX < size && baseMapY > 0 && baseMapY < size) {
      ctx.beginPath();
      ctx.arc(baseMapX, baseMapY, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#06b6d4";
      ctx.fill();
    }

    // Enemies dots
    ctx.fillStyle = "#ef4444";
    this.enemies.forEach((e) => {
      const ex = center + (e.x - this.player.x) * radarScale;
      const ey = center + (e.y - this.player.y) * radarScale;
      if (ex > 2 && ex < size - 2 && ey > 2 && ey < size - 2) {
        ctx.fillRect(ex - 1.5, ey - 1.5, 3, 3);
      }
    });

    // Player center dot
    ctx.beginPath();
    ctx.arc(center, center, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    ctx.restore();
  }
}
