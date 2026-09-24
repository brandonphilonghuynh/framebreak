import {
  BOSSES,
  BOSS_IDS,
  FIGHTER_IDS,
  PRICES,
  POWER,
  type BossId,
  type FighterId,
  type ArenaId,
} from "./data.ts";
import type { Config, WorldState } from "./simulation.ts";

export interface Profile {
  version: 1;
  name: string;
  currency: number;
  xp: number;
  rating: number;
  unlocked: FighterId[];
  defeated: BossId[];
  settled: string[];
  wins: number;
  losses: number;
  streak: number;
  bestStreak: number;
  damage: number;
  parries: number;
}
export const SAVE_KEY = "framebreak.solstice.profile.v1";
export const newProfile = (): Profile => ({
  version: 1,
  name: "Pilot",
  currency: 1000,
  xp: 0,
  rating: 0,
  unlocked: ["vector"],
  defeated: [],
  settled: [],
  wins: 0,
  losses: 0,
  streak: 0,
  bestStreak: 0,
  damage: 0,
  parries: 0,
});
export const levelOf = (p: Profile) => Math.min(50, 1 + Math.floor(p.xp / 250));
export const rankOf = (rating: number) =>
  ["Seedling", "Copperleaf", "Sunstone", "Auric", "Radiant", "Solar Ascendant"][
    Math.min(5, Math.floor(rating / 200))
  ];
export const xpProgress = (p: Profile) => p.xp % 250;
const integer = (value: unknown, max = 1_000_000_000) =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= max &&
  Math.floor(value) === value;

/** Import uses the same validation as loading. Invalid saves are never written over silently. */
export function parseProfile(raw: string): Profile {
  const p = JSON.parse(raw) as Profile;
  if (
    !p ||
    p.version !== 1 ||
    typeof p.name !== "string" ||
    p.name.length > 24 ||
    !p.name.trim()
  )
    throw new Error("This is not a compatible Solstice save.");
  for (const key of [
    "currency",
    "xp",
    "rating",
    "wins",
    "losses",
    "streak",
    "bestStreak",
    "damage",
    "parries",
  ] as const)
    if (!integer(p[key]))
      throw new Error("The save contains invalid progress.");
  if (
    !Array.isArray(p.unlocked) ||
    !p.unlocked.includes("vector") ||
    p.unlocked.some((id) => !FIGHTER_IDS.includes(id))
  )
    throw new Error("The save contains an invalid fighter.");
  if (
    !Array.isArray(p.defeated) ||
    p.defeated.some((id) => !BOSS_IDS.includes(id))
  )
    throw new Error("The save contains an invalid boss.");
  if (
    !Array.isArray(p.settled) ||
    p.settled.length > 64 ||
    p.settled.some((id) => typeof id !== "string" || id.length > 80)
  )
    throw new Error("Invalid match history.");
  return {
    ...newProfile(),
    ...p,
    name: p.name.trim(),
    unlocked: [...new Set(p.unlocked)],
    defeated: [...new Set(p.defeated)],
  };
}
export function purchase(p: Profile, id: FighterId): Profile {
  if (!FIGHTER_IDS.includes(id) || p.unlocked.includes(id))
    throw new Error("This fighter is already in your crew.");
  if (p.currency < PRICES[id])
    throw new Error("Earn more Lumens in ranked matches or boss contracts.");
  return {
    ...p,
    currency: p.currency - PRICES[id],
    unlocked: [...p.unlocked, id],
  };
}
export function bossAvailable(p: Profile, id: BossId) {
  return levelOf(p) >= BOSSES[id].level && !p.defeated.includes(id);
}
export function rankedOpponent(
  p: Profile,
  selected: FighterId,
): { cpu: FighterId; level: number; arena: ArenaId } {
  const tier = Math.min(
    5,
    Math.max(POWER[selected] - 1, Math.floor(p.rating / 200)),
  );
  const order = [
    "rook",
    "nyx",
    "ember",
    "solis",
    "astra",
    "astra",
  ] as FighterId[];
  const level = Math.min(55, levelOf(p) + 1 + Math.floor(p.rating / 400));
  return {
    cpu: order[tier],
    level,
    arena: (["skyline", "tempest", "reactor"] as ArenaId[])[p.wins % 3],
  };
}
export function rankedReward(opponentLevel: number, rating: number) {
  return 300 + opponentLevel * 80 + Math.floor(rating / 200) * 120;
}
export interface Reward {
  lumens: number;
  xp: number;
  rating: number;
  firstClear: boolean;
}
export function settleMatch(
  p: Profile,
  w: WorldState,
): { profile: Profile; reward: Reward } {
  const reward: Reward = { lumens: 0, xp: 0, rating: 0, firstClear: false };
  const c = w.config;
  if (
    !c.matchId ||
    w.winner === null ||
    p.settled.includes(c.matchId) ||
    (c.mode !== "ranked" && c.mode !== "boss")
  )
    return { profile: p, reward };
  if (!p.unlocked.includes(c.player)) return { profile: p, reward };
  const next: Profile = {
    ...p,
    unlocked: [...p.unlocked],
    defeated: [...p.defeated],
    settled: [...p.settled, c.matchId].slice(-64),
  };
  const won = w.winner === 0;
  if (c.mode === "boss") {
    const id = c.cpu as BossId;
    if (!BOSS_IDS.includes(id) || !bossAvailable(p, id))
      return { profile: p, reward };
    if (won) {
      reward.lumens = BOSSES[id].reward;
      reward.xp = BOSSES[id].xp;
      reward.firstClear = true;
      next.defeated.push(id);
    }
  } else {
    reward.xp = won ? 140 + Math.min(55, c.opponentLevel ?? 1) * 15 : 35;
    reward.lumens = won
      ? rankedReward(c.opponentLevel ?? 1, p.rating) +
        Math.min(5, p.streak) * 50
      : 0;
    reward.rating = won
      ? 40 + Math.min(20, (c.opponentLevel ?? 1) * 2)
      : w.winner === "draw"
        ? 0
        : -20;
  }
  next.currency += reward.lumens;
  next.xp += reward.xp;
  next.rating = Math.max(0, next.rating + reward.rating);
  reward.rating = next.rating - p.rating;
  next.wins += Number(won);
  next.losses += Number(w.winner === 1);
  next.streak = won ? next.streak + 1 : 0;
  next.bestStreak = Math.max(next.bestStreak, next.streak);
  next.damage += Math.round(w.fighters[0].damageDealt);
  next.parries += w.fighters[0].parries;
  return { profile: next, reward };
}
