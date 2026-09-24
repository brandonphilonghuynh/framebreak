import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createWorld,
  tick,
  neutralInput,
  applyAttack,
  type Input,
  type Attack,
} from "../src/game/simulation.ts";
import {
  FIGHTER_IDS,
  ARENA_IDS,
  ARENAS,
  FIGHTERS,
  type FighterId,
} from "../src/game/data.ts";
import { CpuController } from "../src/game/cpu.ts";
const config = {
  player: "vector" as FighterId,
  cpu: "rook" as FighterId,
  arena: "skyline" as const,
  mode: "duel" as const,
  difficulty: "expert" as const,
  hazards: false,
};
function ready(player: FighterId = "vector") {
  const w = createWorld({ ...config, player });
  w.fighters.forEach((f, i) =>
    Object.assign(f, {
      x: 480 + i * 55,
      y: 500,
      grounded: true,
      invulnerable: 0,
    }),
  );
  return w;
}
function step(
  w: ReturnType<typeof ready>,
  p: Partial<Input> = {},
  cpu: Partial<Input> = {},
) {
  tick(w, [
    { ...neutralInput(), ...p },
    { ...neutralInput(), ...cpu },
  ]);
}
function strike(properties: Partial<Attack> = {}): Attack {
  return {
    id: 1,
    owner: 0,
    kind: "light",
    x: 535,
    y: 452,
    vx: 0,
    vy: 0,
    width: 90,
    height: 75,
    life: 1,
    damage: 10,
    force: 0,
    vertical: 0,
    direction: 1,
    projectile: false,
    follow: false,
    hit: [],
    color: 0xffffff,
    charge: 0,
    ...properties,
  };
}

test("early presses link all three jabs before a rival can mash out with a strike, guard or dodge", () => {
  for (const player of FIGHTER_IDS)
    for (const defense of ["attack", "guard", "dodge"] as const) {
      const w = ready(player);
      for (let frame = 0; frame <= 34; frame++) {
        const enemy =
          frame > 0
            ? { [defense]: defense === "guard" || frame % 4 === 0 }
            : {};
        step(w, { attack: [0, 10, 26].includes(frame) }, enemy);
      }
      assert.equal(w.fighters[0].hits, 3, `${player}/${defense}`);
      assert.equal(w.fighters[1].hits, 0, `${player}/${defense}`);
      assert.equal(w.fighters[0].bestCombo, 3);
      assert.ok(w.fighters[1].stun > 0);
    }
});

test("attack buffering captures hitstop presses once and holding a button does not auto-combo", () => {
  const w = ready();
  w.fighters[1].x = 1100;
  w.hitstop = 0.08;
  step(w, { attack: true, up: true, move: -1 });
  for (let n = 0; n < 10; n++) step(w);
  assert.equal(w.nextId, 2);
  assert.equal(w.attacks[0].direction, -1);
  assert.ok(w.attacks[0].y < w.fighters[0].y - 75);
  const held = ready();
  held.fighters[1].x = 1100;
  for (let n = 0; n < 90; n++) step(held, { attack: true });
  assert.equal(held.nextId, 2);
});

test("expired buffered attacks do not emerge after a long stun", () => {
  const w = ready();
  w.fighters[0].stun = 0.7;
  step(w, { attack: true });
  for (let n = 0; n < 70; n++) step(w);
  assert.equal(w.fighters[0].hits, 0);
  assert.equal(w.nextId, 1);
});

test("down-air gives each pilot a longer setup while repeated spikes lose the full stun", () => {
  for (const id of FIGHTER_IDS) {
    const w = ready(id),
      f = w.fighters[1];
    applyAttack(w, strike({ stun: FIGHTERS[id].downAirStun }), f);
    assert.ok(f.stun >= 1.18, id);
    applyAttack(w, strike({ id: 2, stun: FIGHTERS[id].downAirStun }), f);
    assert.ok(f.stun >= 1.18, "A follow-up must not shorten existing stun");
    f.stun = 0.1;
    applyAttack(w, strike({ id: 3, stun: FIGHTERS[id].downAirStun }), f);
    assert.ok(f.stun < 0.6, id);
  }
});

test("tapped ultimates telegraph for half a second and can be interrupted before firing", () => {
  for (const id of FIGHTER_IDS) {
    const w = ready(id);
    w.fighters[1].x = 1100;
    const f = w.fighters[0];
    f.meter = 100;
    step(w, { ultimate: true });
    for (let n = 0; n < 20; n++) step(w);
    assert.equal(w.attacks.length, 0, id);
    assert.equal(f.meter, 100, id);
    for (let n = 0; n < 12; n++) step(w);
    assert.equal(w.attacks[0].kind, "ultimate", id);
    assert.equal(f.meter, 0, id);
  }
  const w = ready();
  w.fighters[0].meter = 100;
  step(w, { ultimate: true });
  step(w);
  applyAttack(w, strike({ owner: 1 }), w.fighters[0]);
  for (let n = 0; n < 45; n++) step(w);
  assert.equal(w.fighters[0].charge, null);
  assert.equal(w.fighters[0].meter, 100);
  assert.equal(w.attacks.length, 0);
});

test("full ultimate charge takes two seconds and the meter does not refill from ultimate hits", () => {
  const half = ready(),
    full = ready();
  for (const w of [half, full]) {
    w.fighters[1].x = 1100;
    w.fighters[0].meter = 100;
  }
  for (let n = 0; n < 60; n++) step(half, { ultimate: true });
  step(half);
  for (let n = 0; n < 120; n++) step(full, { ultimate: true });
  step(full);
  assert.ok(half.attacks[0].charge < 0.55);
  assert.equal(full.attacks[0].charge, 1);
  const w = ready();
  for (let n = 0; n < 10; n++) applyAttack(w, strike({ id: n }), w.fighters[1]);
  assert.ok(w.fighters[0].meter <= 46);
  assert.ok(w.fighters[1].meter <= 19);
  w.fighters[0].meter = 0;
  const ult = strike({ kind: "ultimate", damage: 45 });
  applyAttack(w, ult, w.fighters[1]);
  ult.hitCooldown![1] = 0;
  applyAttack(w, ult, w.fighters[1]);
  assert.equal(w.fighters[0].meter, 0);
});

test("air jumps keep their full lift on release and cannot be used a third time", () => {
  for (const id of FIGHTER_IDS) {
    const tap = ready(id),
      held = ready(id);
    for (const w of [tap, held]) {
      const f = w.fighters[0];
      f.x = 100;
      f.y = 600;
      f.grounded = false;
      f.jumps = 1;
      step(w, { jump: true });
    }
    for (let n = 0; n < 20; n++) {
      step(tap);
      step(held, { jump: true });
    }
    assert.equal(tap.fighters[0].y, held.fighters[0].y, id);
    assert.ok(tap.fighters[0].y < 440, id);
    const velocity = tap.fighters[0].vy;
    step(tap, { jump: true });
    assert.equal(tap.fighters[0].jumps, 0);
    assert.ok(tap.fighters[0].vy > velocity);
  }
});

test("both sides recover from below either ledge on every arena using an air jump", () => {
  for (const id of FIGHTER_IDS)
    for (const arena of ARENA_IDS)
      for (const side of [0, 1] as const) {
        const w = createWorld({ ...config, player: id, cpu: id, arena });
        const floors = ARENAS[arena].platforms.filter((p) => !p.oneWay);
        const floor = side ? floors.at(-1)! : floors[0];
        const f = w.fighters[side],
          edge = side ? floor.x + floor.width : floor.x;
        Object.assign(f, {
          x: edge + (side ? 70 : -70),
          y: floor.y + 150,
          vy: 200,
          jumps: 1,
          invulnerable: 0,
        });
        const controller = new CpuController("expert", () => 0.9, side);
        let landed = false;
        for (let n = 0; n < 180; n++) {
          const inputs: [Input, Input] = [neutralInput(), neutralInput()];
          inputs[side] = controller.update(w);
          tick(w, inputs);
          if (f.grounded) {
            landed = true;
            break;
          }
          if (f.stocks < 3) break;
        }
        assert.ok(landed, `${id}/${arena}/side ${side}`);
        assert.equal(f.stocks, 3);
      }
});

test("rising recovery can reach the stage after both jumps are spent", () => {
  for (const side of [0, 1] as const) {
    const w = ready("rook"),
      f = w.fighters[side];
    Object.assign(f, {
      x: side ? 1090 : 110,
      y: 700,
      vy: 150,
      jumps: 0,
      grounded: false,
      facing: side ? -1 : 1,
    });
    let landed = false;
    for (let n = 0; n < 150; n++) {
      const inputs: [Input, Input] = [neutralInput(), neutralInput()];
      inputs[side] = {
        ...neutralInput(),
        move: side ? -1 : 1,
        up: n < 6,
        special: n < 6,
      };
      tick(w, inputs);
      if (f.grounded) {
        landed = true;
        break;
      }
      if (f.stocks < 3) break;
    }
    assert.ok(landed, `side ${side}`);
    assert.equal(f.stocks, 3);
  }
});

test("a stunned CPU preserves its recovery jump until the input can take effect", () => {
  const w = ready();
  const f = w.fighters[1];
  Object.assign(f, {
    x: 1080,
    y: 620,
    vy: 80,
    jumps: 1,
    stun: 0.1,
    grounded: false,
  });
  const cpu = new CpuController("expert", () => 0.9, 1);
  const input = cpu.update(w);
  assert.equal(input.jump, false);
  assert.ok(input.move < 0);
});

test("unlimited practice meter is opt-in and never changes duel meter rules", () => {
  for (const mode of ["training", "duel"] as const)
    for (const enabled of [false, true]) {
      const w = createWorld({
        ...config,
        mode,
        practiceInfiniteMeter: enabled,
      });
      w.fighters[0].meter = 17;
      step(w);
      assert.equal(
        w.fighters[0].meter,
        mode === "training" && enabled ? 100 : 17,
      );
    }
});
