import { FIGHTERS, type FighterId } from "../game/data.ts";
import { PHYSIQUES, ROLES, SPECIALS, ULTIMATES } from "../game/roster.ts";
import { LORE } from "../game/lore.ts";
import { SIGNATURES } from "../game/equipment.ts";

/** Values come from the actual rule tables, rather than arbitrary power bars. */
export function fighterStats(id: FighterId): string {
  const f = FIGHTERS[id],
    p = PHYSIQUES[id];
  const stats = [
    [
      "Attack",
      `${f.damage}% base`,
      "Unarmed first strike; weapons add their own damage.",
    ],
    [
      "Defense",
      `${Math.round(100 / p.damageTaken)}%`,
      `Relative damage durability; weight ${f.weight.toFixed(2)}× resists knockback.`,
    ],
    [
      "Speed",
      `${f.speed} u/s`,
      "Maximum ground speed, before fields or guarding.",
    ],
    [
      "Mobility",
      `${p.jumps} jumps / ${p.dodges} dodge${p.dodges > 1 ? "s" : ""}`,
      `Jump ${f.jump}; air control ${p.airControl}; acceleration ${p.acceleration}.`,
    ],
    [
      "Complexity",
      `${ROLES[id].complexity}/4`,
      "How demanding the controls and timing are, not power.",
    ],
    [
      "Ult. range",
      `${ULTIMATES[id].range} u`,
      "Approximate coverage including hitbox. Cataclysm is total width across both sides.",
    ],
  ];
  return `<dl class="fighter-stats">${stats.map(([label, value, title]) => `<div title="${title}"><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl>`;
}
export function profileSections(id: FighterId): string {
  const f = FIGHTERS[id],
    l = LORE[id],
    p = PHYSIQUES[id];
  return `<section id="dossier-section-0" class="dossier-section" aria-label="Biography"><div class="dossier-facts">${[
    ["IDENTITY", l.alias],
    ["HOMEWORLD", l.homeworld],
    ["GALAXY", l.galaxy],
    ["HEIGHT / MASS", `${l.height} / ${l.weight}`],
    ["ROLE", ROLES[id].role],
    ["DIFFICULTY", ROLES[id].difficulty],
  ]
    .map(([key, value]) => `<div><small>${key}</small><b>${value}</b></div>`)
    .join(
      "",
    )}</div><h3>Built for the circuit</h3><p>${l.build}</p><h3>Before the spotlight</h3><p>${l.background}</p></section>
  <section id="dossier-section-1" class="dossier-section" aria-label="Combat" hidden>${fighterStats(id)}<h3>Fighting style</h3><p>${l.style}</p><div class="strength-grid"><div><h3>Advantages</h3><p>${l.strengths}</p></div><div><h3>Tradeoffs</h3><p>${l.weaknesses}</p></div></div><h3>J / Normal attacks</h3><p>Three deliberate presses chain ${f.damage}, ${f.damage}, ${f.damage + 3}% unarmed strikes before defense modifiers. The finisher launches. Aim with movement and W/S. Down + J in the air performs ${f.downAir}: ${f.downAirDamage}% base damage and ${f.downAirStun}s stun. Repeated hits cannot restart stun, and opponents gain a short escape window when it ends.</p><h3>K / ${f.special} <small>${SPECIALS[id].cooldown}s cooldown</small></h3><p>${SPECIALS[id].description}</p><h3>I / ${f.ultimate}</h3><p>${f.ultimateDescription} Earn 60 meter, then hold/release I; full power takes 2 seconds, with a ${ULTIMATES[id].windup}s minimum windup. Two possible pulses together deal up to ${Math.round((f.damage + 3 + Math.max(...SIGNATURES[id].map((w) => w.damage))) * ULTIMATES[id].multiplier * 10) / 10}% before defense or distance modifiers. Every ultimate can be parried.</p><h3>Movement & recovery</h3><p>${p.jumps} jumps; ${p.dodges} stored dodge${p.dodges > 1 ? "s" : ""}, recharging one every ${p.dodgeRecharge}s. W + K, release K: ${f.recovery}, once per airtime, independent of the signature cooldown. Landing restores jumps and recovery.</p><h3>Signature equipment</h3><p>${SIGNATURES[id].map((w) => `<b>${w.name}</b> — ${w.description}.`).join(" ")}</p></section>
  <section id="dossier-section-2" class="dossier-section" aria-label="Lore" hidden><span class="eyebrow">THE FRAMEBREAK TOURNAMENT</span><h3>Worlds linked by a borrowed dawn</h3><p>The Solstice Circuit draws fighters from solar civilizations across three galaxies. Its floating arenas are powered by a relay built to share daylight. Glory and prize money are real; so are the missing energy shipments beneath the spectacle.</p><h3>What brings ${f.name} here</h3><p>${l.motivation}</p><h3>Allies, debts & rivalries</h3><p>${l.relationships}</p><blockquote>“${l.quote}”</blockquote></section>`;
}
