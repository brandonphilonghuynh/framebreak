import type { CombatantId, FighterId } from "./data.ts";

/** Gameplay values and silhouette proportions share one source of truth. */
export interface Physique {
  acceleration: number;
  airControl: number;
  airSpeed: number;
  airJump: number;
  jumps: number;
  dodges: number;
  dodgeRecharge: number;
  damageTaken: number;
  hurtWidth: number;
  hurtHeight: number;
  reach: number;
  bodyWidth: number;
  bodyHeight: number;
  limbWidth: number;
}
const baseline: Physique = {
  acceleration: 16,
  airControl: 6.5,
  airSpeed: 1.08,
  airJump: 1.3,
  jumps: 2,
  dodges: 1,
  dodgeRecharge: 1.15,
  damageTaken: 1,
  hurtWidth: 44,
  hurtHeight: 108,
  reach: 86,
  bodyWidth: 1,
  bodyHeight: 1,
  limbWidth: 1,
};
export const PHYSIQUES: Record<FighterId, Physique> = {
  vector: { ...baseline },
  rook: {
    ...baseline,
    acceleration: 10,
    airControl: 4.8,
    airSpeed: 0.94,
    airJump: 1.25,
    damageTaken: 0.88,
    hurtWidth: 62,
    hurtHeight: 131,
    reach: 108,
    bodyWidth: 1.28,
    bodyHeight: 1.16,
    limbWidth: 1.35,
  },
  nyx: {
    ...baseline,
    acceleration: 21,
    airControl: 8.5,
    airSpeed: 1.12,
    hurtWidth: 38,
    hurtHeight: 105,
    bodyWidth: 0.86,
    limbWidth: 0.86,
  },
  ember: {
    ...baseline,
    acceleration: 24,
    airControl: 10,
    airSpeed: 1.15,
    airJump: 1.2,
    jumps: 3,
    dodges: 2,
    dodgeRecharge: 1.65,
    damageTaken: 1.12,
    hurtWidth: 37,
    hurtHeight: 100,
    reach: 72,
    bodyWidth: 0.82,
    bodyHeight: 0.94,
    limbWidth: 0.8,
  },
  solis: {
    ...baseline,
    acceleration: 13,
    airControl: 6,
    airSpeed: 1.02,
    damageTaken: 0.92,
    hurtWidth: 52,
    hurtHeight: 125,
    reach: 100,
    bodyWidth: 1.08,
    bodyHeight: 1.12,
    limbWidth: 1.12,
  },
  astra: {
    ...baseline,
    acceleration: 22,
    airControl: 11,
    airSpeed: 1.15,
    damageTaken: 1.04,
    hurtWidth: 40,
    hurtHeight: 114,
    reach: 94,
    bodyWidth: 0.88,
    bodyHeight: 1.06,
    limbWidth: 0.9,
  },
};
export const physique = (id: CombatantId): Physique =>
  PHYSIQUES[id as FighterId] ?? {
    ...baseline,
    hurtWidth: 62,
    hurtHeight: 148,
    bodyWidth: 1.24,
    bodyHeight: 1.24,
  };

export const SPECIALS = {
  vector: {
    name: "Solar Lance",
    cooldown: 5,
    windup: 0.3,
    duration: 0.2,
    range: 430,
    description:
      "A shoulder collector unfolds, then fires a straight solar beam. Face your target before activating; the gold guide shows its path. Jump, dodge or parry the beam.",
  },
  nyx: {
    name: "Starfall",
    cooldown: 5.5,
    windup: 0.24,
    duration: 1.1,
    range: 560,
    description:
      "Launch three luminous stars on separate, fixed trajectories. They never home. Space the fan to cover approaches; opponents can weave through or reflect individual stars.",
  },
  rook: {
    name: "Seismic Bulwark",
    cooldown: 7,
    windup: 0.45,
    duration: 0.22,
    range: 145,
    description:
      "Brace in armor, taking 30% less damage and resisting ordinary interruption, then push enemies away with a close seismic wave. Ultimates and perfect parries break the stance.",
  },
  ember: {
    name: "Phoenix Dash",
    cooldown: 4.8,
    windup: 0.16,
    duration: 0.23,
    range: 190,
    description:
      "Burst forward through a fiery afterimage. The dash deals damage once and displaces an opponent. No invulnerability: shields, parries and well-timed attacks can stop it.",
  },
  solis: {
    name: "Eclipse Field",
    cooldown: 8,
    windup: 0.3,
    duration: 2.6,
    range: 150,
    description:
      "Anchor a dark star and golden corona at your position. Enemies inside move 25% slower; Solis takes 20% less damage while within it. Jump or walk out freely; the field never roots or stuns.",
  },
  astra: {
    name: "Tidal Orbit",
    cooldown: 6.5,
    windup: 0.2,
    duration: 1.4,
    range: 420,
    description:
      "Hold K to suspend an orbiting water sphere for up to one second; release K to aim it horizontally or down-diagonally with S. It forms a small vortex after travel or contact: one damage pulse and a gentle, escapable pull. W + K remains recovery.",
  },
} as const;
export type AbilityId = keyof typeof SPECIALS;
const ultimate = (
  vx: number,
  vy: number,
  width: number,
  height: number,
  life: number,
  multiplier: number,
  force: number,
  windup = 0.5,
) => ({
  vx,
  vy,
  width,
  height,
  life,
  multiplier,
  force,
  windup,
  // Maximum forward coverage from the fighter center, rounded to ten world units.
  range: Math.round((70 + Math.abs(vx) * life + width / 2) / 10) * 10,
});
export const ULTIMATES = {
  vector: ultimate(660, 0, 170, 80, 1.05, 1.8, 330),
  rook: { ...ultimate(0, 0, 850, 48, 0.7, 2, 410, 0.65), range: 850 },
  nyx: ultimate(460, 0, 160, 145, 1.35, 1.85, 320),
  ember: ultimate(370, -190, 150, 145, 1.1, 1.9, 345),
  solis: ultimate(340, 0, 225, 130, 1.35, 1.75, 340),
  astra: ultimate(460, 0, 135, 145, 1.35, 1.8, 325),
} satisfies Record<FighterId, ReturnType<typeof ultimate>>;

export const ROLES: Record<
  FighterId,
  { role: string; difficulty: string; complexity: number }
> = {
  vector: { role: "Balanced all-rounder", difficulty: "Easy", complexity: 1 },
  rook: { role: "Heavyweight bruiser", difficulty: "Easy", complexity: 1 },
  nyx: {
    role: "Ranged pressure & spacing",
    difficulty: "Medium",
    complexity: 2,
  },
  ember: {
    role: "High-speed aerial fighter",
    difficulty: "Hard",
    complexity: 3,
  },
  solis: { role: "Durable area controller", difficulty: "Hard", complexity: 3 },
  astra: {
    role: "Versatile technical fighter",
    difficulty: "Expert",
    complexity: 4,
  },
};
