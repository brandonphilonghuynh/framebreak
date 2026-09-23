import Phaser from "phaser";
import { MOVES, type Resolution } from "../game/combat";
export class Arena extends Phaser.Scene {
  private fighters: Phaser.GameObjects.Container[] = [];
  private rings: Phaser.GameObjects.Ellipse[] = [];
  constructor() {
    super("Arena");
  }
  create() {
    this.fighters = [];
    this.rings = [];
    const g = this.add.graphics();
    g.fillStyle(0x101a20);
    g.fillRect(0, 0, 1100, 410);
    g.lineStyle(1, 0x24343b);
    for (let x = -500; x < 1700; x += 100) g.lineBetween(550, 80, x, 410);
    for (let y = 235; y < 410; y += 35) g.lineBetween(0, y, 1100, y);
    g.fillStyle(0x142229);
    g.fillRect(0, 0, 1100, 225);
    for (let x = 40; x < 1100; x += 170) {
      g.lineStyle(1, 0x2a3c43);
      g.strokeRect(x, 35, 105, 170);
      g.lineBetween(x, 35, x + 105, 205);
    }
    g.lineStyle(3, 0x38514f);
    g.lineBetween(0, 225, 1100, 225);
    g.lineStyle(1, 0x91c9ad, 0.25);
    g.strokeEllipse(550, 335, 760, 105);
    this.add
      .text(550, 62, "F B  /  TRAINING DIVISION", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#50666c",
      })
      .setOrigin(0.5);
    this.add
      .text(550, 120, "01", {
        fontFamily: "Arial",
        fontStyle: "bold",
        fontSize: "76px",
        color: "#203339",
      })
      .setOrigin(0.5);
    [350, 750].forEach((x, i) => {
      const color = i ? 0xf4a078 : 0xa8f0cb;
      this.add.ellipse(x, 337, 140, 24, 0x000000, 0.4);
      const ring = this.add
        .ellipse(x, 262, 132, 180)
        .setStrokeStyle(3, color)
        .setVisible(false);
      this.rings.push(ring);
      const body = this.add.graphics();
      body.fillStyle(color);
      body.fillRoundedRect(-25, -127, 48, 65, 10);
      body.fillCircle(0, -151, 19);
      body.lineStyle(18, color);
      body.lineBetween(-14, -70, -26, -9);
      body.lineBetween(13, -70, 32, -9);
      body.lineStyle(15, color);
      body.lineBetween(-20, -113, -43, -80);
      body.lineBetween(20, -112, 48, -125);
      body.fillStyle(0x152a2a);
      body.fillRect(2, -159, 17, 7);
      body.fillRect(-23, -80, 45, 9);
      const fighter = this.add.container(x, 332, [body]);
      if (i) fighter.scaleX = -1;
      this.fighters.push(fighter);
      this.tweens.add({
        targets: fighter,
        y: 328,
        duration: 1100 + i * 150,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });
    this.game.events.on("resolve", this.animate, this);
    this.game.events.on("reset-arena", this.resetArena, this);
    this.events.once("shutdown", () => {
      this.game.events.off("resolve", this.animate, this);
      this.game.events.off("reset-arena", this.resetArena, this);
    });
  }
  private resetArena() {
    // Restart also clears old effect timers and tweens.
    this.scene.restart();
  }
  private animate(result: Resolution) {
    result.actions.forEach((action, i) => {
      const fighter = this.fighters[i],
        direction = i ? -1 : 1,
        base = i ? 750 : 350;
      if (["strike", "grab"].includes(MOVES[action].type))
        this.tweens.add({
          targets: fighter,
          x: base + direction * 125,
          duration: 160,
          yoyo: true,
          hold: 100,
        });
      if (action === "dodge")
        this.tweens.add({
          targets: fighter,
          x: base - direction * 75,
          alpha: 0.25,
          duration: 180,
          yoyo: true,
        });
      if (action === "block" || action === "recover") {
        this.rings[i]
          .setStrokeStyle(3, action === "recover" ? 0x83c5f4 : 0xa8f0cb)
          .setVisible(true);
        this.time.delayedCall(650, () => this.rings[i].setVisible(false));
      }
      this.time.delayedCall(190, () => {
        if (result.damage[i]) {
          this.cameras.main.shake(110, 0.004);
          const spark = this.add.circle(base, 242, 30, 0xfff2d3, 0.9);
          this.tweens.add({
            targets: spark,
            scale: 2.5,
            alpha: 0,
            duration: 300,
            onComplete: () => spark.destroy(),
          });
          this.tweens.add({
            targets: fighter,
            alpha: 0.25,
            duration: 65,
            yoyo: true,
            repeat: 2,
          });
        }
        const label = this.add
          .text(
            base,
            180,
            result.damage[i]
              ? `−${result.damage[i]} HP`
              : action === "dodge"
                ? "EVADE"
                : action === "block"
                  ? "GUARD"
                  : "",
            {
              fontFamily: "monospace",
              fontSize: "24px",
              color: result.damage[i] ? "#ffc3a4" : "#a8f0cb",
            },
          )
          .setOrigin(0.5);
        this.tweens.add({
          targets: label,
          y: 145,
          alpha: 0,
          duration: 1000,
          onComplete: () => label.destroy(),
        });
      });
    });
  }
}
