import Phaser from "phaser";
import { FIGHTERS } from "../game/data";
import { SPECIALS } from "../game/roster";
import type { Attack, WorldState } from "../game/simulation";

const ring = (
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  color: number,
  alpha = 0.8,
) => {
  g.lineStyle(2, color, alpha);
  g.strokeCircle(x, y, radius);
};
function star(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  color: number,
  rotation = 0,
) {
  const points = Array.from({ length: 10 }, (_, i) => {
    const a = rotation + (i * Math.PI) / 5 - Math.PI / 2,
      r = i % 2 ? radius * 0.4 : radius;
    return new Phaser.Geom.Point(x + Math.cos(a) * r, y + Math.sin(a) * r);
  });
  g.fillStyle(color, 0.8);
  g.fillPoints(points, true);
  g.lineStyle(1.5, 0xfff4d5, 0.9);
  g.strokePoints(points, true);
}
export function drawFields(
  g: Phaser.GameObjects.Graphics,
  w: WorldState,
  reduced: boolean,
) {
  for (const f of w.fields) {
    const alpha = Math.min(1, f.life / 0.3),
      phase = reduced ? 0 : w.time;
    if (f.kind === "eclipse") {
      g.fillStyle(0x111c31, 0.28 * alpha);
      g.fillCircle(f.x, f.y, f.radius);
      g.lineStyle(7, 0xf4c85b, 0.22 * alpha);
      g.strokeCircle(f.x, f.y, f.radius - 4);
      ring(g, f.x, f.y, f.radius, 0xffe5a0, alpha);
      g.fillStyle(0x101b29, 0.88);
      g.fillCircle(f.x, f.y, 24);
      g.lineStyle(5, 0xffd375, 0.8);
      g.strokeCircle(f.x, f.y, 28);
      for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI) / 5 + phase * 0.2;
        g.lineStyle(2, 0xffeeb8, 0.7 * alpha);
        g.lineBetween(
          f.x + Math.cos(a) * 32,
          f.y + Math.sin(a) * 32,
          f.x + Math.cos(a) * 40,
          f.y + Math.sin(a) * 40,
        );
      }
    } else {
      g.fillStyle(0x6be5f4, 0.1 * alpha);
      g.fillCircle(f.x, f.y, f.radius);
      for (let i = 0; i < 3; i++) {
        g.lineStyle(
          3 - i * 0.6,
          i === 0 ? 0xf2fffb : 0x6be5f4,
          (0.65 - i * 0.12) * alpha,
        );
        g.beginPath();
        g.arc(
          f.x,
          f.y,
          30 + i * 25,
          phase * 3 + i * 2,
          phase * 3 + i * 2 + 4.6,
        );
        g.strokePath();
      }
    }
  }
  for (const f of w.fighters) {
    if (f.ability) {
      const id = f.ability,
        color = FIGHTERS[id].color,
        x = f.x,
        y = f.y - 60;
      if (id === "vector") {
        const direction = f.abilityFacing;
        g.lineStyle(1, 0xffe2a0, 0.65);
        g.lineBetween(x, y, x + direction * 450, y);
        g.fillStyle(0x174c53);
        g.fillRect(x - 20, y - 30, 40, 24);
        g.lineStyle(2, 0xecc777);
        g.strokeRect(x - 20, y - 30, 40, 24);
        for (let i = -10; i < 20; i += 10)
          g.lineBetween(x + i, y - 30, x + i, y - 6);
      } else if (id === "astra") {
        const a = reduced ? 0 : f.abilityTime * 5;
        ring(g, x, y, 42, color, 0.65);
        g.fillStyle(0x9ef5ff, 0.8);
        g.fillCircle(x + Math.cos(a) * 42, y + Math.sin(a) * 42, 13);
        g.lineStyle(1, 0xd6ffff, 0.7);
        g.lineBetween(x, y, x + f.abilityFacing * 100, y + f.abilityAim * 100);
      } else {
        ring(
          g,
          x,
          y,
          35 + Math.min(1, f.abilityTime / SPECIALS[id].windup) * 24,
          color,
          0.65,
        );
        if (id === "nyx")
          [-1, 0, 1].forEach((lane) =>
            star(g, x + lane * 30, y - 40, 9, color),
          );
      }
    }
    if (f.armor > 0) {
      g.lineStyle(4, 0xe9d28b, 0.8);
      g.strokeRoundedRect(f.x - 37, f.y - 122, 74, 117, 12);
    }
    if (f.id === "rook" && f.charge === "ultimate") {
      const width = 180 + Math.min(1, f.chargeTime / 2) * 200;
      g.lineStyle(3, 0xffce87, 0.6);
      g.lineBetween(f.x - width / 2, f.y, f.x + width / 2, f.y);
    }
  }
}
/** Return false to use the established normal-strike renderer. */
export function drawSignature(
  g: Phaser.GameObjects.Graphics,
  a: Attack,
  w: WorldState,
  reduced: boolean,
): boolean {
  const time = reduced ? 0 : w.time,
    owner = w.fighters[a.owner].id;
  if (a.effect === "cataclysm" || a.effect === "bulwark") {
    const ground = a.y + a.height / 2;
    g.fillStyle(a.color, 0.12);
    g.fillEllipse(a.x, ground - 12, a.width, a.height);
    g.lineStyle(a.effect === "cataclysm" ? 5 : 3, 0xffda8c, 0.9);
    g.strokeEllipse(a.x, ground - 8, a.width, 30);
    for (let i = -3; i <= 3; i++) {
      const x = a.x + (i * a.width) / 7;
      g.lineStyle(2, 0xf8dda1, 0.75);
      g.lineBetween(x - 14, ground, x, ground - 8);
      g.lineBetween(x, ground - 8, x + 12, ground + 5);
      if (!reduced) {
        g.fillStyle(0xb1a681, 0.8);
        g.fillRect(x, ground - 22 - Math.sin((a.age ?? 0) * 9 + i) * 15, 7, 5);
      }
    }
    return true;
  }
  if (
    a.effect === "solar-beam" ||
    (a.kind === "ultimate" && owner === "vector")
  ) {
    g.fillStyle(a.color, 0.17);
    g.fillRoundedRect(
      a.x - a.width / 2,
      a.y - a.height / 2,
      a.width,
      a.height,
      8,
    );
    g.lineStyle(a.kind === "ultimate" ? 13 : 7, 0xfbe6a0, 0.65);
    g.lineBetween(a.x - a.width / 2, a.y, a.x + a.width / 2, a.y);
    g.lineStyle(3, 0xfff8de, 0.95);
    g.lineBetween(a.x - a.width / 2, a.y, a.x + a.width / 2, a.y);
    return true;
  }
  if (a.effect === "star" || (a.kind === "ultimate" && owner === "nyx")) {
    g.fillStyle(a.color, 0.12);
    g.fillCircle(a.x, a.y, a.width * 0.6);
    star(g, a.x, a.y, a.width * 0.5, a.color, time * 2);
    if (a.kind === "ultimate") ring(g, a.x, a.y, a.width * 0.65, a.color, 0.45);
    return true;
  }
  if (a.effect === "phoenix") {
    const x = a.x,
      y = a.y,
      d = a.direction;
    g.fillStyle(0xffa654, 0.38);
    g.fillTriangle(
      x + d * a.width * 0.5,
      y,
      x - d * a.width,
      y - a.height * 0.5,
      x - d * a.width * 0.4,
      y + a.height * 0.5,
    );
    g.lineStyle(4, 0xffe4a6, 0.85);
    g.lineBetween(
      x - d * a.width * 0.7,
      y - a.height * 0.25,
      x + d * a.width * 0.4,
      y,
    );
    g.lineBetween(
      x - d * a.width * 0.7,
      y + a.height * 0.25,
      x + d * a.width * 0.4,
      y,
    );
    return true;
  }
  if (
    a.effect === "tidal-orb" ||
    (a.kind === "ultimate" && owner === "astra")
  ) {
    g.fillStyle(a.color, 0.22);
    g.fillCircle(a.x, a.y, a.width / 2);
    ring(g, a.x, a.y, a.width * 0.48, 0xdbfff8);
    g.lineStyle(3, a.color, 0.8);
    g.strokeEllipse(a.x, a.y, a.width * 1.25, a.height * 0.4);
    for (let i = 0; i < 3; i++) {
      const angle = time * 3 + i * 2.1;
      g.fillStyle(0xe9fff7);
      g.fillCircle(
        a.x + (Math.cos(angle) * a.width) / 2,
        a.y + (Math.sin(angle) * a.height) / 2,
        4,
      );
    }
    return true;
  }
  if (a.kind === "ultimate" && owner === "solis") {
    g.fillStyle(0xffd878, 0.16);
    g.fillCircle(a.x, a.y, a.height / 2);
    ring(g, a.x, a.y, a.height / 2, 0xffe7a0);
    ring(g, a.x, a.y, a.height / 3, 0xfff8ce, 0.9);
    star(g, a.x, a.y, a.height * 0.28, 0xffd270, time * 0.7);
    return true;
  }
  return false;
}
