import { SPECIALS } from "./roster.ts";
export type FighterId = "vector" | "rook" | "nyx" | "ember" | "solis" | "astra";
export type BossId = "warden" | "vesper" | "heliarch" | "eclipse";
export type CombatantId = FighterId | BossId;
export type ArenaId = "skyline" | "reactor" | "tempest";
export type Difficulty = "rookie" | "standard" | "expert";
export type Mode = "duel" | "arcade" | "training" | "ranked" | "boss";
export interface FighterDefinition {
  id: CombatantId;
  name: string;
  title: string;
  tagline: string;
  bio: string;
  color: number;
  accent: string;
  speed: number;
  jump: number;
  weight: number;
  damage: number;
  special: string;
  ultimate: string;
  recovery: string;
  downAir: string;
  downAirDescription: string;
  downAirDamage: number;
  downAirStun: number;
  specialDescription: string;
  ultimateDescription: string;
}
export const FIGHTERS: Record<CombatantId, FighterDefinition> = {
  vector: {
    id: "vector",
    name: "Vector",
    title: "THE LIVE WIRE",
    tagline: "Catch the blur.",
    bio: "A solar courier with balanced strikes, dependable movement and a directed beam. A welcoming first pilot with room for precise play.",
    color: 0x4debd1,
    accent: "#4debd1",
    speed: 315,
    jump: 645,
    weight: 1,
    damage: 8,
    special: SPECIALS.vector.name,
    ultimate: "Event horizon",
    recovery: "Skywire",
    downAir: "Vector spike",
    downAirDescription:
      "A fast diagonal heel that spikes and freezes a rival in place.",
    downAirDamage: 9,
    downAirStun: 0.65,
    specialDescription: SPECIALS.vector.description,
    ultimateDescription:
      "Fire a wide, high-speed energy wave. Even this can be parried.",
  },
  rook: {
    id: "rook",
    name: "Rook",
    title: "THE IMMOVABLE",
    tagline: "Bring the building down.",
    bio: "A towering guardian in living armor. Powerful grounded strikes and seismic defense trade aerial freedom for staying power.",
    color: 0xffa06b,
    accent: "#ffa06b",
    speed: 245,
    jump: 590,
    weight: 1.38,
    damage: 10,
    special: SPECIALS.rook.name,
    ultimate: "Cataclysm",
    recovery: "Iron ascent",
    downAir: "Pillar drop",
    downAirDescription:
      "A heavy downward hammer with the longest stun and launch weight.",
    downAirDamage: 12,
    downAirStun: 0.65,
    specialDescription: SPECIALS.rook.description,
    ultimateDescription:
      "Raise both fists, then smash the ground. An expanding quake hits hardest near the impact; jump, dodge or parry to escape.",
  },
  nyx: {
    id: "nyx",
    name: "Nyx",
    title: "THE AFTERIMAGE",
    tagline: "Own the empty space.",
    bio: "An agile prism navigator who owns the empty space. Starfall rewards patient spacing and precise angles.",
    color: 0xca9aff,
    accent: "#ca9aff",
    speed: 335,
    jump: 670,
    weight: 0.96,
    damage: 7,
    special: SPECIALS.nyx.name,
    ultimate: "Supernova",
    recovery: "Phase lift",
    downAir: "Shadow dive",
    downAirDescription: "A quick descending blade that sets up a ranged reset.",
    downAirDamage: 8,
    downAirStun: 0.65,
    specialDescription: SPECIALS.nyx.description,
    ultimateDescription:
      "Launch an enormous star core. A parry reflects it back at you.",
  },
  ember: {
    id: "ember",
    name: "Ember",
    title: "THE FALLING STAR",
    tagline: "Leave a brighter crater.",
    bio: "A lightweight solar-wing racer. Three jumps, two dodges and a phoenix dash reward daring aerial routes, but mistakes hit hard.",
    color: 0xff668d,
    accent: "#ff668d",
    speed: 350,
    jump: 665,
    weight: 0.82,
    damage: 7,
    special: SPECIALS.ember.name,
    ultimate: "Phoenix break",
    recovery: "Flare rise",
    downAir: "Meteor heel",
    downAirDescription: "A flaming heel that pins a rival below Ember.",
    downAirDamage: 10,
    downAirStun: 0.65,
    specialDescription: SPECIALS.ember.description,
    ultimateDescription:
      "Unleash a huge ascending phoenix. Its leading edge can be parried.",
  },
  solis: {
    id: "solis",
    name: "Solis",
    title: "THE SUNWARD SENTINEL",
    tagline: "Stand in the light.",
    bio: "A veteran solar guardian. Anchor an eclipse, defend your ground and turn patient positioning into solar pressure.",
    color: 0xf4c85b,
    accent: "#f4c85b",
    speed: 285,
    jump: 635,
    weight: 1.22,
    damage: 9,
    special: SPECIALS.solis.name,
    ultimate: "Daybreak",
    recovery: "Sunrise lift",
    downAir: "Zenith fall",
    downAirDescription: "A descending shield strike with a long stun.",
    downAirDamage: 13,
    downAirStun: 0.65,
    specialDescription: SPECIALS.solis.description,
    ultimateDescription:
      "A sustained solar wave. Escape its field before the second pulse.",
  },
  astra: {
    id: "astra",
    name: "Astra",
    title: "THE ORBITAL DUELIST",
    tagline: "Every orbit returns.",
    bio: "An elite orbital duelist. Precise aerial steering and a steerable water vortex reward ambitious timing and positioning.",
    color: 0x6be5f4,
    accent: "#6be5f4",
    speed: 340,
    jump: 690,
    weight: 0.95,
    damage: 8,
    special: SPECIALS.astra.name,
    ultimate: "Orbital bloom",
    recovery: "Skythread",
    downAir: "Comet needle",
    downAirDescription: "A long downward lance that spikes and stuns.",
    downAirDamage: 14,
    downAirStun: 0.65,
    specialDescription: SPECIALS.astra.description,
    ultimateDescription:
      "A brilliant orbital core that can strike twice or be reflected.",
  },
  warden: {
    id: "warden",
    name: "Verdant Warden",
    title: "BOSS / GARDEN KEEPER",
    tagline: "The garden remembers.",
    bio: "An ancient horticultural automaton with root-forged fists and a solar halberd.",
    color: 0x91d56b,
    accent: "#91d56b",
    speed: 265,
    jump: 650,
    weight: 1.65,
    damage: 12,
    special: "Rootbreaker",
    ultimate: "Overgrowth",
    recovery: "Vine ascent",
    downAir: "Canopy crash",
    downAirDescription: "A crushing drop.",
    downAirDamage: 16,
    downAirStun: 1.31,
    specialDescription: "A wide root-powered slam.",
    ultimateDescription: "A huge radial solar shockwave.",
  },
  vesper: {
    id: "vesper",
    name: "Vesper Prime",
    title: "BOSS / MIRROR ENGINE",
    tagline: "Light has a sharp edge.",
    bio: "A rogue orbital engineer whose mirrors turn sunlight into cutting lances.",
    color: 0xb59fff,
    accent: "#b59fff",
    speed: 335,
    jump: 700,
    weight: 1.2,
    damage: 13,
    special: "Mirror lance",
    ultimate: "Prism collapse",
    recovery: "Refraction",
    downAir: "Glass comet",
    downAirDescription: "A piercing fall.",
    downAirDamage: 17,
    downAirStun: 1.26,
    specialDescription: "A concentrated mirror bolt.",
    ultimateDescription: "A giant unstable prism.",
  },
  heliarch: {
    id: "heliarch",
    name: "The Heliarch",
    title: "BOSS / FURNACE SOVEREIGN",
    tagline: "Kneel before the dawn.",
    bio: "A towering solar-forge monarch carrying a furnace hammer and an ion crown.",
    color: 0xffb55f,
    accent: "#ffb55f",
    speed: 300,
    jump: 680,
    weight: 1.8,
    damage: 15,
    special: "Furnace rise",
    ultimate: "Solar judgment",
    recovery: "Flare throne",
    downAir: "Crownfall",
    downAirDescription: "A molten downward hammer.",
    downAirDamage: 20,
    downAirStun: 1.36,
    specialDescription: "A rising furnace strike.",
    ultimateDescription: "A great ascending solar flame.",
  },
  eclipse: {
    id: "eclipse",
    name: "Eclipse Seraph",
    title: "BOSS / LAST LIGHT",
    tagline: "The sun has one final shadow.",
    bio: "The final solar sentinel. Six floating vanes channel the power of a captured star.",
    color: 0xf6e7a5,
    accent: "#f6e7a5",
    speed: 360,
    jump: 730,
    weight: 1.65,
    damage: 17,
    special: "Eventide",
    ultimate: "Totality",
    recovery: "Seraph ascent",
    downAir: "Fallen sun",
    downAirDescription: "A devastating solar spike.",
    downAirDamage: 22,
    downAirStun: 1.41,
    specialDescription: "A returning dark sun.",
    ultimateDescription: "A wide pulse of captured starlight.",
  },
};
export const FIGHTER_IDS: FighterId[] = [
  "vector",
  "rook",
  "nyx",
  "ember",
  "solis",
  "astra",
];
export const BOSS_IDS: BossId[] = ["warden", "vesper", "heliarch", "eclipse"];
export const isBoss = (id: CombatantId): id is BossId =>
  BOSS_IDS.includes(id as BossId);
export const archetype = (
  id: CombatantId,
): "vector" | "rook" | "nyx" | "ember" | "solis" =>
  id === "warden"
    ? "rook"
    : id === "vesper" || id === "astra"
      ? "nyx"
      : id === "heliarch"
        ? "ember"
        : id === "eclipse"
          ? "solis"
          : id;
export const PRICES: Record<FighterId, number> = {
  vector: 0,
  rook: 3000,
  nyx: 3000,
  ember: 5000,
  solis: 7500,
  astra: 25000,
};
export const PROGRESSION_TIER: Record<FighterId, number> = {
  vector: 1,
  rook: 2,
  nyx: 3,
  ember: 4,
  solis: 5,
  astra: 6,
};
export const BOSSES: Record<
  BossId,
  { level: number; reward: number; xp: number; arena: ArenaId; phase: string }
> = {
  warden: {
    level: 2,
    reward: 5000,
    xp: 400,
    arena: "skyline",
    phase: "Root systems awaken: faster slams and solar regeneration.",
  },
  vesper: {
    level: 5,
    reward: 14000,
    xp: 650,
    arena: "tempest",
    phase: "Mirrors unfold: faster lances and more aggressive aerial pursuit.",
  },
  heliarch: {
    level: 9,
    reward: 42000,
    xp: 1100,
    arena: "reactor",
    phase:
      "The furnace ignites: greater speed and accelerated ultimate charge.",
  },
  eclipse: {
    level: 14,
    reward: 120000,
    xp: 1800,
    arena: "tempest",
    phase:
      "Totality begins: heightened speed, pressure and solar regeneration.",
  },
};
export interface Platform {
  x: number;
  y: number;
  width: number;
  oneWay: boolean;
  motion?: {
    axis: "x" | "y";
    amplitude: number;
    period: number;
    phase?: number;
  };
}
export interface ArenaDefinition {
  id: ArenaId;
  name: string;
  subtitle: string;
  color: number;
  accent: string;
  platforms: Platform[];
  hazardX: number;
  hazardName: string;
  description: string;
}
export const ARENAS: Record<ArenaId, ArenaDefinition> = {
  skyline: {
    id: "skyline",
    name: "Solstice Gardens",
    subtitle: "SOLARPUNK / HOME ARENA",
    color: 0x88e0bd,
    accent: "#88e0bd",
    description: "Sunlit gardens, drifting skybridges and a living solar city.",
    hazardX: 600,
    hazardName: "SOLAR LANCE",
    platforms: [
      { x: 180, y: 500, width: 840, oneWay: false },
      {
        x: 320,
        y: 360,
        width: 180,
        oneWay: true,
        motion: { axis: "x", amplitude: 85, period: 7 },
      },
      {
        x: 700,
        y: 320,
        width: 180,
        oneWay: true,
        motion: { axis: "y", amplitude: 45, period: 6 },
      },
    ],
  },
  reactor: {
    id: "reactor",
    name: "Helios Foundry",
    subtitle: "SOLAR FORGE / 02",
    color: 0xffa66d,
    accent: "#ffa66d",
    description:
      "An orbital sun forge. Red markers warn of falling ion spears.",
    hazardX: 600,
    hazardName: "ION SPEAR",
    platforms: [
      { x: 250, y: 510, width: 700, oneWay: false },
      { x: 145, y: 360, width: 175, oneWay: true },
      { x: 880, y: 360, width: 175, oneWay: true },
      {
        x: 485,
        y: 255,
        width: 230,
        oneWay: true,
        motion: { axis: "y", amplitude: 60, period: 8 },
      },
    ],
  },
  tempest: {
    id: "tempest",
    name: "Aurora Spires",
    subtitle: "ORBITAL SANCTUARY / 77",
    color: 0x69d9ff,
    accent: "#69d9ff",
    description: "Floating solar islands with a moving bridge over the clouds.",
    hazardX: 350,
    hazardName: "ION STRIKE",
    platforms: [
      { x: 140, y: 505, width: 390, oneWay: false },
      { x: 670, y: 505, width: 390, oneWay: false },
      {
        x: 445,
        y: 375,
        width: 310,
        oneWay: true,
        motion: { axis: "x", amplitude: 95, period: 8 },
      },
      { x: 185, y: 285, width: 155, oneWay: true },
      { x: 860, y: 285, width: 155, oneWay: true },
    ],
  },
};
export const ARENA_IDS = Object.keys(ARENAS) as ArenaId[];
export function platformsAt(id: ArenaId, time: number): Platform[] {
  return ARENAS[id].platforms.map((p) =>
    p.motion
      ? {
          ...p,
          [p.motion.axis]:
            p[p.motion.axis] +
            Math.sin(
              (time * Math.PI * 2) / p.motion.period + (p.motion.phase ?? 0),
            ) *
              p.motion.amplitude,
        }
      : { ...p },
  );
}
export const WORLD = {
  width: 1200,
  height: 680,
  gravity: 1650,
  left: -190,
  right: 1390,
  top: -280,
  bottom: 880,
};
export const CONTROLS = [
  ["A / D", "Move"],
  ["W / SPACE", "Jump ×2 / Ember ×3"],
  ["S", "Fast fall / drop"],
  ["J", "Attack / combo"],
  ["DOWN + J", "Down-air stun"],
  ["K", "Signature ability"],
  ["W + K", "Recovery"],
  ["L", "Parry / shield"],
  ["SHIFT", "Dodge"],
  ["HOLD I", "Ultimate"],
  ["ESC", "Pause"],
];
