import { chooseCpu, newMatch, resolveTurn } from "../src/game/combat.ts";
import { FIGHTER_IDS } from "../src/game/data.ts";
let seed = 20260923;
const random = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
console.log(
  "Deterministic standard CPU mirrors — 100 matches per pairing. Not a substitute for human balance testing.",
);
for (const player of FIGHTER_IDS)
  for (const cpu of FIGHTER_IDS) {
    let wins = 0,
      draws = 0,
      totalTurns = 0,
      unfinished = 0;
    for (let i = 0; i < 100; i++) {
      let s = newMatch(player, cpu);
      while (!s.outcome && s.turn <= 300) {
        const a = chooseCpu({ ...s, player: s.cpu, cpu: s.player }, random),
          b = chooseCpu(s, random);
        s = resolveTurn(s, a, b).state;
      }
      if (s.outcome === "victory") wins++;
      if (s.outcome === "draw") draws++;
      if (!s.outcome) unfinished++;
      totalTurns += s.turn - 1;
    }
    console.log(
      `${player.padEnd(6)} vs ${cpu.padEnd(6)} | wins ${String(wins).padStart(3)}% | draws ${draws} | mean ${(totalTurns / 100).toFixed(1)} turns | unfinished ${unfinished}`,
    );
  }
