# Development log

## 2026-09-23 — Version 0.1

### Completed

- Inspected an empty workspace and initialized a dedicated local Git repository (rather than using the inherited parent repository).
- Installed Phaser, TypeScript and Vite; added npm commands, lockfile, strict TypeScript, relative build paths and Git ignores.
- Implemented all six actions, simultaneous snapshot resolution, speed interrupts/trades, range-aware moves, health/stamina, guard breaks, recovery vulnerability and escalating consecutive dodge cost.
- Added a weighted balanced CPU, precommitted before player input, using public resources and the last five completed player moves.
- Built original procedural arena/fighters, action reveals, attack/defense animations, hit flashes, shake, floating damage, animated bars and stamina change messages.
- Added title, help, mouse/keyboard input, disabled unaffordable actions, win/loss/draw states, restart and title return between exchanges.
- Added all project documentation, runtime license notices, and a production HTML5 ZIP for manual itch.io publishing.
- Formatted source for readability with a one-time Prettier invocation; no formatting dependency added.

### Architecture decisions

`src/game/combat.ts` has no rendering dependencies. It owns move data, state, legal action checks, resolution and CPU weighting. `Arena.ts` handles Phaser rendering. `main.ts` connects DOM menus/controls to the game with a short locked reveal sequence. Keep future rules out of scene/UI code. Both resource payments precede resolution; equal-speed hits trade. Reset invalidates pending UI callbacks and restarts the arena to cancel visual effects.

The browser interface uses semantic buttons and native dialogs. CPU commitment lives outside the DOM and is only displayed during the reveal. There is no save storage, network gameplay, analytics or backend. Fighter definition extension fields are intentionally small; future custom caps/passives require wiring into resolution.

### Verification

- `npm test`: 11 tests pass, including all 36 action pairs, interruptions/trades, all defenses, recovery, insufficient stamina, range, victory/defeat/draw, restart baseline, history bounds and CPU behavior.
- 100 deterministic full-match simulations terminate within the 300-turn safety bound with valid resource values.
- `npm run typecheck`: pass. The initial missing DOM.Iterable library entry was corrected.
- `npm run build`: pass; generated HTML, CSS, JavaScript and runtime license file use local relative paths.
- Vite development server starts and serves HTTP 200. Production preview starts successfully.
- In-app browser: verified title/start, rendered Phaser arena, all six action buttons, reveal/input locking, combat log, recovery, disabled heavy at zero stamina, keyboard rejection of that unaffordable heavy, help open/close, full defeat flow and restart.
- Production preview: title/start and a complete 15-exchange victory run successfully; no browser console warnings or errors. Final rebuilt bundle also verified for keyboard input and restart during a reveal, followed by a new exchange.
- No lint framework configured; strict typing and rule tests are the checks.

### Known limitations and balancing notes

- Phaser produces a non-fatal large-bundle warning (~1.23 MB JavaScript, ~339 KB gzip). No unnecessary bundling changes made for this small prototype.
- Close range is fixed for live matches; Mid and Far exist in the resolver and tests only.
- No sound/music; placeholder procedural figures are intentional.
- UI may scroll on shorter screens. Desktop is the supported target; mobile/controller support is deferred.
- Human balance testing remains necessary. Light may be too efficient, and grab has broad coverage at Close. Heavy punishes recovery/guard but loses neutral speed contests.
- Restart resets everything immediately; no confirmation prompt. No persistence.
- Hosted itch.io behavior must be checked manually after upload; no account access or publishing attempted.

### Recommended next milestone

V0.2: implement meaningful movement among Close/Mid/Far, then distinct archetypes/move sets and CPU personalities. First measure match lengths and action frequencies through human playtests; retain the existing resolver tests when tuning costs or speed.

## 2026-09-23 — Version 0.2 milestone

Implemented simultaneous range movement, three playable fighter definitions and move sets, signature cooldowns, range-aware personalities/difficulty, character/opponent selection, and the original neon rooftop art direction. Retained the pure resolver / Phaser scene / DOM UI separation. Expanded regression tests to 17, including 2,187 fighter/range/action combinations and 270 seeded full matches. A balance harness found Nyx weak at Mid; improved Needle ray’s speed/efficiency, Prism lance, and the zoner’s spacing weights. Preparing the v1.0 release candidate with optional procedural audio, reduced motion, documentation and a reproducible upload package.
