import type { UpgradeCard, PlayerState, SanctuaryBase } from "./types";

export const UPGRADE_POOL: UpgradeCard[] = [
  {
    id: "fire_rate",
    title: "Overclock CPU",
    description: "Weapon fire rate increased by +25%.",
    icon: "⚡",
    category: "weapon",
    rarity: "common",
  },
  {
    id: "damage",
    title: "Plasma Infusion",
    description: "All weapon projectile damage increased by +30%.",
    icon: "💥",
    category: "weapon",
    rarity: "common",
  },
  {
    id: "speed",
    title: "Zero-Latency Thrusters",
    description: "Operator movement speed increased by +18%.",
    icon: "👟",
    category: "stat",
    rarity: "common",
  },
  {
    id: "max_health",
    title: "Reinforced Alloy Hull",
    description: "Max Health increased by +40 and immediately heals 40 HP.",
    icon: "🛡️",
    category: "stat",
    rarity: "common",
  },
  {
    id: "pickup_range",
    title: "Electromagnetic Coil",
    description: "XP data fragment magnet radius expanded by +50%.",
    icon: "🧲",
    category: "stat",
    rarity: "common",
  },
  {
    id: "base_repair",
    title: "Sanctuary Nanite Surge",
    description: "Repairs the Sanctuary Base Core for +350 HP and raises max base shields.",
    icon: "🏛️",
    category: "base",
    rarity: "rare",
  },
  {
    id: "pierce",
    title: "Quantum Drill Tips",
    description: "Projectiles pierce through +2 additional enemies.",
    icon: "🎯",
    category: "weapon",
    rarity: "rare",
  },
  {
    id: "ability_cdr",
    title: "Fast-Bus Interrupts",
    description: "Special Companion Ability cooldown reduced by -25%.",
    icon: "⏱️",
    category: "ability",
    rarity: "rare",
  },
  {
    id: "base_turrets",
    title: "Core Defense Grid",
    description: "Sanctuary Base perimeter pylons automatically target and fire at nearby enemies.",
    icon: "📡",
    category: "base",
    rarity: "epic",
  },
];

export function getRandomUpgrades(count: number = 3): UpgradeCard[] {
  const shuffled = [...UPGRADE_POOL].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function applyUpgrade(upgrade: UpgradeCard, player: PlayerState, base: SanctuaryBase) {
  switch (upgrade.id) {
    case "fire_rate":
      player.fireRateMultiplier += 0.25;
      break;
    case "damage":
      player.damageMultiplier += 0.3;
      break;
    case "speed":
      player.speed *= 1.18;
      break;
    case "max_health":
      player.maxHealth += 40;
      player.health = Math.min(player.maxHealth, player.health + 40);
      break;
    case "pickup_range":
      player.pickupRange *= 1.5;
      break;
    case "base_repair":
      base.health = Math.min(base.maxHealth, base.health + 350);
      base.level++;
      break;
    case "pierce":
      player.projectileSpeedMultiplier += 0.2;
      break;
    case "ability_cdr":
      player.companion.abilityCooldown *= 0.75;
      break;
    case "base_turrets":
      base.level++;
      break;
  }
}
