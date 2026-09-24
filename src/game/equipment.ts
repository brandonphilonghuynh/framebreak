import { type CombatantId } from "./data.ts";
import { COMBAT } from "./tuning.ts";
export type WeaponShape =
  "blade" | "hammer" | "bow" | "spear" | "disc" | "claw";
export interface Weapon {
  id: string;
  name: string;
  shape: WeaponShape;
  damage: number;
  reach: number;
  force: number;
  description: string;
}
const pair = (
  owner: CombatantId,
  a: [string, WeaponShape],
  b: [string, WeaponShape],
): [Weapon, Weapon] =>
  [a, b].map(([name, shape], index) => ({
    id: `${owner}-${index}`,
    name,
    shape,
    damage: shape === "hammer" ? 5 : shape === "claw" ? 2 : 3,
    reach: shape === "spear" ? 70 : shape === "blade" ? 35 : 12,
    force: shape === "hammer" ? 100 : shape === "disc" ? 50 : 25,
    description:
      shape === "bow"
        ? "Ranged bolts · aim with W/S + A/D"
        : shape === "disc"
          ? "Returning energy disc"
          : shape === "hammer"
            ? "Heavy launch · slower recovery"
            : shape === "spear"
              ? "Long reach · diagonal thrusts"
              : shape === "claw"
                ? "Fast pressure · short recovery"
                : "Extended arc · balanced pressure",
  })) as [Weapon, Weapon];
export const SIGNATURES: Record<CombatantId, [Weapon, Weapon]> = {
  vector: pair("vector", ["Helio sabre", "blade"], ["Arc talons", "claw"]),
  rook: pair("rook", ["Canopy maul", "hammer"], ["Root pike", "spear"]),
  nyx: pair("nyx", ["Prism bow", "bow"], ["Crescent mirror", "disc"]),
  ember: pair("ember", ["Flare claws", "claw"], ["Meteor cleaver", "blade"]),
  solis: pair("solis", ["Corona aegis", "disc"], ["Dawn hammer", "hammer"]),
  astra: pair("astra", ["Orbit lance", "spear"], ["Sunstring", "bow"]),
  warden: pair(
    "warden",
    ["Rootforged fists", "hammer"],
    ["Verdant halberd", "spear"],
  ),
  vesper: pair("vesper", ["Mirror needles", "bow"], ["Prism crescent", "disc"]),
  heliarch: pair(
    "heliarch",
    ["Furnace hammer", "hammer"],
    ["Ion crown", "disc"],
  ),
  eclipse: pair(
    "eclipse",
    ["Seraph lance", "spear"],
    ["Captured star", "disc"],
  ),
};
export const SHARED_WEAPON: Weapon = {
  id: "relay-blade",
  name: "Relay blade",
  shape: "blade",
  damage: 3,
  reach: 28,
  force: 30,
  description: "A shared solar blade for either pilot.",
};
export const WEAPONS = Object.fromEntries(
  [...Object.values(SIGNATURES).flat(), SHARED_WEAPON].map((w) => [w.id, w]),
) as Record<string, Weapon>;
export const GADGETS = ["repair", "capacitor", "aegis", "jet"] as const;
export type GadgetId = (typeof GADGETS)[number];
export const GADGET_NAMES: Record<GadgetId, string> = {
  repair: "Repair seed · −20% damage",
  capacitor: `Sun cell · +${COMBAT.meterPickup} meter`,
  aegis: "Aegis field · shield + protection",
  jet: "Updraft pack · restore recovery",
};
export interface Pickup {
  id: number;
  type: "weapon" | "gadget";
  item: string;
  owner: 0 | 1 | null;
  x: number;
  y: number;
  vy: number;
  born: number;
  life: number;
  platform: number | null;
}
