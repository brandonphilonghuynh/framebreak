import Phaser from "phaser";
import { Arena } from "./scenes/Arena";
import {
  canUse,
  chooseCpu,
  cost,
  newMatch,
  resolveTurn,
  unavailableReason,
  shiftDistance,
} from "./game/combat";
import {
  ACTIONS,
  FIGHTERS,
  FIGHTER_IDS,
  MOVES,
  DISTANCES,
  KEYS,
  ICONS,
  getMove,
  type Action,
  type FighterId,
  type Difficulty,
} from "./game/data";
import { CombatAudio } from "./game/audio";
import { portrait } from "./ui/portraits";
import "./style.css";
const app = document.querySelector<HTMLDivElement>("#app")!;
const card = (action: Action) =>
  `<button class="action ${action}" data-action="${action}"><div class="action-top"><kbd>${KEYS[action]}</kbd><span id="cost-${action}" class="cost"></span><span class="move-icon">${ICONS[action]}</span></div><div class="move-name" id="name-${action}"></div><div id="stats-${action}" class="move-stats"></div><p id="desc-${action}"></p><div id="reach-${action}" class="reach"></div></button>`;
app.innerHTML = `
<header><a class="brand" href="#" aria-label="FRAMEBREAK roster">FRAME<span>BREAK</span><i>ϟ</i></a><div class="header-right"><span class="edition">NEON CIRCUIT <b>1.0</b></span><button id="sound" class="small" aria-pressed="false">SOUND OFF</button><button id="motion" class="small" aria-pressed="false">REDUCE MOTION</button><button id="help" class="small">FIELD MANUAL ↗</button></div></header>
<main><div class="intro"><div><div class="eyebrow"><span class="live-dot"></span> SIMULTANEOUS TACTICAL FIGHTING</div><h1>Break the <em>pattern.</em></h1></div><div class="intro-aside"><span>THE ROOFTOPS ARE YOURS.</span><p>Read the distance. Read the rival.</p></div></div>
<section id="combat" aria-label="Combat arena"><div class="arena-top"><span>◈ SKYLINE 09 <i>/</i> AFTER HOURS</span><span id="turn">EXCHANGE 01</span></div><div class="fighters-hud">${[0, 1].map((i) => `<div class="fighter-hud ${i ? "enemy" : ""}"><div class="hud-portrait" id="portrait-${i}"></div><div class="hud-data"><div class="fighter-name"><div><small id="role-${i}"></small><strong id="fighter-${i}"></strong></div><span id="hp${i}"></span></div><div class="bar health"><div id="health${i}"></div></div><div class="stamina-line"><span>STAMINA</span><span id="sp${i}"></span></div><div class="bar stamina"><div id="stamina${i}"></div></div><div id="signature-${i}" class="signature-state"></div></div></div>`).join("")}<div class="versus">VS</div></div>
<div id="arena"><div id="reveal" class="reveal" aria-live="polite"></div></div><div class="range-strip"><span>STRIKE DISTANCE</span><div id="distance"></div><span id="range-hint"></span></div></section>
<section class="decision"><div class="section-heading"><div><span class="eyebrow">YOUR MOVE</span><h2 id="phase">Choose your next read</h2></div><span id="cpu-status"><i class="live-dot"></i> RIVAL LOCKED IN</span></div><div class="action-grid">${ACTIONS.slice(0, 7).map(card).join("")}</div><div class="footwork"><span><b>CONTROL THE GAP</b><small>Footwork resolves before attacks.</small></span>${ACTIONS.slice(
  7,
)
  .map(
    (a) =>
      `<button class="movement" data-action="${a}"><kbd>${KEYS[a]}</kbd><b>${MOVES[a].name}</b><span>${ICONS[a]}</span><small>−8 ST</small></button>`,
  )
  .join(
    "",
  )}<p id="footwork-note">Opposite steps cancel. Matching steps stack.</p></div></section>
<section class="intel"><div class="read-panel"><span class="eyebrow">READ THE ROOM</span><p id="read"></p><div class="history" id="history"></div></div><div class="log-panel"><div class="section-heading"><span class="eyebrow">THE EXCHANGE</span><span id="log-tag"></span></div><div id="log" role="log" aria-live="polite"></div></div></section>
<footer><span>FRAMEBREAK / NEON CIRCUIT 1.0</span><span>1–7 ACTIONS · Q/E FOOTWORK · H HELP · R REMATCH</span><div><button id="roster" class="small">CHANGE FIGHTERS</button><button id="restart" class="small">REMATCH ↻</button></div></footer></main>
<dialog id="menu" aria-labelledby="menu-title"><div class="menu-top"><span class="eyebrow">WELCOME TO THE NEON CIRCUIT</span><span class="edition">SINGLE PLAYER / 1.0</span></div><div class="menu-headline"><h2 id="menu-title">Two minds.<br><em>One moment.</em></h2><p>Choose your fighter. Find your rival’s rhythm.<br>Then break it.</p></div><div class="eyebrow roster-label">01 / PICK YOUR FIGHTER</div><div class="roster-grid">${FIGHTER_IDS.map((id) => `<button class="fighter-card" data-fighter="${id}" style="--accent:${FIGHTERS[id].accent}" aria-pressed="${id === "vector"}">${portrait(id)}<div><small>${FIGHTERS[id].title}</small><strong>${FIGHTERS[id].name}</strong><p>${FIGHTERS[id].tagline}</p></div></button>`).join("")}</div><div id="fighter-detail"></div><div class="match-options"><label>02 / YOUR RIVAL<select id="opponent">${FIGHTER_IDS.map((id) => `<option value="${id}" ${id === "rook" ? "selected" : ""}>${FIGHTERS[id].name} · ${FIGHTERS[id].personality}</option>`).join("")}</select></label><label>03 / CPU READS<select id="difficulty"><option value="rookie">Rookie · forgiving reads</option><option value="standard" selected>Standard · adaptive</option><option value="expert">Expert · stronger reads</option></select></label></div><button id="start" class="primary">ENTER THE CIRCUIT <span>↗</span></button><div class="menu-bottom"><button id="menu-help" class="text-button">First time? Learn the reads →</button><span>NO TIMER. MAKE IT COUNT.</span></div></dialog>
<dialog id="result" aria-labelledby="result-title"><div id="result-kicker" class="eyebrow"></div><h2 id="result-title"></h2><p id="result-copy"></p><div id="result-stats" class="result-stats"></div><button id="rematch" class="primary">RUN IT BACK ↗</button><button id="result-roster" class="text-button">Change fighters →</button></dialog>
<dialog id="instructions" aria-labelledby="help-title"><div class="eyebrow">FIELD MANUAL / NEON CIRCUIT</div><h2 id="help-title">Make your <em>read.</em></h2><p>Your rival commits <b>before</b> you choose. Neither fighter sees the other’s current action. Both are revealed together.</p><div class="manual-grid"><section><h3>01 / Own the distance</h3><p><b>Q Advance</b> closes one band; <b>E Retreat</b> opens one. Both cost 8 stamina. Movement resolves before attacks: opposite steps cancel; matching steps shift two bands. Retreat is not a dodge. At a boundary, movement still costs stamina.</p><p>Moves show their reach. “Read required” means they miss at the current range, but an opponent’s approach may bring them in range.</p></section><section><h3>02 / Commit with intent</h3><p><b>1 Light</b> is fast. <b>2 Heavy</b> pressures guard. <b>3 Block</b> spends stamina only when hit. <b>4 Dodge</b> evades strikes. <b>5 Grab</b> catches guard and dodge at Close. <b>6 Recover</b> restores stamina but takes 40% extra damage.</p><p>Faster in-range attacks interrupt slower ones. Equal speeds trade. No stamina refunds for misses or interruptions. An exhausted guard takes full damage.</p></section><section><h3>03 / Know your signature</h3><p><b>7 Special:</b> Vector’s Flash step closes one band, then strikes. Rook’s Fault line pushes away on an unguarded hit. Nyx’s Prism lance hits Mid/Far. Each costs stamina and has two full turns of cooldown—even on a miss.</p><p>Consecutive dodges cost 25, then 35, then 45. Any other action resets that streak. Fighters have different health, stamina and move stats.</p></section><section><h3>04 / Break the habit</h3><p>The CPU reads your last five moves and public resources. Difficulty changes how strongly it reads habits, never its damage or access to your choice.</p><p>One round. Zero health loses; double knockouts draw. No timer, automatic regeneration or save data. <b>R</b> rematches; <b>H / Esc</b> closes help. Sound starts off; motion can be reduced in the header.</p></section></div><button id="close-help" class="primary">LET’S FIGHT ↗</button></dialog>`;
const el = (id: string) => document.getElementById(id)!;
const menu = document.querySelector<HTMLDialogElement>("#menu")!;
const help = document.querySelector<HTMLDialogElement>("#instructions")!;
const resultDialog = document.querySelector<HTMLDialogElement>("#result")!;
const buttons = [
  ...document.querySelectorAll<HTMLButtonElement>("[data-action]"),
];
const sound = new CombatAudio();
let selected: FighterId = "vector",
  opponent: FighterId = "rook",
  difficulty: Difficulty = "standard";
let state = newMatch(selected, opponent, difficulty),
  cpuAction: Action = chooseCpu(state),
  locked = true;
let generation = 0,
  timers: number[] = [],
  damageDealt = 0,
  damageTaken = 0;
let reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "arena",
  width: 1100,
  height: 360,
  backgroundColor: "#171331",
  scene: Arena,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  render: { antialias: true },
  audio: { noAudio: true },
});
game.registry.set("match", state);
game.registry.set("reducedMotion", reducedMotion);
function selectFighter(id: FighterId) {
  selected = id;
  document
    .querySelectorAll<HTMLButtonElement>("[data-fighter]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.fighter === id)),
    );
  const f = FIGHTERS[id],
    special = getMove("special", id);
  el("fighter-detail").innerHTML =
    `<p>${f.bio}</p><div><span><b>${f.maxHealth}</b> HEALTH</span><span><b>${f.maxStamina}</b> STAMINA</span><span><b>${special.name}</b> SIGNATURE</span></div>`;
}
function update() {
  [state.player, state.cpu].forEach((f, i) => {
    const def = FIGHTERS[f.id];
    el(`hp${i}`).innerHTML = `${f.health}<small> / ${def.maxHealth}</small>`;
    el(`sp${i}`).textContent = `${f.stamina} / ${def.maxStamina}`;
    el(`health${i}`).style.width = `${(f.health / def.maxHealth) * 100}%`;
    el(`stamina${i}`).style.width = `${(f.stamina / def.maxStamina) * 100}%`;
    el(`signature-${i}`).textContent =
      `${getMove("special", f.id).name} / ${f.specialCooldown ? `READY IN ${f.specialCooldown}T` : "READY"}`;
    el(`health${i}`).style.background = def.accent;
    el(`fighter-${i}`).textContent = def.name;
    el(`role-${i}`).textContent = i
      ? `CPU / ${def.personality.toUpperCase()} / ${state.difficulty.toUpperCase()}`
      : `YOU / ${def.title}`;
  });
  el("turn").textContent =
    `EXCHANGE ${String(state.turn - (state.outcome ? 1 : 0)).padStart(2, "0")}`;
  el("distance").innerHTML = DISTANCES.map(
    (d) =>
      `<span class="${state.distance === d ? "active" : ""}">${d.toUpperCase()}</span>`,
  ).join("<i>—</i>");
  el("range-hint").textContent =
    state.distance === "close"
      ? "GRABS IN REACH"
      : state.distance === "far"
        ? "LONG-RANGE READS"
        : "WATCH THE APPROACH";
  buttons.forEach((button) => {
    const a = button.dataset.action as Action,
      move = getMove(a, state.player.id),
      reason = unavailableReason(a, state.player);
    button.disabled = locked || !!reason;
    button.title = reason ?? move.description;
    if (a === "advance" || a === "retreat") return;
    el(`name-${a}`).textContent = move.name;
    el(`cost-${a}`).textContent =
      a === "recover"
        ? `+${move.recovery} ST`
        : a === "block"
          ? "ON HIT"
          : `−${cost(a, state.player)} ST`;
    el(`stats-${a}`).textContent = move.damage
      ? `${move.damage} DMG · ${move.speed} SPEED`
      : a === "block"
        ? "GUARD / LOSES TO GRAB"
        : a === "dodge"
          ? "EVADE / LOSES TO GRAB"
          : "RECOVERY / VULNERABLE";
    el(`desc-${a}`).textContent = move.description;
    const inRange =
      move.range.includes(shiftDistance(state.distance, move.movement ?? 0)) ||
      !move.range.length;
    el(`reach-${a}`).textContent =
      reason ??
      (move.range.length
        ? `${move.range.join(" / ").toUpperCase()}${!inRange ? " · READ REQUIRED" : ""}`
        : "ALL RANGES");
    el(`reach-${a}`).classList.toggle("out-of-range", !inRange && !reason);
  });
  el("history").textContent =
    `LAST FIVE / ${state.player.history.map((a) => getMove(a, state.player.id).name).join(" · ") || "YOUR STORY STARTS HERE"}`;
}
function cancelPending() {
  generation++;
  timers.forEach(clearTimeout);
  timers = [];
}
function reset() {
  cancelPending();
  state = newMatch(selected, opponent, difficulty);
  cpuAction = chooseCpu(state);
  locked = false;
  damageDealt = 0;
  damageTaken = 0;
  game.registry.set("match", state);
  game.events.emit("reset-arena");
  [menu, help, resultDialog].forEach((d) => {
    if (d.open) d.close();
  });
  el("portrait-0").innerHTML = portrait(state.player.id);
  el("portrait-1").innerHTML = portrait(state.cpu.id);
  el("reveal").textContent = "";
  el("phase").textContent = "Choose your next read";
  el("cpu-status").textContent = "● RIVAL LOCKED IN";
  el("log").innerHTML = "<p>The city is watching. Make your opening read.</p>";
  el("log-tag").textContent = "WAITING FOR THE FIRST SPARK";
  el("read").textContent =
    `${FIGHTERS[opponent].name} ${opponent === "rook" ? "wants to get close. Deny the grab or meet it with speed." : opponent === "nyx" ? "owns the outside. Close the gap before the beam arrives." : "closes distance fast. Anticipate the rush."}`;
  buttons.forEach((b) => b.classList.remove("selected"));
  update();
  sound.play("select");
}
function showRoster() {
  cancelPending();
  locked = true;
  el("reveal").textContent = "";
  if (resultDialog.open) resultDialog.close();
  if (help.open) help.close();
  if (!menu.open) menu.showModal();
  update();
}
function delay(callback: () => void, ms: number) {
  const token = generation;
  timers.push(
    window.setTimeout(() => {
      if (token === generation) callback();
    }, ms),
  );
}
function commit(action: Action) {
  if (
    locked ||
    menu.open ||
    help.open ||
    resultDialog.open ||
    !canUse(action, state.player)
  )
    return;
  locked = true;
  update();
  sound.play("select");
  buttons.find((b) => b.dataset.action === action)?.classList.add("selected");
  const ownMove = getMove(action, state.player.id),
    enemyMove = getMove(cpuAction, state.cpu.id),
    result = resolveTurn(state, action, cpuAction);
  el("phase").textContent = "Committed. Trust the read.";
  el("cpu-status").textContent = "REVEALING BOTH CHOICES";
  el("reveal").innerHTML =
    `<small>YOU LOCKED IN</small><strong>${ownMove.name}</strong>`;
  delay(() => {
    sound.play("reveal");
    el("reveal").innerHTML =
      `<strong>${ownMove.name}</strong><small>VS</small><strong class="rival-move">${enemyMove.name}</strong>`;
  }, 400);
  delay(() => {
    state = result.state;
    game.registry.set("match", state);
    game.events.emit("resolve", result);
    update();
    damageDealt += result.damage[1];
    damageTaken += result.damage[0];
    sound.play(result.damage.some(Boolean) ? "hit" : "guard");
    const entry = document.createElement("div");
    entry.className = "log-entry";
    const title = document.createElement("b");
    title.textContent = `${String(state.turn - 1).padStart(2, "0")} / ${ownMove.name} × ${enemyMove.name}`;
    entry.append(title);
    result.messages.forEach((message) => {
      const p = document.createElement("p");
      p.textContent = message;
      entry.append(p);
    });
    const p = document.createElement("p");
    p.className = "stamina-summary";
    p.textContent = `STAMINA  YOU ${result.staminaDelta[0] >= 0 ? "+" : ""}${result.staminaDelta[0]} / ${FIGHTERS[state.cpu.id].name.toUpperCase()} ${result.staminaDelta[1] >= 0 ? "+" : ""}${result.staminaDelta[1]}`;
    entry.append(p);
    el("log").prepend(entry);
    el("log").scrollTop = 0;
    while (el("log").children.length > 6) el("log").lastElementChild?.remove();
    el("log-tag").textContent = `EXCHANGE ${state.turn - 1}`;
  }, 850);
  delay(() => {
    buttons.forEach((b) => b.classList.remove("selected"));
    el("reveal").textContent = "";
    if (state.outcome) {
      el("phase").textContent = "Round complete";
      el("cpu-status").textContent = "THE READ IS SETTLED";
      el("result-kicker").textContent =
        state.outcome.toUpperCase() + " / NEON CIRCUIT";
      el("result-title").textContent =
        state.outcome === "victory"
          ? "You broke the pattern."
          : state.outcome === "defeat"
            ? "A read worth learning."
            : "Same frame. Same fate.";
      el("result-copy").textContent =
        state.outcome === "victory"
          ? `${FIGHTERS[state.player.id].name} takes the rooftop. Ready for another rival?`
          : state.outcome === "defeat"
            ? `${FIGHTERS[state.cpu.id].name} had the last word. Change your rhythm and run it back.`
            : "A double knockout. Nobody saw that coming.";
      el("result-stats").innerHTML =
        `<span><b>${state.turn - 1}</b>EXCHANGES</span><span><b>${damageDealt}</b>DAMAGE DEALT</span><span><b>${damageTaken}</b>DAMAGE TAKEN</span>`;
      if (help.open) help.close();
      resultDialog.showModal();
      sound.play(state.outcome === "victory" ? "win" : "lose");
    } else {
      cpuAction = chooseCpu(state);
      locked = false;
      el("phase").textContent = "Choose your next read";
      el("cpu-status").textContent = "● RIVAL LOCKED IN";
      el("read").textContent =
        state.player.stamina < 20
          ? "Running on fumes. Recover creates an opening—distance can buy breathing room."
          : state.player.history.length > 1 &&
              state.player.history.slice(-2).every((a) => a === action)
            ? "Same move, twice. Are you building a pattern—or setting a trap?"
            : state.distance === "far"
              ? "Space is a resource. Recover, approach, or threaten a long-range signature."
              : "Predict the next range, not just the next move. A retreat can make a grab whiff.";
    }
    update();
  }, 2050);
}
function openHelp() {
  if (!help.open) help.showModal();
}
buttons.forEach((b) =>
  b.addEventListener("click", () => commit(b.dataset.action as Action)),
);
document.querySelectorAll<HTMLButtonElement>("[data-fighter]").forEach((b) =>
  b.addEventListener("click", () => {
    selectFighter(b.dataset.fighter as FighterId);
    sound.play("select");
  }),
);
el("opponent").addEventListener("change", (e) => {
  opponent = (e.target as HTMLSelectElement).value as FighterId;
});
el("difficulty").addEventListener("change", (e) => {
  difficulty = (e.target as HTMLSelectElement).value as Difficulty;
});
["start", "restart", "rematch"].forEach((id) =>
  el(id).addEventListener("click", reset),
);
["roster", "result-roster"].forEach((id) =>
  el(id).addEventListener("click", showRoster),
);
document.querySelector(".brand")!.addEventListener("click", (e) => {
  e.preventDefault();
  showRoster();
});
["help", "menu-help"].forEach((id) =>
  el(id).addEventListener("click", openHelp),
);
el("close-help").addEventListener("click", () => help.close());
[menu, resultDialog].forEach((d) =>
  d.addEventListener("cancel", (e) => e.preventDefault()),
);
el("sound").addEventListener("click", async () => {
  await sound.setEnabled(!sound.enabled);
  el("sound").textContent = `SOUND ${sound.enabled ? "ON" : "OFF"}`;
  el("sound").setAttribute("aria-pressed", String(sound.enabled));
});
function updateMotion() {
  document.body.classList.toggle("reduced-motion", reducedMotion);
  game.registry.set("reducedMotion", reducedMotion);
  game.events.emit("motion-change", reducedMotion);
  el("motion").setAttribute("aria-pressed", String(reducedMotion));
  el("motion").textContent = reducedMotion ? "MOTION REDUCED" : "REDUCE MOTION";
}
el("motion").addEventListener("click", () => {
  reducedMotion = !reducedMotion;
  updateMotion();
});
window.addEventListener("keydown", (e) => {
  if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  const target = e.target as HTMLElement;
  if (["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)) return;
  if (e.key.toLowerCase() === "h") {
    e.preventDefault();
    help.open ? help.close() : openHelp();
  } else if (e.key.toLowerCase() === "r" && !help.open && !menu.open) reset();
  else {
    const action = ACTIONS.find(
      (a) => KEYS[a].toLowerCase() === e.key.toLowerCase(),
    );
    if (action) {
      e.preventDefault();
      commit(action);
    }
  }
});
selectFighter(selected);
update();
updateMotion();
menu.showModal();
