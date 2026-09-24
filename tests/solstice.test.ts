import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ARENA_IDS,
  FIGHTER_IDS,
  BOSS_IDS,
  BOSSES,
  FIGHTERS,
  PRICES,
  platformsAt,
} from "../src/game/data.ts";
import {
  createWorld,
  tick,
  neutralInput,
  applyAttack,
  type Config,
  type Attack,
  type WorldState,
  type Input,
} from "../src/game/simulation.ts";
import { SIGNATURES, WEAPONS } from "../src/game/equipment.ts";
import {
  newProfile,
  parseProfile,
  purchase,
  levelOf,
  bossAvailable,
  settleMatch,
  rankedOpponent,
  rankedReward,
} from "../src/game/progression.ts";
import { CpuController } from "../src/game/cpu.ts";
const base: Config = {
  player: "vector",
  cpu: "rook",
  arena: "skyline",
  mode: "duel",
  difficulty: "expert",
  hazards: false,
};
function steps(w: WorldState, n: number, input: Partial<Input> = {}) {
  for (let i = 0; i < n; i++)
    tick(w, [{ ...neutralInput(), ...input }, neutralInput()]);
}
const strike = (w: WorldState, props: Partial<Attack> = {}): Attack => ({
  id: 999,
  owner: 0,
  kind: "light",
  x: w.fighters[1].x,
  y: w.fighters[1].y - 42,
  vx: 0,
  vy: 0,
  width: 150,
  height: 100,
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
  ...props,
});

test("deployment freezes movement, damage, clocks and drops for three seconds", () => {
  const w = createWorld({ ...base, countdown: true, equipment: true });
  const x = w.fighters[0].x;
  steps(w, 179, { move: 1, attack: true });
  assert.equal(w.time, 0);
  assert.equal(w.remaining, 180);
  assert.equal(w.fighters[0].x, x);
  assert.equal(w.pickups.length, 0);
  steps(w, 3, { move: 1 });
  assert.equal(w.countdown, 0);
  assert.ok(w.time > 0);
  assert.ok(w.fighters[0].x > x);
});
test("each moving platform carries a grounded fighter without accumulating drift", () => {
  for (const arena of ARENA_IDS) {
    const w = createWorld({ ...base, arena });
    const index = platformsAt(arena, 0).findIndex((p) => p.motion);
    const initial = platformsAt(arena, 0)[index];
    const f = w.fighters[0];
    f.x = initial.x + initial.width / 2;
    f.y = initial.y;
    f.grounded = true;
    f.platform = index;
    steps(w, 120);
    const moved = platformsAt(arena, w.time)[index];
    assert.ok(f.grounded, arena);
    assert.ok(Math.abs(f.x - (moved.x + initial.width / 2)) < 0.01, arena);
    assert.ok(Math.abs(f.y - moved.y) < 0.01, arena);
  }
});
test("signature gear drops at five seconds, repeats at fifteen, shared gear at ten", () => {
  const w = createWorld({ ...base, equipment: true });
  steps(w, 299);
  assert.equal(w.pickups.length, 0);
  steps(w, 1);
  assert.equal(w.signatureWave, 1);
  assert.equal(w.pickups.filter((p) => p.owner === 0).length, 2);
  assert.equal(w.pickups.filter((p) => p.owner === 1).length, 2);
  steps(w, 300);
  assert.equal(w.supplyWave, 1);
  assert.equal(w.pickups.filter((p) => p.owner === null).length, 2);
  steps(w, 300);
  assert.equal(w.signatureWave, 2);
  assert.ok(w.pickups.every((p) => p.life > 0));
});
test("bosses are not playable, start armed, change weapons in phase two and receive no signature drone drops", () => {
  for (const id of BOSS_IDS) {
    assert.ok(!FIGHTER_IDS.includes(id as never));
    const w = createWorld({ ...base, mode: "boss", cpu: id, equipment: true });
    assert.equal(w.fighters[1].weapon, SIGNATURES[id][0].id);
    assert.equal(w.fighters[1].stocks, 2);
    w.fighters[1].damage = 90;
    steps(w, 1);
    assert.equal(w.bossPhase, 2);
    assert.equal(w.fighters[1].weapon, SIGNATURES[id][1].id);
    w.time = 4.999;
    steps(w, 1);
    assert.equal(w.pickups.filter((p) => p.owner === 1).length, 0);
    assert.equal(w.pickups.filter((p) => p.owner === 0).length, 2);
  }
});
test("pickup input equips only eligible nearby gear and a held key does not consume two drops", () => {
  const w = createWorld({ ...base, equipment: true });
  const f = w.fighters[0];
  f.x = 600;
  f.y = 500;
  f.grounded = true;
  const item = (owner: 0 | 1 | null, id: number) => ({
    id,
    type: "weapon" as const,
    item: SIGNATURES[owner === 1 ? "rook" : "vector"][0].id,
    owner,
    x: 600,
    y: 480,
    vy: 0,
    born: 0,
    life: 10,
    platform: 0,
  });
  w.pickups = [item(1, 10), item(0, 11), item(0, 12)];
  steps(w, 1, { pickup: true });
  assert.equal(f.weapon, SIGNATURES.vector[0].id);
  assert.equal(w.pickups.length, 2);
  steps(w, 1, { pickup: true });
  assert.equal(w.pickups.length, 2);
  steps(w, 1);
  steps(w, 1, { pickup: true });
  assert.equal(w.pickups.length, 1);
  assert.equal(w.pickups[0].owner, 1);
});
test("all twelve signature weapons change attacks and ranged weapons aim diagonally", () => {
  for (const id of FIGHTER_IDS)
    for (const weapon of SIGNATURES[id]) {
      const w = createWorld({ ...base, player: id });
      const f = w.fighters[0];
      f.x = 400;
      f.y = 500;
      f.grounded = true;
      f.weapon = weapon.id;
      w.fighters[1].x = 1100;
      steps(w, 1, { attack: true, up: true, move: 1 });
      const a = w.attacks[0];
      assert.ok(a.damage >= FIGHTERS[id].damage + weapon.damage, id);
      if (["bow", "disc"].includes(weapon.shape)) {
        assert.ok(a.projectile);
        assert.ok(a.vx > 0 && a.vy < 0);
      } else assert.ok(a.width > 86);
    }
});
test("lingering ultimates hit twice at a timed interval, never every frame or a third time", () => {
  const w = createWorld(base);
  w.fighters.forEach((f, i) => {
    f.x = i ? 660 : 590;
    f.y = 500;
    f.grounded = true;
    f.invulnerable = 0;
  });
  w.attacks = [
    strike(w, {
      kind: "ultimate",
      damage: 12,
      life: 1,
      hitCooldown: [],
      hitCount: [],
    }),
  ];
  steps(w, 1);
  assert.equal(w.fighters[1].damage, 12);
  steps(w, 5);
  assert.equal(w.fighters[1].damage, 12);
  steps(w, 100);
  assert.equal(w.fighters[1].damage, 24);
  assert.equal(w.fighters[0].hits, 2);
});
test("post-match total damage and combo records survive a stock loss", () => {
  const w = createWorld(base);
  w.fighters[1].invulnerable = 0;
  applyAttack(w, strike(w), w.fighters[1]);
  applyAttack(w, strike(w, { id: 1000 }), w.fighters[1]);
  assert.equal(w.fighters[0].damageDealt, 20);
  assert.equal(w.fighters[1].damageTaken, 20);
  assert.equal(w.fighters[0].bestCombo, 2);
  w.hitstop = 0;
  w.fighters[1].y = 1000;
  steps(w, 1);
  assert.equal(w.fighters[1].damage, 0);
  assert.equal(w.fighters[1].damageTaken, 20);
});
test("ranked rewards increase with opponent strength, and settlement is idempotent", () => {
  const p = newProfile(),
    w = createWorld({
      ...base,
      mode: "ranked",
      matchId: "rank-1",
      opponentLevel: 3,
    });
  w.winner = 0;
  w.fighters[0].damageDealt = 123;
  const result = settleMatch(p, w);
  assert.ok(result.profile.currency > p.currency);
  assert.ok(result.profile.xp > 0);
  assert.equal(result.profile.damage, 123);
  assert.equal(p.currency, 1000);
  assert.equal(settleMatch(result.profile, w).profile, result.profile);
  assert.ok(rankedReward(15, 800) > rankedReward(3, 0));
});
test("boss rewards are gated, pay once forever and allow retry after a loss", () => {
  for (const id of BOSS_IDS) {
    const b = BOSSES[id],
      p = { ...newProfile(), xp: (b.level - 1) * 250 };
    assert.equal(levelOf(p), b.level);
    assert.ok(bossAvailable(p, id));
    const w = createWorld({
      ...base,
      cpu: id,
      mode: "boss",
      matchId: `boss-${id}`,
    });
    w.winner = 1;
    const lost = settleMatch(p, w);
    assert.equal(lost.reward.lumens, 0);
    assert.ok(bossAvailable(lost.profile, id));
    w.config.matchId += "-retry";
    w.winner = 0;
    const win = settleMatch(lost.profile, w);
    assert.equal(win.reward.lumens, b.reward);
    assert.equal(win.profile.currency, p.currency + b.reward);
    assert.ok(!bossAvailable(win.profile, id));
    w.config.matchId += "-replay";
    assert.equal(settleMatch(win.profile, w).reward.lumens, 0);
    assert.equal(settleMatch(newProfile(), w).reward.lumens, 0);
  }
});
test("purchases spend once, reject insufficient funds, and bosses can never be bought", () => {
  const p = { ...newProfile(), currency: 50000 };
  const q = purchase(p, "astra");
  assert.equal(q.currency, 50000 - PRICES.astra);
  assert.ok(q.unlocked.includes("astra"));
  assert.equal(p.unlocked.length, 1);
  assert.throws(() => purchase(q, "astra"));
  assert.throws(() => purchase(newProfile(), "rook"));
  assert.throws(() => purchase(p, "warden" as never));
});
test("save export/import preserves claims and unlocks while rejecting malformed balances and IDs", () => {
  const p = {
    ...newProfile(),
    unlocked: ["vector", "rook"] as typeof FIGHTER_IDS,
    defeated: ["warden"] as typeof BOSS_IDS,
    currency: 500,
  };
  assert.deepEqual(parseProfile(JSON.stringify(p)), p);
  assert.throws(() => parseProfile("oops"));
  assert.throws(() => parseProfile(JSON.stringify({ ...p, currency: -1 })));
  assert.throws(() =>
    parseProfile(JSON.stringify({ ...p, unlocked: ["vector", "eclipse"] })),
  );
  assert.throws(() =>
    parseProfile(JSON.stringify({ ...p, rating: "Infinity" })),
  );
});
test("practice and quick play award no currency; losses do not subtract Lumens", () => {
  for (const mode of ["duel", "training"] as const) {
    const p = newProfile(),
      w = createWorld({ ...base, mode, matchId: "free" });
    w.winner = 0;
    assert.equal(settleMatch(p, w).profile, p);
  }
  const p = newProfile(),
    w = createWorld({ ...base, mode: "ranked", matchId: "loss" });
  w.winner = 1;
  const result = settleMatch(p, w),
    q = result.profile;
  assert.equal(q.currency, p.currency);
  assert.equal(q.rating, 0);
  assert.equal(q.losses, 1);
  assert.equal(result.reward.rating, 0);
});
test("higher-tier selections and ranks face stronger ranked opponents", () => {
  const low = rankedOpponent(newProfile(), "vector"),
    high = rankedOpponent({ ...newProfile(), xp: 2500, rating: 1000 }, "astra");
  assert.equal(high.cpu, "astra");
  assert.ok(high.level > low.level);
  assert.ok(!BOSS_IDS.includes(high.cpu as never));
});
test("all four armed bosses complete a deterministic fight with finite state", () => {
  for (const cpu of BOSS_IDS) {
    let seed = 7;
    const random = () =>
      (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    const w = createWorld({
      ...base,
      player: "astra",
      cpu,
      mode: "boss",
      arena: BOSSES[cpu].arena,
      equipment: true,
      hazards: true,
      opponentLevel: BOSSES[cpu].level,
    });
    const a = new CpuController("expert", random, 0),
      b = new CpuController("expert", random, 1);
    for (let i = 0; i < 18000 && w.winner === null; i++)
      tick(w, [a.update(w), b.update(w)]);
    assert.notEqual(w.winner, null, cpu);
    assert.ok(
      w.fighters.every(
        (f) => Number.isFinite(f.damageDealt) && Number.isFinite(f.x),
      ),
      cpu,
    );
  }
});

test("an awakened boss remains in phase two after healing below the threshold", () => {
  const w = createWorld({ ...base, mode: "boss", cpu: "warden" });
  w.fighters[1].damage = 86;
  steps(w, 1);
  assert.equal(w.bossPhase, 2);
  w.fighters[1].damage = 40;
  steps(w, 1);
  assert.equal(w.bossPhase, 2);
  assert.equal(w.fighters[1].weapon, SIGNATURES.warden[1].id);
});
