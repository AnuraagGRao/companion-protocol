export type CompanionId = "koji" | "mochi" | "kai";
export type OperatorId = "ren" | "aya" | "rowan";

export interface HumanOperator {
  id: OperatorId;
  name: string;
  identity: string;
  title: string;
  emoji: string;
  accentHex: string;
  baseHealthBonus: number;
  baseSpeedBonus: number;
  specialTrait: string;
  traitDesc: string;
  lore: string;
}

export interface CompanionData {
  id: CompanionId;
  name: string;
  species: string;
  emoji: string;
  title: string;
  accentHex: string;
  themeColor: string;
  baseHealth: number;
  baseSpeed: number;
  weaponName: string;
  weaponDesc: string;
  abilityName: string;
  abilityDesc: string;
  abilityCooldown: number; // in seconds
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  health: number;
  maxHealth: number;
  speed: number;
  level: number;
  xp: number;
  nextXp: number;
  facingAngle: number;
  operator: HumanOperator;
  companion: CompanionData;
  companionX: number;
  companionY: number;
  companionAngle: number;
  abilityCooldownTimer: number;
  isInvulnerable: boolean;
  invulnerableTimer: number;
  // Weapon Stats
  damageMultiplier: number;
  fireRateMultiplier: number;
  projectileSpeedMultiplier: number;
  pickupRange: number;
}

export interface SanctuaryBase {
  x: number;
  y: number;
  radius: number;
  health: number;
  maxHealth: number;
  shieldRadius: number;
  isUnderAttack: boolean;
  level: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  pierce: number;
  duration: number;
  color: string;
  isEnemy: boolean;
  type: "beam" | "bomb" | "blade" | "bullet" | "laser" | "flame";
  rotation?: number;
}

export type EnemyType = "glitch" | "crawler" | "brute" | "phantom" | "boss";

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  color: string;
  xpValue: number;
  targetMode: "player" | "base";
  shootCooldown?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
  alpha: number;
}

export interface DamageNumber {
  id: string;
  x: number;
  y: number;
  value: number | string;
  color: string;
  life: number;
  maxLife: number;
  isCrit?: boolean;
}

export interface XpOrb {
  id: string;
  x: number;
  y: number;
  value: number;
  color: string;
}

export interface MapObstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "server_rack" | "bamboo_pillar" | "thermal_rock" | "data_monolith";
  health?: number;
  destructible?: boolean;
}

export interface CaptureNode {
  id: string;
  x: number;
  y: number;
  radius: number;
  type: "overclock" | "heal" | "emp" | "shield";
  charge: number; // 0 to 100
  isCharged: boolean;
  cooldownTimer: number;
}

export interface UpgradeCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "weapon" | "stat" | "base" | "ability";
  rarity: "common" | "rare" | "epic";
}
