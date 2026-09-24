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
    bio: "A fast rushdown fighter. Close gaps with a charged dash and turn precision parries into relentless pressure.",
    color: 0x4debd1,
    accent: "#4debd1",
    speed: 345,
    jump: 645,
    weight: 1,
    damage: 7,
    special: "Flash drive",
    ultimate: "Event horizon",
    recovery: "Skywire",
    downAir: "Vector spike",
    downAirDescription:
      "A fast diagonal heel that spikes and freezes a rival in place.",
    downAirDamage: 9,
    downAirStun: 0.82,
    specialDescription:
      "Charge a forward dash. More charge means more reach and launch power.",
    ultimateDescription:
      "Fire a wide, high-speed energy wave. Even this can be parried.",
  },
  rook: {
    id: "rook",
    name: "Rook",
    title: "THE IMMOVABLE",
    tagline: "Bring the building down.",
    bio: "A heavy brawler with devastating launch power. Slower on the ground; harder to knock off it.",
    color: 0xffa06b,
    accent: "#ffa06b",
    speed: 255,
    jump: 600,
    weight: 1.3,
    damage: 10,
    special: "Fault line",
    ultimate: "Worldbreaker",
    recovery: "Iron ascent",
    downAir: "Pillar drop",
    downAirDescription:
      "A heavy downward hammer with the longest stun and launch weight.",
    downAirDamage: 12,
    downAirStun: 0.92,
    specialDescription:
      "Charge a seismic strike. The ground wave grows with your charge.",
    ultimateDescription:
      "A huge shockwave on both sides. Time a parry to turn the tide.",
  },
  nyx: {
    id: "nyx",
    name: "Nyx",
    title: "THE AFTERIMAGE",
    tagline: "Own the empty space.",
    bio: "A light, mobile zoner. Harass from afar with charged projectiles, then escape with a rising phase strike.",
    color: 0xca9aff,
    accent: "#ca9aff",
    speed: 315,
    jump: 675,
    weight: 0.88,
    damage: 6,
    special: "Prism lance",
    ultimate: "Supernova",
    recovery: "Phase lift",
    downAir: "Shadow dive",
    downAirDescription: "A quick descending blade that sets up a ranged reset.",
    downAirDamage: 8,
    downAirStun: 0.86,
    specialDescription:
      "Hold to grow a piercing prism bolt. Releasing early fires a quick shot.",
    ultimateDescription:
      "Launch an enormous star core. A parry reflects it back at you.",
  },
  ember: {
    id: "ember",
    name: "Ember",
    title: "THE FALLING STAR",
    tagline: "Leave a brighter crater.",
    bio: "An aerial bruiser. Rise with a flaming uppercut and send opponents skyward with a charged phoenix.",
    color: 0xff668d,
    accent: "#ff668d",
    speed: 300,
    jump: 660,
    weight: 1.05,
    damage: 8,
    special: "Solar uppercut",
    ultimate: "Phoenix break",
    recovery: "Flare rise",
    downAir: "Meteor heel",
    downAirDescription: "A flaming heel that pins a rival below Ember.",
    downAirDamage: 10,
    downAirStun: 0.88,
    specialDescription:
      "Charge a rising flame strike. Strong vertical launch; useful in the air.",
    ultimateDescription:
      "Unleash a huge ascending phoenix. Its leading edge can be parried.",
  },
  solis: {
    id: "solis",
    name: "Solis",
    title: "THE SUNWARD SENTINEL",
    tagline: "Stand in the light.",
    bio: "A veteran solar guardian. Prism armor and a returning sun-disc turn patient defense into crushing space control.",
    color: 0xf4c85b,
    accent: "#f4c85b",
    speed: 285,
    jump: 640,
    weight: 1.2,
    damage: 10,
    special: "Corona disc",
    ultimate: "Daybreak",
    recovery: "Sunrise lift",
    downAir: "Zenith fall",
    downAirDescription: "A descending shield strike with a long stun.",
    downAirDamage: 13,
    downAirStun: 0.93,
    specialDescription:
      "Hurl a growing solar disc that returns toward its launch point.",
    ultimateDescription:
      "A sustained solar wave. Escape its field before the second pulse.",
  },
  astra: {
    id: "astra",
    name: "Astra",
    title: "THE ORBITAL DUELIST",
    tagline: "Every orbit returns.",
    bio: "An elite orbital duelist. Long solar lances, precise aerial control and exceptional mobility reward ambitious reads.",
    color: 0x6be5f4,
    accent: "#6be5f4",
    speed: 355,
    jump: 700,
    weight: 0.98,
    damage: 11,
    special: "Helix lance",
    ultimate: "Orbital bloom",
    recovery: "Skythread",
    downAir: "Comet needle",
    downAirDescription: "A long downward lance that spikes and stuns.",
    downAirDamage: 14,
    downAirStun: 0.88,
    specialDescription:
      "Launch a concentrated solar lance; aim before releasing.",
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
    downAirStun: 0.95,
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
    downAirStun: 0.9,
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
    downAirStun: 1,
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
    downAirStun: 1.05,
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
  rook: 2500,
  nyx: 6500,
  ember: 12000,
  solis: 22000,
  astra: 40000,
};
export const POWER: Record<FighterId, number> = {
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
  ["W / SPACE", "Jump ×2"],
  ["S", "Fast fall / drop"],
  ["J", "Attack / combo"],
  ["DOWN + J", "Down-air stun"],
  ["HOLD K", "Charge special"],
  ["W + K", "Recovery"],
  ["L", "Parry / shield"],
  ["SHIFT", "Dodge"],
  ["HOLD I", "Ultimate"],
  ["ESC", "Pause"],
];
