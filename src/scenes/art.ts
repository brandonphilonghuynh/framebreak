import Phaser from "phaser";
import {
  ARENAS,
  FIGHTERS,
  archetype,
  isBoss,
  type ArenaId,
  type CombatantId,
  type Platform,
} from "../game/data";
import { physique } from "../game/roster";
import type { WeaponShape } from "../game/equipment";
export interface Rig {
  root: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Container;
  front: Phaser.GameObjects.Container;
  back: Phaser.GameObjects.Container;
  legs: Phaser.GameObjects.Container[];
  label: Phaser.GameObjects.Text;
  shield: Phaser.GameObjects.Ellipse;
  charge: Phaser.GameObjects.Arc;
  weapon: Phaser.GameObjects.Graphics;
  cape: Phaser.GameObjects.Graphics;
}
const poly = (
  g: Phaser.GameObjects.Graphics,
  coords: number[],
  color: number,
  alpha = 1,
) => {
  g.fillStyle(color, alpha);
  g.fillPoints(
    Array.from(
      { length: coords.length / 2 },
      (_, i) => new Phaser.Geom.Point(coords[i * 2], coords[i * 2 + 1]),
    ),
    true,
  );
};
export function drawWeapon(
  g: Phaser.GameObjects.Graphics,
  shape: WeaponShape,
  color: number,
  x = 0,
  y = 0,
  scale = 1,
) {
  const line = (
    a: number,
    b: number,
    c: number,
    d: number,
    width: number,
    c1: number,
  ) => {
    g.lineStyle(width * scale, c1);
    g.lineBetween(x + a * scale, y + b * scale, x + c * scale, y + d * scale);
  };
  if (shape === "blade" || shape === "spear") {
    const length = shape === "spear" ? 83 : 50;
    line(0, 16, 0, -length, 5, 0x243f3c);
    line(0, -8, 0, -length, 3, 0xd7c684);
    line(-11, 0, 11, 0, 4, 0xd8b462);
    poly(
      g,
      [
        x - 5 * scale,
        y - length * scale + 15 * scale,
        x,
        y - (length + 18) * scale,
        x + 7 * scale,
        y - (length - 4) * scale,
      ],
      color,
    );
    line(0, -length + 11, 0, -length - 8, 2, 0xffffdc);
  } else if (shape === "hammer") {
    line(0, 18, 0, -44, 7, 0x9e814b);
    g.fillStyle(0xe9e5ca);
    g.fillRoundedRect(
      x - 23 * scale,
      y - 53 * scale,
      46 * scale,
      26 * scale,
      4 * scale,
    );
    g.lineStyle(3 * scale, 0x334f46);
    g.strokeRoundedRect(
      x - 23 * scale,
      y - 53 * scale,
      46 * scale,
      26 * scale,
      4 * scale,
    );
    g.fillStyle(color);
    g.fillRect(x - 18 * scale, y - 47 * scale, 36 * scale, 5 * scale);
  } else if (shape === "bow") {
    line(0, 20, 0, -44, 2, 0xede6a2);
    line(0, 20, -18, -10, 5, color);
    line(-18, -10, 0, -44, 5, color);
    line(-10, -12, 25, -12, 3, 0xfff0bd);
  } else if (shape === "disc") {
    g.lineStyle(6 * scale, color);
    g.strokeCircle(x, y - 12 * scale, 24 * scale);
    g.lineStyle(2 * scale, 0xfff0bd);
    g.strokeCircle(x, y - 12 * scale, 16 * scale);
    g.fillStyle(0xe7dfaf);
    g.fillCircle(x, y - 12 * scale, 7 * scale);
  } else {
    [-8, 0, 8].forEach((a) => {
      line(a, 4, a + 5, -30, 4, color);
      line(a + 5, -30, a + 6, -36, 2, 0xffffdc);
    });
  }
}
export function makeRig(
  scene: Phaser.Scene,
  id: CombatantId,
  side: number,
): Rig {
  const def = FIGHTERS[id],
    style = archetype(id),
    boss = isBoss(id),
    heavy = style === "rook" || id === "solis" || id === "heliarch";
  const root = scene.add.container(),
    body = scene.add.container();
  root.add(body);
  const proportions = physique(id);
  const color =
      id === "vector"
        ? 0x438675
        : id === "rook"
          ? 0x648157
          : id === "ember"
            ? 0xe19247
            : def.color,
    ivory = 0xeee8d0,
    ink = 0x173e39,
    gold = 0xc9ad67;
  const cape = scene.add.graphics();
  body.add(cape);
  if (style === "nyx" || style === "solis" || id === "astra") {
    poly(
      cape,
      [-17, -90, -38, -27, -11, -37, 8, -7, 19, -84],
      style === "solis" ? 0xc6aa5b : 0x345869,
    );
    cape.lineStyle(2, color, 0.8);
    cape.lineBetween(-18, -78, -28, -34);
  } else {
    poly(
      cape,
      [-8, -91, -36, -92, -60, -64, -30, -74],
      style === "vector" ? 0xf3d17b : color,
    );
    poly(cape, [-11, -83, -43, -76, -50, -51, -21, -65], gold, 0.85);
  }
  if (boss) {
    const wings = scene.add.graphics();
    [-1, 1].forEach((dir) => {
      poly(
        wings,
        [dir * 19, -84, dir * 70, -120, dir * 53, -67, dir * 29, -46],
        ivory,
      );
      poly(wings, [dir * 26, -83, dir * 60, -108, dir * 46, -70], color, 0.7);
    });
    body.add(wings);
  }
  const legs = [-11, 11].map((x) => {
    const limb = scene.add.container(x, -37),
      g = scene.add.graphics();
    g.fillStyle(ink);
    g.fillRoundedRect(-7, -3, 15, 34, 5);
    g.fillStyle(ivory);
    g.fillRoundedRect(-8, 7, 16, 20, 4);
    g.fillStyle(color);
    g.fillRect(-6, 10, 12, 4);
    g.fillStyle(ink);
    g.fillRoundedRect(-8, 25, 24, 12, 3);
    g.lineStyle(2, gold);
    g.lineBetween(-4, 35, 16, 35);
    limb.add(g);
    limb.setScale(proportions.limbWidth / proportions.bodyWidth, 1);
    body.add(limb);
    return limb;
  });
  const arm = (isBack: boolean) => {
    const limb = scene.add.container(isBack ? -18 : 20, -79),
      g = scene.add.graphics();
    g.fillStyle(isBack ? 0x9fbaa5 : ivory);
    g.fillRoundedRect(-8, -5, heavy ? 23 : 17, 28, 6);
    g.fillStyle(color);
    g.fillRoundedRect(-9, -7, heavy ? 25 : 19, 14, 4);
    g.lineStyle(2, gold);
    g.lineBetween(-7, 8, 10, 8);
    g.fillStyle(ink);
    g.fillRoundedRect(-6, 20, 15, 13, 3);
    g.fillStyle(ivory);
    g.fillRoundedRect(-7, 16, 18, 9, 3);
    limb.add(g);
    limb.setScale(proportions.limbWidth / proportions.bodyWidth, 1);
    return limb;
  };
  const back = arm(true);
  body.add(back);
  const core = scene.add.graphics(),
    w = heavy ? 27 : 21;
  poly(
    core,
    [-w, -84, -9, -92, 15, -90, w, -75, w - 6, -38, -w + 5, -38],
    ivory,
  );
  poly(core, [-w + 5, -77, 0, -67, w - 6, -77, w - 10, -41, -w + 8, -41], ink);
  poly(core, [-w + 3, -85, -9, -89, -3, -65, -20, -69], color);
  poly(core, [7, -87, w - 1, -80, 18, -65, 4, -66], color);
  core.lineStyle(2, gold);
  core.lineBetween(-16, -46, 16, -46);
  core.lineBetween(0, -65, 0, -49);
  core.lineStyle(1, 0xffffff, 0.5);
  core.lineBetween(-w + 3, -80, -w + 6, -54);
  core.lineStyle(3, 0x52665a, 0.5);
  core.lineBetween(w - 5, -72, w - 8, -43);
  core.fillStyle(gold);
  core.fillRoundedRect(-w, -39, w * 2, 8, 2);
  core.fillStyle(0xfcf1b1);
  core.fillCircle(0, -73, 6);
  core.lineStyle(2, color);
  core.strokeCircle(0, -73, 9);
  const head = scene.add.graphics();
  // Different faces, hair and headgear keep silhouettes readable at game scale.
  if (!boss) {
    const skin =
      id === "vector" || id === "rook" || id === "solis"
        ? 0x9c6545
        : id === "nyx"
          ? 0xb57d61
          : 0xe4b283;
    head.fillStyle(skin);
    head.fillRoundedRect(-13, -118, 29, 30, 9);
    head.fillStyle(0x253d35);
    head.fillRect(1, -106, 4, 3);
    head.fillRect(12, -106, 3, 3);
    head.lineStyle(1, 0x543b2a);
    head.lineBetween(5, -95, 12, -96);
    if (id === "vector") {
      [-12, -3, 7, 15].forEach((x, i) => {
        head.fillStyle(0x383122);
        head.fillCircle(x, -119 - (i % 2) * 3, 8);
      });
      head.fillStyle(gold);
      head.fillRoundedRect(-15, -117, 31, 6, 2);
      head.fillStyle(0x6fcfc5);
      head.fillCircle(-4, -114, 5);
      head.fillCircle(10, -114, 5);
    } else if (id === "rook") {
      poly(
        head,
        [-14, -100, -7, -89, 10, -87, 17, -95, 12, -90, -9, -87],
        0x303e30,
      );
      head.fillStyle(ink);
      head.fillRoundedRect(-14, -123, 31, 11, 4);
      head.fillStyle(color);
      head.fillRect(-17, -122, 37, 4);
    } else if (id === "ember") {
      poly(
        head,
        [-17, -110, -13, -126, 3, -135, 21, -124, 16, -114, 3, -121, -3, -107],
        0xc76138,
      );
      poly(
        head,
        [-11, -122, -37, -143, -28, -105, -45, -91, -20, -106],
        0xf18f43,
      );
    } else if (id === "nyx") {
      poly(
        head,
        [
          -17, -99, -20, -116, -9, -131, 14, -127, 23, -110, 9, -121, -5, -111,
          -12, -98,
        ],
        0xd4cde6,
      );
      head.lineStyle(3, color);
      head.lineBetween(-13, -111, 19, -113);
      head.fillStyle(gold);
      head.fillCircle(-12, -97, 3);
    } else if (id === "solis") {
      [-15, -7, 1, 9].forEach((x) => {
        head.lineStyle(5, 0xe5e2c7);
        head.lineBetween(x, -124, x - 4, -106);
      });
      head.lineStyle(3, gold);
      head.strokeEllipse(0, -105, 62, 45);
    } else {
      poly(
        head,
        [-17, -108, -11, -130, 16, -125, 23, -117, 2, -121, -8, -107],
        0x293e55,
      );
      head.lineStyle(2, gold);
      head.strokeEllipse(2, -121, 40, 12);
    }
  } else {
    poly(
      head,
      [-18, -111, -10, -131, 12, -128, 24, -110, 14, -91, -15, -94],
      ivory,
    );
    poly(core, [-14, -112, 21, -115, 14, -102, 0, -98, -13, -104], ink);
    head.lineStyle(4, color);
    head.lineBetween(-8, -109, 0, -106);
    head.lineBetween(6, -106, 16, -109);
    poly(
      head,
      [-14, -126, -24, -144, -2, -135, 6, -150, 14, -131, 26, -142, 20, -122],
      gold,
    );
  }
  head.setScale(
    boss ? 1 : 0.76 / proportions.bodyWidth,
    boss ? 1 : 0.8 / proportions.bodyHeight,
  );
  if (!boss) head.setPosition(0, -30);

  if (heavy) {
    poly(core, [-31, -89, -13, -90, -17, -72, -35, -72], ivory);
    core.fillStyle(color);
    core.fillRoundedRect(-33, -86, 17, 6, 2);
  }
  body.add(core);
  body.add(head);
  const front = arm(false);
  body.add(front);
  const weapon = scene.add.graphics({ x: 6, y: 28 });
  front.add(weapon);
  const shield = scene.add
    .ellipse(0, -60, 108, 142)
    .setStrokeStyle(3, 0xa1e8d6)
    .setFillStyle(0xa1e8d6, 0.1)
    .setVisible(false);
  root.add(shield);
  const charge = scene.add
    .circle(0, -62, 65)
    .setStrokeStyle(3, color, 0.8)
    .setVisible(false);
  root.add(charge);
  const label = scene.add
    .text(0, -136 * proportions.bodyHeight, side ? "CPU" : "P1", {
      fontFamily: "Arial",
      fontStyle: "bold",
      fontSize: "12px",
      color: side ? "#ffe1a1" : "#ceffe4",
      backgroundColor: "#133d3dd9",
      padding: { x: 7, y: 4 },
    })
    .setOrigin(0.5);
  root.add(label);
  body.setScale(proportions.bodyWidth, proportions.bodyHeight);
  return { root, body, front, back, legs, label, shield, charge, weapon, cape };
}
export function drawArena(scene: Phaser.Scene, id: ArenaId) {
  const bg = scene.add
    .image(600, 340, id === "skyline" ? "gardens" : "orbital")
    .setDisplaySize(1200, 680);
  if (id === "reactor") bg.setTint(0xffd7b1);
  if (id === "tempest") bg.setTint(0xbce7ff);
  const g = scene.add.graphics();
  g.fillStyle(
    id === "reactor" ? 0x492d1f : 0x285e67,
    id === "skyline" ? 0.08 : 0.12,
  );
  g.fillRect(0, 0, 1200, 680);
  // Distant, translucent solar sails leave the middle of the arena clear.
  if (id === "reactor") {
    g.lineStyle(15, 0xdec69b, 0.4);
    g.strokeCircle(940, 215, 130);
    g.lineStyle(3, 0xffe4a0, 0.8);
    g.strokeCircle(940, 215, 111);
    [-1, 1].forEach((dir) => {
      g.fillStyle(0x304c50, 0.55);
      g.fillRect(dir < 0 ? 24 : 1100, 0, 76, 680);
      for (let y = 90; y < 650; y += 90) {
        g.fillStyle(0xffd280, 0.65);
        g.fillRect(dir < 0 ? 38 : 1114, y, 48, 3);
      }
    });
  }
  g.fillGradientStyle(0x123f39, 0x123f39, 0x103c37, 0x103c37, 0, 0, 0.45, 0.45);
  g.fillRect(0, 570, 1200, 110);
}
export function drawPlatforms(
  g: Phaser.GameObjects.Graphics,
  platforms: Platform[],
  id: ArenaId,
) {
  g.clear();
  const color = ARENAS[id].color;
  platforms.forEach((p, i) => {
    const deep = p.oneWay ? 17 : 40;
    g.fillStyle(0x163e3d, 0.22);
    g.fillRoundedRect(p.x + 7, p.y + deep + 4, p.width, 9, 4);
    g.fillStyle(0x355953);
    g.fillRoundedRect(p.x, p.y, p.width, deep, 6);
    poly(
      g,
      [
        p.x + 20,
        p.y + deep,
        p.x + p.width - 20,
        p.y + deep,
        p.x + p.width - 42,
        p.y + deep + 24,
        p.x + 45,
        p.y + deep + 24,
      ],
      0x234741,
    );
    g.fillStyle(0xdbdac1);
    g.fillRoundedRect(p.x - 2, p.y - 3, p.width + 4, 10, 4);
    g.lineStyle(3, color);
    g.lineBetween(p.x + 10, p.y + 9, p.x + p.width - 10, p.y + 9);
    for (let x = p.x + 18; x < p.x + p.width - 12; x += 48) {
      g.fillStyle(0x182f37);
      g.fillRect(x, p.y + 15, 25, deep > 20 ? 13 : 2);
      g.lineStyle(1, color, 0.6);
      g.lineBetween(x + 3, p.y + 18, x + 22, p.y + 18);
    }
    if (id !== "reactor")
      for (let j = 0; j < Math.floor(p.width / 70); j++) {
        const x = p.x + 17 + j * 66;
        g.lineStyle(2, 0x547744, 0.9);
        g.lineBetween(x, p.y + 4, x + 6, p.y + 26 + (j % 3) * 8);
        g.fillStyle(0x79a459);
        g.fillEllipse(x + 3, p.y + 13, 9, 4);
        g.fillEllipse(x + 8, p.y + 23, 8, 5);
      }
    g.fillStyle(0xf6df95, 0.7);
    g.fillRect(p.x + p.width / 2 - 12, p.y + deep + 7, 24, 3);
    if (p.motion) {
      g.lineStyle(1, 0xf3e8b1, 0.3);
      g.strokeEllipse(p.x + p.width / 2, p.y + deep + 31, 40, 8);
    }
  });
}
export function drawDrone(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  color: number,
  beam = false,
) {
  g.fillStyle(0xe9e5d1);
  g.fillRoundedRect(x - 27, y - 12, 54, 26, 10);
  g.lineStyle(2, 0x214c47);
  g.strokeRoundedRect(x - 27, y - 12, 54, 26, 10);
  g.fillStyle(0x234b44);
  g.fillRoundedRect(x - 16, y - 5, 32, 12, 4);
  g.fillStyle(color);
  g.fillCircle(x - 6, y, 3);
  g.fillCircle(x + 6, y, 3);
  [-1, 1].forEach((dir) => {
    g.fillStyle(0xd7c68b);
    g.fillEllipse(x + dir * 36, y + 1, 19, 11);
    g.lineStyle(2, color, 0.7);
    g.strokeEllipse(x + dir * 36, y - 5, 31, 6);
  });
  if (beam) {
    g.fillStyle(color, 0.12);
    g.fillTriangle(x - 18, y + 14, x + 18, y + 14, x, y + 115);
  }
}
