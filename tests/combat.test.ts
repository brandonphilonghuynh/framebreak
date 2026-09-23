import { test } from "node:test";
import assert from "node:assert/strict";
import {
  newMatch,
  resolveTurn,
  canUse,
  cost,
  chooseCpu,
} from "../src/game/combat.ts";
import {
  ACTIONS,
  FIGHTER_IDS,
  FIGHTERS,
  DISTANCES,
  getMove,
  type Action,
  type Difficulty,
} from "../src/game/data.ts";
const mirror = () => {
  const s = newMatch("vector", "vector");
  s.distance = "close";
  return s;
};
test("all 2,187 fighter/range/action combinations conserve resources and preserve input", () => {
  for (const player of FIGHTER_IDS)
    for (const cpu of FIGHTER_IDS)
      for (const distance of DISTANCES)
        for (const a of ACTIONS)
          for (const b of ACTIONS) {
            const before = newMatch(player, cpu);
            before.distance = distance;
            const snapshot = structuredClone(before),
              result = resolveTurn(before, a, b);
            assert.deepEqual(before, snapshot);
            assert.equal(result.state.turn, 2);
            assert.ok(result.messages.length);
            assert.ok(DISTANCES.includes(result.state.distance));
            for (const f of [result.state.player, result.state.cpu]) {
              assert.ok(f.health >= 0 && f.health <= FIGHTERS[f.id].maxHealth);
              assert.ok(
                f.stamina >= 0 && f.stamina <= FIGHTERS[f.id].maxStamina,
              );
              assert.ok(f.specialCooldown >= 0 && f.specialCooldown <= 2);
            }
          }
});
test("symmetric resolution has no player-first damage advantage", () => {
  for (const player of FIGHTER_IDS)
    for (const cpu of FIGHTER_IDS)
      for (const a of ACTIONS)
        for (const b of ACTIONS) {
          const first = resolveTurn(newMatch(player, cpu), a, b),
            second = resolveTurn(newMatch(cpu, player), b, a);
          assert.deepEqual(first.damage, [...second.damage].reverse());
          assert.deepEqual(first.state.player, second.state.cpu);
          assert.deepEqual(first.state.cpu, second.state.player);
          assert.equal(first.state.distance, second.state.distance);
        }
});
test("faster strikes interrupt heavy/grab; equal-speed strikes trade", () => {
  for (const slower of ["heavy", "grab"] as Action[])
    assert.deepEqual(resolveTurn(mirror(), "light", slower).damage, [0, 11]);
  assert.deepEqual(resolveTurn(mirror(), "light", "light").damage, [11, 11]);
});
test("guard absorbs light; heavy chips and drains guard; exhaustion breaks guard", () => {
  let result = resolveTurn(mirror(), "block", "light");
  assert.deepEqual(result.damage, [0, 0]);
  assert.equal(result.state.player.stamina, 90);
  assert.equal(result.blocked[0], true);
  result = resolveTurn(mirror(), "block", "heavy");
  assert.equal(result.damage[0], 8);
  assert.equal(result.state.player.stamina, 75);
  const before = mirror();
  before.player.stamina = 9;
  result = resolveTurn(before, "block", "light");
  assert.equal(result.damage[0], 11);
  assert.equal(result.state.player.stamina, 0);
  assert.equal(result.blocked[0], false);
});
test("dodge avoids strikes, grab catches dodge/block, repeated dodge costs reset", () => {
  assert.equal(resolveTurn(mirror(), "dodge", "heavy").damage[0], 0);
  assert.equal(resolveTurn(mirror(), "dodge", "heavy").dodged[0], true);
  assert.equal(resolveTurn(mirror(), "dodge", "grab").damage[0], 15);
  assert.equal(resolveTurn(mirror(), "block", "grab").damage[0], 15);
  const before = mirror();
  before.player.history = ["dodge"];
  assert.equal(cost("dodge", before.player), 35);
  before.player.history.push("dodge");
  assert.equal(cost("dodge", before.player), 45);
  before.player.history.push("block");
  assert.equal(cost("dodge", before.player), 25);
});
test("recovery respects different stamina caps and vulnerability", () => {
  for (const id of FIGHTER_IDS) {
    const before = newMatch(id, "vector");
    before.player.stamina = 0;
    const r = resolveTurn(before, "recover", "heavy");
    assert.equal(r.state.player.stamina, getMove("recover", id).recovery);
    assert.equal(r.damage[0], 34);
    before.player.stamina = FIGHTERS[id].maxStamina - 2;
    assert.equal(resolveTurn(before, "recover", "block").staminaDelta[0], 2);
  }
});
test("unaffordable actions reject atomically and free choices stay legal", () => {
  const before = mirror();
  before.player.stamina = 0;
  const snapshot = structuredClone(before);
  for (const a of ACTIONS.filter((a) => !["block", "recover"].includes(a))) {
    assert.equal(canUse(a, before.player), false);
    assert.throws(() => resolveTurn(before, a, "block"), /stamina/);
  }
  assert.deepEqual(before, snapshot);
  assert.equal(canUse("block", before.player), true);
  assert.equal(canUse("recover", before.player), true);
});
test("movement combines simultaneously: matching steps stack, opposite cancel, bounds clamp", () => {
  let before = newMatch();
  before.distance = "far";
  assert.equal(
    resolveTurn(before, "advance", "advance").state.distance,
    "close",
  );
  before.distance = "close";
  assert.equal(resolveTurn(before, "retreat", "retreat").state.distance, "far");
  before.distance = "mid";
  assert.equal(resolveTurn(before, "advance", "retreat").state.distance, "mid");
  before.distance = "close";
  const r = resolveTurn(before, "advance", "block");
  assert.equal(r.state.distance, "close");
  assert.equal(r.staminaDelta[0], -8);
});
test("range checks happen after footwork; retreat is not invulnerability", () => {
  let before = mirror();
  let r = resolveTurn(before, "retreat", "grab");
  assert.equal(r.damage[0], 0);
  assert.equal(r.state.distance, "mid");
  r = resolveTurn(before, "retreat", "heavy");
  assert.equal(r.damage[0], 24);
  before.distance = "mid";
  r = resolveTurn(before, "grab", "advance");
  assert.equal(r.damage[1], 15);
  assert.equal(r.state.distance, "close");
  before.distance = "far";
  assert.deepEqual(resolveTurn(before, "light", "heavy").damage, [0, 0]);
});
test("Vector signature shifts distance first and spends cooldown even on interruption", () => {
  const before = newMatch("vector", "rook");
  before.distance = "far";
  const r = resolveTurn(before, "special", "recover");
  assert.equal(r.attackDistance, "mid");
  assert.equal(r.damage[1], 25);
  assert.equal(r.state.player.specialCooldown, 2);
  before.distance = "close";
  const interrupted = resolveTurn(before, "special", "light");
  assert.equal(interrupted.interrupted[0], true);
  assert.equal(interrupted.damage[1], 0);
  assert.equal(interrupted.state.player.specialCooldown, 2);
});
test("special needs two intervening turns; cooldown blocks otherwise affordable selection", () => {
  let s = resolveTurn(mirror(), "special", "block").state;
  s.player.stamina = 100;
  assert.equal(canUse("special", s.player), false);
  assert.throws(() => resolveTurn(s, "special", "block"), /Ready in 2 turns/);
  s = resolveTurn(s, "recover", "block").state;
  assert.equal(s.player.specialCooldown, 1);
  s = resolveTurn(s, "block", "block").state;
  assert.equal(s.player.specialCooldown, 0);
  assert.equal(canUse("special", s.player), true);
});
test("Rook signature pushes only on unguarded hit; Nyx signature reaches Far and whiffs Close", () => {
  let s = newMatch("rook", "vector");
  s.distance = "close";
  let r = resolveTurn(s, "special", "recover");
  assert.equal(r.state.distance, "mid");
  assert.equal(r.damage[1], 39);
  r = resolveTurn(s, "special", "block");
  assert.equal(r.state.distance, "close");
  assert.equal(r.damage[1], 9);
  r = resolveTurn(s, "special", "dodge");
  assert.equal(r.state.distance, "close");
  assert.equal(r.damage[1], 0);
  s = newMatch("nyx", "rook");
  s.distance = "far";
  assert.equal(resolveTurn(s, "special", "block").damage[1], 6);
  s.distance = "close";
  assert.equal(resolveTurn(s, "special", "recover").damage[1], 0);
});
test("fighter definitions affect caps, reach, speed, damage and recovery", () => {
  const s = newMatch("rook", "nyx");
  assert.equal(s.player.health, 120);
  assert.equal(s.player.stamina, 90);
  assert.equal(s.cpu.health, 90);
  assert.equal(s.cpu.stamina, 110);
  assert.deepEqual(getMove("light", "rook").range, ["close"]);
  assert.deepEqual(getMove("light", "nyx").range, ["mid"]);
  assert.equal(getMove("grab", "rook").damage, 21);
  assert.equal(getMove("recover", "nyx").recovery, 32);
});
test("victory, defeat, draw and rejecting actions after game over", () => {
  let before = mirror();
  before.cpu.health = 10;
  assert.equal(
    resolveTurn(before, "light", "recover").state.outcome,
    "victory",
  );
  before.player.health = 10;
  before.cpu.health = 100;
  assert.equal(resolveTurn(before, "recover", "light").state.outcome, "defeat");
  before.cpu.health = 10;
  const result = resolveTurn(before, "light", "light");
  assert.equal(result.state.outcome, "draw");
  assert.throws(() => resolveTurn(result.state, "block", "block"), /finished/);
  assert.deepEqual(newMatch("nyx", "rook"), newMatch("nyx", "rook"));
  assert.equal(newMatch().player.history.length, 0);
  assert.equal(newMatch().player.specialCooldown, 0);
});
test("CPU always respects costs/cooldowns; history stays at five moves", () => {
  for (const id of FIGHTER_IDS) {
    const s = newMatch("vector", id);
    s.cpu.stamina = 0;
    s.cpu.specialCooldown = 2;
    for (let i = 0; i < 100; i++)
      assert.ok(["block", "recover"].includes(chooseCpu(s, () => i / 100)));
  }
  let s = mirror();
  for (let i = 0; i < 8; i++) s = resolveTurn(s, "recover", "recover").state;
  assert.equal(s.player.history.length, 5);
});
test("CPU reads public habits and personalities without a current-action input", () => {
  const baseline = newMatch("vector", "rook");
  baseline.distance = "close";
  const repeated = structuredClone(baseline);
  repeated.player.history = ["block", "block", "block", "block", "block"];
  const counts = (s: typeof baseline, a: Action) => {
    let count = 0;
    for (let i = 0; i < 1000; i++)
      if (chooseCpu(s, () => i / 1000) === a) count++;
    return count;
  };
  assert.ok(counts(repeated, "grab") > counts(baseline, "grab") * 1.5);
  const far = newMatch("vector", "rook");
  far.distance = "far";
  assert.ok(counts(far, "advance") > 500);
  const zoner = newMatch("vector", "nyx");
  zoner.distance = "far";
  assert.ok(counts(zoner, "special") > counts(far, "special"));
  repeated.difficulty = "rookie";
  const rookie = counts(repeated, "grab");
  repeated.difficulty = "expert";
  assert.ok(counts(repeated, "grab") > rookie);
});
test("270 deterministic matches across rosters and difficulty complete with valid stats", () => {
  let seed = 42;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (const player of FIGHTER_IDS)
    for (const cpu of FIGHTER_IDS)
      for (const difficulty of ["rookie", "standard", "expert"] as Difficulty[])
        for (let i = 0; i < 10; i++) {
          let s = newMatch(player, cpu, difficulty),
            turns = 0;
          while (!s.outcome && turns < 500) {
            const choices = ACTIONS.filter((a) => canUse(a, s.player));
            s = resolveTurn(
              s,
              choices[Math.floor(random() * choices.length)],
              chooseCpu(s, random),
            ).state;
            assert.ok(s.player.stamina >= 0 && s.cpu.stamina >= 0);
            turns++;
          }
          assert.ok(
            s.outcome,
            `${player}/${cpu}/${difficulty} did not terminate`,
          );
        }
});
