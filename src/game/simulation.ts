import {
  ARENAS,
  FIGHTERS,
  WORLD,
  archetype,
  isBoss,
  platformsAt,
  type FighterId,
  type CombatantId,
  type ArenaId,
  type Difficulty,
  type Mode,
} from "./data.ts";
import {
  SIGNATURES,
  WEAPONS,
  SHARED_WEAPON,
  GADGETS,
  GADGET_NAMES,
  type Pickup,
  type GadgetId,
} from "./equipment.ts";
export interface Input {
  move: number;
  jump: boolean;
  down: boolean;
  up: boolean;
  attack: boolean;
  special: boolean;
  guard: boolean;
  dodge: boolean;
  ultimate: boolean;
  pickup?: boolean;
}
export const neutralInput = (): Input => ({
  move: 0,
  jump: false,
  down: false,
  up: false,
  attack: false,
  special: false,
  guard: false,
  dodge: false,
  ultimate: false,
});
export interface Fighter {
  id: CombatantId;
  side: 0 | 1;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: number;
  damage: number;
  stocks: number;
  meter: number;
  shield: number;
  grounded: boolean;
  jumps: number;
  stun: number;
  invulnerable: number;
  attackCooldown: number;
  specialCooldown: number;
  dodgeCooldown: number;
  parryCooldown: number;
  parryWindow: number;
  guarding: boolean;
  charge: "special" | "ultimate" | null;
  chargeTime: number;
  chargeRecovery: boolean;
  recoveryUsed: boolean;
  dropTime: number;
  dashTime: number;
  combo: number;
  comboTimer: number;
  pose: string;
  poseTime: number;
  last: Input;
  parries: number;
  hits: number;
  kos: number;
  damageDealt: number;
  damageTaken: number;
  bestCombo: number;
  comboHits: number;
  comboAt: number;
  weapon: string | null;
  platform: number | null;
  airStunGrace: number;
}
export interface Attack {
  id: number;
  owner: 0 | 1;
  kind: "light" | "special" | "ultimate";
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  life: number;
  damage: number;
  force: number;
  vertical: number;
  direction: number;
  projectile: boolean;
  follow: boolean;
  hit: number[];
  /** Ultimates may strike again after a brief tick gap while their hitbox persists. */
  hitCooldown?: number[];
  hitCount?: number[];
  /** Down-air attacks use a longer stun than the shared launch calculation. */
  stun?: number;
  aimX?: number;
  aimY?: number;
  returning?: boolean;
  age?: number;
  color: number;
  charge: number;
}
export interface GameEvent {
  type:
    | "hit"
    | "parry"
    | "guard"
    | "break"
    | "attack"
    | "charge"
    | "ko"
    | "jump"
    | "dodge"
    | "hazard"
    | "pickup"
    | "finish";
  x: number;
  y: number;
  side?: number;
  text?: string;
  amount?: number;
  ultimate?: boolean;
}
export interface Config {
  player: FighterId;
  cpu: CombatantId;
  arena: ArenaId;
  difficulty: Difficulty;
  mode: Mode;
  hazards: boolean;
  practice?: "dummy" | "parry";
  countdown?: boolean;
  equipment?: boolean;
  playerLevel?: number;
  opponentLevel?: number;
  matchId?: string;
}
export interface WorldState {
  config: Config;
  fighters: [Fighter, Fighter];
  attacks: Attack[];
  events: GameEvent[];
  time: number;
  remaining: number;
  winner: 0 | 1 | "draw" | null;
  nextId: number;
  hitstop: number;
  hazardCycle: number;
  hazardHit: number[];
  countdown: number;
  pickups: Pickup[];
  signatureWave: number;
  supplyWave: number;
  bossPhase: number;
}
function makeFighter(id: CombatantId, side: 0 | 1): Fighter {
  return {
    id,
    side,
    x: side ? 830 : 370,
    y: 170,
    vx: 0,
    vy: 0,
    facing: side ? -1 : 1,
    damage: 0,
    stocks: 3,
    meter: 0,
    shield: 100,
    grounded: false,
    jumps: 2,
    stun: 0,
    invulnerable: 1.8,
    attackCooldown: 0,
    specialCooldown: 0,
    dodgeCooldown: 0,
    parryCooldown: 0,
    parryWindow: 0,
    guarding: false,
    charge: null,
    chargeTime: 0,
    chargeRecovery: false,
    recoveryUsed: false,
    dropTime: 0,
    dashTime: 0,
    combo: 0,
    comboTimer: 0,
    pose: "idle",
    poseTime: 0,
    last: neutralInput(),
    parries: 0,
    hits: 0,
    kos: 0,
    damageDealt: 0,
    damageTaken: 0,
    bestCombo: 0,
    comboHits: 0,
    comboAt: -10,
    weapon: isBoss(id) ? SIGNATURES[id][0].id : null,
    platform: null,
    airStunGrace: 0,
  };
}
export function createWorld(config: Config): WorldState {
  const w: WorldState = {
    config: { ...config },
    fighters: [makeFighter(config.player, 0), makeFighter(config.cpu, 1)],
    attacks: [],
    events: [],
    time: 0,
    remaining: 180,
    winner: null,
    nextId: 1,
    hitstop: 0,
    hazardCycle: -1,
    hazardHit: [],
    countdown: config.countdown ? 3 : 0,
    pickups: [],
    signatureWave: 0,
    supplyWave: 0,
    bossPhase: 1,
  };
  if (config.mode === "boss") w.fighters[1].stocks = 2;
  if (config.mode === "training") w.fighters[0].meter = 100;
  return w;
}
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
function emit(w: WorldState, event: GameEvent) {
  w.events.push(event);
}
function spawn(w: WorldState, f: Fighter, properties: Partial<Attack>) {
  const attack: Attack = {
    id: w.nextId++,
    owner: f.side,
    kind: "light",
    x: f.x + f.facing * 50,
    y: f.y - 48,
    vx: 0,
    vy: 0,
    width: 86,
    height: 70,
    life: 0.13,
    damage: FIGHTERS[f.id].damage,
    force: 205,
    vertical: 0.52,
    direction: f.facing,
    projectile: false,
    follow: false,
    hit: [],
    hitCooldown: [],
    hitCount: [],
    color: FIGHTERS[f.id].color,
    charge: 0,
    ...properties,
  };
  if (
    f.side === 1 &&
    (w.config.mode === "boss" || w.config.mode === "ranked")
  ) {
    const scale =
      1 +
      Math.min(
        w.config.mode === "boss" ? 0.65 : 0.3,
        Math.max(0, (w.config.opponentLevel ?? 1) - 1) *
          (w.config.mode === "boss" ? 0.018 : 0.006),
      );
    attack.damage *= scale;
  }
  w.attacks.push(attack);
  emit(w, {
    type: "attack",
    x: f.x,
    y: f.y - 45,
    side: f.side,
    ultimate: attack.kind === "ultimate",
  });
}
function releaseCharge(w: WorldState, f: Fighter) {
  const style = archetype(f.id);
  const kind = f.charge;
  if (!kind) return;
  const charge = clamp(f.chargeTime / (kind === "ultimate" ? 1.1 : 1.3), 0, 1);
  f.charge = null;
  f.chargeTime = 0;
  f.pose = kind;
  f.poseTime = 0.4;
  f.attackCooldown = 0.4;
  if (kind === "ultimate") {
    if (f.meter < 100) return;
    f.meter = 0;
    f.specialCooldown = 0.8;
    const common = {
      kind: "ultimate" as const,
      damage: 28 + charge * 17,
      force: 490 + charge * 220,
      charge,
      life: 0.7,
    };
    if (style === "rook")
      spawn(w, f, {
        ...common,
        x: f.x,
        y: f.y - 70,
        width: 410 + charge * 180,
        height: 180,
        vertical: 0.8,
        life: 0.22,
      });
    else if (style === "ember") {
      f.vy = -350;
      spawn(w, f, {
        ...common,
        x: f.x + f.facing * 90,
        y: f.y - 80,
        vx: f.facing * 390,
        vy: -150,
        width: 160,
        height: 185,
        projectile: true,
        vertical: 1.1,
        life: 1.15,
      });
    } else
      spawn(w, f, {
        ...common,
        x: f.x + f.facing * 80,
        y: f.y - 50,
        vx:
          f.facing * (style === "vector" ? 820 : style === "solis" ? 310 : 490),
        width:
          style === "vector"
            ? 230
            : style === "solis"
              ? 240
              : 125 + charge * 55,
        height: style === "vector" ? 104 : 125 + charge * 55,
        projectile: true,
        vertical: 0.55,
        life: 1.35,
      });
  } else {
    f.specialCooldown = 0.65;
    if (f.chargeRecovery) {
      f.vy = -740 - charge * 130;
      f.vx = f.facing * 125;
      f.dashTime = 0.17;
      f.recoveryUsed = true;
      f.grounded = false;
      spawn(w, f, {
        kind: "special",
        follow: true,
        width: 92,
        height: 112,
        damage: 9 + charge * 7,
        force: 230 + charge * 90,
        vertical: 1.15,
        life: 0.25,
        charge,
      });
    } else if (style === "nyx" || style === "solis")
      spawn(w, f, {
        kind: "special",
        x: f.x + f.facing * 60,
        vx: f.facing * (510 + charge * 210),
        width: 40 + charge * 52,
        height: 32 + charge * 36,
        damage: 8 + charge * 16,
        force: 230 + charge * 190,
        projectile: true,
        life: 1.35,
        charge,
        returning: style === "solis",
      });
    else if (style === "rook")
      spawn(w, f, {
        kind: "special",
        x: f.x + f.facing * (65 + charge * 45),
        width: 140 + charge * 150,
        height: 95,
        damage: 12 + charge * 18,
        force: 260 + charge * 250,
        vertical: 0.68,
        life: 0.2,
        charge,
      });
    else if (style === "ember") {
      f.vy = -290 - charge * 300;
      f.grounded = false;
      spawn(w, f, {
        kind: "special",
        follow: true,
        width: 105,
        height: 140,
        damage: 9 + charge * 17,
        force: 230 + charge * 215,
        vertical: 1.1,
        life: 0.27,
        charge,
      });
    } else {
      f.vx = f.facing * (570 + charge * 400);
      f.dashTime = 0.16 + charge * 0.14;
      spawn(w, f, {
        kind: "special",
        follow: true,
        width: 104,
        height: 76,
        damage: 8 + charge * 15,
        force: 235 + charge * 220,
        vertical: 0.45,
        life: 0.18 + charge * 0.14,
        charge,
      });
    }
  }
  f.chargeRecovery = false;
}
function launch(w: WorldState, target: Fighter, attack: Attack) {
  const owner = w.fighters[attack.owner];
  target.damage = clamp(target.damage + attack.damage, 0, 999);
  target.damageTaken += attack.damage;
  owner.damageDealt += attack.damage;
  owner.comboHits = w.time - owner.comboAt < 0.9 ? owner.comboHits + 1 : 1;
  owner.comboAt = w.time;
  owner.bestCombo = Math.max(owner.bestCombo, owner.comboHits);
  const force =
    (attack.force * (1 + target.damage / 100)) / FIGHTERS[target.id].weight;
  const direction = attack.projectile
    ? Math.sign(attack.vx) || attack.direction
    : attack.kind === "ultimate" && archetype(owner.id) === "rook"
      ? Math.sign(target.x - owner.x) || attack.direction
      : attack.direction;
  target.vx = direction * force * Math.cos(attack.vertical);
  target.vy = -force * Math.sin(attack.vertical);
  target.grounded = false;
  target.stun = clamp(
    Math.max(
      attack.stun && target.airStunGrace === 0 ? attack.stun : 0,
      0.12 + force / 2400,
    ),
    0.15,
    attack.stun ? 1.1 : 0.7,
  );
  if (attack.stun) target.airStunGrace = 1.4;
  target.charge = null;
  target.chargeTime = 0;
  target.guarding = false;
  target.dashTime = 0;
  target.pose = "hurt";
  target.poseTime = target.stun;
  owner.meter = clamp(owner.meter + attack.damage * 1.25, 0, 100);
  target.meter = clamp(target.meter + attack.damage * 0.6, 0, 100);
  owner.hits++;
  w.hitstop = attack.kind === "ultimate" ? 0.085 : 0.045;
  emit(w, {
    type: "hit",
    x: target.x,
    y: target.y - 42,
    side: target.side,
    amount: Math.round(attack.damage),
    ultimate: attack.kind === "ultimate",
  });
}
export function applyAttack(
  w: WorldState,
  attack: Attack,
  target: Fighter,
): "hit" | "parry" | "guard" | "ignore" {
  if (
    target.side === attack.owner ||
    target.invulnerable > 0 ||
    (attack.hit.includes(target.side) &&
      !(
        attack.kind === "ultimate" &&
        (attack.hitCooldown?.[target.side] ?? 0) <= 0 &&
        (attack.hitCount?.[target.side] ?? 0) < 2
      ))
  )
    return "ignore";
  const sourceDirection = attack.projectile
    ? -Math.sign(attack.vx)
    : Math.sign(w.fighters[attack.owner].x - target.x) || -attack.direction;
  const facing =
    sourceDirection === target.facing || Math.abs(attack.x - target.x) < 22;
  if (target.parryWindow > 0 && facing) {
    const owner = w.fighters[attack.owner];
    target.parries++;
    target.meter = clamp(target.meter + 25, 0, 100);
    target.shield = clamp(target.shield + 14, 0, 100);
    target.invulnerable = 0.18;
    target.parryWindow = 0;
    target.pose = "parry";
    target.poseTime = 0.35;
    w.hitstop = 0.09;
    owner.stun = Math.max(owner.stun, 0.48);
    owner.charge = null;
    owner.chargeTime = 0;
    if (attack.projectile) {
      attack.owner = target.side;
      attack.vx = -attack.vx * 1.1;
      attack.vy = -attack.vy * 0.5;
      attack.direction = target.facing;
      attack.hit = [];
      attack.hitCooldown = [];
      attack.hitCount = [];
      attack.damage *= 1.1;
      attack.color = FIGHTERS[target.id].color;
      attack.life = Math.max(attack.life, 0.8);
      attack.x = target.x + target.facing * (attack.width / 2 + 32);
    } else attack.life = 0;
    emit(w, {
      type: "parry",
      x: target.x,
      y: target.y - 45,
      side: target.side,
      text: attack.kind === "ultimate" ? "ULTIMATE PARRIED" : "PERFECT PARRY",
      ultimate: attack.kind === "ultimate",
    });
    return "parry";
  }
  if (!attack.hit.includes(target.side)) attack.hit.push(target.side);
  if (attack.kind === "ultimate") {
    attack.hitCooldown ??= [];
    attack.hitCooldown[target.side] = 0.16;
    attack.hitCount ??= [];
    attack.hitCount[target.side] = (attack.hitCount[target.side] ?? 0) + 1;
  }
  if (target.guarding && facing && attack.kind !== "ultimate") {
    target.shield -= attack.damage * 2.4;
    target.vx = attack.direction * 100;
    target.meter = clamp(target.meter + 3, 0, 100);
    if (target.shield <= 0) {
      target.shield = 0;
      target.stun = 1.15;
      target.guarding = false;
      target.pose = "hurt";
      target.poseTime = 1.15;
      emit(w, {
        type: "break",
        x: target.x,
        y: target.y - 50,
        side: target.side,
        text: "SHIELD BREAK",
      });
    } else
      emit(w, {
        type: "guard",
        x: target.x,
        y: target.y - 45,
        side: target.side,
      });
    return "guard";
  }
  // Ultimate attacks bypass a held shield, but use the exact same timed parry path above.
  launch(w, target, attack);
  return "hit";
}
function ringOut(w: WorldState, f: Fighter) {
  const opponent = w.fighters[1 - f.side];
  opponent.kos++;
  const stocks = w.config.mode === "training" ? f.stocks : f.stocks - 1;
  emit(w, {
    type: "ko",
    x: clamp(f.x, 20, 1180),
    y: clamp(f.y, 20, 650),
    side: f.side,
    text: `${FIGHTERS[f.id].name.toUpperCase()} RING OUT`,
  });
  const next = makeFighter(f.id, f.side);
  next.stocks = Math.max(0, stocks);
  next.meter = f.meter * 0.5;
  next.parries = f.parries;
  next.hits = f.hits;
  next.kos = f.kos;
  next.damageDealt = f.damageDealt;
  next.damageTaken = f.damageTaken;
  next.bestCombo = f.bestCombo;
  next.invulnerable = 2.3;
  Object.assign(f, next);
  w.attacks = w.attacks.filter((a) => a.owner !== f.side);
}
function finish(w: WorldState, winner: WorldState["winner"]) {
  w.winner = winner;
  emit(w, {
    type: "finish",
    x: 600,
    y: 220,
    text: winner === "draw" ? "DRAW" : winner === 0 ? "VICTORY" : "DEFEAT",
  });
}
function drop(
  w: WorldState,
  type: Pickup["type"],
  item: string,
  x: number,
  owner: Pickup["owner"],
) {
  w.pickups.push({
    id: w.nextId++,
    type,
    item,
    owner,
    x,
    y: -20,
    vy: 80,
    born: w.time,
    life: 15,
    platform: null,
  });
}
function updatePickups(w: WorldState, pressed: boolean[], dt: number) {
  const platforms = platformsAt(w.config.arena, w.time);
  if (w.time + 0.00001 >= 5 + w.signatureWave * 10) {
    w.signatureWave++;
    w.fighters.forEach((f) => {
      if (isBoss(f.id)) return;
      const x = f.side ? 820 : 380;
      SIGNATURES[f.id].forEach((weapon, index) =>
        drop(w, "weapon", weapon.id, x + (index ? 48 : -48), f.side),
      );
    });
  }
  if (w.time + 0.00001 >= 10 + w.supplyWave * 10) {
    const x =
      w.config.arena === "tempest" ? (w.supplyWave % 2 ? 810 : 390) : 600;
    drop(w, "weapon", SHARED_WEAPON.id, x - 35, null);
    drop(w, "gadget", GADGETS[w.supplyWave % GADGETS.length], x + 35, null);
    w.supplyWave++;
  }
  for (const p of w.pickups) {
    p.life -= dt;
    if (p.platform !== null) {
      const old = platformsAt(w.config.arena, w.time - dt)[p.platform];
      p.x += platforms[p.platform].x - old.x;
      p.y = platforms[p.platform].y - 16;
    } else {
      const oldY = p.y;
      p.vy = Math.min(700, p.vy + dt * 1000);
      p.y += p.vy * dt;
      const index = platforms.findIndex(
        (floor) =>
          oldY + 16 <= floor.y &&
          p.y + 16 >= floor.y &&
          p.x > floor.x &&
          p.x < floor.x + floor.width,
      );
      if (index >= 0) {
        p.platform = index;
        p.y = platforms[index].y - 16;
        p.vy = 0;
      }
    }
  }
  w.fighters.forEach((f, side) => {
    if (!pressed[side] || f.stun > 0 || isBoss(f.id)) return;
    const p = w.pickups
      .filter(
        (p) =>
          p.life > 0 &&
          (p.owner === null || p.owner === side) &&
          Math.abs(p.x - f.x) < 75 &&
          Math.abs(p.y - (f.y - 35)) < 90,
      )
      .sort((a, b) => Math.abs(a.x - f.x) - Math.abs(b.x - f.x))[0];
    if (!p) return;
    p.life = 0;
    if (p.type === "weapon") f.weapon = p.item;
    else if (p.item === "repair") f.damage = Math.max(0, f.damage - 20);
    else if (p.item === "capacitor") f.meter = Math.min(100, f.meter + 35);
    else if (p.item === "aegis") {
      f.shield = 100;
      f.invulnerable = Math.max(f.invulnerable, 1);
    } else {
      f.jumps = 2;
      f.recoveryUsed = false;
      f.vy = -450;
      f.grounded = false;
    }
    emit(w, {
      type: "pickup",
      x: f.x,
      y: f.y - 90,
      side,
      text:
        p.type === "weapon"
          ? WEAPONS[p.item].name.toUpperCase()
          : GADGET_NAMES[p.item as GadgetId].toUpperCase(),
    });
  });
  w.pickups = w.pickups.filter((p) => p.life > 0 && p.y < WORLD.bottom);
}
export function tick(w: WorldState, inputs: [Input, Input], dt = 1 / 60): void {
  w.events = [];
  if (w.winner !== null) return;
  dt = clamp(dt, 0, 1 / 30);
  if (w.countdown > 0) {
    w.countdown = Math.max(0, w.countdown - dt);
    return;
  }
  if (w.hitstop > 0) {
    w.hitstop = Math.max(0, w.hitstop - dt);
    return;
  }
  w.time += dt;
  if (w.config.mode !== "training") w.remaining = Math.max(0, w.remaining - dt);
  const platforms = platformsAt(w.config.arena, w.time);
  const previousPlatforms = platformsAt(w.config.arena, w.time - dt);
  const pickupPressed = inputs.map(
    (input, side) => !!input.pickup && !w.fighters[side].last.pickup,
  );
  if (w.config.mode === "boss") {
    const boss = w.fighters[1];
    if (boss.stocks < 2 || boss.damage > 85) w.bossPhase = 2;
    boss.meter = Math.min(100, boss.meter + dt * (w.bossPhase === 2 ? 8 : 3));
    if (w.bossPhase === 2 && (boss.id === "warden" || boss.id === "eclipse"))
      boss.damage = Math.max(0, boss.damage - dt * 1.5);
    boss.weapon = SIGNATURES[boss.id][w.bossPhase === 2 ? 1 : 0].id;
  }
  w.fighters.forEach((f, i) => {
    const input = inputs[i],
      def = FIGHTERS[f.id];
    for (const key of [
      "stun",
      "invulnerable",
      "attackCooldown",
      "specialCooldown",
      "dodgeCooldown",
      "parryCooldown",
      "parryWindow",
      "dropTime",
      "dashTime",
      "comboTimer",
      "poseTime",
      "airStunGrace",
    ] as const)
      f[key] = Math.max(0, f[key] - dt);
    if (f.comboTimer === 0) f.combo = 0;
    const attached = f.grounded
      ? (f.platform ??
        previousPlatforms.findIndex(
          (p) =>
            Math.abs(f.y - p.y) < 1 &&
            f.x + 18 > p.x &&
            f.x - 18 < p.x + p.width,
        ))
      : -1;
    if (attached !== null && attached >= 0 && previousPlatforms[attached]) {
      f.x += platforms[attached].x - previousPlatforms[attached].x;
      f.y += platforms[attached].y - previousPlatforms[attached].y;
    }
    if (w.config.mode === "training" && i === 0) f.meter = 100;
    f.guarding = input.guard && f.shield > 0 && f.stun === 0 && !f.charge;
    if (f.guarding) {
      f.shield = Math.max(0, f.shield - 15 * dt);
      if (
        input.guard &&
        !f.last.guard &&
        f.parryCooldown === 0 &&
        f.shield >= 6
      ) {
        f.parryWindow = 0.155;
        f.parryCooldown = 0.5;
        f.shield -= 6;
      }
    } else f.shield = Math.min(100, f.shield + 13 * dt);
    if (f.stun === 0) {
      if (input.move && !f.guarding) f.facing = Math.sign(input.move);
      if (f.dashTime === 0) {
        const speed =
          def.speed *
          (isBoss(f.id) && w.bossPhase === 2 ? 1.13 : 1) *
          (f.charge ? 0.32 : f.guarding ? 0.18 : 1);
        const target = clamp(input.move, -1, 1) * speed;
        f.vx += (target - f.vx) * Math.min(1, dt * (f.grounded ? 16 : 5));
      }
      if (
        input.jump &&
        !f.last.jump &&
        f.jumps > 0 &&
        !f.guarding &&
        !f.charge
      ) {
        f.vy = -(f.jumps === 2 ? def.jump : def.jump * 0.87);
        f.jumps--;
        f.grounded = false;
        f.pose = "jump";
        f.poseTime = 0.25;
        emit(w, { type: "jump", x: f.x, y: f.y, side: f.side });
      }
      if (input.down) {
        f.vy += dt * 1150;
        const on = platforms.find(
          (p) =>
            p.oneWay &&
            Math.abs(f.y - p.y) < 5 &&
            f.x > p.x - 18 &&
            f.x < p.x + p.width + 18,
        );
        if (f.grounded && on) {
          f.dropTime = 0.23;
          f.grounded = false;
          f.y += 7;
        }
      }
      if (
        input.dodge &&
        !f.last.dodge &&
        f.dodgeCooldown === 0 &&
        f.shield >= 18 &&
        !f.charge
      ) {
        f.invulnerable = 0.24;
        f.dodgeCooldown = 0.95;
        f.shield -= 18;
        f.vx = (input.move || f.facing) * 590;
        f.dashTime = 0.2;
        f.pose = "dodge";
        f.poseTime = 0.24;
        emit(w, { type: "dodge", x: f.x, y: f.y - 35, side: f.side });
      }
      if (!f.guarding && f.dashTime === 0) {
        if (
          input.ultimate &&
          !f.last.ultimate &&
          f.meter >= 100 &&
          f.attackCooldown === 0 &&
          !f.charge
        ) {
          f.charge = "ultimate";
          f.chargeTime = 0;
          emit(w, {
            type: "charge",
            x: f.x,
            y: f.y - 40,
            side: f.side,
            ultimate: true,
          });
        } else if (
          input.special &&
          !f.last.special &&
          f.specialCooldown === 0 &&
          f.attackCooldown === 0 &&
          !f.charge &&
          (!input.up || !f.recoveryUsed)
        ) {
          f.charge = "special";
          f.chargeTime = 0;
          f.chargeRecovery = input.up;
          emit(w, { type: "charge", x: f.x, y: f.y - 40, side: f.side });
        }
        if (f.charge) {
          f.chargeTime = Math.min(1.5, f.chargeTime + dt);
          if (f.charge === "special" ? !input.special : !input.ultimate)
            releaseCharge(w, f);
        } else if (input.attack && !f.last.attack && f.attackCooldown === 0) {
          const aerial = !f.grounded;
          const downAerial = aerial && input.down;
          const attackDirection = Math.sign(input.move) || f.facing;
          f.combo = (f.combo % 3) + 1;
          const attackVertical = downAerial
            ? -0.8
            : input.up
              ? 1.02
              : aerial && input.move
                ? 0.62
                : f.grounded
                  ? f.combo === 3
                    ? 0.9
                    : 0.35
                  : 0.7;
          f.comboTimer = 0.7;
          f.attackCooldown = downAerial ? 0.46 : f.combo === 3 ? 0.4 : 0.24;
          f.pose = downAerial ? "down-attack" : "attack";
          f.poseTime = downAerial ? 0.3 : 0.22;
          const weapon = f.weapon ? WEAPONS[f.weapon] : null;
          const aimY = input.down ? 0.7 : input.up ? -0.7 : 0;
          const aimX = attackDirection * (aimY ? 0.72 : 1);
          const ranged =
            weapon && ["bow", "disc"].includes(weapon.shape) && !downAerial;
          if (weapon?.shape === "hammer") f.attackCooldown += 0.13;
          if (weapon?.shape === "claw") f.attackCooldown *= 0.8;
          spawn(w, f, {
            damage: downAerial
              ? def.downAirDamage + (weapon?.damage ?? 0)
              : def.damage + (f.combo === 3 ? 3 : 0) + (weapon?.damage ?? 0),
            force:
              (downAerial ? 220 : f.combo === 3 ? 300 : 190) +
              (weapon?.force ?? 0),
            vertical: attackVertical,
            direction: attackDirection,
            x:
              f.x +
              attackDirection *
                (downAerial ? 32 : 50 + (weapon?.reach ?? 0) / 2),
            y: f.y + (downAerial ? 18 : input.up ? -90 : -48),
            width: ranged
              ? 44
              : (downAerial ? 96 : archetype(f.id) === "rook" ? 108 : 86) +
                (weapon?.reach ?? 0),
            height: downAerial ? 88 : f.grounded ? 66 : 105,
            stun: downAerial ? def.downAirStun : undefined,
            vx: ranged ? aimX * 570 : 0,
            vy: ranged ? aimY * 570 : 0,
            projectile: !!ranged,
            returning: (ranged && weapon?.shape === "disc") || false,
            life: ranged ? 0.95 : 0.13,
            aimX,
            aimY,
          });
        }
      }
    } else {
      f.vx += input.move * dt * 95;
      f.charge = null;
      f.chargeTime = 0;
      f.parryWindow = 0;
    }
    // A short-release jump cuts upward velocity, allowing variable-height hops.
    if (!input.jump && f.last.jump && f.vy < -260) f.vy *= 0.6;
    const previousY = f.y;
    f.vy = Math.min(1120, f.vy + WORLD.gravity * dt);
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    f.grounded = false;
    f.platform = null;
    if (f.vy >= 0) {
      for (const { platform, index } of platforms
        .map((platform, index) => ({ platform, index }))
        .sort((a, b) => a.platform.y - b.platform.y)) {
        if (platform.oneWay && f.dropTime > 0) continue;
        if (
          previousY <=
            (attached === index ? platform.y : previousPlatforms[index].y) +
              0.5 &&
          f.y >= platform.y &&
          f.x + 18 > platform.x &&
          f.x - 18 < platform.x + platform.width
        ) {
          f.y = platform.y;
          f.vy = 0;
          f.grounded = true;
          f.platform = index;
          f.jumps = 2;
          f.recoveryUsed = false;
          break;
        }
      }
    }
    if (f.grounded && f.stun > 0) f.vx *= Math.pow(0.09, dt);
    if (f.poseTime === 0)
      f.pose = f.charge
        ? "charge"
        : f.guarding
          ? "guard"
          : !f.grounded
            ? "jump"
            : Math.abs(f.vx) > 35
              ? "run"
              : "idle";
    f.last = { ...input };
  });
  for (const attack of w.attacks) {
    attack.life -= dt;
    attack.age = (attack.age ?? 0) + dt;
    if (attack.returning && attack.age > 0.42) {
      attack.returning = false;
      attack.vx *= -1;
      attack.vy *= -1;
      attack.direction *= -1;
    }
    if (attack.hitCooldown)
      attack.hitCooldown = attack.hitCooldown.map((value) =>
        Math.max(0, value - dt),
      );
    if (attack.life <= 0) continue;
    if (attack.follow) {
      const f = w.fighters[attack.owner];
      attack.x = f.x + f.facing * 44;
      attack.y = f.y - 52;
    } else {
      attack.x += attack.vx * dt;
      attack.y += attack.vy * dt;
    }
    for (const target of w.fighters) {
      if (attack.owner === target.side) continue;
      if (
        Math.abs(attack.x - target.x) < attack.width / 2 + 22 &&
        Math.abs(attack.y - (target.y - 42)) < attack.height / 2 + 40
      ) {
        const result = applyAttack(w, attack, target);
        if (result === "parry") break;
      }
    }
  }
  w.attacks = w.attacks.filter((a) => a.life > 0 && a.x > -400 && a.x < 1600);
  if (w.config.equipment) updatePickups(w, pickupPressed, dt);
  if (w.config.hazards) {
    const cycle = Math.floor(w.time / 12),
      phase = w.time % 12;
    if (cycle !== w.hazardCycle) {
      w.hazardCycle = cycle;
      w.hazardHit = [];
    }
    if (phase >= 10 && phase < 10.35) {
      for (const f of w.fighters) {
        if (
          w.hazardHit.includes(f.side) ||
          Math.abs(f.x - ARENAS[w.config.arena].hazardX) > 48 ||
          f.invulnerable > 0
        )
          continue;
        w.hazardHit.push(f.side);
        if (f.parryWindow > 0) {
          f.meter = clamp(f.meter + 12, 0, 100);
          f.parries++;
          emit(w, {
            type: "parry",
            x: f.x,
            y: f.y - 45,
            side: f.side,
            text: "SURGE PARRIED",
          });
        } else {
          f.damage += 9;
          f.damageTaken += 9;
          f.vy = -450;
          f.stun = 0.22;
          f.charge = null;
          emit(w, {
            type: "hazard",
            x: f.x,
            y: f.y - 45,
            side: f.side,
            amount: 9,
          });
        }
      }
    }
  }
  // Ring-outs are checked together so a same-frame double KO can be a draw.
  for (const f of w.fighters)
    if (
      f.x < WORLD.left ||
      f.x > WORLD.right ||
      f.y > WORLD.bottom ||
      f.y < WORLD.top
    )
      ringOut(w, f);
  if (w.config.mode !== "training") {
    if (w.fighters.every((f) => f.stocks === 0)) finish(w, "draw");
    else if (w.fighters[0].stocks === 0) finish(w, 1);
    else if (w.fighters[1].stocks === 0) finish(w, 0);
    else if (w.remaining === 0) {
      const [a, b] = w.fighters;
      finish(
        w,
        a.stocks !== b.stocks
          ? a.stocks > b.stocks
            ? 0
            : 1
          : a.damage === b.damage
            ? "draw"
            : a.damage < b.damage
              ? 0
              : 1,
      );
    }
  }
}
