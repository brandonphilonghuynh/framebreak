import type { FighterId } from "./data.ts";
export interface Lore {
  alias: string;
  homeworld: string;
  galaxy: string;
  height: string;
  weight: string;
  build: string;
  style: string;
  strengths: string;
  weaknesses: string;
  background: string;
  motivation: string;
  relationships: string;
  quote: string;
}
/** Expands the established solar courier / guardian / duelist identities. */
export const LORE: Record<FighterId, Lore> = {
  vector: {
    alias: "Vector · Ilan Vey",
    homeworld: "Solstice, the Canopy Cities",
    galaxy: "Aurelia Spiral",
    height: "181 cm",
    weight: "79 kg",
    build:
      "Lean, moderately muscular; courier endurance beneath green-and-ivory solar armor.",
    style:
      "Courier footwork, compact sabre combinations and directed solar pressure.",
    strengths:
      "Balanced acceleration and recovery. Solar Lance covers a straight approach without requiring an equipped weapon.",
    weaknesses:
      "No extra jump or dodge. His beam has a readable startup and leaves his back exposed.",
    background:
      "Ilan carried replacement sun cells between the hanging districts of Solstice long before anyone called him Vector. His battered goggles once belonged to the engineer who built the first garden skybridge. When the Circuit bought the routes his neighbors depended on, the courier entered under the call sign painted on his glider.",
    motivation:
      "Win the routes back, and discover why the tournament collectors are draining more sunlight than their arenas could ever use.",
    relationships:
      "Rook taught him how to fall without breaking his armor. Ember is his oldest racing rival; they still count bridge crossings as victories. He trusts Solis, but not the answers Solis avoids.",
    quote: "The shortest way home is through the impossible.",
  },
  rook: {
    alias: "Rook · Damar Osei",
    homeworld: "Verdance, the Root Bastions",
    galaxy: "Aurelia Spiral",
    height: "218 cm",
    weight: "158 kg",
    build:
      "Very tall, exceptionally muscular heavyweight; layered ivory armor and living canopy growth.",
    style:
      "Bastion wrestling, planted hammer strikes and seismic counterpressure.",
    strengths:
      "Highest roster weight and damage resistance. Wide grounded strikes; Bulwark absorbs ordinary interruption before pushing rivals away.",
    weaknesses:
      "Slow acceleration, broad collision profile and limited aerial steering. Cataclysm must reach solid footing and can be jumped.",
    background:
      "Damar held a refugee skybridge for six days during the Helion Water Accord conflict. The green vines on his armor are grafts from the last garden he defended. The Circuit calls him immovable, but he remembers every place he was forced to leave.",
    motivation:
      "Use tournament winnings to rebuild the Root Bastions, and find the missing convoy whose signal appeared inside the Circuit archives.",
    relationships:
      "Astra commanded the tide engines across that same skybridge. Each thought the other had destroyed the convoy until an identical forged order surfaced. Rook now protects Vector with an older brother’s impatient affection.",
    quote: "Behind me, something is still growing.",
  },
  nyx: {
    alias: "Nyx · Sera Nadir",
    homeworld: "Vespera, the Prism Belt",
    galaxy: "Nacre Veil",
    height: "174 cm",
    weight: "64 kg",
    build:
      "Slim, agile and lean; silver-violet hair, a star earring and a high-collared prism cloak.",
    style:
      "Prism navigation translated into combat: fan trajectories, distance traps and sudden angle changes.",
    strengths:
      "Fast acceleration and three separate Starfall paths. Excellent spacing with a bow or returning mirror.",
    weaknesses:
      "Low direct strike damage. Starfall never tracks; enemies who read its lanes can close the gap.",
    background:
      "Sera mapped solar routes through a belt whose mirrors could bend a sunrise around a planet. When a rogue mirror engine began erasing whole routes, she stole its star charts and vanished. The silver in her hair is a souvenir of the escape; the name Nyx is the one she kept.",
    motivation:
      "Trace Vesper Prime’s missing charts to the tournament’s hidden observatory before anyone can turn another inhabited sun into a weapon.",
    relationships:
      "Astra can read the oceanic coordinates hidden in her charts. Nyx trades information with Ember and needles Solis whenever he recognizes a symbol too quickly.",
    quote: "You cannot strike the space I have already left.",
  },
  ember: {
    alias: "Ember · Kira Solane",
    homeworld: "Cinderwake, the Solar Sails",
    galaxy: "Aurelia Spiral",
    height: "166 cm",
    weight: "56 kg",
    build:
      "Slim, lightweight and athletic; red hair and translucent solar wings over warm ivory flight armor.",
    style:
      "Solar-wing racing, short claw combinations and explosive changes of aerial direction.",
    strengths:
      "Three jumps, two dodge charges and the fastest ground acceleration. Phoenix Dash connects creative approach and escape routes.",
    weaknesses:
      "Lowest weight and damage resistance; short unarmed reach. Dodge charges recharge one at a time, and Phoenix Dash is not invulnerable.",
    background:
      "Kira grew up catching thermal currents between Cinderwake’s solar sails. Her first phoenix rig was built from scrapped collector vanes and a dare. She became a champion racer, then a relief pilot when the forge sovereign began impounding the colony’s energy harvest.",
    motivation:
      "Defeat the Heliarch’s claim on the sails and win enough light to keep her home airborne through its long eclipse.",
    relationships:
      "Vector still owes her a new set of goggles after their last race. Rook calls her reckless, then quietly repairs her wing mounts. She suspects Nyx knows who signed the forge’s orders.",
    quote: "If the sky closes, I will make another opening.",
  },
  solis: {
    alias: "Solis · Amon of the First Dawn",
    homeworld: "Heliova, the Corona Sanctum",
    galaxy: "The Auric Reach",
    height: "205 cm",
    weight: "116 kg",
    build:
      "Tall, muscular and imposing, with a mobile guardian’s stance, white locs and a gold collector halo.",
    style:
      "Solar shield forms, anchored territory control and patient counterattacks.",
    strengths:
      "Strong durability and weight with better mobility than Rook. Eclipse Field creates a temporary defensive position rather than a damage race.",
    weaknesses:
      "Moderate acceleration. The field remains where it was cast; opponents can leave, and Solis loses its protection when he follows.",
    background:
      "Amon guarded the first solar relay, before it became the heart of the FrameBreak tournament. Its founders promised to share daylight with worlds that had none. His white locs and scarred corona mark decades spent keeping that promise after the founders disappeared.",
    motivation:
      "Reach the buried relay beneath the finals and learn whether the tournament’s captured star is being healed or consumed.",
    relationships:
      "He recognized Rook and Astra’s forged orders because they carried a founder’s seal. He has not yet told them whose. Vector’s stubborn generosity reminds him of the engineer he failed to save.",
    quote: "A dawn belongs to everyone it reaches.",
  },
  astra: {
    alias: "Astra · Cael Maris",
    homeworld: "Pelagia, the Tidal Rings",
    galaxy: "Nacre Veil",
    height: "186 cm",
    weight: "74 kg",
    build:
      "Graceful, athletic and lean; navy hair, cyan-white armor and a suspended tidal mantle.",
    style:
      "Orbital lance fencing and closed-loop water manipulation, with precise aerial redirects.",
    strengths:
      "The most precise air steering. Hold or release Tidal Orbit to vary placement; its escapable vortex opens technical combo and spacing routes.",
    weaknesses:
      "Light frame, modest basic damage and demanding spacing. The sphere and vortex share a single damage opportunity; wasted placement leaves a long cooldown.",
    background:
      "Cael learned to guide water through Pelagia’s orbital habitats without losing a drop to the void. During the Helion conflict, their tide engines faced Rook’s bastion. A falsified evacuation order made enemies of two people who were trying to protect the same convoy.",
    motivation:
      "Recover the convoy manifest and redirect the Circuit’s stolen energy into the failing tidal rings at home.",
    relationships:
      "Rook is a former enemy and a difficult new ally. Nyx is their partner in deciphering the hidden charts. Astra suspects Solis knows the architect behind both the conflict and the Circuit.",
    quote: "Even a star must answer to its orbit.",
  },
};
