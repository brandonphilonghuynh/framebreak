import Phaser from "phaser";
import { FIGHTERS, getMove, type FighterId, type Distance } from "../game/data";
import { newMatch, type Match, type Resolution } from "../game/combat";
const positions = (distance: Distance): [number, number] =>
  distance === "close"
    ? [435, 665]
    : distance === "mid"
      ? [330, 770]
      : [190, 910];
export class Arena extends Phaser.Scene {
  private fighters: Phaser.GameObjects.Container[] = [];
  private idle: Phaser.Tweens.Tween[] = [];
  private reduced = false;
  constructor() {
    super("Arena");
  }
  create() {
    this.fighters = [];
    this.idle = [];
    this.reduced = !!this.game.registry.get("reducedMotion");
    const state: Match = this.game.registry.get("match") ?? newMatch();
    this.drawCity();
    [state.player, state.cpu].forEach((f, i) => {
      const fighter = this.drawFighter(f.id, positions(state.distance)[i], i);
      this.fighters.push(fighter);
      if (!this.reduced)
        this.idle.push(
          this.tweens.add({
            targets: fighter,
            y: 281,
            duration: 1000 + i * 190,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
          }),
        );
    });
    this.game.events.on("resolve", this.animate, this);
    this.game.events.on("reset-arena", this.resetArena, this);
    this.game.events.on("motion-change", this.setMotion, this);
    this.events.once("shutdown", () => {
      this.game.events.off("resolve", this.animate, this);
      this.game.events.off("reset-arena", this.resetArena, this);
      this.game.events.off("motion-change", this.setMotion, this);
    });
  }
  private resetArena() {
    this.scene.restart();
  }
  private setMotion(value: boolean) {
    this.reduced = value;
    this.idle.forEach((t) => t.stop());
    this.idle = [];
    if (!value)
      this.fighters.forEach((f) =>
        this.idle.push(
          this.tweens.add({
            targets: f,
            y: 281,
            duration: 1100,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
          }),
        ),
      );
  }
  private drawCity() {
    const g = this.add.graphics();
    g.fillGradientStyle(0x171237, 0x251449, 0x56377d, 0x8e4c88, 1);
    g.fillRect(0, 0, 1100, 360);
    // Layered sunset discs and horizon haze create depth without downloaded assets.
    g.fillStyle(0xe899ff, 0.035);
    g.fillCircle(550, 123, 160);
    g.fillStyle(0xfba29f, 0.07);
    g.fillCircle(550, 123, 133);
    g.fillStyle(0xffbf87);
    g.fillCircle(550, 124, 83);
    for (let i = 0; i < 8; i++) {
      g.fillStyle(0x803f7c, 0.5 + i * 0.045);
      g.fillRect(465, 138 + i * 8, 170, 2 + i * 0.55);
    }
    for (let i = 0; i < 48; i++) {
      const x = (i * 137 + 51) % 1100,
        y = (i * 43 + 17) % 147;
      g.fillStyle(i % 3 ? 0xc9c0fb : 0x69ebff, 0.25 + (i % 4) * 0.12);
      g.fillRect(x, y, i % 5 === 0 ? 3 : 1.5, 1.5);
    }
    const buildings = [
      [-20, 72, 130],
      [75, 60, 83],
      [133, 101, 115],
      [227, 46, 67],
      [275, 83, 160],
      [365, 65, 96],
      [720, 95, 141],
      [808, 61, 75],
      [880, 85, 183],
      [972, 70, 112],
      [1051, 95, 150],
    ];
    buildings.forEach(([x, w, h], i) => {
      g.fillStyle(i % 2 ? 0x21203f : 0x252143);
      g.fillRect(x, 244 - h, w, h);
      g.fillStyle(0x514379);
      g.fillRect(x, 244 - h, w, 3);
      for (let row = 0; row < h - 15; row += 14)
        for (let col = 8; col < w - 5; col += 13) {
          if ((row + col + i) % 5 === 0) continue;
          g.fillStyle((col + i) % 3 ? 0x665790 : 0xe0a07e, 0.6);
          g.fillRect(x + col, 254 - h + row, 4, 5);
        }
      if (i % 3 === 0) {
        g.lineStyle(2, 0x685086);
        g.lineBetween(x + w / 2, 244 - h, x + w / 2, 219 - h);
        g.fillStyle(0xff89b4);
        g.fillCircle(x + w / 2, 218 - h, 2);
      }
    });
    // Suspended cables, rooftop railing, and two contrasting signs frame the stage.
    g.lineStyle(2, 0x18172f, 0.8);
    g.lineBetween(0, 42, 380, 121);
    g.lineBetween(1100, 20, 798, 100);
    g.fillStyle(0x17172d);
    g.fillRect(0, 239, 1100, 121);
    g.fillStyle(0x2c2b47);
    g.fillRect(0, 242, 1100, 9);
    for (let x = 0; x < 1100; x += 90) {
      g.lineStyle(2, 0x464464);
      g.lineBetween(x, 205, x, 249);
    }
    g.lineStyle(2, 0x73658c);
    g.lineBetween(0, 205, 1100, 205);
    g.lineStyle(1, 0x55436e);
    for (let x = -500; x < 1600; x += 110) g.lineBetween(550, 238, x, 360);
    for (let y = 264; y < 360; y += 24) g.lineBetween(0, y, 1100, y);
    g.fillStyle(0x46e7d2, 0.08);
    g.fillEllipse(550, 304, 800, 68);
    g.lineStyle(2, 0x67e8cf, 0.65);
    g.strokeEllipse(550, 304, 800, 68);
    g.lineStyle(1, 0xff79af, 0.5);
    g.strokeEllipse(550, 304, 835, 80);
    g.fillStyle(0x272743);
    g.fillRect(34, 121, 155, 57);
    g.lineStyle(2, 0x52e7dc);
    g.strokeRect(34, 121, 155, 57);
    this.add.text(48, 133, "FRAME / 09", {
      fontFamily: "monospace",
      fontSize: "19px",
      color: "#71ffde",
      fontStyle: "bold",
    });
    this.add.text(49, 157, "NO SIGNAL. ALL INSTINCT.", {
      fontFamily: "monospace",
      fontSize: "8px",
      color: "#b2bdde",
    });
    g.fillStyle(0x2a2041);
    g.fillRect(944, 52, 102, 119);
    g.lineStyle(2, 0xff7eb6);
    g.strokeRect(944, 52, 102, 119);
    this.add
      .text(995, 71, "夜", {
        fontFamily: "sans-serif",
        fontSize: "46px",
        color: "#ff8ebe",
      })
      .setOrigin(0.5, 0);
    this.add
      .text(995, 130, "AFTERHOURS", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#ffc3e1",
      })
      .setOrigin(0.5, 0);
    this.add
      .text(
        550,
        341,
        "N E O N   C I R C U I T   /   R E A D   T H E   U N S E E N",
        { fontFamily: "monospace", fontSize: "9px", color: "#74668e" },
      )
      .setOrigin(0.5);
    [45, 1055].forEach((x) => {
      g.fillStyle(0x14152a);
      g.fillRect(x - 15, 257, 30, 44);
      g.fillStyle(0xff91a1, 0.7);
      g.fillRect(x - 8, 260, 16, 4);
    });
  }
  private drawFighter(id: FighterId, x: number, side: number) {
    const color = FIGHTERS[id].color,
      g = this.add.graphics(),
      container = this.add.container(x, 285);
    const poly = (points: number[], fill: number) => {
      g.fillStyle(fill);
      g.fillPoints(
        Array.from(
          { length: points.length / 2 },
          (_, i) => new Phaser.Geom.Point(points[i * 2], points[i * 2 + 1]),
        ),
        true,
      );
    };
    g.fillStyle(0x080916, 0.5);
    g.fillEllipse(0, 10, id === "rook" ? 139 : 111, 19);
    g.lineStyle(2, color, 0.7);
    g.strokeEllipse(0, 10, 116, 22);
    const wide = id === "rook" ? 1.2 : 1;
    // Boots and split stance anchor three recognizable, original armored silhouettes.
    poly([-22, -71, -4, -69, -13, -10, -40, -10], 0x252943);
    poly([5, -69, 24, -69, 37, -9, 15, -9], 0x292d46);
    poly([-40, -20, -12, -20, -12, -3, -47, -3], color);
    poly([14, -20, 37, -20, 46, -3, 15, -3], color);
    if (id === "nyx") {
      poly([-25, -135, -60, -13, -10, -40, 24, -76, 33, -129], 0x6d4ba0);
      poly([-21, -126, -42, -24, -16, -39, 3, -108], 0xa474d0);
    }
    if (id === "vector") {
      poly([-19, -128, -49, -138, -86, -106, -48, -116, -13, -112], 0xf76d9a);
      g.lineStyle(2, 0xffbcbd);
      g.lineBetween(-35, -127, -67, -116);
    }
    poly(
      [
        -26 * wide,
        -129,
        -11,
        -139,
        18,
        -135,
        31 * wide,
        -115,
        23 * wide,
        -66,
        -24 * wide,
        -66,
      ],
      color,
    );
    poly(
      [-17, -117, 18, -121, 18, -84, -17, -80],
      id === "rook" ? 0x734b47 : 0x23334e,
    );
    poly([-18, -76, 24, -76, 25, -63, -21, -63], 0x11192d);
    poly(
      [-25 * wide, -119, -45 * wide, -106, -41 * wide, -77, -24, -89],
      id === "rook" ? 0xe78459 : color,
    );
    poly(
      [
        25 * wide,
        -120,
        45 * wide,
        -129,
        61 * wide,
        -114,
        48 * wide,
        -97,
        25,
        -100,
      ],
      color,
    );
    g.fillStyle(id === "nyx" ? 0xe5baff : 0xeef6d9);
    g.fillRoundedRect(45 * wide, -129, 23, 24, 6);
    g.fillRoundedRect(-49 * wide, -89, 23, 23, 6);
    if (id === "rook") {
      g.fillStyle(0xffc879);
      g.fillRoundedRect(-49, -126, 32, 26, 5);
      g.fillRoundedRect(17, -135, 38, 28, 5);
      g.lineStyle(4, 0x513d41);
      g.lineBetween(-39, -118, -23, -118);
      g.lineBetween(28, -127, 46, -127);
    }
    poly(
      [-21, -165, -7, -178, 14, -176, 28, -156, 20, -136, -16, -136, -27, -152],
      color,
    );
    poly([-24, -159, 25, -163, 22, -146, -19, -145], 0x172036);
    g.fillStyle(0xf9ffd5);
    g.fillRect(1, -156, 19, 4);
    if (id === "vector") {
      poly([-22, -169, -4, -186, 3, -175, 14, -183, 22, -168], 0xe0ffee);
    }
    if (id === "nyx") {
      g.lineStyle(3, 0xf2bfff);
      g.strokeEllipse(1, -169, 69, 18);
      g.lineStyle(3, 0xe8b9ff);
      g.lineBetween(61, -144, 77, -96);
      g.lineStyle(7, 0xb193fb, 0.3);
      g.lineBetween(61, -144, 77, -96);
    }
    poly([-8, -111, 6, -117, 12, -103, -1, -95], 0xfaffd4);
    g.lineStyle(2, 0xffffff, 0.5);
    g.lineBetween(-17, -132, 12, -130);
    container.add(g);
    if (side) g.scaleX = -1;
    const label = this.add
      .text(
        0,
        31,
        `${side ? "CPU" : "YOU"} / ${FIGHTERS[id].name.toUpperCase()}`,
        {
          fontFamily: "monospace",
          fontSize: "10px",
          color: side ? "#ffc8b4" : "#b3fff0",
          backgroundColor: "#14142c",
          padding: { x: 7, y: 4 },
        },
      )
      .setOrigin(0.5);
    container.add(label);
    return container;
  }
  private animate(result: Resolution) {
    const atImpact = positions(result.attackDistance),
      final = positions(result.state.distance);
    this.fighters.forEach((fighter, i) => {
      const action = result.actions[i],
        definition = [result.state.player, result.state.cpu][i],
        color = FIGHTERS[definition.id].color,
        move = getMove(action, definition.id),
        direction = i ? -1 : 1;
      this.tweens.add({
        targets: fighter,
        x: atImpact[i],
        duration: this.reduced ? 0 : 220,
        ease: "Sine.easeOut",
      });
      this.time.delayedCall(230, () => {
        if (!this.reduced && ["strike", "grab"].includes(move.type))
          this.tweens.add({
            targets: fighter,
            x: atImpact[i] + direction * (result.interrupted[i] ? 12 : 45),
            duration: 110,
            yoyo: true,
            hold: 70,
          });
        if (!this.reduced && action === "dodge")
          this.tweens.add({
            targets: fighter,
            alpha: 0.3,
            angle: -direction * 8,
            duration: 140,
            yoyo: true,
          });
        if (action === "block" || action === "recover" || result.dodged[i]) {
          const ring = this.add
            .ellipse(atImpact[i], 207, 105, 158)
            .setStrokeStyle(3, action === "recover" ? 0xa6ccff : color, 0.8);
          this.tweens.add({
            targets: ring,
            alpha: 0,
            scale: this.reduced ? 1 : 1.18,
            duration: 550,
            onComplete: () => ring.destroy(),
          });
        }
        if (
          action === "special" &&
          !result.interrupted[i] &&
          move.range.includes(result.attackDistance) &&
          !this.reduced
        ) {
          const beam = this.add.graphics();
          beam.lineStyle(definition.id === "nyx" ? 8 : 3, color, 0.7);
          beam.lineBetween(atImpact[i], 182, atImpact[1 - i], 202);
          this.tweens.add({
            targets: beam,
            alpha: 0,
            duration: 300,
            onComplete: () => beam.destroy(),
          });
        }
        this.time.delayedCall(120, () => {
          if (result.damage[i]) {
            if (!this.reduced) {
              this.cameras.main.shake(105, 0.0035);
              for (let j = 0; j < 8; j++) {
                const spark = this.add
                  .rectangle(atImpact[i], 192, 3, 10, j % 2 ? 0xffecc7 : color)
                  .setAngle(j * 45);
                this.tweens.add({
                  targets: spark,
                  x: atImpact[i] + Math.cos(j) * 65,
                  y: 192 + Math.sin(j) * 55,
                  alpha: 0,
                  duration: 300,
                  onComplete: () => spark.destroy(),
                });
              }
            }
            this.tweens.add({
              targets: fighter,
              alpha: 0.45,
              duration: 70,
              yoyo: true,
              repeat: this.reduced ? 0 : 1,
            });
          }
          const text = result.damage[i]
            ? `−${result.damage[i]}`
            : result.dodged[i]
              ? "EVADE"
              : result.blocked[i]
                ? "GUARD"
                : result.interrupted[i]
                  ? "INTERRUPTED"
                  : action === "recover"
                    ? `+${result.staminaDelta[i]} ST`
                    : "";
          if (text) {
            const label = this.add
              .text(atImpact[i], 93, text, {
                fontFamily: "monospace",
                fontSize: result.damage[i] ? "28px" : "14px",
                fontStyle: "bold",
                color: result.damage[i] ? "#fff0cb" : "#b4ffeb",
                stroke: "#221a3e",
                strokeThickness: 5,
              })
              .setOrigin(0.5);
            this.tweens.add({
              targets: label,
              y: this.reduced ? 93 : 69,
              alpha: 0,
              delay: 200,
              duration: 500,
              onComplete: () => label.destroy(),
            });
          }
        });
      });
      this.time.delayedCall(720, () => {
        this.tweens.add({
          targets: fighter,
          x: final[i],
          alpha: definition.health === 0 ? 0.35 : 1,
          duration: this.reduced ? 0 : 220,
        });
      });
    });
  }
}
