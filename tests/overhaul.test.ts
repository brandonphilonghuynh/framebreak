import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createWorld,
  tick,
  neutralInput,
  applyAttack,
  type Attack,
  type Input,
  type WorldState,
} from "../src/game/simulation.ts";
import {
  FIGHTER_IDS,
  FIGHTERS,
  PRICES,
  type FighterId,
} from "../src/game/data.ts";
import { PHYSIQUES, SPECIALS, ULTIMATES } from "../src/game/roster.ts";
import { COMBAT } from "../src/game/tuning.ts";
import { newProfile, purchase, parseProfile } from "../src/game/progression.ts";
import { profileSections, fighterStats } from "../src/ui/fighter-profile.ts";
import { SIGNATURES } from "../src/game/equipment.ts";
import { LORE } from "../src/game/lore.ts";
const base = {
  player: "vector" as const,
  cpu: "vector" as const,
  arena: "skyline" as const,
  mode: "duel" as const,
  difficulty: "standard" as const,
  hazards: false,
};
function ready(id: FighterId = "vector", cpu: FighterId = "vector") {
  const w = createWorld({ ...base, player: id, cpu });
  w.fighters.forEach((f, i) =>
    Object.assign(f, {
      x: i ? 1050 : 600,
      y: 500,
      grounded: true,
      invulnerable: 0,
    }),
  );
  return w;
}
function step(
  w: WorldState,
  count = 1,
  player: Partial<Input> = {},
  cpu: Partial<Input> = {},
) {
  for (let i = 0; i < count; i++)
    tick(w, [
      { ...neutralInput(), ...player },
      { ...neutralInput(), ...cpu },
    ]);
}
function hit(props: Partial<Attack> = {}): Attack {
  return {
    id: 200,
    owner: 0,
    kind: "light",
    x: 660,
    y: 450,
    vx: 0,
    vy: 0,
    width: 60,
    height: 50,
    life: 1,
    damage: 10,
    force: 0,
    vertical: 0.5,
    direction: 1,
    projectile: false,
    follow: false,
    hit: [],
    color: 0xffffff,
    charge: 0,
    ...props,
  };
}
function cast(w: WorldState, held = false) {
  step(w, 1, { special: true });
  const ticks = Math.ceil(SPECIALS[w.config.player].windup * 60) + 1;
  step(w, ticks, { special: held });
}

test("normal stun is exactly 0.5 simulation seconds, cannot refresh, and grants a control window", () => {
  const w = ready(),
    f = w.fighters[1];
  f.x = 750;
  applyAttack(w, hit({ force: 500 }), f);
  assert.equal(f.stun, 0.5);
  w.hitstop = 0;
  step(w, 12);
  const remaining = f.stun;
  applyAttack(w, hit({ id: 201 }), f);
  assert.equal(f.stun, remaining);
  w.hitstop = 0;
  step(w, 19);
  assert.equal(f.stun, 0);
  assert.ok(f.stunGrace > 0);
  const vx = f.vx;
  applyAttack(w, hit({ id: 202, force: 800, stun: 1.4 }), f);
  assert.equal(f.stun, 0);
  assert.equal(f.vx, vx);
  w.hitstop = 0;
  step(w, 1, {}, { dodge: true });
  assert.equal(f.dodgeCharges, 0);
  assert.ok(f.invulnerable > 0);
});

test("repeated hits cannot immobilize a pilot indefinitely", () => {
  for (const id of FIGHTER_IDS) {
    const w = ready("vector", id),
      f = w.fighters[1];
    f.x = 750;
    let controlledFrames = 0;
    for (let n = 0; n < 240; n++) {
      // Dense overlapping attacks, including spikes, must still yield control.
      if (n % 4 === 0)
        applyAttack(w, hit({ id: n, stun: n % 8 === 0 ? 0.65 : undefined }), f);
      w.hitstop = 0;
      step(w);
      if (f.stun === 0) controlledFrames++;
    }
    assert.ok(controlledFrames >= 35, `${id}: ${controlledFrames}`);
  }
});

test("Ember has a ground jump plus two air jumps; landing restores all three", () => {
  const w = ready("ember"),
    f = w.fighters[0];
  assert.equal(f.jumps, 3);
  for (const remaining of [2, 1, 0]) {
    step(w, 1, { jump: true });
    assert.equal(f.jumps, remaining);
    assert.ok(f.vy < -600);
    step(w);
  }
  const before = f.vy;
  step(w, 1, { jump: true });
  assert.ok(f.vy > before);
  step(w, 180);
  assert.ok(f.grounded);
  assert.equal(f.jumps, 3);
});

test("Ember can spend two dodge charges, never three, and they refill serially", () => {
  const w = ready("ember"),
    f = w.fighters[0];
  step(w, 1, { dodge: true });
  assert.equal(f.dodgeCharges, 1);
  step(w, 19);
  step(w, 1, { dodge: true, move: -1 });
  assert.equal(f.dodgeCharges, 0);
  step(w, 19);
  step(w, 1, { dodge: true });
  assert.equal(f.dodgeCharges, 0);
  step(w, 62);
  assert.equal(f.dodgeCharges, 1);
  step(w, 100);
  assert.equal(f.dodgeCharges, 2);
  const other = ready("vector");
  step(other, 1, { dodge: true });
  step(other, 19);
  step(other, 1, { dodge: true });
  assert.equal(other.fighters[0].dodgeCharges, 0);
});

test("movement acceleration, aerial handling, weight and collision sizes differ by physique", () => {
  const speed: Record<string, number> = {};
  for (const id of FIGHTER_IDS) {
    const w = ready(id);
    step(w, 8, { move: 1 });
    speed[id] = w.fighters[0].vx;
  }
  assert.ok(speed.ember > speed.vector && speed.vector > speed.rook);
  assert.ok(speed.astra > speed.solis && speed.solis > speed.rook);
  assert.ok(PHYSIQUES.astra.airControl > PHYSIQUES.vector.airControl);
  assert.ok(PHYSIQUES.rook.hurtWidth > PHYSIQUES.ember.hurtWidth);
  assert.ok(
    FIGHTERS.rook.weight > FIGHTERS.solis.weight &&
      FIGHTERS.solis.weight > FIGHTERS.ember.weight,
  );
});

test("every signature activates once, has its own cooldown, and becomes reusable", () => {
  for (const id of FIGHTER_IDS) {
    const w = ready(id),
      f = w.fighters[0];
    step(w, 1, { special: true });
    assert.equal(f.specialCooldown, SPECIALS[id].cooldown);
    step(w, 70, { special: true });
    assert.equal(f.ability, null, id);
    // Keep the fighter safely grounded while testing cooldown, including Phoenix Dash.
    let activations = 1;
    for (let n = 0; n < Math.ceil(SPECIALS[id].cooldown * 60) + 10; n++) {
      Object.assign(f, { x: 600, y: 500, grounded: true, vx: 0, vy: 0 });
      step(w, 1, { special: n % 2 === 0 });
      activations += w.events.filter((e) => e.type === "ability").length;
    }
    assert.equal(activations, 2, id);
  }
});

test("Solar Lance telegraphs before firing in the locked facing direction and can be jumped", () => {
  const w = ready(),
    f = w.fighters[0];
  f.facing = -1;
  w.fighters[1].x = 350;
  step(w, 1, { special: true });
  step(w, 10);
  assert.equal(w.attacks.length, 0);
  step(w, 10);
  const beam = w.attacks.find((a) => a.effect === "solar-beam")!;
  assert.ok(beam);
  assert.ok(beam.x < f.x);
  assert.ok(w.fighters[1].damage > 0);
  const jump = ready();
  jump.fighters[1].x = 800;
  jump.fighters[1].y = 280;
  cast(jump);
  assert.equal(jump.fighters[1].damage, 0);
});

test("Starfall creates three individual non-homing projectiles with distinct lanes", () => {
  const w = ready("nyx");
  cast(w);
  const stars = w.attacks.filter((a) => a.effect === "star");
  assert.equal(stars.length, 3);
  assert.equal(new Set(stars.map((a) => a.vy)).size, 3);
  const velocities = stars.map((a) => [a.vx, a.vy]);
  w.fighters[1].x = 50;
  step(w, 6);
  assert.deepEqual(
    stars.map((a) => [a.vx, a.vy]),
    velocities,
  );
});

test("Bulwark absorbs regular interruption, releases a radial push, and loses to ultimates", () => {
  const w = ready("rook"),
    f = w.fighters[0];
  step(w, 1, { special: true });
  applyAttack(w, hit({ owner: 1 }), f);
  assert.equal(f.stun, 0);
  assert.equal(f.ability, "rook");
  assert.ok(f.damage < 10 * PHYSIQUES.rook.damageTaken);
  w.hitstop = 0;
  step(w, 30);
  const wave = w.attacks.find((a) => a.effect === "bulwark")!;
  assert.ok(wave);
  w.fighters[1].x = f.x - 60;
  applyAttack(w, wave, w.fighters[1]);
  assert.ok(w.fighters[1].vx < 0);
  const counter = ready("rook");
  step(counter, 1, { special: true });
  applyAttack(
    counter,
    hit({ owner: 1, kind: "ultimate" }),
    counter.fighters[0],
  );
  assert.equal(counter.fighters[0].ability, null);
  assert.equal(counter.fighters[0].stun, 0.5);
});

test("Phoenix Dash travels a bounded distance, hits once and is not invulnerable", () => {
  const w = ready("ember"),
    f = w.fighters[0];
  w.fighters[1].x = 720;
  const x = f.x;
  cast(w);
  assert.equal(f.invulnerable, 0);
  step(w, 28);
  assert.ok(f.x - x > 130 && f.x - x < 290, `${f.x - x}`);
  assert.equal(f.hits, 1);
  assert.ok(w.fighters[1].vx > 0);
});

test("Eclipse Field slows movement without stunning and defense ends outside its boundary", () => {
  const w = ready("solis"),
    f = w.fighters[0],
    enemy = w.fighters[1];
  enemy.x = 690;
  cast(w);
  assert.equal(w.fields.length, 1);
  const outside = ready("solis");
  outside.fighters[1].x = 690;
  step(w, 8, {}, { move: 1 });
  step(outside, 8, {}, { move: 1 });
  assert.ok(enemy.vx < outside.fighters[1].vx);
  assert.equal(enemy.stun, 0);
  applyAttack(w, hit({ owner: 1 }), f);
  assert.ok(Math.abs(f.damage - 10 * 0.92 * 0.8) < 1e-8);
  f.x = 300;
  f.invulnerable = 0;
  const before = f.damage;
  applyAttack(w, hit({ owner: 1, id: 201 }), f);
  assert.ok(Math.abs(f.damage - before - 9.2) < 1e-8);
  step(w, 200);
  assert.equal(w.fields.length, 0);
});

test("Tidal Orbit supports a held release and downward aim, then becomes an escapable single-pulse vortex", () => {
  const w = ready("astra"),
    f = w.fighters[0];
  step(w, 30, { special: true, down: true });
  assert.equal(f.ability, "astra");
  assert.equal(w.attacks.length, 0);
  step(w, 1, { down: true });
  const orb = w.attacks.find((a) => a.effect === "tidal-orb")!;
  assert.ok(orb.vx > 0 && orb.vy > 0);
  step(w, 37);
  const field = w.fields[0];
  assert.ok(field && field.kind === "vortex");
  const enemy = w.fighters[1];
  Object.assign(enemy, {
    x: field.x,
    y: field.y + 45,
    vx: 0,
    vy: 0,
    invulnerable: 0,
  });
  step(w);
  const damage = enemy.damage;
  assert.ok(damage > 0);
  for (let n = 0; n < 10; n++) {
    enemy.x = field.x;
    enemy.y = field.y + 45;
    w.hitstop = 0;
    step(w);
  }
  assert.equal(enemy.damage, damage);
  enemy.stun = 0;
  step(w, 45, {}, { move: 1 });
  assert.ok(Math.abs(enemy.x - field.x) > field.radius);
});

test("signature cooldowns never disable rising recovery, and cooldowns survive interruption", () => {
  for (const id of FIGHTER_IDS) {
    const w = ready(id),
      f = w.fighters[0];
    step(w, 1, { special: true });
    applyAttack(w, hit({ owner: 1, kind: "ultimate" }), f);
    assert.equal(f.ability, null);
    assert.ok(f.specialCooldown > 0);
    Object.assign(f, {
      stun: 0,
      stunGrace: 0,
      x: 100,
      y: 650,
      grounded: false,
      jumps: 0,
      last: neutralInput(),
    });
    w.hitstop = 0;
    step(w, 1, { special: true, up: true });
    step(w);
    assert.ok(f.recoveryUsed, id);
    assert.ok(f.vy < -800, id);
  }
});

test("Cataclysm waits for ground, expands, falls off at distance, and misses airborne opponents", () => {
  const w = ready("rook"),
    f = w.fighters[0];
  f.meter = 60;
  step(w, 1, { ultimate: true });
  step(w, 32);
  assert.equal(w.attacks.length, 0);
  step(w, 8);
  const wave = w.attacks.find((a) => a.effect === "cataclysm")!;
  assert.ok(wave);
  const width = wave.width;
  step(w, 8);
  assert.ok(wave.width > width);
  const near = ready("rook"),
    far = ready("rook");
  near.fighters[1].x = 630;
  far.fighters[1].x = 910;
  applyAttack(
    near,
    { ...wave, hit: [], hitCount: [], hitCooldown: [] },
    near.fighters[1],
  );
  applyAttack(
    far,
    { ...wave, hit: [], hitCount: [], hitCooldown: [] },
    far.fighters[1],
  );
  assert.ok(near.fighters[1].damage > far.fighters[1].damage);
  const air = ready("rook");
  air.fighters[0].meter = 60;
  Object.assign(air.fighters[0], { y: 100, grounded: false });
  step(air, 1, { ultimate: true });
  step(air, 40);
  assert.equal(air.attacks.length, 0);
  assert.equal(air.fighters[0].meter, 60);
  for (let n = 0; n < 50 && !air.attacks.length; n++) step(air);
  assert.equal(air.attacks[0]?.effect, "cataclysm");
  const jump = ready("rook");
  jump.fighters[0].meter = 60;
  jump.fighters[1].x = 680;
  step(jump, 1, { ultimate: true });
  step(jump, 24);
  step(jump, 1, {}, { jump: true });
  step(jump, 42, {}, { jump: true });
  assert.equal(jump.fighters[1].damage, 0);
});

test("each full ultimate has a bounded two-hit damage budget and remains parryable", () => {
  for (const id of FIGHTER_IDS) {
    const w = ready(id),
      f = w.fighters[0];
    f.meter = 60;
    step(w, 120, { ultimate: true });
    step(w);
    const a = w.attacks.find((a) => a.kind === "ultimate")!;
    assert.ok(a, id);
    const heavy =
      FIGHTERS[id].damage +
      3 +
      Math.max(...SIGNATURES[id].map((weapon) => weapon.damage));
    assert.ok(a.damage * 2 >= heavy * 1.5 && a.damage * 2 <= heavy * 2.001, id);
    assert.equal(f.meter, 0);
    assert.equal(f.ultimatesUsed, 1);
    const target = w.fighters[1];
    target.invulnerable = 0;
    target.facing = -1;
    target.parryWindow = 0.15;
    assert.equal(applyAttack(w, a, target), "parry", id);
  }
});

test("meter earns an ultimate sooner than the previous 100-point pacing and emits readiness once", () => {
  const w = ready(),
    f = w.fighters[0];
  for (let n = 0; n < 12; n++) applyAttack(w, hit({ id: n }), w.fighters[1]);
  assert.equal(f.meter, 60);
  assert.ok(120 * 0.35 < 100);
  w.hitstop = 0;
  step(w);
  assert.equal(
    w.events.filter((e) => e.type === "ready" && e.side === 0).length,
    1,
  );
  step(w);
  assert.equal(
    w.events.filter((e) => e.type === "ready" && e.side === 0).length,
    0,
  );
});

test("all requested prices deduct exactly once and ownership persists through save reload", () => {
  assert.deepEqual(PRICES, {
    vector: 0,
    rook: 3000,
    nyx: 3000,
    ember: 5000,
    solis: 7500,
    astra: 25000,
  });
  for (const id of FIGHTER_IDS.filter((id) => id !== "vector")) {
    const p = { ...newProfile(), currency: PRICES[id] };
    const bought = parseProfile(JSON.stringify(purchase(p, id)));
    assert.equal(bought.currency, 0);
    assert.ok(bought.unlocked.includes(id));
    assert.throws(() => purchase(bought, id));
    assert.equal(bought.currency, 0);
    assert.throws(() => purchase({ ...p, currency: p.currency - 1 }, id));
  }
});

test("every profile contains its own biography, mechanics, lore and mechanically derived stats", () => {
  for (const id of FIGHTER_IDS) {
    const sections = profileSections(id),
      stats = fighterStats(id),
      lore = LORE[id];
    for (const value of [
      lore.alias,
      lore.homeworld,
      lore.galaxy,
      lore.height,
      lore.weight,
      lore.background,
      lore.relationships,
      lore.quote,
      FIGHTERS[id].special,
      FIGHTERS[id].ultimate,
    ])
      assert.ok(sections.includes(value), `${id}: ${value}`);
    assert.ok(stats.includes(`${FIGHTERS[id].speed} u/s`));
    assert.ok(sections.includes(`${SPECIALS[id].cooldown}s cooldown`));
  }
});

test("walking or being hit off a platform preserves only the allotted mid-air jumps", () => {
  for (const id of FIGHTER_IDS) {
    const w = ready(id),
      f = w.fighters[0];
    f.x = 1005;
    step(w, 30, { move: 1 });
    assert.equal(f.grounded, false);
    assert.equal(f.jumps, PHYSIQUES[id].jumps - 1, id);
    const struck = ready("vector", id);
    const target = struck.fighters[1];
    target.x = 740;
    applyAttack(struck, hit({ force: 300 }), target);
    assert.equal(target.jumps, PHYSIQUES[id].jumps - 1, id);
  }
});
