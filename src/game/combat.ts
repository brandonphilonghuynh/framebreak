import {
  ACTIONS,
  DISTANCES,
  FIGHTERS,
  getMove,
  type Action,
  type Distance,
  type FighterId,
  type Difficulty,
} from "./data.ts";
export { ACTIONS, DISTANCES, FIGHTERS, MOVES, getMove } from "./data.ts";
export type { Action, Distance, FighterId, Difficulty, Move } from "./data.ts";
export interface Fighter {
  id: FighterId;
  health: number;
  stamina: number;
  history: Action[];
  specialCooldown: number;
}
export interface Match {
  player: Fighter;
  cpu: Fighter;
  distance: Distance;
  turn: number;
  outcome: "victory" | "defeat" | "draw" | null;
  difficulty: Difficulty;
}
export interface Resolution {
  state: Match;
  messages: string[];
  damage: [number, number];
  staminaDelta: [number, number];
  actions: [Action, Action];
  previousDistance: Distance;
  attackDistance: Distance;
  interrupted: boolean[];
  dodged: boolean[];
  blocked: boolean[];
}
export function newMatch(
  player: FighterId = "vector",
  cpu: FighterId = "rook",
  difficulty: Difficulty = "standard",
): Match {
  const fighter = (id: FighterId): Fighter => ({
    id,
    health: FIGHTERS[id].maxHealth,
    stamina: FIGHTERS[id].maxStamina,
    history: [],
    specialCooldown: 0,
  });
  return {
    player: fighter(player),
    cpu: fighter(cpu),
    distance: "mid",
    turn: 1,
    outcome: null,
    difficulty,
  };
}
export function cost(action: Action, fighter: Fighter): number {
  let repeats = 0;
  if (action === "dodge")
    for (const previous of [...fighter.history].reverse()) {
      if (previous !== "dodge") break;
      repeats++;
    }
  return getMove(action, fighter.id).cost + Math.min(repeats, 2) * 10;
}
export function canUse(action: Action, fighter: Fighter): boolean {
  return (
    fighter.stamina >= cost(action, fighter) &&
    (action !== "special" || fighter.specialCooldown === 0)
  );
}
export function unavailableReason(
  action: Action,
  fighter: Fighter,
): string | null {
  if (action === "special" && fighter.specialCooldown > 0)
    return `Ready in ${fighter.specialCooldown} turn${fighter.specialCooldown === 1 ? "" : "s"}`;
  if (fighter.stamina < cost(action, fighter))
    return `Need ${cost(action, fighter)} stamina`;
  return null;
}
export const shiftDistance = (distance: Distance, amount: number): Distance =>
  DISTANCES[Math.max(0, Math.min(2, DISTANCES.indexOf(distance) + amount))];
export function resolveTurn(
  before: Match,
  playerAction: Action,
  cpuAction: Action,
): Resolution {
  if (before.outcome) throw new Error("The match is already finished.");
  const actions: [Action, Action] = [playerAction, cpuAction];
  const original = [before.player, before.cpu];
  actions.forEach((a, i) => {
    if (!canUse(a, original[i]))
      throw new Error(unavailableReason(a, original[i]) ?? "Invalid action");
  });
  const state = structuredClone(before),
    fighters = [state.player, state.cpu];
  const names = ["You", FIGHTERS[state.cpu.id].name];
  const moves = actions.map((a, i) => getMove(a, original[i].id));
  const messages: string[] = [],
    damage: [number, number] = [0, 0],
    dodged = [false, false],
    blocked = [false, false];
  actions.forEach((a, i) => {
    fighters[i].stamina -= cost(a, original[i]);
    fighters[i].specialCooldown = Math.max(0, original[i].specialCooldown - 1);
    if (moves[i].cooldown) fighters[i].specialCooldown = moves[i].cooldown!;
  });
  // Both movement commitments combine before either attack is checked for reach.
  // Opposite directions cancel, and two advances/retreats can shift two bands.
  const movement = moves.reduce((sum, m) => sum + (m.movement ?? 0), 0);
  state.distance = shiftDistance(before.distance, movement);
  const attackDistance = state.distance;
  if (moves.some((m) => m.movement))
    messages.push(
      `Footwork: ${before.distance.toUpperCase()} → ${state.distance.toUpperCase()}${movement === 0 ? " — opposing movement cancelled" : state.distance === before.distance ? " — arena boundary reached" : ""}.`,
    );
  const inRange = moves.map((m) => m.range.includes(attackDistance));
  const offensive = moves.map((m) => ["strike", "grab"].includes(m.type));
  const interrupted = moves.map(
    (move, i) =>
      offensive[i] &&
      offensive[1 - i] &&
      inRange[i] &&
      inRange[1 - i] &&
      moves[1 - i].speed > move.speed,
  );
  let knockback = 0;
  moves.forEach((move, i) => {
    const target = 1 - i,
      defense = actions[target];
    if (!offensive[i]) return;
    if (!inRange[i]) {
      messages.push(
        `${names[i]}: ${move.name} missed at ${attackDistance} range.`,
      );
      return;
    }
    if (interrupted[i]) {
      messages.push(
        `${names[target]} interrupted ${names[i] === "You" ? "your" : `${names[i]}’s`} ${move.name}.`,
      );
      return;
    }
    if (defense === "dodge" && move.type === "strike") {
      dodged[target] = true;
      messages.push(`${names[target]} dodged ${move.name}.`);
      return;
    }
    let hit = move.damage;
    if (defense === "block" && move.type === "strike") {
      const guardCost = move.guardCost ?? 10;
      if (fighters[target].stamina >= guardCost) {
        fighters[target].stamina -= guardCost;
        hit = move.chip ?? 0;
        blocked[target] = true;
        messages.push(
          `${names[target]} blocked ${move.name} (${hit} chip; −${guardCost} stamina).`,
        );
      } else {
        fighters[target].stamina = 0;
        messages.push(
          `${names[target]}: guard broken! ${move.name} hits for ${hit}.`,
        );
      }
    } else {
      if (moves[target].vulnerability)
        hit = Math.round(hit * moves[target].vulnerability!);
      messages.push(
        `${names[i]}: ${move.name} hit for ${hit}${defense === "recover" ? " — recovery punished" : move.type === "grab" && ["block", "dodge"].includes(defense) ? ` — caught ${defense}` : ""}.`,
      );
    }
    damage[target] = hit;
    if (hit > 0 && !blocked[target]) knockback += move.knockback ?? 0;
  });
  if (knockback) {
    state.distance = shiftDistance(attackDistance, knockback);
    messages.push(
      `Impact pushed the fighters to ${state.distance.toUpperCase()} range.`,
    );
  }
  fighters.forEach((fighter, i) => {
    fighter.health = Math.max(0, fighter.health - damage[i]);
    if (moves[i].recovery) {
      const restored = Math.min(
        moves[i].recovery!,
        FIGHTERS[fighter.id].maxStamina - fighter.stamina,
      );
      fighter.stamina += restored;
      messages.push(`${names[i]} recovered ${restored} stamina.`);
    }
    fighter.history = [...fighter.history, actions[i]].slice(-5);
  });
  if (!messages.length)
    messages.push("Both fighters held their defenses. No damage dealt.");
  state.turn++;
  state.outcome =
    state.player.health <= 0 && state.cpu.health <= 0
      ? "draw"
      : state.cpu.health <= 0
        ? "victory"
        : state.player.health <= 0
          ? "defeat"
          : null;
  return {
    state,
    messages,
    damage,
    actions,
    previousDistance: before.distance,
    attackDistance,
    interrupted,
    dodged,
    blocked,
    staminaDelta: [
      state.player.stamina - before.player.stamina,
      state.cpu.stamina - before.cpu.stamina,
    ],
  };
}
// CPU sees only the last completed state. Difficulty changes reads, never damage or hidden knowledge.
export function chooseCpu(
  state: Match,
  random: () => number = Math.random,
): Action {
  const { cpu, player, distance } = state;
  const personality = FIGHTERS[cpu.id].personality;
  const weights: Record<Action, number> = {
    light: 5,
    heavy: 2,
    block: 2,
    dodge: 1.5,
    grab: 2,
    recover: 0.5,
    special: 2,
    advance: 1,
    retreat: 0.6,
  };
  const read =
    state.difficulty === "rookie"
      ? 0.3
      : state.difficulty === "expert"
        ? 1.7
        : 1;
  const count = (a: Action) =>
    player.history.filter((x) => x === a).length * read;
  weights.recover += cpu.stamina < 30 ? 18 : cpu.stamina < 55 ? 6 : 0;
  weights.block += cpu.health / FIGHTERS[cpu.id].maxHealth < 0.3 ? 3 : 0;
  weights.grab += count("block") * 3 + count("dodge") * 2;
  weights.light += count("heavy") * 3 + count("grab") * 2;
  weights.heavy += count("recover") * 2 + (player.stamina < 15 ? 3 : 0);
  weights.block += count("light") * 1.5;
  weights.dodge += count("special");
  if (personality === "pressure") {
    weights.light += 2;
    weights.special += 2;
    weights.advance += 1;
  }
  if (personality === "grappler") {
    weights.grab += 3;
    weights.heavy += 1;
    weights.advance += 2;
  }
  if (personality === "zoner") {
    weights.special += 3;
    weights.retreat += distance === "close" ? 10 : 0;
    if (distance === "mid") {
      weights.light += 7;
      weights.advance = 0;
    }
  }
  for (const a of ACTIONS) {
    const move = getMove(a, cpu.id);
    if (
      move.range.length &&
      !move.range.includes(shiftDistance(distance, move.movement ?? 0))
    )
      weights[a] *= 0.06;
  }
  if (distance === "far") {
    weights.advance += personality === "zoner" ? 1 : 18;
    weights.retreat = 0;
    weights.block *= 0.25;
    weights.dodge *= 0.25;
  }
  if (distance === "mid" && personality === "grappler") weights.advance += 6;
  if (distance === "close") weights.advance = 0;
  // A retreat read can lure short attacks out of range; approach can catch recovery.
  weights.retreat += distance !== "far" ? count("light") * 0.7 : 0;
  weights.advance +=
    distance !== "close" && personality !== "zoner"
      ? count("recover") * 1.4
      : 0;
  if (cpu.stamina > FIGHTERS[cpu.id].maxStamina - 15) weights.recover = 0.05;
  const available = ACTIONS.filter((a) => canUse(a, cpu));
  let ticket =
    Math.min(0.999999, Math.max(0, random())) *
    available.reduce((sum, a) => sum + weights[a], 0);
  return available.find((a) => (ticket -= weights[a]) < 0) ?? "recover";
}
