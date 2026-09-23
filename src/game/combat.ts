export type Action = 'light' | 'heavy' | 'block' | 'dodge' | 'grab' | 'recover';
export type Distance = 'close' | 'mid' | 'far';
export interface Move {
  name: string; damage: number; cost: number; speed: number; range: Distance[];
  type: 'strike' | 'grab' | 'defense' | 'recovery'; description: string;
  chip?: number; guardCost?: number; recovery?: number; vulnerability?: number;
}
export const MOVES: Record<Action, Move> = {
  light: { name: 'Light attack', damage: 12, cost: 15, speed: 8, range: ['close', 'mid'], type: 'strike', description: 'Fast pressure. Interrupts heavy attacks.' },
  heavy: { name: 'Heavy attack', damage: 25, cost: 35, speed: 3, range: ['close', 'mid'], type: 'strike', chip: 8, guardCost: 25, description: 'Breaks passive guards. Risky against light.' },
  block: { name: 'Block', damage: 0, cost: 0, speed: 10, range: [], type: 'defense', description: 'Stops light; heavy costs 25 guard stamina. Loses to grab.' },
  dodge: { name: 'Dodge', damage: 0, cost: 25, speed: 10, range: [], type: 'defense', description: 'Evades strikes. Repeated dodge costs +10, then +20.' },
  grab: { name: 'Grab', damage: 15, cost: 20, speed: 5, range: ['close'], type: 'grab', description: 'Catches blocks and dodges. Loses to light.' },
  recover: { name: 'Recover', damage: 0, cost: 0, speed: 0, range: [], type: 'recovery', recovery: 30, vulnerability: 1.4, description: 'Restore 30 stamina. Take 40% more damage.' },
};
export interface FighterDefinition { name: string; maxHealth: number; maxStamina: number; moves: Action[]; color: number; portrait?: string; passive?: string; personality?: string }
export const FIGHTERS: FighterDefinition[] = [
  { name: 'Vector', maxHealth: 100, maxStamina: 100, moves: Object.keys(MOVES) as Action[], color: 0xa8f0cb },
  { name: 'Rook', maxHealth: 100, maxStamina: 100, moves: Object.keys(MOVES) as Action[], color: 0xf4a078, personality: 'balanced' },
];
export interface Fighter { health: number; stamina: number; history: Action[] }
export interface Match { player: Fighter; cpu: Fighter; distance: Distance; turn: number; outcome: 'victory' | 'defeat' | 'draw' | null }
export interface Resolution { state: Match; messages: string[]; damage: [number, number]; staminaDelta: [number, number]; actions: [Action, Action] }
export function newMatch(): Match { return { player: { health: 100, stamina: 100, history: [] }, cpu: { health: 100, stamina: 100, history: [] }, distance: 'close', turn: 1, outcome: null }; }
export function cost(action: Action, fighter: Fighter): number {
  let repeats = 0;
  if (action === 'dodge') for (const previous of [...fighter.history].reverse()) { if (previous !== 'dodge') break; repeats++; }
  return MOVES[action].cost + Math.min(repeats, 2) * 10;
}
export function canUse(action: Action, fighter: Fighter): boolean { return fighter.stamina >= cost(action, fighter); }
export function resolveTurn(before: Match, playerAction: Action, cpuAction: Action): Resolution {
  if (before.outcome) throw new Error('The match is already finished.');
  const actions: [Action, Action] = [playerAction, cpuAction];
  const original = [before.player, before.cpu];
  actions.forEach((a, i) => { if (!canUse(a, original[i])) throw new Error('Insufficient stamina.'); });
  const state: Match = structuredClone(before);
  const fighters = [state.player, state.cpu];
  const names = ['You', 'Rook'];
  const messages: string[] = [];
  const damage: [number, number] = [0, 0];
  actions.forEach((a, i) => { fighters[i].stamina -= cost(a, original[i]); });
  // Determine active hits from the same snapshot. Equal-speed attacks trade.
  const inRange = actions.map(a => MOVES[a].range.includes(state.distance));
  const offensive = actions.map(a => ['strike', 'grab'].includes(MOVES[a].type));
  const interrupted = actions.map((a, i) => offensive[i] && offensive[1-i] && inRange[i] && inRange[1-i] && MOVES[actions[1-i]].speed > MOVES[a].speed);
  actions.forEach((action, i) => {
    const target = 1-i, move = MOVES[action], defense = actions[target];
    if (!offensive[i]) return;
    if (!inRange[i]) { messages.push(`${names[i]}: ${move.name} missed at ${state.distance} range.`); return; }
    if (interrupted[i]) { messages.push(`${names[target]} interrupted ${names[i] === 'You' ? 'your' : "Rook’s"} ${move.name.toLowerCase()}.`); return; }
    if (defense === 'dodge' && move.type === 'strike') { messages.push(`${names[target]} dodged ${names[i] === 'You' ? 'your' : "Rook’s"} ${move.name.toLowerCase()}.`); return; }
    let hit = move.damage;
    if (defense === 'block' && move.type === 'strike') {
      const guardCost = move.guardCost ?? 10;
      if (fighters[target].stamina >= guardCost) { fighters[target].stamina -= guardCost; hit = move.chip ?? 0; messages.push(`${names[target]} blocked ${move.name.toLowerCase()} (${hit} chip; −${guardCost} stamina).`); }
      else { fighters[target].stamina = 0; messages.push(`${names[target]}: guard broken! Not enough stamina to absorb the hit.`); }
    } else {
      if (MOVES[defense].vulnerability) hit = Math.round(hit * MOVES[defense].vulnerability!);
      messages.push(`${names[i]}: ${move.name} hit for ${hit}${defense === 'recover' ? ' — recovery punished' : move.type === 'grab' && ['block', 'dodge'].includes(defense) ? ` — caught ${defense}` : ''}.`);
    }
    damage[target] = hit;
  });
  fighters.forEach((fighter, i) => {
    fighter.health = Math.max(0, fighter.health - damage[i]);
    const recovery = MOVES[actions[i]].recovery;
    if (recovery) { const restored = Math.min(recovery, 100 - fighter.stamina); fighter.stamina += restored; messages.push(`${names[i]} recovered ${restored} stamina.`); }
    fighter.history = [...fighter.history, actions[i]].slice(-5);
  });
  if (!messages.length) messages.push('Both fighters held their defenses. No damage dealt.');
  state.turn++;
  state.outcome = state.player.health <= 0 && state.cpu.health <= 0 ? 'draw' : state.cpu.health <= 0 ? 'victory' : state.player.health <= 0 ? 'defeat' : null;
  return { state, messages, damage, staminaDelta: [state.player.stamina-before.player.stamina, state.cpu.stamina-before.cpu.stamina], actions };
}
// Only completed history is available here. The UI calls this before enabling input.
export function chooseCpu(state: Match, random: () => number = Math.random): Action {
  const weights: Record<Action, number> = { light: 5, heavy: 2, block: 2, dodge: 2, grab: 2, recover: 1 };
  const history = state.player.history;
  const count = (a: Action) => history.filter(x => x === a).length;
  weights.recover += state.cpu.stamina < 35 ? 14 : state.cpu.stamina < 65 ? 5 : 0;
  weights.block += state.cpu.health < 30 ? 3 : 0;
  weights.grab += count('block') * 3 + count('dodge') * 2;
  weights.light += count('heavy') * 3;
  weights.heavy += count('recover') * 2 + (state.player.stamina < 15 ? 3 : 0);
  weights.block += count('light') * 2;
  weights.dodge += count('light');
  if (state.cpu.stamina > 85) weights.recover = 0.1;
  if (state.distance !== 'close') weights.grab = 0;
  if (state.distance === 'far') { weights.light = 0; weights.heavy = 0; }
  const available = (Object.keys(MOVES) as Action[]).filter(a => canUse(a, state.cpu));
  let ticket = random() * available.reduce((sum, a) => sum + weights[a], 0);
  return available.find(a => (ticket -= weights[a]) < 0) ?? 'recover';
}
