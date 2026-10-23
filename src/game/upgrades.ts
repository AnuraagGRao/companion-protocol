import type { UpgradeCard, PlayerState, SanctuaryBase } from "./types";
import { sounds } from "./sound";

export const EVOLUTION_CARDS: Record<string, UpgradeCard> = {
  koji: {
    id: "evolution_koji",
    title: "Hyper-Lattice Ion Beam",
    description: "LEGENDARY EVOLUTION: Bamboo Railgun pierces 8 enemies and arcs chain lightning to 3 nearby targets.",
    icon: "⚡",
    category: "evolution",
    rarity: "legendary",
  },
  mochi: {
    id: "evolution_mochi",
    title: "Citrus Supernova",
    description: "LEGENDARY EVOLUTION: Yuzu Bomb explodes on contact into 6 cluster bomblets that carpet-bomb the horde.",
    icon: "🍊",
    category: "evolution",
    rarity: "legendary",
  },
  kai: {
    id: "evolution_kai",
    title: "Eclipse Vortex",
    description: "LEGENDARY EVOLUTION: Homing Blades spawn 4 permanent orbiting plasma shurikens that shred nearby enemies.",
    icon: "🌀",
    category: "evolution",
    rarity: "legendary",
  },
};

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
    description: "Max Health increased by +45 and immediately heals 45 HP.",
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
    id: "crit_chance",
    title: "Overcharged Capacitors",
    description: "+18% Critical Strike Chance & +50% Critical Damage.",
    icon: "✨",
    category: "weapon",
    rarity: "rare",
  },
  {
    id: "dash_cooldown",
    title: "Phase Sub-Thrusters",
    description: "Phase Dash cooldown reduced by -35% with extended invulnerability.",
    icon: "💨",
    category: "stat",
    rarity: "rare",
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

export function getRandomUpgrades(player: PlayerState, count: number = 3): UpgradeCard[] {
  const options: UpgradeCard[] = [];

  // If player is level 5 or higher and hasn't evolved their weapon yet, guarantee evolution card
  if (player.level >= 5 && !player.isEvolved) {
    const evoCard = EVOLUTION_CARDS[player.companion.id];
    if (evoCard) {
      options.push(evoCard);
    }
  }

  const shuffled = [...UPGRADE_POOL].sort(() => 0.5 - Math.random());
  for (const card of shuffled) {
    if (options.length >= count) break;
    if (!options.some((o) => o.id === card.id)) {
      options.push(card);
    }
  }

  return options;
}

export function applyUpgrade(upgrade: UpgradeCard, player: PlayerState, base: SanctuaryBase) {
  switch (upgrade.id) {
    case "evolution_koji":
    case "evolution_mochi":
    case "evolution_kai":
      player.isEvolved = true;
      player.evolutionTitle = upgrade.title;
      player.damageMultiplier += 0.4;
      sounds.playEvolution();
      break;
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
      player.maxHealth += 45;
      player.health = Math.min(player.maxHealth, player.health + 45);
      break;
    case "pickup_range":
      player.pickupRange *= 1.5;
      break;
    case "crit_chance":
      player.critChance = Math.min(0.85, player.critChance + 0.18);
      player.critMultiplier += 0.5;
      break;
    case "dash_cooldown":
      player.dashMaxCooldown = Math.max(0.8, player.dashMaxCooldown * 0.65);
      break;
    case "base_repair":
      base.health = Math.min(base.maxHealth, base.health + 350);
      base.level++;
      break;
    case "pierce":
      player.pierceBonus += 2;
      break;
    case "ability_cdr":
      player.companion.abilityCooldown *= 0.75;
      break;
    case "base_turrets":
      base.level++;
      break;
  }
}
