import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createWorld,
  tick,
  neutralInput,
  applyAttack,
  type Attack,
  type WorldState,
  type Input,
} from "../src/game/simulation.ts";
import {
  FIGHTER_IDS,
  ARENA_IDS,
  FIGHTERS,
  type FighterId,
} from "../src/game/data.ts";
import { CpuController } from "../src/game/cpu.ts";
const config = {
  player: "vector" as const,
  cpu: "rook" as const,
  arena: "skyline" as const,
  difficulty: "standard" as const,
  mode: "duel" as const,
  hazards: false,
};
function ready(player: FighterId = "vector", cpu: FighterId = "rook") {
  const w = createWorld({ ...config, player, cpu });
  w.fighters.forEach((f, i) => {
    f.x = i ? 665 : 600;
    f.y = 500;
    f.invulnerable = 0;
    f.grounded = true;
  });
  return w;
}
function steps(
  w: WorldState,
  count: number,
  input: Partial<Input> = {},
  enemy: Partial<Input> = {},
) {
  for (let i = 0; i < count; i++)
    tick(w, [
      { ...neutralInput(), ...input },
      { ...neutralInput(), ...enemy },
    ]);
}
function attack(w: WorldState, props: Partial<Attack> = {}): Attack {
  return {
    id: 1,
    owner: 1,
    kind: "light",
    x: 625,
    y: 452,
    vx: -500,
    vy: 0,
    width: 90,
    height: 75,
    life: 1,
    damage: 10,
    force: 250,
    vertical: 0.6,
    direction: -1,
    projectile: false,
    follow: false,
    hit: [],
    color: 0xffffff,
    charge: 0,
    ...props,
  };
}
test("movement is continuous and double jumps stop at two until landing", () => {
  const w = ready();
  steps(w, 10, { move: -1 });
  assert.ok(w.fighters[0].x < 585);
  steps(w, 1, { jump: true });
  assert.equal(w.fighters[0].jumps, 1);
  assert.ok(w.fighters[0].vy < 0);
  steps(w, 1);
  steps(w, 1, { jump: true });
  assert.equal(w.fighters[0].jumps, 0);
  steps(w, 1);
  const before = w.fighters[0].vy;
  steps(w, 1, { jump: true });
  assert.ok(w.fighters[0].vy > before);
  steps(w, 180);
  assert.equal(w.fighters[0].jumps, 2);
  assert.equal(w.fighters[0].grounded, true);
});
test("jump release shortens upward travel; down drops only through thin platforms", () => {
  const long = ready(),
    short = ready();
  steps(long, 1, { jump: true });
  steps(short, 1, { jump: true });
  steps(long, 10, { jump: true });
  steps(short, 10);
  assert.ok(long.fighters[0].y < short.fighters[0].y);
  const w = ready();
  w.fighters[0].x = 400;
  w.fighters[0].y = 360;
  steps(w, 1, { down: true });
  assert.ok(w.fighters[0].y > 360);
  steps(w, 50);
  assert.equal(w.fighters[0].y, 500);
  steps(w, 5, { down: true });
  assert.equal(w.fighters[0].y, 500);
});
test("landing restores recovery and jumps across all arenas", () => {
  for (const arena of ARENA_IDS) {
    const w = createWorld({ ...config, arena });
    const f = w.fighters[0];
    f.x = arena === "tempest" ? 320 : 600;
    f.y = 20;
    f.jumps = 0;
    f.recoveryUsed = true;
    steps(w, 150);
    assert.ok(f.grounded);
    assert.equal(f.jumps, 2);
    assert.equal(f.recoveryUsed, false);
  }
});
test("charged special release has more damage than a tap for every fighter", () => {
  for (const id of FIGHTER_IDS) {
    const low = ready(id),
      high = ready(id);
    low.fighters[1].x = 1100;
    high.fighters[1].x = 1100;
    steps(low, 1, { special: true });
    steps(low, 1);
    steps(high, 75, { special: true });
    steps(high, 1);
    assert.ok(low.attacks.length);
    assert.ok(high.attacks.length);
    assert.ok(high.attacks[0].damage > low.attacks[0].damage + 8, id);
    assert.equal(high.fighters[0].charge, null);
  }
});
test("ultimate requires full meter and release spends it for all characters", () => {
  for (const id of FIGHTER_IDS) {
    const w = ready(id);
    w.fighters[1].x = 1150;
    steps(w, 1, { ultimate: true });
    assert.equal(w.fighters[0].charge, null);
    steps(w, 1);
    w.fighters[0].meter = 100;
    steps(w, 50, { ultimate: true });
    assert.equal(w.fighters[0].charge, "ultimate");
    steps(w, 1);
    assert.equal(w.fighters[0].meter, 0);
    assert.equal(w.attacks[0].kind, "ultimate");
  }
});
test("all playable ultimates can be parried; projectile ultimates reflect ownership", () => {
  for (const id of FIGHTER_IDS) {
    const w = ready("vector", id);
    const target = w.fighters[0];
    target.facing = 1;
    target.parryWindow = 0.1;
    target.guarding = true;
    const a = attack(w, {
      kind: "ultimate",
      projectile: id !== "rook",
      damage: 42,
    });
    const result = applyAttack(w, a, target);
    assert.equal(result, "parry");
    assert.equal(target.damage, 0);
    assert.equal(target.parries, 1);
    assert.equal(target.meter, 10);
    if (a.projectile) {
      assert.equal(a.owner, 0);
      assert.ok(a.vx > 0);
      assert.ok(a.damage > 42);
    } else assert.equal(a.life, 0);
    assert.ok(w.events.some((e) => e.text === "ULTIMATE PARRIED"));
  }
});
test("holding shield does not parry later hits and ultimates bypass it", () => {
  const w = ready();
  const f = w.fighters[0];
  f.facing = 1;
  steps(w, 15, { guard: true });
  assert.equal(f.parryWindow, 0);
  assert.equal(f.guarding, true);
  assert.equal(applyAttack(w, attack(w), f), "guard");
  assert.equal(f.damage, 0);
  assert.equal(
    applyAttack(w, attack(w, { id: 2, kind: "ultimate" }), f),
    "hit",
  );
  assert.equal(f.damage, 10);
});
test("parries require facing the attack and cannot be mashed without reset", () => {
  const w = ready();
  const f = w.fighters[0];
  f.facing = -1;
  f.parryWindow = 0.1;
  assert.equal(applyAttack(w, attack(w), f), "hit");
  const second = ready();
  steps(second, 1, { guard: true });
  assert.ok(second.fighters[0].parryWindow > 0);
  steps(second, 12);
  steps(second, 1, { guard: true });
  assert.equal(second.fighters[0].parryWindow, 0);
});
test("depleted shield breaks, dodge spends shield and prevents hits briefly", () => {
  const w = ready();
  const f = w.fighters[0];
  f.shield = 10;
  f.guarding = true;
  f.facing = 1;
  assert.equal(applyAttack(w, attack(w), f), "guard");
  assert.equal(f.shield, 0);
  assert.ok(f.stun >= 1);
  assert.equal(f.guarding, false);
  const second = ready();
  steps(second, 1, { dodge: true });
  assert.ok(second.fighters[0].invulnerable > 0);
  assert.ok(second.fighters[0].shield <= 82);
  assert.equal(
    applyAttack(second, attack(second), second.fighters[0]),
    "ignore",
  );
});
test("higher damage amplifies launch and heavier fighters resist it", () => {
  const low = ready(),
    high = ready();
  high.fighters[0].damage = 120;
  applyAttack(low, attack(low), low.fighters[0]);
  applyAttack(high, attack(high), high.fighters[0]);
  assert.ok(Math.abs(high.fighters[0].vx) > Math.abs(low.fighters[0].vx) * 1.7);
  const heavy = ready("rook"),
    light = ready("nyx");
  applyAttack(heavy, attack(heavy), heavy.fighters[0]);
  applyAttack(light, attack(light), light.fighters[0]);
  assert.ok(Math.abs(heavy.fighters[0].vx) < Math.abs(light.fighters[0].vx));
});
test("rising recovery is limited per airtime and interrupted charge does not fire", () => {
  const w = ready();
  w.fighters[1].x = 1100;
  w.fighters[0].y = 300;
  w.fighters[0].grounded = false;
  steps(w, 1, { special: true, up: true });
  steps(w, 1);
  assert.equal(w.fighters[0].recoveryUsed, true);
  assert.ok(w.fighters[0].vy < -600);
  w.fighters[0].specialCooldown = 0;
  w.fighters[0].attackCooldown = 0;
  w.fighters[0].dashTime = 0;
  steps(w, 1, { special: true, up: true });
  assert.equal(w.fighters[0].charge, null);
  const other = ready();
  steps(other, 1, { special: true });
  applyAttack(other, attack(other), other.fighters[0]);
  steps(other, 1);
  assert.equal(other.fighters[0].charge, null);
  assert.equal(other.attacks.length, 0);
});
test("an attack hits each target once and invulnerability prevents damage", () => {
  const w = ready();
  const a = attack(w);
  assert.equal(applyAttack(w, a, w.fighters[0]), "hit");
  assert.equal(applyAttack(w, a, w.fighters[0]), "ignore");
  assert.equal(w.fighters[0].damage, 10);
  w.fighters[0].invulnerable = 1;
  assert.equal(applyAttack(w, attack(w, { id: 2 }), w.fighters[0]), "ignore");
});
test("ringouts reset percent, subtract stocks and award a win; simultaneous final KOs draw", () => {
  const w = ready();
  w.fighters[1].y = 950;
  w.fighters[1].damage = 180;
  steps(w, 1);
  assert.equal(w.fighters[1].stocks, 2);
  assert.equal(w.fighters[1].damage, 0);
  assert.ok(w.fighters[1].invulnerable > 2);
  assert.equal(w.fighters[0].kos, 1);
  w.fighters[1].stocks = 1;
  w.fighters[1].y = 950;
  steps(w, 1);
  assert.equal(w.winner, 0);
  const time = w.time;
  steps(w, 10);
  assert.equal(w.time, time);
  const double = ready();
  double.fighters.forEach((f) => {
    f.stocks = 1;
    f.y = 950;
  });
  steps(double, 1);
  assert.equal(double.winner, "draw");
});
test("timeout uses stocks then damage then draw; practice never ends or spends stocks", () => {
  const w = ready();
  w.remaining = 0.001;
  w.fighters[0].damage = 40;
  steps(w, 1);
  assert.equal(w.winner, 1);
  const tie = ready();
  tie.remaining = 0.001;
  steps(tie, 1);
  assert.equal(tie.winner, "draw");
  const practice = createWorld({
    ...config,
    mode: "training",
    practiceInfiniteMeter: true,
  });
  practice.fighters[0].y = 950;
  steps(practice, 1);
  assert.equal(practice.fighters[0].stocks, 3);
  assert.equal(practice.winner, null);
  steps(practice, 1);
  assert.equal(practice.fighters[0].meter, 100);
});
test("hazards warn before damage, hit once per surge, and can be parried", () => {
  const w = ready();
  w.config.hazards = true;
  w.time = 9.8;
  steps(w, 1);
  assert.equal(w.fighters[0].damage, 0);
  w.time = 10.01;
  steps(w, 1);
  assert.equal(w.fighters[0].damage, 9);
  steps(w, 5);
  assert.equal(w.fighters[0].damage, 9);
  const parry = ready();
  parry.config.hazards = true;
  parry.time = 10.01;
  parry.fighters[0].parryWindow = 0.1;
  steps(parry, 1);
  assert.equal(parry.fighters[0].damage, 0);
  assert.equal(parry.fighters[0].meter, 6);
});
test("frame steps are bounded and fixed-seed CPU simulations are deterministic", () => {
  function run() {
    let seed = 23;
    const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    const w = createWorld(config),
      cpu = new CpuController("expert", rnd);
    for (let i = 0; i < 600; i++) tick(w, [neutralInput(), cpu.update(w)]);
    return w;
  }
  assert.deepEqual(run(), run());
  const w = ready();
  tick(w, [neutralInput(), neutralInput()], 1);
  assert.ok(w.time <= 1 / 30);
});
test("all fighter/arena combinations remain finite under seeded CPU play", () => {
  for (const player of FIGHTER_IDS)
    for (const arena of ARENA_IDS) {
      const w = createWorld({ ...config, player, arena });
      const cpu = new CpuController("standard", () => 0.45);
      for (let i = 0; i < 900; i++) {
        tick(w, [
          {
            ...neutralInput(),
            move: Math.sin(i / 80) > 0 ? 1 : -1,
            jump: i % 80 < 12,
            attack: i % 18 < 4,
            special: i % 160 > 100,
            guard: i % 130 > 115,
          },
          cpu.update(w),
        ]);
        for (const f of w.fighters) {
          assert.ok(
            Number.isFinite(f.x) &&
              Number.isFinite(f.vx) &&
              Number.isFinite(f.damage),
          );
          assert.ok(f.stocks >= 0 && f.stocks <= 3);
          assert.ok(f.meter >= 0 && f.meter <= 100);
          assert.ok(f.shield >= 0 && f.shield <= 100);
        }
      }
    }
});

test("Nyx holds her ground at a retreating ledge and aims charges toward the rival", () => {
  const w = ready("rook", "nyx");
  const f = w.fighters[1];
  f.x = 995;
  w.fighters[0].x = 850;
  const cautious = new CpuController("standard", () => 0.9);
  assert.equal(cautious.update(w).move, 0);
  f.x = 850;
  w.fighters[0].x = 720;
  f.facing = 1;
  const charging = new CpuController("standard", () => 0.1);
  const input = charging.update(w);
  assert.equal(input.special, true);
  assert.equal(input.move, 0);
  assert.equal(f.facing, -1);
  tick(w, [neutralInput(), input]);
  w.time += 0.2;
  assert.equal(charging.update(w).move, 0);
  assert.equal(f.facing, -1);
});
test("airborne CPU outside the stage recovers inward even when its rival is farther out", () => {
  const w = ready();
  w.fighters[1].x = 1150;
  w.fighters[1].y = 300;
  w.fighters[1].grounded = false;
  w.fighters[0].x = 1230;
  assert.equal(new CpuController("expert", () => 0.5).update(w).move, -1);
});

test("expert CPU chooses a directional down-air when edgeguarding below", () => {
  const w = ready("vector", "ember");
  const cpu = w.fighters[1],
    rival = w.fighters[0];
  cpu.x = 650;
  cpu.y = 300;
  cpu.grounded = false;
  rival.x = 610;
  rival.y = 350;
  const input = new CpuController("expert", () => 0.01, 1).update(w);
  assert.equal(input.attack, true);
  assert.equal(input.down, true);
  assert.equal(input.move, 0);
});

test("actual charged ultimates collide with a freshly timed parry for every fighter", () => {
  for (const id of FIGHTER_IDS) {
    const w = ready("vector", id);
    w.fighters[1].meter = 100;
    steps(w, 60, {}, { ultimate: true });
    assert.equal(w.fighters[1].charge, "ultimate", id);
    steps(w, 1, { guard: true });
    assert.equal(w.fighters[0].damage, 0, id);
    assert.ok(
      w.events.some((e) => e.type === "parry" && e.ultimate),
      id,
    );
    assert.equal(w.fighters[1].meter, 0, id);
  }
});

test("every fighter has a diagonal down-air that stuns", () => {
  for (const id of FIGHTER_IDS) {
    const w = ready(id, "rook");
    const attacker = w.fighters[0],
      target = w.fighters[1];
    attacker.x = 600;
    attacker.y = 300;
    attacker.grounded = false;
    attacker.jumps = 1;
    target.x = 645;
    target.y = 300;
    const input = { ...neutralInput(), move: 1, down: true, attack: true };
    tick(w, [input, neutralInput()]);
    assert.equal(w.attacks[0]?.direction, 1, id);
    assert.equal(w.attacks[0]?.vertical, -0.8, id);
    assert.ok(target.stun >= 0.82, id);
    assert.equal(attacker.pose, "down-attack", id);
  }
});

test("aerial attacks aim diagonally from movement direction", () => {
  const w = ready();
  const f = w.fighters[0];
  f.y = 300;
  f.grounded = false;
  f.facing = -1;
  tick(w, [{ ...neutralInput(), move: 1, attack: true }, neutralInput()]);
  assert.equal(w.attacks[0].direction, 1);
  assert.equal(w.attacks[0].vertical, 0.62);
});

test("ultimate hitboxes can hit twice when a target remains inside", () => {
  const w = ready();
  const target = w.fighters[0];
  const a = attack(w, {
    kind: "ultimate",
    projectile: false,
    life: 0.4,
    damage: 18,
    hitCooldown: [],
  });
  assert.equal(applyAttack(w, a, target), "hit");
  const first = target.damage;
  a.hitCooldown![0] = 0;
  assert.equal(applyAttack(w, a, target), "hit");
  assert.equal(target.damage, first + 18);
  assert.equal(w.fighters[1].hits, 2);
});
