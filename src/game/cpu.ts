import { archetype, isBoss, platformsAt, type Difficulty } from "./data.ts";
import { WEAPONS } from "./equipment.ts";
import { neutralInput, type Input, type WorldState } from "./simulation.ts";
/** CPU observes positions and visible attacks, never the player’s keyboard state. */
export class CpuController {
  private nextThink = 0;
  private input = neutralInput();
  private releaseAt = 0;
  private jumpUntil = 0;
  private guardUntil = 0;
  private side: 0 | 1;
  private difficulty: Difficulty;
  private random: () => number;
  constructor(
    difficulty: Difficulty,
    random: () => number = Math.random,
    side: 0 | 1 = 1,
  ) {
    this.side = side;
    this.difficulty = difficulty;
    this.random = random;
  }
  reset() {
    this.nextThink = 0;
    this.input = neutralInput();
    this.releaseAt = 0;
    this.jumpUntil = 0;
    this.guardUntil = 0;
  }
  update(w: WorldState): Input {
    if (w.config.mode === "training") {
      const input = neutralInput();
      if (w.config.practice === "parry") {
        const f = w.fighters[this.side],
          enemy = w.fighters[1 - this.side],
          dx = enemy.x - f.x;
        input.move = Math.abs(dx) > 190 ? Math.sign(dx) : 0;
        f.facing = Math.sign(dx) || f.facing;
        f.meter = 100;
        input.ultimate = w.time % 4 > 2 && w.time % 4 < 2.9;
      }
      return input;
    }
    const f = w.fighters[this.side],
      enemy = w.fighters[1 - this.side],
      now = w.time;
    if (w.countdown > 0) return neutralInput();
    if (now < this.nextThink)
      return {
        ...this.input,
        jump: now < this.jumpUntil,
        guard: now < this.guardUntil,
      };
    this.nextThink =
      now +
      (this.difficulty === "rookie"
        ? 0.25
        : this.difficulty === "expert"
          ? Math.max(0.065, 0.115 - (w.config.opponentLevel ?? 1) * 0.003)
          : 0.155);
    const input = neutralInput();
    const dx = enemy.x - f.x;
    input.move = Math.abs(dx) > 30 ? Math.sign(dx) : 0;
    const platforms = platformsAt(w.config.arena, now);
    const floor = platforms.filter((p) => !p.oneWay);
    const nearest = floor.reduce((a, b) =>
      Math.abs(a.x + a.width / 2 - f.x) < Math.abs(b.x + b.width / 2 - f.x)
        ? a
        : b,
    );
    const overFloor = floor.some(
      (p) => f.x > p.x + 15 && f.x < p.x + p.width - 15,
    );
    const outsideStage =
      f.x < floor[0].x ||
      f.x > floor[floor.length - 1].x + floor[floor.length - 1].width;
    const recovering = outsideStage || f.y > 560 || (!overFloor && f.y > 430);
    const enemyOffstage =
      enemy.x < floor[0].x ||
      enemy.x > floor[floor.length - 1].x + floor[floor.length - 1].width ||
      enemy.y > 560;
    if (recovering) {
      input.move = Math.sign(nearest.x + nearest.width / 2 - f.x);
      if (f.vy > 30) {
        if (f.jumps > 0 && now > this.jumpUntil + 0.1) {
          this.jumpUntil = now + 0.14;
          input.jump = true;
        } else if (!f.recoveryUsed && f.specialCooldown === 0 && !f.charge) {
          input.up = true;
          input.special = true;
          this.releaseAt = now + 0.15;
        }
      }
    } else {
      const style = archetype(f.id);
      const weapon = f.weapon ? WEAPONS[f.weapon] : null;
      const ranged = weapon?.shape === "bow" || weapon?.shape === "disc";
      const preferred =
        ranged || style === "nyx" || style === "solis"
          ? 235
          : style === "rook"
            ? 70
            : 85;
      if (Math.abs(dx) < preferred - 30)
        input.move =
          ranged || style === "nyx" || style === "solis" ? -Math.sign(dx) : 0;
      if (Math.abs(dx) > preferred + 20) input.move = Math.sign(dx);
      const standing = platforms.find(
        (p) => Math.abs(f.y - p.y) < 8 && f.x >= p.x && f.x <= p.x + p.width,
      );
      const nearEdge =
        standing &&
        (input.move > 0
          ? f.x > standing.x + standing.width - 58
          : f.x < standing.x + 58);
      // A zoner may retreat to make space, but never deliberately back off a ledge.
      if (f.grounded && nearEdge && input.move * Math.sign(dx) < 0)
        input.move = 0;
      if (
        f.grounded &&
        (enemy.y < f.y - 75 ||
          (nearEdge && (Math.abs(dx) > 110 || enemyOffstage))) &&
        now > this.jumpUntil + 0.2
      ) {
        input.jump = true;
        this.jumpUntil = now + 0.2;
      }
      if (enemy.y > f.y + 120 && f.grounded) input.down = true;
      // Competitive CPUs edgeguard with a directional aerial instead of waiting on stage.
      if (
        !f.grounded &&
        Math.abs(dx) < 135 &&
        Math.abs(enemy.y - f.y) < 150 &&
        (overFloor || (f.jumps > 0 && !f.recoveryUsed && f.y < 390)) &&
        f.attackCooldown === 0 &&
        this.random() < (this.difficulty === "expert" ? 0.72 : 0.4)
      ) {
        input.attack = true;
        input.move = Math.sign(dx) || f.facing;
        input.down = enemy.y > f.y + 20;
        input.up = enemy.y < f.y - 45;
      }
      const danger = w.attacks.find(
        (a) =>
          a.owner !== this.side &&
          Math.abs(a.x - f.x) < (a.projectile ? 230 : 145) &&
          Math.abs(a.y - (f.y - 42)) < 125,
      );
      const canReact =
        this.random() <
        (this.difficulty === "rookie"
          ? 0.15
          : this.difficulty === "expert"
            ? 0.85
            : 0.38);
      if (danger && canReact && f.parryCooldown === 0) {
        input.move = 0;
        f.facing = Math.sign(enemy.x - f.x) || f.facing;
        this.guardUntil = now + 0.17;
        input.guard = true;
      } else if (
        Math.abs(dx) < 120 &&
        this.random() < 0.07 &&
        f.dodgeCooldown === 0
      )
        input.dodge = true;
      else if (
        Math.abs(dx) < (ranged ? 470 : 100 + (weapon?.reach ?? 0)) &&
        Math.abs(enemy.y - f.y) < (ranged ? 230 : 100) &&
        f.attackCooldown === 0 &&
        this.random() < (this.difficulty === "expert" ? 0.96 : 0.77)
      )
        input.attack = true;
      if (
        !input.guard &&
        !input.attack &&
        f.meter >= 100 &&
        !f.charge &&
        Math.abs(dx) < (style === "rook" ? 250 : 550) &&
        this.random() < 0.23
      ) {
        input.ultimate = true;
        this.releaseAt = now + 0.45 + this.random() * 0.55;
      } else if (
        !input.guard &&
        !input.attack &&
        !f.charge &&
        f.specialCooldown === 0 &&
        Math.abs(dx) < (style === "nyx" || style === "solis" ? 600 : 280) &&
        this.random() < 0.19
      ) {
        input.special = true;
        this.releaseAt = now + 0.12 + this.random() * 0.8;
      }
      if (input.attack && ranged) {
        input.up = enemy.y < f.y - 70;
        input.down = !f.grounded && enemy.y > f.y + 70;
      }
      // Contest useful drops without abandoning recovery or walking off the stage.
      const supply = w.pickups
        .filter(
          (p) =>
            (p.owner === null || p.owner === this.side) &&
            p.platform !== null &&
            (!f.weapon || p.type === "gadget"),
        )
        .sort((a, b) => Math.abs(a.x - f.x) - Math.abs(b.x - f.x))[0];
      if (
        supply &&
        !isBoss(f.id) &&
        !f.charge &&
        !input.guard &&
        Math.abs(supply.x - f.x) < 300 &&
        Math.abs(supply.y - f.y) < 100
      ) {
        if (Math.abs(supply.x - f.x) < 70) input.pickup = !this.input.pickup;
        else if (!input.attack && Math.abs(dx) > 130)
          input.move = Math.sign(supply.x - f.x);
      }
    }
    if (f.charge) {
      input.attack = false;
      input.dodge = false;
      input.guard = false;
      this.guardUntil = 0;
      input.special = f.charge === "special" && now < this.releaseAt;
      input.ultimate = f.charge === "ultimate" && now < this.releaseAt;
    }
    if (
      !recovering &&
      (f.charge || input.attack || input.special || input.ultimate)
    ) {
      input.move = 0;
      f.facing = Math.sign(dx) || f.facing;
    }
    // Directional influence steers toward the stage while launched; fast-fall resumes after stun.
    if (f.stun > 0) {
      const center = nearest.x + nearest.width / 2;
      input.move = Math.sign(center - f.x) || -Math.sign(f.vx);
      input.down = f.vy < -300;
    }
    input.jump ||= now < this.jumpUntil;
    input.guard ||= now < this.guardUntil;
    // Release pulse buttons between decisions so attacks/jumps remain deliberate presses.
    if (this.input.attack) input.attack = false;
    if (this.input.dodge) input.dodge = false;
    this.input = input;
    return { ...input };
  }
}
