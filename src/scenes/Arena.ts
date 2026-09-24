import Phaser from "phaser";
import { physique } from "../game/roster";
import { drawFields, drawSignature } from "./ability-effects";
import { COMBAT } from "../game/tuning";
import { ARENAS, FIGHTERS, isBoss, platformsAt } from "../game/data";
import { WEAPONS, GADGET_NAMES, type GadgetId } from "../game/equipment";
import {
  createWorld,
  tick,
  type WorldState,
  type Config,
  type GameEvent,
} from "../game/simulation";
import { CpuController } from "../game/cpu";
import { PlayerControls } from "../game/input";
import {
  drawArena,
  drawPlatforms,
  drawWeapon,
  drawDrone,
  makeRig,
  type Rig,
} from "./art";
export class Arena extends Phaser.Scene {
  world!: WorldState;
  private cpu!: CpuController;
  private controls!: PlayerControls;
  private rigs: Rig[] = [];
  private attacks!: Phaser.GameObjects.Graphics;
  private hazard!: Phaser.GameObjects.Graphics;
  private platforms!: Phaser.GameObjects.Graphics;
  private equipment!: Phaser.GameObjects.Graphics;
  private drones!: Phaser.GameObjects.Graphics;
  private pickupLabels: Phaser.GameObjects.Text[] = [];
  private countdownLabel!: Phaser.GameObjects.Text;
  private indicators: Phaser.GameObjects.Text[] = [];
  private accumulator = 0;
  private hudClock = 0;
  private running = false;
  private reduced = false;
  constructor() {
    super("Arena");
  }
  preload() {
    this.load.image(
      "gardens",
      `${import.meta.env.BASE_URL}art/solstice-gardens.png`,
    );
    this.load.image(
      "orbital",
      `${import.meta.env.BASE_URL}art/aurora-spires.png`,
    );
  }
  create() {
    this.controls = this.game.registry.get("controls");
    this.reduced = !!this.game.registry.get("reducedMotion");
    this.start(this.game.registry.get("config"), false);
    this.game.events.on("start-fight", this.start, this);
    this.game.events.on("pause-fight", this.pause, this);
    this.game.events.on("motion-change", this.setMotion, this);
    this.game.events.emit("arena-ready");
    this.events.once("shutdown", () => {
      this.game.events.off("start-fight", this.start, this);
      this.game.events.off("pause-fight", this.pause, this);
      this.game.events.off("motion-change", this.setMotion, this);
    });
  }
  private setMotion(value: boolean) {
    this.reduced = value;
  }
  private pause(paused: boolean) {
    this.running = !paused && this.world.winner === null;
    this.controls.enabled = this.running;
    this.controls.clear();
    this.accumulator = 0;
  }
  private start(config: Config, run = true) {
    if (!config) return;
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.cameras.main.resetFX();
    this.children.removeAll(true);
    this.world = createWorld(config);
    this.cpu = new CpuController(config.difficulty);
    this.accumulator = 0;
    this.hudClock = 0;
    this.running = run;
    this.controls.enabled = run;
    this.controls.clear();
    drawArena(this, config.arena);
    this.platforms = this.add.graphics();
    this.hazard = this.add.graphics();
    this.attacks = this.add.graphics();
    this.equipment = this.add.graphics();
    this.rigs = this.world.fighters.map((f) => makeRig(this, f.id, f.side));
    this.drones = this.add.graphics();
    this.pickupLabels = Array.from({ length: 16 }, () =>
      this.add
        .text(0, 0, "", {
          fontFamily: "Arial",
          fontSize: "9px",
          fontStyle: "bold",
          color: "#fff4c9",
          backgroundColor: "#103c39dc",
          padding: { x: 5, y: 3 },
        })
        .setOrigin(0.5)
        .setVisible(false),
    );
    this.countdownLabel = this.add
      .text(600, 250, "", {
        fontFamily: "Arial",
        fontSize: "84px",
        fontStyle: "bold",
        color: "#fff2b9",
        stroke: "#1a5046",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(9);
    this.indicators = this.world.fighters.map((f) =>
      this.add
        .text(0, 0, "", {
          fontFamily: "monospace",
          fontSize: "14px",
          color: FIGHTERS[f.id].accent,
          backgroundColor: "#10172bdd",
          padding: { x: 6, y: 4 },
        })
        .setOrigin(0.5)
        .setVisible(false),
    );
    this.game.events.emit("world-update", this.world);
    this.renderWorld();
  }
  update(_time: number, delta: number) {
    if (!this.world) return;
    if (this.running) {
      this.accumulator += Math.min(delta / 1000, 0.1);
      while (this.accumulator >= 1 / 60) {
        tick(
          this.world,
          [this.controls.read(), this.cpu.update(this.world)],
          1 / 60,
        );
        this.world.events.forEach((event) => this.effect(event));
        this.accumulator -= 1 / 60;
        if (this.world.winner !== null) {
          this.running = false;
          this.controls.enabled = false;
          this.controls.clear();
          this.game.events.emit("fight-ended", this.world);
          break;
        }
      }
    }
    this.hudClock += delta;
    if (this.hudClock > 75) {
      this.hudClock = 0;
      this.game.events.emit("world-update", this.world);
    }
    this.renderWorld();
  }
  private renderWorld() {
    const w = this.world;
    this.attacks.clear();
    this.hazard.clear();
    this.equipment.clear();
    this.drones.clear();
    drawPlatforms(
      this.platforms,
      platformsAt(w.config.arena, w.time),
      w.config.arena,
    );
    this.countdownLabel
      .setVisible(w.countdown > 0)
      .setText(w.countdown > 0 ? String(Math.ceil(w.countdown)) : "");
    const phase = w.time % 12,
      arena = ARENAS[w.config.arena];
    if (w.config.hazards && phase > 8.3 && phase < 10.35) {
      const active = phase >= 10;
      this.hazard.fillStyle(active ? 0xffe39a : 0xff334f, active ? 0.45 : 0.12);
      this.hazard.fillRect(arena.hazardX - 45, 60, 90, 540);
      this.hazard.lineStyle(2, 0xff4654, 0.8);
      this.hazard.strokeRect(arena.hazardX - 45, 60, 90, 540);
      this.hazard.fillStyle(0xd53045, 0.9);
      this.hazard.fillTriangle(
        arena.hazardX - 21,
        100,
        arena.hazardX + 21,
        100,
        arena.hazardX,
        135,
      );
      this.hazard.lineStyle(4, 0xffe59f);
      this.hazard.lineBetween(arena.hazardX, 104, arena.hazardX, 117);
      if (active) {
        const y = -130 + (phase - 10) * 2500;
        this.hazard.lineStyle(9, 0xe5c677);
        this.hazard.lineBetween(arena.hazardX, y - 160, arena.hazardX, y);
        this.hazard.fillStyle(0xfff1b2);
        this.hazard.fillTriangle(
          arena.hazardX - 19,
          y - 5,
          arena.hazardX + 19,
          y - 5,
          arena.hazardX,
          y + 43,
        );
      }
    }
    drawFields(this.attacks, w, this.reduced);
    w.attacks.forEach((a) => {
      if (drawSignature(this.attacks, a, w, this.reduced)) return;
      this.attacks.fillStyle(a.color, a.kind === "ultimate" ? 0.4 : 0.3);
      this.attacks.lineStyle(a.kind === "ultimate" ? 4 : 2, a.color, 0.9);
      if (a.projectile) {
        this.attacks.fillEllipse(a.x, a.y, a.width, a.height);
        this.attacks.strokeEllipse(a.x, a.y, a.width, a.height);
        this.attacks.fillStyle(0xffffff, 0.75);
        this.attacks.fillEllipse(a.x, a.y, a.width * 0.4, a.height * 0.4);
        this.attacks.lineStyle(4, a.color, 0.4);
        this.attacks.lineBetween(
          a.x - a.direction * a.width * 0.4,
          a.y,
          a.x - a.direction * a.width * 1.3,
          a.y,
        );
      } else {
        this.attacks.fillEllipse(a.x, a.y, a.width, a.height);
        this.attacks.lineStyle(a.stun ? 5 : 3, a.color, 0.9);
        this.attacks.beginPath();
        this.attacks.arc(
          a.x - a.direction * 20,
          a.y,
          a.width * 0.48,
          a.stun ? 0.15 : -1.2,
          a.stun ? 2.6 : 1.2,
          a.direction < 0,
        );
        this.attacks.strokePath();
        this.attacks.lineStyle(2, 0xffffdc, 0.9);
        this.attacks.lineBetween(
          a.x - a.width * 0.2,
          a.y - a.height * 0.15,
          a.x + a.direction * a.width * 0.35,
          a.y + (a.stun ? 35 : -10),
        );
      }
    });
    w.fighters.forEach((f, i) => {
      const rig = this.rigs[i],
        speed = Math.abs(f.vx),
        walking = f.grounded && speed > 30 && !f.charge;
      const dropY =
        w.countdown > 0 && !isBoss(f.id)
          ? 35 + ((3 - w.countdown) / 3) * 135
          : f.y;
      rig.root.setPosition(f.x, dropY);
      rig.body.setScale(
        f.facing * physique(f.id).bodyWidth,
        physique(f.id).bodyHeight,
      );
      rig.weapon.clear();
      if (f.weapon)
        drawWeapon(rig.weapon, WEAPONS[f.weapon].shape, FIGHTERS[f.id].color);
      rig.cape.setAngle(
        !this.reduced
          ? Math.sin(w.time * 5 + i) * 3 - Math.min(12, speed / 30)
          : 0,
      );
      if (w.countdown > 0 && !isBoss(f.id)) {
        drawDrone(this.drones, f.x, dropY - 164, FIGHTERS[f.id].color, true);
        this.drones.lineStyle(2, 0xe5d28a, 0.8);
        this.drones.lineBetween(f.x - 18, dropY - 145, f.x - 18, dropY - 88);
        this.drones.lineBetween(f.x + 18, dropY - 145, f.x + 18, dropY - 88);
      }
      rig.body.setAngle(
        f.pose === "hurt"
          ? this.reduced
            ? 0
            : -f.facing * 18
          : f.pose === "dodge" && !this.reduced
            ? f.facing * 28
            : 0,
      );
      rig.root.setAlpha(
        f.stocks === 0
          ? 0.2
          : f.invulnerable > 0
            ? this.reduced
              ? 0.65
              : 0.5 + Math.sin(w.time * 24) * 0.22
            : 1,
      );
      rig.front.angle = ["attack", "special", "ultimate"].includes(f.pose)
        ? -105
        : f.pose === "down-attack"
          ? 105
          : f.charge
            ? -125
            : f.guarding
              ? -65
              : !f.grounded
                ? -35
                : -22;
      rig.back.angle = ["attack", "special", "ultimate"].includes(f.pose)
        ? 35
        : f.pose === "down-attack"
          ? -35
          : f.charge
            ? 45
            : f.guarding
              ? 25
              : 18;
      if (f.id === "rook" && f.charge === "ultimate") {
        rig.front.angle = -160;
        rig.back.angle = 160;
      } else if (f.id === "rook" && f.pose === "ultimate") {
        rig.front.angle = -15;
        rig.back.angle = 15;
        rig.body.setAngle(f.facing * 10);
      } else if (f.ability || f.pose === "special") {
        const angles: Record<string, [number, number]> = {
          vector: [-85, -45],
          rook: [-65, 65],
          nyx: [-100, 80],
          ember: [-120, 90],
          solis: [-80, 80],
          astra: [-65, 120],
        };
        const pose = angles[f.id];
        if (pose) {
          rig.front.angle = pose[0];
          rig.back.angle = pose[1];
        }
      } else if (f.pose === "ultimate") {
        const angles: Record<string, [number, number]> = {
          vector: [-95, -70],
          nyx: [-145, 130],
          ember: [-165, 155],
          solis: [-90, 90],
          astra: [-110, 145],
        };
        const pose = angles[f.id];
        if (pose) {
          rig.front.angle = pose[0];
          rig.back.angle = pose[1];
        }
      }
      rig.legs[0].angle =
        walking && !this.reduced
          ? Math.sin(w.time * 16) * 28
          : !f.grounded
            ? -28
            : 0;
      rig.legs[1].angle =
        walking && !this.reduced
          ? -Math.sin(w.time * 16) * 28
          : !f.grounded
            ? 25
            : 0;
      rig.shield
        .setVisible(f.guarding || f.parryWindow > 0)
        .setStrokeStyle(
          f.parryWindow > 0 ? 5 : 2,
          f.parryWindow > 0 ? 0xfff5ae : 0x7ecbf4,
          f.shield / 120 + 0.15,
        );
      rig.charge
        .setVisible(!!f.charge)
        .setScale(0.6 + f.chargeTime * 0.4)
        .setStrokeStyle(
          f.charge === "ultimate" ? 5 : 3,
          f.charge === "ultimate" ? 0xffe5a0 : FIGHTERS[f.id].color,
          0.9,
        );
      rig.label.setText(
        f.ability
          ? FIGHTERS[f.id].special.toUpperCase()
          : f.charge
            ? `${f.charge === "ultimate" ? "ULT" : "CHARGE"} ${Math.min(100, Math.floor((f.chargeTime / (f.charge === "ultimate" ? COMBAT.ultimateCharge : COMBAT.specialCharge)) * 100))}%`
            : f.stun > 0
              ? "STUNNED"
              : `${i ? "CPU" : "YOU"} · ${Math.round(f.damage)}%`,
      );
      const outside = f.x < 18 || f.x > 1182 || f.y < 30 || f.y > 680;
      this.indicators[i]
        .setVisible(outside && f.stocks > 0)
        .setPosition(
          Phaser.Math.Clamp(f.x, 50, 1150),
          Phaser.Math.Clamp(f.y, 115, 620),
        )
        .setText(
          `${i ? "CPU" : "YOU"} ${f.y > 680 ? "↓" : f.y < 30 ? "↑" : f.x < 18 ? "←" : "→"} ${Math.round(f.damage)}%`,
        );
    });
    this.pickupLabels.forEach((label) => label.setVisible(false));
    w.pickups.forEach((p, index) => {
      const color =
        p.owner === null ? 0xffdf88 : FIGHTERS[w.fighters[p.owner].id].color;
      this.equipment.fillStyle(0x164840, 0.85);
      this.equipment.fillRoundedRect(p.x - 18, p.y - 17, 36, 34, 8);
      this.equipment.lineStyle(2, color, 0.9);
      this.equipment.strokeRoundedRect(p.x - 18, p.y - 17, 36, 34, 8);
      if (p.type === "weapon")
        drawWeapon(
          this.equipment,
          WEAPONS[p.item].shape,
          color,
          p.x,
          p.y + 10,
          0.45,
        );
      else {
        this.equipment.fillStyle(color);
        this.equipment.fillCircle(p.x, p.y, 8);
        this.equipment.lineStyle(2, 0x21463e);
        this.equipment.lineBetween(p.x - 4, p.y, p.x + 4, p.y);
        this.equipment.lineBetween(p.x, p.y - 4, p.x, p.y + 4);
      }
      if (w.time - p.born < 1.4)
        drawDrone(this.drones, p.x, -20 + (w.time - p.born) * 65, color, true);
      const label = this.pickupLabels[index];
      if (label) {
        const name =
          p.type === "weapon"
            ? WEAPONS[p.item].name
            : GADGET_NAMES[p.item as GadgetId].split(" · ")[0];
        label
          .setVisible(true)
          .setPosition(p.x, p.y + 30)
          .setText(
            `${p.owner === 0 ? "P1 · " : p.owner === 1 ? "CPU · " : ""}${name}`,
          );
      }
    });
  }
  private effect(event: GameEvent) {
    this.game.events.emit("combat-event", event);
    if (event.type === "finish") return;
    const shake = this.reduced
      ? 0
      : Number(this.game.registry.get("shake") ?? 0.65);
    if (
      event.type === "attack" &&
      event.ultimate &&
      this.world.fighters[event.side ?? 0].id === "rook" &&
      shake > 0
    )
      this.cameras.main.shake(180, 0.005 * shake);
    const color =
      event.type === "parry"
        ? 0xfff0a0
        : event.side === undefined
          ? 0xffffff
          : FIGHTERS[this.world.fighters[event.side].id].color;
    if (["hit", "parry", "ko", "break", "hazard"].includes(event.type)) {
      if (!this.reduced) {
        this.cameras.main.shake(
          event.type === "ko" ? 230 : 95,
          (event.type === "ko" ? 0.009 : 0.003) * shake,
        );
        for (let i = 0; i < (event.type === "ko" ? 20 : 9); i++) {
          const angle = i * 2.4,
            particle = this.add
              .rectangle(
                event.x,
                event.y,
                4,
                event.type === "parry" ? 19 : 9,
                color,
              )
              .setAngle(i * 35);
          this.tweens.add({
            targets: particle,
            x: event.x + Math.cos(angle) * (event.type === "ko" ? 170 : 75),
            y: event.y + Math.sin(angle) * (event.type === "ko" ? 170 : 65),
            alpha: 0,
            angle: i * 65,
            duration: 450,
            onComplete: () => particle.destroy(),
          });
        }
      }
      const label = this.add
        .text(event.x, event.y - 45, event.text ?? `+${event.amount ?? 0}%`, {
          fontFamily: "monospace",
          fontSize: event.type === "parry" ? "23px" : "19px",
          fontStyle: "bold",
          color: event.type === "parry" ? "#fff5a8" : "#fff1e0",
          stroke: "#1c173a",
          strokeThickness: 5,
        })
        .setOrigin(0.5)
        .setDepth(100);
      label.x = Phaser.Math.Clamp(label.x, 150, 1050);
      label.y = Phaser.Math.Clamp(label.y, 125, 590);
      this.tweens.add({
        targets: label,
        y: label.y - (this.reduced ? 0 : 35),
        alpha: 0,
        delay: 250,
        duration: 650,
        onComplete: () => label.destroy(),
      });
    } else if (event.type === "jump" || event.type === "dodge") {
      const ring = this.add
        .ellipse(event.x, event.y, 55, 10)
        .setStrokeStyle(2, color, 0.8);
      this.tweens.add({
        targets: ring,
        scale: this.reduced ? 1 : 1.8,
        alpha: 0,
        duration: 230,
        onComplete: () => ring.destroy(),
      });
    }
  }
}
