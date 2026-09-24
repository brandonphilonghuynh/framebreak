import { createWorld, tick } from "../src/game/simulation.ts";
import { CpuController } from "../src/game/cpu.ts";
import { FIGHTER_IDS, ARENA_IDS } from "../src/game/data.ts";
let seed = 20260923;
const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
console.log(
  `Realtime deterministic CPU-vs-CPU sweep. ${FIGHTER_IDS.length ** 2 * ARENA_IDS.length} fighter/arena matchups with gear; a smoke test, not human balance proof.`,
);
let games = 0,
  seconds = 0,
  timeouts = 0,
  ultimates = 0,
  matchesWithUltimate = 0;
const wins: Record<string, number> = Object.fromEntries(
  FIGHTER_IDS.map((id) => [id, 0]),
);
for (const player of FIGHTER_IDS)
  for (const cpu of FIGHTER_IDS)
    for (const arena of ARENA_IDS) {
      const w = createWorld({
        player,
        cpu,
        arena,
        difficulty: "standard",
        mode: "duel",
        hazards: false,
        equipment: true,
      });
      const a = new CpuController("standard", random, 0),
        b = new CpuController("standard", random, 1);
      let frames = 0;
      while (w.winner === null && frames++ < 16000)
        tick(w, [a.update(w), b.update(w)]);
      games++;
      const used = w.fighters.reduce((sum, f) => sum + f.ultimatesUsed, 0);
      ultimates += used;
      if (used > 0) matchesWithUltimate++;
      seconds += w.time;
      if (w.remaining === 0) timeouts++;
      if (w.winner === null)
        throw new Error(`Unfinished ${player}/${cpu}/${arena}`);
      if (w.winner !== null && w.winner !== "draw")
        wins[w.fighters[w.winner].id]++;
      console.log(
        `${player.padEnd(6)} / ${cpu.padEnd(6)} / ${arena.padEnd(7)} | ${Math.round(w.time)}s | stocks ${w.fighters.map((f) => f.stocks).join(":")} | hits ${w.fighters.map((f) => f.hits).join(":")}`,
      );
    }
console.log({
  games,
  meanSeconds: Math.round(seconds / games),
  timeouts,
  wins,
  ultimates,
  matchesWithUltimate,
});
