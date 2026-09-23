import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MOVES,
  newMatch,
  resolveTurn,
  canUse,
  cost,
  chooseCpu,
  type Action,
} from "../src/game/combat.ts";
const actions = Object.keys(MOVES) as Action[];
test("all 36 simultaneous matchups conserve bounds and do not mutate input", () => {
  for (const a of actions)
    for (const b of actions) {
      const state = newMatch();
      const result = resolveTurn(state, a, b);
      assert.equal(state.turn, 1);
      assert.equal(state.player.health, 100);
      assert.equal(result.state.turn, 2);
      for (const f of [result.state.player, result.state.cpu]) {
        assert.ok(f.health >= 0 && f.health <= 100);
        assert.ok(f.stamina >= 0 && f.stamina <= 100);
      }
      assert.ok(result.messages.length);
    }
});
test("speed interrupts heavy and grab; equal speed trades", () => {
  for (const a of ["heavy", "grab"] as Action[]) {
    const r = resolveTurn(newMatch(), "light", a);
    assert.deepEqual(r.damage, [0, 12]);
  }
  assert.deepEqual(resolveTurn(newMatch(), "light", "light").damage, [12, 12]);
});
test("block absorbs light, heavy chips and drains, insufficient guard breaks", () => {
  let r = resolveTurn(newMatch(), "block", "light");
  assert.deepEqual(r.damage, [0, 0]);
  assert.equal(r.state.player.stamina, 90);
  r = resolveTurn(newMatch(), "block", "heavy");
  assert.equal(r.damage[0], 8);
  assert.equal(r.state.player.stamina, 75);
  const s = newMatch();
  s.player.stamina = 9;
  r = resolveTurn(s, "block", "light");
  assert.equal(r.damage[0], 12);
  assert.equal(r.state.player.stamina, 0);
});
test("dodge avoids strikes but loses to grab and repetition costs more", () => {
  assert.equal(resolveTurn(newMatch(), "dodge", "heavy").damage[0], 0);
  assert.equal(resolveTurn(newMatch(), "dodge", "grab").damage[0], 15);
  const s = newMatch();
  s.player.history = ["dodge"];
  assert.equal(cost("dodge", s.player), 35);
  s.player.history.push("dodge");
  assert.equal(cost("dodge", s.player), 45);
});
test("grab beats block; recover restores stamina and takes bonus damage", () => {
  assert.equal(resolveTurn(newMatch(), "grab", "block").damage[1], 15);
  const s = newMatch();
  s.player.stamina = 10;
  const r = resolveTurn(s, "recover", "heavy");
  assert.equal(r.state.player.stamina, 40);
  assert.equal(r.damage[0], 35);
});
test("invalid moves reject without mutation; free choices remain available", () => {
  const s = newMatch();
  s.player.stamina = 0;
  assert.equal(canUse("heavy", s.player), false);
  assert.equal(canUse("block", s.player), true);
  assert.equal(canUse("recover", s.player), true);
  assert.throws(() => resolveTurn(s, "heavy", "light"), /Insufficient/);
  assert.equal(s.player.stamina, 0);
});
test("range limits apply from data", () => {
  const s = newMatch();
  s.distance = "mid";
  assert.equal(resolveTurn(s, "grab", "recover").damage[1], 0);
  s.distance = "far";
  assert.deepEqual(resolveTurn(s, "light", "heavy").damage, [0, 0]);
});
test("victory, defeat, simultaneous knockout and fresh restart", () => {
  const s = newMatch();
  s.cpu.health = 12;
  assert.equal(resolveTurn(s, "light", "recover").state.outcome, "victory");
  s.player.health = 12;
  s.cpu.health = 100;
  assert.equal(resolveTurn(s, "recover", "light").state.outcome, "defeat");
  s.cpu.health = 12;
  assert.equal(resolveTurn(s, "light", "light").state.outcome, "draw");
  assert.deepEqual(newMatch().player, {
    health: 100,
    stamina: 100,
    history: [],
  });
});
test("CPU respects stamina and history is capped at five", () => {
  const s = newMatch();
  s.cpu.stamina = 0;
  for (let i = 0; i < 100; i++)
    assert.ok(["block", "recover"].includes(chooseCpu(s, () => i / 100)));
  let match = newMatch();
  for (let i = 0; i < 8; i++)
    match = resolveTurn(match, "recover", "recover").state;
  assert.equal(match.player.history.length, 5);
});
test("CPU habits shift weighted decisions without current action input", () => {
  const neutral = newMatch(),
    habitual = newMatch();
  habitual.player.history = ["block", "block", "block", "block", "block"];
  let first = 0,
    second = 0;
  for (let i = 0; i < 1000; i++) {
    if (chooseCpu(neutral, () => i / 1000) === "grab") first++;
    if (chooseCpu(habitual, () => i / 1000) === "grab") second++;
  }
  assert.ok(second > first * 2);
});
test("simulated matches terminate with valid stats", () => {
  let seed = 42;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 100; i++) {
    let s = newMatch();
    let turns = 0;
    while (!s.outcome && turns < 300) {
      const choices = actions.filter((a) => canUse(a, s.player));
      s = resolveTurn(
        s,
        choices[Math.floor(random() * choices.length)],
        chooseCpu(s, random),
      ).state;
      turns++;
    }
    assert.ok(s.outcome);
  }
});
