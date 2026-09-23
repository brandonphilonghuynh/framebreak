export type Action =
  | "light"
  | "heavy"
  | "block"
  | "dodge"
  | "grab"
  | "recover"
  | "special"
  | "advance"
  | "retreat";
export type Distance = "close" | "mid" | "far";
export type FighterId = "vector" | "rook" | "nyx";
export type Difficulty = "rookie" | "standard" | "expert";
export const DISTANCES: Distance[] = ["close", "mid", "far"];
export const ACTIONS: Action[] = [
  "light",
  "heavy",
  "block",
  "dodge",
  "grab",
  "recover",
  "special",
  "advance",
  "retreat",
];
export const KEYS: Record<Action, string> = {
  light: "1",
  heavy: "2",
  block: "3",
  dodge: "4",
  grab: "5",
  recover: "6",
  special: "7",
  advance: "Q",
  retreat: "E",
};
export const ICONS: Record<Action, string> = {
  light: "↗",
  heavy: "✦",
  block: "◈",
  dodge: "➶",
  grab: "⌁",
  recover: "＋",
  special: "ϟ",
  advance: "→←",
  retreat: "←→",
};
export interface Move {
  name: string;
  damage: number;
  cost: number;
  speed: number;
  range: Distance[];
  type: "strike" | "grab" | "defense" | "recovery" | "movement";
  description: string;
  chip?: number;
  guardCost?: number;
  recovery?: number;
  vulnerability?: number;
  movement?: number;
  knockback?: number;
  cooldown?: number;
}
export const MOVES: Record<Action, Move> = {
  light: {
    name: "Light attack",
    damage: 12,
    cost: 15,
    speed: 8,
    range: ["close", "mid"],
    type: "strike",
    description: "Quick pressure. Interrupt slower attacks.",
  },
  heavy: {
    name: "Heavy attack",
    damage: 25,
    cost: 35,
    speed: 3,
    range: ["close", "mid"],
    type: "strike",
    chip: 8,
    guardCost: 25,
    description: "Cracks guards. A strong read against recovery.",
  },
  block: {
    name: "Block",
    damage: 0,
    cost: 0,
    speed: 10,
    range: [],
    type: "defense",
    description: "Absorb strikes with stamina. Grabs bypass guard.",
  },
  dodge: {
    name: "Dodge",
    damage: 0,
    cost: 25,
    speed: 10,
    range: [],
    type: "defense",
    description: "Evade strikes. Grabs catch you. Repeats cost +10/+20.",
  },
  grab: {
    name: "Grab",
    damage: 15,
    cost: 20,
    speed: 5,
    range: ["close"],
    type: "grab",
    description: "Catch blocks and dodges. Loses to fast strikes.",
  },
  recover: {
    name: "Recover",
    damage: 0,
    cost: 0,
    speed: 0,
    range: [],
    type: "recovery",
    recovery: 30,
    vulnerability: 1.4,
    description: "Restore stamina. Take 40% extra damage this turn.",
  },
  special: {
    name: "Flash step",
    damage: 18,
    cost: 30,
    speed: 6,
    range: ["close", "mid"],
    type: "strike",
    movement: -1,
    cooldown: 2,
    description: "Close one range band, then strike. Two-turn cooldown.",
  },
  advance: {
    name: "Advance",
    damage: 0,
    cost: 8,
    speed: 9,
    range: [],
    type: "movement",
    movement: -1,
    description: "Close one range band before attacks. No protection.",
  },
  retreat: {
    name: "Retreat",
    damage: 0,
    cost: 8,
    speed: 9,
    range: [],
    type: "movement",
    movement: 1,
    description: "Open one range band before attacks. No invulnerability.",
  },
};
export interface FighterDefinition {
  id: FighterId;
  name: string;
  title: string;
  tagline: string;
  bio: string;
  maxHealth: number;
  maxStamina: number;
  color: number;
  accent: string;
  personality: "pressure" | "grappler" | "zoner";
  moves: Partial<Record<Action, Partial<Move>>>;
}
export const FIGHTERS: Record<FighterId, FighterDefinition> = {
  vector: {
    id: "vector",
    name: "Vector",
    title: "THE LIVE WIRE",
    tagline: "Speed is a state of mind.",
    bio: "A quick-footed courier who turns distance into pressure. Flash step closes the gap before the hit.",
    maxHealth: 100,
    maxStamina: 100,
    color: 0x4debd1,
    accent: "#4debd1",
    personality: "pressure",
    moves: {
      light: { name: "Pulse jab", damage: 11, cost: 14 },
      heavy: { name: "Arc kick", damage: 24, cost: 32 },
      grab: { name: "Tripwire" },
      special: { name: "Flash step" },
    },
  },
  rook: {
    id: "rook",
    name: "Rook",
    title: "THE IMMOVABLE",
    tagline: "Every inch has a price.",
    bio: "A heavyweight enforcer. Fight up close, grab the guard, or slam opponents away to reset the pace.",
    maxHealth: 120,
    maxStamina: 90,
    color: 0xffa06b,
    accent: "#ffa06b",
    personality: "grappler",
    moves: {
      light: {
        name: "Knuckle check",
        damage: 14,
        cost: 16,
        speed: 7,
        range: ["close"],
      },
      heavy: {
        name: "Wrecking blow",
        damage: 29,
        cost: 36,
        speed: 2,
        chip: 10,
        guardCost: 28,
      },
      grab: { name: "Vice grip", damage: 21, cost: 23, speed: 5 },
      special: {
        name: "Fault line",
        damage: 28,
        cost: 38,
        speed: 2,
        movement: 0,
        knockback: 1,
        chip: 9,
        guardCost: 26,
        description:
          "Heavy shockwave. On an unguarded hit, push one band away.",
      },
    },
  },
  nyx: {
    id: "nyx",
    name: "Nyx",
    title: "THE AFTERIMAGE",
    tagline: "Catch what isn’t there.",
    bio: "A precision duelist who controls the outside. Prism lance reaches Far, but her light strike needs Mid.",
    maxHealth: 90,
    maxStamina: 110,
    color: 0xca9aff,
    accent: "#ca9aff",
    personality: "zoner",
    moves: {
      light: { name: "Needle ray", damage: 14, cost: 12, speed: 9, range: ["mid"] },
      heavy: { name: "Crescent cut", damage: 23, cost: 30, speed: 4, chip: 7 },
      grab: { name: "Phase snare", damage: 13, cost: 18 },
      recover: { recovery: 32 },
      special: {
        name: "Prism lance",
        damage: 24,
        cost: 28,
        speed: 7,
        range: ["mid", "far"],
        movement: 0,
        chip: 6,
        guardCost: 20,
        description: "A long-range beam. Hits Mid/Far; whiffs at Close.",
      },
    },
  },
};
export const FIGHTER_IDS = Object.keys(FIGHTERS) as FighterId[];
export function getMove(action: Action, fighter: FighterId): Move {
  return { ...MOVES[action], ...FIGHTERS[fighter].moves[action] };
}
