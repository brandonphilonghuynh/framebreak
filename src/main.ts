import Phaser from "phaser";
import { Arena } from "./scenes/Arena";
import {
  ARENAS,
  ARENA_IDS,
  BOSSES,
  BOSS_IDS,
  FIGHTERS,
  FIGHTER_IDS,
  PRICES,
  isBoss,
  type FighterId,
  type BossId,
  type ArenaId,
  type Difficulty,
} from "./game/data";
import {
  SIGNATURES,
  WEAPONS,
  GADGET_NAMES,
  type GadgetId,
} from "./game/equipment";
import {
  newProfile,
  parseProfile,
  purchase,
  SAVE_KEY,
  levelOf,
  rankOf,
  xpProgress,
  bossAvailable,
  rankedOpponent,
  rankedReward,
  settleMatch,
  type Profile,
  type Reward,
} from "./game/progression";
import type { Config, WorldState, GameEvent } from "./game/simulation";
import { PlayerControls } from "./game/input";
import { PHYSIQUES, SPECIALS, ULTIMATES, ROLES, physique } from "./game/roster";
import { LORE } from "./game/lore";
import { fighterStats, profileSections } from "./ui/fighter-profile";
import { COMBAT } from "./game/tuning";
import { CombatAudio } from "./game/audio";
import { portrait } from "./ui/portraits";
import "./style.css";
import "./solstice.css";

const $ = (id: string) => document.getElementById(id)!;
const money = (n: number) => Math.floor(n).toLocaleString("en-US");
const safe = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const sun =
  '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 1 24 13 37 9 29 20 39 28 25 27 20 39 15 27 1 28 11 20 3 9 16 13Z" fill="currentColor"/><circle cx="20" cy="20" r="7" fill="#133e3a"/></svg>';
let profile = newProfile(),
  saveWarning = "",
  saveBlocked = false;
try {
  const raw = localStorage.getItem(SAVE_KEY);
  if (raw) profile = parseProfile(raw);
} catch {
  saveWarning =
    "Your saved profile could not be loaded. It has been preserved. Import a valid backup to resume saving.";
  saveBlocked = true;
}
let selected: FighterId = "vector",
  view = "play",
  active = false,
  paused = false,
  loading = true,
  shake = 0.65,
  reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
let current: Config = {
  player: "vector",
  cpu: "rook",
  arena: "skyline",
  difficulty: "standard",
  mode: "duel",
  hazards: false,
  equipment: true,
  countdown: true,
};
let setupPlayer: FighterId = selected;
let lastWorld: WorldState | null = null,
  lastReward: Reward | null = null,
  helpResume = false,
  announcementTimer = 0;
const controls = new PlayerControls(),
  audio = new CombatAudio();

$("app").innerHTML = `
<div id="hub" class="hub">
 <header class="hub-header"><a class="brand" href="#" aria-label="FRAMEBREAK home">${sun}<span><b class="brand-word">FrameBreak</b><small>THE SOLSTICE CIRCUIT</small></span></a><div class="pilot-bar"><div id="pilot-face"></div><div><b id="pilot-name">Pilot</b><small id="pilot-level"></small><div class="xp-track"><i id="pilot-xp"></i></div></div><span class="balance"><i>✦</i><b id="balance"></b><small>LUMENS</small></span></div></header>
 <div class="hub-layout"><nav class="side-nav" aria-label="Main navigation">${[
   ["play", "◈", "Play"],
   ["fighters", "♜", "Fighters"],
   ["bosses", "✧", "Boss contracts"],
   ["profile", "◎", "Profile"],
   ["guide", "☷", "Field manual"],
   ["settings", "⚙", "Settings"],
 ]
   .map(
     ([id, icon, name]) =>
       `<button data-view="${id}" ${id === "play" ? 'aria-current="page"' : ""}><span>${icon}</span>${name}<i>›</i></button>`,
   )
   .join(
     "",
   )}<div class="nav-foot"><span class="online-dot"></span> CPU CIRCUIT<small>Your world. Your progress.</small></div></nav>
 <main id="hub-content"></main></div>
 <footer class="hub-footer"><span>${sun} POWERED BY THE SUN. DRIVEN BY YOU.</span><span id="save-status">LOCAL PROFILE · AUTO-SAVED</span><b>SOLSTICE / 5.0</b></footer>
</div>
<div id="match" class="match-shell" hidden>
 <header class="match-header"><button id="leave" class="ghost">← SOLSTICE HUB</button><span id="match-label"></span><div><button id="match-help" class="ghost">CONTROLS</button><button id="pause" class="ghost">PAUSE Ⅱ</button></div></header>
 <section class="game-frame" aria-label="Live fighting arena"><div id="arena"></div><div class="hud">${[0, 1].map((i) => `<div class="fighter-hud ${i ? "enemy" : ""}"><div id="portrait-${i}" class="hud-portrait"></div><div class="hud-data"><div class="fighter-name"><span><small>${i ? "CPU RIVAL" : "PILOT ONE"}</small><b id="name-${i}"></b></span><strong id="damage-${i}">0<small>%</small></strong></div><span id="stocks-${i}"></span><div class="shield-track" title="Shield energy"><i id="shield-${i}"></i></div><div class="meter-track"><i id="meter-${i}"></i></div><span class="meter-label" id="meter-label-${i}"></span><span class="weapon-label" id="weapon-${i}"></span><span class="ability-label" id="ability-${i}"></span><span class="mobility-label" id="mobility-${i}"></span></div></div>`).join("")}<div class="timer"><b id="clock">3:00</b><small id="round-label"></small></div></div><div id="announcement" class="announcement" role="status"></div><div id="boss-phase" class="boss-phase" hidden></div><div class="arena-bottom"><span id="hazard-status"></span><span id="drop-status"></span></div><div id="combo-toast" class="combo-toast"></div></section>
 <div class="control-deck"><div><button data-key="KeyA" aria-label="Move left"><kbd>A</kbd> ←</button><button data-key="KeyD" aria-label="Move right"><kbd>D</kbd> →</button><button data-key="Space" aria-label="Jump"><kbd>SPACE</kbd> JUMP</button></div><div>${[
   ["KeyJ", "J", "STRIKE"],
   ["KeyK", "K", "SPECIAL"],
   ["KeyL", "L", "PARRY"],
   ["ShiftLeft", "SHIFT", "DODGE"],
   ["KeyI", "I", "ULTIMATE"],
   ["KeyE", "E", "PICK UP"],
 ]
   .map(
     ([key, label, name]) =>
       `<button data-key="${key}"><kbd>${label}</kbd>${name}</button>`,
   )
   .join(
     "",
   )}</div></div><div class="match-hints"><span>DOWN + J · STUN AERIAL</span><span>W + K · RECOVERY</span><span>A/D + W/S + J · AIM</span><button id="reset" class="text-button">RESTART ↻</button></div><div id="coach" class="practice-coach" hidden></div>
</div>
<dialog id="setup" class="panel-dialog" aria-labelledby="setup-title"><button class="close" data-close="setup" aria-label="Close setup">×</button><span class="eyebrow">YOUR ARENA. YOUR RULES.</span><h2 id="setup-title">Flight check.</h2><div class="setup-grid"><label>MODE<select id="mode"><option value="duel">Quick play · CPU duel</option><option value="training">Practice lab · free trials</option></select></label><label>RIVAL<select id="opponent">${FIGHTER_IDS.map((id) => `<option value="${id}" ${id === "rook" ? "selected" : ""}>${FIGHTERS[id].name}</option>`).join("")}</select></label><label>CPU LEVEL<select id="difficulty"><option value="rookie">Rookie</option><option value="standard" selected>Standard</option><option value="expert">Expert</option></select></label><label>PRACTICE<select id="practice"><option value="dummy">Idle dummy</option><option value="parry">Ultimate parry drill</option></select></label></div><div class="arena-options">${ARENA_IDS.map((id) => `<label><input type="radio" name="stage" value="${id}" ${id === "skyline" ? "checked" : ""}><span><b>${ARENAS[id].name}</b><small>${ARENAS[id].description}</small></span></label>`).join("")}</div><label class="check"><input type="checkbox" id="hazards" checked> Falling solar spears · red warning before impact</label><label class="check" id="practice-meter-option" hidden><input type="checkbox" id="practice-infinite-meter"> Unlimited ultimate meter · practice only</label><button id="start-custom" class="gold-button">DEPLOY ${sun}</button><p class="fine">Quick play and practice award no Lumens. Your equipment arrives at 5 seconds, then every 10 seconds.</p></dialog>
<dialog id="pause-menu" class="panel-dialog compact" aria-labelledby="pause-title"><span class="eyebrow">TAKE A BREATH</span><h2 id="pause-title">Hold the light.</h2><p>The arena is paused. Your fight will wait.</p><button id="resume" class="gold-button">BACK TO THE FIGHT ↗</button><button id="pause-restart" class="soft-button">Restart this fight</button><button id="pause-leave" class="text-button">Return to hub</button></dialog>
<dialog id="result" class="panel-dialog result-dialog" aria-labelledby="result-title"><span id="result-kicker" class="eyebrow"></span><h2 id="result-title"></h2><p id="result-copy"></p><div id="result-fighters" class="result-fighters"></div><div id="reward" class="reward-bar"></div><button id="next" class="gold-button">NEXT FIGHT ↗</button><button id="result-home" class="text-button">Return to Solstice</button></dialog>
<dialog id="instructions" class="panel-dialog manual-dialog" aria-labelledby="help-title"><button class="close" data-close="instructions" aria-label="Close field manual">×</button><span class="eyebrow">FLIGHT SCHOOL / FIELD MANUAL</span><h2 id="help-title">Own the air.</h2><div id="manual-content"></div></dialog>
<dialog id="fighter-profile" class="panel-dialog fighter-profile-dialog" aria-labelledby="fighter-profile-name"></dialog>
<div id="toast" class="toast" role="status" hidden></div>`;

const dialog = (id: string) => $(id) as HTMLDialogElement;
const manual = `<div class="manual-grid"><section><h3>01 / Movement</h3><p><b>A/D or arrows</b> run and steer. <b>Space, W or Up</b> jumps twice (three times for Ember). Release the first jump early for a short hop; the air jump always keeps its full lift. <b>S/Down</b> fast-falls or drops through thin platforms. Moving platforms carry you.</p><p><b>W + K, release K</b> rises back toward the stage once per airtime. Landing restores jumps and recovery.</p></section><section><h3>02 / Attacks</h3><p><b>J</b> chains three strikes. Press the next strike slightly early to buffer it; the first two hits hold your rival close and the third launches. Normal stun lasts 0.5 seconds, cannot be refreshed, and ends with a brief escape window. <b>Down + J in the air</b> uses your character’s stun spike. Combine A/D with W/S to aim attacks diagonally. Bows and discs fire in the aimed direction.</p><p><b>K</b> activates your unique special; each has its own cooldown. Astra can hold K to position her water sphere, then release it with S to aim downward. W + K recovery has a separate airtime limit. <b>Hold I / release</b> spends full meter on an ultimate. Full charge takes ${COMBAT.ultimateCharge} seconds; even a tap commits to a ${COMBAT.ultimateWindup}-second windup that can be interrupted. Rook’s Cataclysm needs 0.65 seconds and solid footing. An ultimate can hit twice, 160 ms apart, if you remain in its hitbox.</p></section><section><h3>03 / Defense & gear</h3><p><b>Tap L at impact</b>: the first 155 ms parries frontal attacks, including every ultimate. Projectiles reflect. Hold L to shield regular hits; ultimates bypass a held shield. <b>Shift</b> dodges at a shield cost. Ember stores two dodges; others store one. Charges regenerate over time.</p><p><b>E</b> picks up the nearest eligible weapon or gadget. Your two weapons arrive at 5, 15, 25… seconds. Shared weapons and gadgets arrive at 10, 20, 30… seconds. Bosses enter armed.</p></section><section><h3>04 / The circuit</h3><p>Damage % increases knockback. Launch opponents out to take stocks. Duels last 3 minutes; stocks then lower damage decide a timeout. Bosses have two reinforced stocks; you have three.</p><p>Ranked CPU wins earn Lumens and XP. Boss contracts unlock with level, pay once and allow retries after losses. Red markers warn of falling solar spears. <b>Esc/P</b> pauses. Progress saves on this browser; export a backup in Profile.</p></section></div>`;
$("manual-content").innerHTML = manual;

function toast(message: string) {
  $("toast").textContent = message;
  $("toast").hidden = false;
  window.setTimeout(() => ($("toast").hidden = true), 4000);
}
function save(next: Profile) {
  profile = next;
  try {
    if (saveBlocked) throw new Error();
    localStorage.setItem(SAVE_KEY, JSON.stringify(profile));
    saveWarning = "";
  } catch {
    saveWarning =
      "Progress is in memory only. Export a backup from Profile before closing.";
  }
  updateProfileBar();
}
function updateProfileBar() {
  $("pilot-name").textContent = profile.name;
  $("pilot-level").textContent =
    `LEVEL ${levelOf(profile)} · ${rankOf(profile.rating).toUpperCase()}`;
  $("pilot-xp").style.width = `${xpProgress(profile) / 2.5}%`;
  $("balance").textContent = money(profile.currency);
  $("pilot-face").innerHTML = portrait(selected);
  $("save-status").textContent = saveWarning
    ? "SAVE NEEDS ATTENTION · PROFILE"
    : "LOCAL PROFILE · AUTO-SAVED";
}
function heading(kicker: string, title: string, copy: string) {
  return `<div class="page-heading"><span class="eyebrow">${kicker}</span><h1>${title}</h1><p>${copy}</p></div>`;
}
function fighterVisual(id: FighterId, className = "") {
  return `<div class="crew-art ${className}">${portrait(id)}</div>`;
}
function renderHub() {
  updateProfileBar();
  document.querySelectorAll<HTMLButtonElement>("[data-view]").forEach((b) => {
    if (b.dataset.view === view) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  const p = profile,
    ranked = rankedOpponent(p, selected);
  let html = "";
  if (view === "play")
    html = `${heading("SEASON 01 / ROOTS & HORIZONS", "A brighter kind<br>of battle.", "Find your rhythm. Rise through the circuit. Make the sky yours.")}
   <div class="mode-grid"><button id="quick-play" class="mode-card quick-card"><div class="card-art">${fighterVisual(selected, "hero-portrait")}</div><span class="card-label"><small>YOUR NEXT ADVENTURE</small><strong>Quick play</strong><span>Take to the gardens. Find your flow.</span></span><i>↗</i></button>
   <button id="ranked-play" class="mode-card ranked-card"><span class="rank-emblem">${sun}</span><span class="card-label"><small>${rankOf(p.rating).toUpperCase()} · ${p.rating} RP</small><strong>Ranked circuit</strong><span>${FIGHTERS[ranked.cpu].name} · Level ${ranked.level}<br>Win ✦ ${money(rankedReward(ranked.level, p.rating))}+ Lumens</span></span><i>↗</i></button>
   <div class="mode-stack"><button id="boss-nav" class="mode-card boss-card"><span class="card-label"><small>BIG RIVALS. BIGGER REWARDS.</small><strong>Boss contracts</strong><span>${p.defeated.length} / 4 claimed · up to ✦ 120,000</span></span><i>↗</i></button><button id="practice-nav" class="mode-card practice-card"><span class="card-label"><small>FLIGHT SCHOOL</small><strong>Practice lab</strong><span>Try every fighter. Learn every parry.</span></span><i>↗</i></button></div></div>
   <div class="home-bottom"><div class="dispatch"><span class="eyebrow">WELCOME TO SOLSTICE GARDENS</span><strong>Built for a higher tomorrow.</strong><p>Living cities. Moving skybridges. Solar-powered rivals.</p></div><button id="loadout-nav" class="loadout-card">${portrait(selected)}<span><small>YOUR PILOT</small><b>${FIGHTERS[selected].name}</b><small>${SIGNATURES[selected].map((w) => w.name).join(" / ")}</small></span><i>›</i></button></div>`;
  if (view === "fighters")
    html = `${heading("THE SOLSTICE CREW / 6 PILOTS", "Find your spark.", "Earn Lumens in ranked matches and boss contracts. Every fighter can be tried in Practice.")}
   <div class="fighter-grid">${FIGHTER_IDS.map((id) => {
     const f = FIGHTERS[id],
       owned = p.unlocked.includes(id);
     const role = ROLES[id];
     return `<article class="crew-card ${selected === id ? "selected" : ""}"><button class="fighter-profile-open" data-profile="${id}" aria-label="Open ${f.name} profile">${fighterVisual(id)}<span class="portrait-caption">PILOT DOSSIER <i>↗</i></span></button><div class="crew-info"><span class="eyebrow">${f.title}</span><h2><button class="fighter-name-button" data-profile="${id}">${f.name}</button><span class="difficulty" title="Control complexity, not power">${role.difficulty}</span></h2><small class="fighter-role">${role.role}</small><p>${f.bio}</p>${fighterStats(id)}<div class="special-summary"><b>K / ${f.special}</b><span>${SPECIALS[id].cooldown}s cooldown</span></div><small class="move-info">${PHYSIQUES[id].jumps} JUMPS · ${PHYSIQUES[id].dodges} DODGE${PHYSIQUES[id].dodges > 1 ? "S" : ""} · DOWN-AIR ${f.downAirStun}s</small><div class="crew-actions">${owned ? `<button data-select="${id}" class="${selected === id ? "soft-button" : "gold-button"}">${selected === id ? "SELECTED ✓" : "SELECT PILOT"}</button>` : `<button data-buy="${id}" class="gold-button" ${p.currency < PRICES[id] ? "disabled" : ""}>UNLOCK ✦ ${money(PRICES[id])}</button>`}<button data-trial="${id}" class="text-button">Try ↗</button></div><button data-profile="${id}" class="text-button profile-link">BIOGRAPHY · COMBAT · LORE ↗</button></div></article>`;
   }).join("")}</div>`;
  if (view === "bosses")
    html = `${heading("ONE VICTORY. A LASTING LEGACY.", "Answer the sun.", "Bosses arrive armed, have two reinforced stocks and awaken a second phase. Retry losses; each bounty pays once.")}
   <div class="boss-grid">${BOSS_IDS.map((id, i) => {
     const b = BOSSES[id],
       done = p.defeated.includes(id),
       open = bossAvailable(p, id);
     return `<article class="contract ${done ? "claimed" : ""}"><div class="boss-art" style="--boss:${i};--boss-color:${FIGHTERS[id].accent}">${portrait(id)}<span class="contract-no">0${i + 1}</span></div><div class="contract-body"><span class="eyebrow">${done ? "CONTRACT COMPLETE" : `LEVEL ${b.level}+ · ${ARENAS[b.arena].name.toUpperCase()}`}</span><h2>${FIGHTERS[id].name}</h2><p>${FIGHTERS[id].bio}</p><small>${b.phase}</small><div class="bounty">✦ ${money(b.reward)}<span>ONE-TIME BOUNTY · +${b.xp} XP</span></div><button data-boss="${id}" class="${open ? "gold-button" : "soft-button"}" ${!open ? "disabled" : ""}>${done ? "CLAIMED ✓" : open ? "ACCEPT CONTRACT ↗" : `UNLOCKS AT LEVEL ${b.level}`}</button></div></article>`;
   }).join("")}</div>`;
  if (view === "profile")
    html = `${heading("YOUR JOURNEY / SAVED ON THIS BROWSER", "A little more radiant.", "Ranked wins grow your level, currency and crew. Export a save to take your progress with you.")}
   <section class="profile-panel"><div class="profile-identity">${fighterVisual(selected)}<div><span class="eyebrow">LEVEL ${levelOf(p)}</span><h2>${safe(p.name)}</h2><p>${rankOf(p.rating)} · ${p.rating} RP</p><label>PILOT NAME<input id="profile-name" maxlength="24" value="${safe(p.name)}"></label><button id="save-name" class="soft-button">Save name</button></div></div><div class="profile-stats">${[
     [money(p.currency), "LUMENS"],
     [`${xpProgress(p)} / 250`, "XP TO NEXT LEVEL"],
     [p.wins, "WINS"],
     [p.losses, "LOSSES"],
     [p.bestStreak, "BEST WIN STREAK"],
     [money(p.damage), "TOTAL DAMAGE DEALT"],
     [p.parries, "PERFECT PARRIES"],
     [`${p.defeated.length} / 4`, "BOSS CONTRACTS"],
   ]
     .map(([n, label]) => `<div><b>${n}</b><span>${label}</span></div>`)
     .join(
       "",
     )}</div><p class="save-note">${safe(saveWarning || "Auto-save is active. Saves belong to this browser and address; export before clearing browser data or moving to another device.")}</p><div class="backup-actions"><button id="export-save" class="gold-button">EXPORT SAVE ↓</button><label class="soft-button file-label">IMPORT SAVE ↑<input id="import-save" type="file" accept="application/json,.json"></label></div><p class="fine">Import replaces this local profile after confirmation. This offline ladder has no shared leaderboard or server verification.</p></section>`;
  if (view === "guide")
    html = `${heading("FIELD MANUAL / A LITTLE FLIGHT SCHOOL", "Own the air.", "Movement, timing and a well-placed parry make all the difference.")}<section class="glass-panel">${manual}</section>`;
  if (view === "settings")
    html = `${heading("MAKE YOURSELF AT HOME", "Your atmosphere.", "Audio begins off. Settings apply for this session.")}<section class="settings-panel"><div><span><b>Sound effects</b><small>Strikes, parries, gear and ring-outs.</small></span><button id="sound" class="soft-button" aria-pressed="${audio.enabled}">${audio.enabled ? "ON" : "OFF"}</button></div><div><span><b>Solar soundtrack</b><small>An original, softly synthesized loop.</small></span><button id="music" class="soft-button" aria-pressed="${audio.musicEnabled}">${audio.musicEnabled ? "ON" : "OFF"}</button></div><div><span><b>Reduce motion</b><small>Suppress cosmetic shake and particles; moving platforms remain visible.</small></span><button id="motion" class="soft-button" aria-pressed="${reduced}">${reduced ? "ON" : "OFF"}</button></div><div><span><b>Screen shake</b><small>Impact intensity; reduced motion overrides this setting.</small></span><label class="shake-control"><input id="shake" type="range" min="0" max="100" value="${Math.round(shake * 100)}" aria-label="Screen shake intensity"><output id="shake-value">${Math.round(shake * 100)}%</output></label></div><p class="fine">Keyboard + mouse · local single player · no account required.</p></section>`;
  $("hub-content").innerHTML = html;
  bindHub();
}
function openFighterProfile(id: FighterId) {
  const f = FIGHTERS[id],
    lore = LORE[id],
    role = ROLES[id];
  const modal = dialog("fighter-profile");
  modal.innerHTML = `<button class="close" aria-label="Close fighter profile">×</button><div class="dossier-hero">${fighterVisual(id)}<div><span class="eyebrow">SOLSTICE ARCHIVE / ${f.title}</span><h2 id="fighter-profile-name">${f.name}</h2><span class="difficulty">${role.difficulty}</span><p>${role.role}</p><blockquote>“${lore.quote}”</blockquote></div></div><nav class="profile-tabs" aria-label="Profile sections">${["Biography", "Combat", "Lore"].map((label, i) => `<button class="soft-button" data-section="${i}" aria-pressed="${i === 0}" aria-controls="dossier-section-${i}">${label}</button>`).join("")}</nav>${profileSections(id)}<button class="gold-button dossier-trial">TRY ${f.name.toUpperCase()} IN PRACTICE ↗</button>`;
  modal.querySelector<HTMLButtonElement>(".close")!.onclick = () =>
    modal.close();
  modal.querySelector<HTMLButtonElement>(".dossier-trial")!.onclick = () => {
    modal.close();
    openSetup(true, id);
  };
  modal.querySelectorAll<HTMLButtonElement>("[data-section]").forEach(
    (button) =>
      (button.onclick = () => {
        modal
          .querySelectorAll<HTMLButtonElement>("[data-section]")
          .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
        modal
          .querySelectorAll<HTMLElement>(".dossier-section")
          .forEach(
            (section, i) =>
              (section.hidden = i !== Number(button.dataset.section)),
          );
      }),
  );
  modal.showModal();
}
function on(id: string, fn: () => void) {
  document.getElementById(id)?.addEventListener("click", fn);
}
function changeView(next: string) {
  view = next;
  renderHub();
  $("hub-content").scrollTop = 0;
  window.scrollTo(0, 0);
}
function openSetup(training = false, fighter?: FighterId) {
  setupPlayer = fighter ?? selected;
  ($("mode") as HTMLSelectElement).value = training ? "training" : "duel";
  updateSetup();
  dialog("setup").showModal();
}
function updateSetup() {
  const practice = ($("mode") as HTMLSelectElement).value === "training";
  ($("difficulty") as HTMLSelectElement).disabled = practice;
  ($("practice") as HTMLSelectElement).disabled = !practice;
  $("practice-meter-option").hidden = !practice;
}
function bindHub() {
  document
    .querySelectorAll<HTMLButtonElement>("[data-profile]")
    .forEach(
      (b) =>
        (b.onclick = () => openFighterProfile(b.dataset.profile as FighterId)),
    );
  on("quick-play", () => openSetup());
  on("practice-nav", () => openSetup(true));
  on("boss-nav", () => changeView("bosses"));
  on("loadout-nav", () => changeView("fighters"));
  on("ranked-play", startRanked);
  document.querySelectorAll<HTMLButtonElement>("[data-select]").forEach(
    (b) =>
      (b.onclick = () => {
        selected = b.dataset.select as FighterId;
        renderHub();
      }),
  );
  document
    .querySelectorAll<HTMLButtonElement>("[data-trial]")
    .forEach(
      (b) => (b.onclick = () => openSetup(true, b.dataset.trial as FighterId)),
    );
  document.querySelectorAll<HTMLButtonElement>("[data-buy]").forEach(
    (b) =>
      (b.onclick = () => {
        try {
          const id = b.dataset.buy as FighterId;
          save(purchase(profile, id));
          selected = id;
          renderHub();
          toast(`${FIGHTERS[id].name} joined your crew.`);
        } catch (e) {
          toast((e as Error).message);
        }
      }),
  );
  document
    .querySelectorAll<HTMLButtonElement>("[data-boss]")
    .forEach((b) => (b.onclick = () => startBoss(b.dataset.boss as BossId)));
  on("save-name", () => {
    const name = ($("profile-name") as HTMLInputElement).value.trim();
    if (name) {
      save({ ...profile, name: name.slice(0, 24) });
      renderHub();
      toast("Pilot name saved.");
    }
  });
  on("export-save", () => {
    const blob = new Blob([JSON.stringify(profile, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "framebreak-solstice-save.json";
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  document
    .getElementById("import-save")
    ?.addEventListener("change", async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        if (file.size > 100000)
          throw new Error("That file is too large to be a save.");
        const next = parseProfile(await file.text());
        if (
          !confirm(
            `Replace this profile with ${next.name}, level ${levelOf(next)}?`,
          )
        )
          return;
        saveBlocked = false;
        save(next);
        selected = "vector";
        renderHub();
        toast("Save imported.");
      } catch (error) {
        toast((error as Error).message);
      }
    });
  document.getElementById("shake")?.addEventListener("input", (e) => {
    shake = Number((e.target as HTMLInputElement).value) / 100;
    $("shake-value").textContent = `${Math.round(shake * 100)}%`;
    game.registry.set("shake", shake);
  });
  on("sound", async () => {
    await audio.setEnabled(!audio.enabled);
    renderHub();
  });
  on("music", async () => {
    await audio.setMusic(!audio.musicEnabled);
    audio.pauseMusic(false);
    renderHub();
  });
  on("motion", () => {
    reduced = !reduced;
    setMotion();
    renderHub();
  });
}
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "arena",
  width: 1200,
  height: 680,
  backgroundColor: "#9bd5cf",
  scene: Arena,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  render: { antialias: true },
  audio: { noAudio: true },
  callbacks: {
    preBoot: (g) => {
      g.registry.set("controls", controls);
      g.registry.set("config", current);
      g.registry.set("reducedMotion", reduced);
      g.registry.set("shake", shake);
    },
  },
});
game.events.once("arena-ready", () => {
  loading = false;
});
function setMotion() {
  document.body.classList.toggle("reduced-motion", reduced);
  game.registry.set("reducedMotion", reduced);
  game.events.emit("motion-change", reduced);
}
function deploy(config: Config) {
  if (loading) {
    toast("Preparing the solar arena. Try again in a moment.");
    return;
  }
  if (config.mode !== "training" && !profile.unlocked.includes(config.player)) {
    toast("Unlock this fighter or try them in Practice.");
    return;
  }
  current = {
    ...config,
    countdown: true,
    equipment: true,
    matchId: crypto.randomUUID(),
    playerLevel: levelOf(profile),
  };
  ["setup", "pause-menu", "result", "instructions"].forEach((id) => {
    if (dialog(id).open) dialog(id).close();
  });
  active = true;
  paused = false;
  lastReward = null;
  lastWorld = null;
  $("hub").hidden = true;
  $("match").hidden = false;
  document.body.classList.add("in-match");
  window.scrollTo(0, 0);
  game.scale.refresh();
  game.events.emit("start-fight", current, true);
  audio.pauseMusic(false);
  $("match-label").textContent =
    `${ARENAS[current.arena].name.toUpperCase()} / ${current.mode === "ranked" ? "RANKED CPU" : current.mode === "boss" ? "BOSS CONTRACT" : current.mode === "training" ? "PRACTICE LAB" : "QUICK PLAY"}`;
  $("portrait-0").innerHTML = portrait(current.player);
  $("portrait-1").innerHTML = portrait(current.cpu);
  $("coach").hidden = current.mode !== "training";
  clearTimeout(announcementTimer);
  $("announcement").textContent = "";
}
function startRanked() {
  const rival = rankedOpponent(profile, selected);
  deploy({
    player: selected,
    cpu: rival.cpu,
    arena: rival.arena,
    mode: "ranked",
    difficulty: "expert",
    hazards: true,
    opponentLevel: rival.level,
  });
}
function startBoss(id: BossId) {
  if (!bossAvailable(profile, id)) {
    toast("This contract is locked or already claimed.");
    return;
  }
  const boss = BOSSES[id];
  deploy({
    player: selected,
    cpu: id,
    arena: boss.arena,
    mode: "boss",
    difficulty: "expert",
    hazards: true,
    opponentLevel: Math.max(levelOf(profile), boss.level),
  });
}
function restart() {
  if (
    current.mode === "boss" &&
    !bossAvailable(profile, current.cpu as BossId)
  ) {
    home();
    return;
  }
  deploy({ ...current });
}
function home() {
  active = false;
  paused = true;
  game.events.emit("pause-fight", true);
  ["pause-menu", "result", "instructions"].forEach((id) => {
    if (dialog(id).open) dialog(id).close();
  });
  $("match").hidden = true;
  $("hub").hidden = false;
  document.body.classList.remove("in-match");
  window.scrollTo(0, 0);
  if (!profile.unlocked.includes(selected)) selected = "vector";
  clearTimeout(announcementTimer);
  audio.pauseMusic(false);
  renderHub();
}
function pause(value = true) {
  if (!active) return;
  paused = value;
  game.events.emit("pause-fight", value);
  audio.pauseMusic(value);
  if (value && !dialog("pause-menu").open && !dialog("instructions").open)
    dialog("pause-menu").showModal();
  if (!value && dialog("pause-menu").open) dialog("pause-menu").close();
}
function announce(text: string, duration = 1100) {
  clearTimeout(announcementTimer);
  $("announcement").textContent = text;
  announcementTimer = window.setTimeout(
    () => ($("announcement").textContent = ""),
    duration,
  );
}
function hud(w: WorldState) {
  lastWorld = w;
  w.fighters.forEach((f, i) => {
    const def = FIGHTERS[f.id];
    $(`name-${i}`).textContent = def.name;
    $(`damage-${i}`).innerHTML = `${Math.round(f.damage)}<small>%</small>`;
    $(`damage-${i}`).style.color =
      f.damage > 110 ? "#ff857c" : f.damage > 60 ? "#ffd16e" : "#fff7e8";
    $(`stocks-${i}`).textContent =
      w.config.mode === "training"
        ? "∞ STOCKS"
        : `${"●".repeat(f.stocks)}${"○".repeat(Math.max(0, (isBoss(f.id) ? 2 : 3) - f.stocks))} · ${f.stocks} STOCKS`;
    $(`shield-${i}`).style.width = `${f.shield}%`;
    $(`meter-${i}`).style.width =
      `${Math.min(100, (f.meter / COMBAT.ultimateCost) * 100)}%`;
    $(`meter-label-${i}`).classList.toggle(
      "ready",
      f.meter >= COMBAT.ultimateCost,
    );
    $(`meter-${i}`).style.background = def.accent;
    $(`meter-label-${i}`).textContent =
      f.meter >= COMBAT.ultimateCost
        ? `${def.ultimate.toUpperCase()} · READY`
        : `${def.ultimate.toUpperCase()} · ${Math.floor((f.meter / COMBAT.ultimateCost) * 100)}%`;
    $(`weapon-${i}`).textContent = f.weapon
      ? WEAPONS[f.weapon].name.toUpperCase()
      : "UNARMED · E TO EQUIP";
    $(`ability-${i}`).textContent =
      `${def.special.toUpperCase()} · ${f.ability ? "ACTIVE" : f.specialCooldown > 0 ? `${f.specialCooldown.toFixed(1)}s` : "READY"}`;
    $(`ability-${i}`).classList.toggle("ready", f.specialCooldown === 0);
    $(`mobility-${i}`).textContent =
      `${f.jumps}/${physique(f.id).jumps} JUMPS · ${f.dodgeCharges}/${physique(f.id).dodges} DODGES${f.dodgeRegen > 0 ? ` (${f.dodgeRegen.toFixed(1)}s)` : ""} · RECOVERY ${f.recoveryUsed ? "USED" : "READY"}`;
  });
  $("clock").textContent =
    w.countdown > 0
      ? String(Math.ceil(w.countdown))
      : w.config.mode === "training"
        ? "∞"
        : `${Math.floor(Math.ceil(w.remaining) / 60)}:${String(Math.ceil(w.remaining) % 60).padStart(2, "0")}`;
  $("round-label").textContent = paused
    ? "PAUSED"
    : w.countdown > 0
      ? "DEPLOYING"
      : w.config.mode === "boss"
        ? "BOSS CONTRACT"
        : w.config.mode === "ranked"
          ? `${rankOf(profile.rating).toUpperCase()}`
          : w.config.mode === "training"
            ? "PRACTICE"
            : "3 STOCKS";
  const phase = w.time % 12;
  $("hazard-status").textContent = !w.config.hazards
    ? "SOLAR WEATHER / CLEAR"
    : phase > 8.3 && phase < 10
      ? `⚠ ${ARENAS[w.config.arena].hazardName} · ${(10 - phase).toFixed(1)}s`
      : phase >= 10 && phase < 10.35
        ? "⚠ SPEAR IMPACT"
        : "SOLAR WEATHER / CLEAR";
  $("hazard-status").classList.toggle(
    "warning",
    w.config.hazards && phase > 8.3 && phase < 10.35,
  );
  $("drop-status").textContent =
    w.countdown > 0
      ? "DELIVERY DRONES INBOUND"
      : `SIGNATURE GEAR ${Math.ceil(Math.max(0, 5 + w.signatureWave * 10 - w.time))}s · SUPPLY ${Math.ceil(Math.max(0, 10 + w.supplyWave * 10 - w.time))}s · E PICK UP`;
  $("boss-phase").hidden = w.config.mode !== "boss";
  $("boss-phase").textContent =
    `PHASE ${w.bossPhase} / ${w.bossPhase === 2 ? "AWAKENED · WEAPON SWITCH" : "THE CHALLENGE BEGINS"}`;
  const f = w.fighters[0];
  $("combo-toast").textContent =
    w.time - f.comboAt < 1 && f.comboHits > 1 ? `${f.comboHits} HIT COMBO` : "";
  if (w.config.mode === "training")
    $("coach").innerHTML =
      `<b>PRACTICE COACH</b><span>${f.hits ? "✓" : "○"} LAND A HIT</span><span>${f.parries ? "✓" : "○"} PARRY A STRIKE</span><span>${f.weapon ? "✓" : "○"} EQUIP A WEAPON</span><span>${f.kos ? "✓" : "○"} SCORE A RING-OUT</span><small>${w.config.practice === "parry" ? "Face the rival and tap L as their ultimate arrives." : w.config.practiceInfiniteMeter ? "Unlimited meter is ON. Infinite stocks; try charged ultimates freely." : "Start with full meter, then earn it through combat. Infinite stocks. Unlimited meter is available in Flight check."}</small>`;
}
function ended(w: WorldState) {
  active = false;
  paused = false;
  audio.pauseMusic(true);
  clearTimeout(announcementTimer);
  $("announcement").textContent = "";
  const settled = settleMatch(profile, w);
  lastReward = settled.reward;
  if (settled.profile !== profile) save(settled.profile);
  const won = w.winner === 0,
    draw = w.winner === "draw";
  $("result-kicker").textContent = lastReward.firstClear
    ? "CONTRACT CLEARED / BOUNTY CLAIMED"
    : draw
      ? "DRAW"
      : won
        ? "VICTORY / WELL FLOWN"
        : "DEFEAT / ANOTHER DAWN";
  $("result-title").textContent = won
    ? "A little more radiant."
    : draw
      ? "Even at the horizon."
      : "The sky is still yours.";
  $("result-copy").textContent = lastReward.firstClear
    ? "This boss bounty is permanently claimed. A greater challenge awaits."
    : won
      ? "Your next rival is waiting. Keep the light moving."
      : "Find the recovery route. Watch the red markers. Time the next parry.";
  $("result-fighters").innerHTML = w.fighters
    .map(
      (f, i) =>
        `<article class="result-pilot">${portrait(f.id)}<div><small>${i ? "OPPONENT" : "YOU"}${w.winner === i ? " · WINNER" : ""}</small><h3>${FIGHTERS[f.id].name}</h3><dl><div><dt>DAMAGE DEALT</dt><dd>${Math.round(f.damageDealt)}%</dd></div><div><dt>DAMAGE RECEIVED</dt><dd>${Math.round(f.damageTaken)}%</dd></div><div><dt>RING-OUTS / HITS</dt><dd>${f.kos} / ${f.hits}</dd></div><div><dt>PARRIES / BEST COMBO</dt><dd>${f.parries} / ${f.bestCombo}</dd></div></dl></div></article>`,
    )
    .join("");
  $("reward").innerHTML =
    current.mode === "ranked" || current.mode === "boss"
      ? `<span><b>+${money(lastReward.lumens)} ✦</b>LUMENS</span><span><b>+${lastReward.xp}</b>XP</span><span><b>${lastReward.rating >= 0 ? "+" : ""}${lastReward.rating}</b>RANK POINTS</span><span><b>${levelOf(profile)}</b>PILOT LEVEL</span>`
      : "<span>Training and quick play award no currency. Enter the ranked circuit to grow your crew.</span>";
  $("next").textContent = lastReward.firstClear
    ? "VIEW BOSS CONTRACTS ↗"
    : current.mode === "ranked"
      ? "NEXT RANKED RIVAL ↗"
      : "RUN IT BACK ↗";
  dialog("result").showModal();
  audio.play(won ? "win" : "lose");
}
function combatEvent(e: GameEvent) {
  if (e.type === "ready") {
    if (e.side === 0) {
      audio.play("ready");
      announce(e.text ?? "ULTIMATE READY", 1100);
    }
  } else if (e.type === "ability")
    audio.ability(current[e.side === 0 ? "player" : "cpu"], false);
  else if (e.type === "attack" && e.ultimate)
    audio.ability(current[e.side === 0 ? "player" : "cpu"], true);
  else if (e.type === "hit") audio.play("hit");
  else if (e.type === "parry") {
    audio.play("parry");
    announce(e.text ?? "PERFECT PARRY");
  } else if (e.type === "ko") {
    audio.play("ko");
    announce(e.text ?? "RING OUT");
  } else if (e.type === "pickup") {
    audio.play("select");
  } else if (e.type === "jump") audio.play("jump");
  else if (e.type === "charge") audio.play("charge");
  else if (e.type === "guard") audio.play("guard");
}
game.events.on("world-update", hud);
game.events.on("fight-ended", ended);
game.events.on("combat-event", combatEvent);
document
  .querySelectorAll<HTMLButtonElement>("[data-view]")
  .forEach((b) => (b.onclick = () => changeView(b.dataset.view!)));
document.querySelector(".brand")!.addEventListener("click", (e) => {
  e.preventDefault();
  changeView("play");
});
document
  .querySelectorAll<HTMLButtonElement>("[data-close]")
  .forEach((b) => (b.onclick = () => dialog(b.dataset.close!).close()));
$("mode").addEventListener("change", updateSetup);
on("start-custom", () =>
  deploy({
    player: setupPlayer,
    cpu: ($("opponent") as HTMLSelectElement).value as FighterId,
    arena: (
      document.querySelector('input[name="stage"]:checked') as HTMLInputElement
    ).value as ArenaId,
    difficulty: ($("difficulty") as HTMLSelectElement).value as Difficulty,
    mode: ($("mode") as HTMLSelectElement).value as "duel" | "training",
    practice: ($("practice") as HTMLSelectElement).value as "dummy" | "parry",
    practiceInfiniteMeter: ($("practice-infinite-meter") as HTMLInputElement)
      .checked,
    hazards: ($("hazards") as HTMLInputElement).checked,
  }),
);
on("pause", () => pause(!paused));
on("resume", () => pause(false));
on("reset", restart);
on("pause-restart", restart);
on("leave", home);
on("pause-leave", home);
on("result-home", home);
on("next", () => {
  if (lastReward?.firstClear) {
    view = "bosses";
    home();
  } else if (current.mode === "ranked") startRanked();
  else restart();
});
on("match-help", () => {
  helpResume = active && !paused;
  if (helpResume) {
    paused = true;
    game.events.emit("pause-fight", true);
    audio.pauseMusic(true);
  }
  dialog("instructions").showModal();
});
dialog("instructions").addEventListener("close", () => {
  if (helpResume && active) pause(false);
  helpResume = false;
});
dialog("pause-menu").addEventListener("cancel", (e) => {
  e.preventDefault();
  pause(false);
});
dialog("result").addEventListener("cancel", (e) => e.preventDefault());
document.querySelectorAll<HTMLButtonElement>("[data-key]").forEach((b) => {
  b.addEventListener("pointerdown", (e) => {
    b.setPointerCapture(e.pointerId);
    controls.set(b.dataset.key!, true);
  });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((type) =>
    b.addEventListener(type, () => controls.set(b.dataset.key!, false)),
  );
});
window.addEventListener("keydown", (e) => {
  if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  if (
    active &&
    !dialog("instructions").open &&
    (e.code === "KeyP" || e.key === "Escape")
  ) {
    if (dialog("pause-menu").open) {
      if (e.code === "KeyP") {
        e.preventDefault();
        pause(false);
      }
    } else {
      e.preventDefault();
      pause();
    }
  }
});
window.addEventListener("blur", () => {
  if (active && !paused && !dialog("instructions").open) pause();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && active && !paused) pause();
});
setMotion();
renderHub();
