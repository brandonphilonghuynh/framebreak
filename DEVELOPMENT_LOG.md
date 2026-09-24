# Development log

## 2026-09-23 — Solstice Circuit 5.0 release

Replaced the real-time prototype's neon interface with a solar-future hub and three garden/solar arenas. Added six illustrated pilot portraits, four non-playable boss portraits, distinct animated combat rigs, two new playable pilots, a Lumens shop, ranked CPU progression, level-scaled boss contracts, local auto-save and portable JSON backups. Boss rewards are permanent one-time claims; losses allow retries.

Every map now has a moving platform. Playable fighters arrive by robot during a three-second countdown, receive two signature weapon choices at 5 seconds and every 10 seconds thereafter, and can collect shared supplies every 10 seconds. Bosses enter armed and switch weapons in an awakened phase. Added repair/meter/shield/recovery gadgets, warning-marked falling solar spears, and per-combatant total damage and combo statistics across stocks. Ultimate hitboxes are capped at two hits per target with a timed interval; down-air stun grace prevents repeated full stun locks.

Browser testing found and fixed a blank WebGL arena caused by initializing Phaser inside a zero-sized hidden parent. The hidden arena now remains measurable while inaccessible to pointer and accessibility navigation. Also fixed match-entry scroll position, locked practice trials changing the selected owned pilot, displayed rank losses exceeding the zero-floor deduction, and boss regeneration incorrectly reverting an awakened phase.

Validation: 40 tests pass; strict TypeScript and production packaging pass; all eight ZIP entries verify. The 108-match seeded CPU sweep completes with no timeouts and a 38-second mean. Wins including mirrors: Vector 20, Rook 17, Nyx 24, Ember 8, Solis 22, Astra 17. This is stability evidence, not a human balance claim; Ember CPU tuning and late-game prices remain feedback priorities.

In-app browser checks cover hub and boss contract rendering, free Solis trial, all three arena backdrops, visible combat rigs/drones/supplies, weapon pickup, ultimate button input, manual pause/resume, a complete ranked defeat with both damage totals, saved XP after reload and returning to the owned pilot. No console warnings or errors appeared in these checked flows. Purchase/claim idempotence and save validation are verified by automated tests; hosted itch.io, Safari/Firefox and import/export through a hosted iframe remain unverified.

Original generated artwork is bundled in public/art; built-in generation mode and prompt briefs are recorded in ASSET_LICENSES.md. No new runtime dependency was added. A one-time Prettier pass made the expanded source readable without adding a project dependency. The upload ZIP is approximately 12 MB. Itch.io publication has not been performed.

## 2026-09-24 — Combat feel pass

Responded to playtest feedback about fast ultimates, short combo openings and weak recovery. Ultimate full charge is now 2 seconds with a 0.5-second minimum release windup; meter gain is reduced to 0.35 per damage dealt and 0.12 per damage received. Ultimate hits do not refill the attacker's own meter. Practice no longer silently forces infinite meter: Flight check exposes an explicit Unlimited ultimate meter option.

Jab chains now accept a 160 ms press buffer, use a 0.85-second combo window, reduce early-hit launch force and give the first two hits enough stun/recovery for a deliberate three-hit sequence. Holding J does not auto-combo. Normal hit-stun now has a 0.5–0.95 second floor/range; down-air stuns are 1.18–1.41 seconds, and repeat-spike grace increased to 1.8 seconds. Ground jump short-hop behavior is preserved, but air jumps retain full lift, move faster in the air and recovery rises farther. CPUs avoid wasting recovery jumps during hit-stun and use the same longer timings.

Added `tests/combat-feel.test.ts`: 11 targeted checks for buffered combos, interrupted ultimate windups, meter pacing, stun grace, full-lift air jumps, ledge recovery for both sides across every arena, recovery special reach and practice-meter opt-in. The suite now totals 51 passing tests. The updated seeded 108-match sweep completed without timeouts; average simulation length is 46 seconds, with wins Vector 17, Rook 14, Nyx 20, Ember 13, Solis 26 and Astra 18. This is a stability signal, not a final human balance claim.

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

## 2026-09-23 — Neon Circuit 1.0 release

### Delivered scope

Three selectable fighters and rivals, three CPU read levels, nine actions, meaningful range movement, distinct signatures with public cooldowns, original colorful rooftop/portraits/silhouettes, complete roster → combat → results → rematch flow, optional synthesized effects audio and a reduced-motion toggle. One-round single-player duels remain the focus; no campaign, multiplayer, accounts or saves were added.

### Decisions and fixes

- Moved reusable fighter/move data to `src/game/data.ts`; retained pure snapshot resolution and the Phaser/DOM separation.
- Movement commitments add before attack range checks; equal-speed hits trade. Rook’s knockback occurs only after an unguarded hit. Added exhaustive side-swap symmetry coverage.
- Signature cooldowns last two intervening turns and apply even on a miss. Display both fighters’ cooldowns. Card reach hints include Vector’s own step, without predicting the rival’s secret action.
- Original procedural visual work avoids external asset dependencies. Added distinct armored/scarf/cloak silhouettes, inline SVG portraits, sunset/city depth and per-action colors.
- Sound starts off, uses a user-gesture-created Web Audio context, and disconnects each finished tone. No audio samples or new package dependencies.
- Reduced motion honors the OS preference at startup. Removes idle bobbing, lunges, particles, shake and CSS transitions; retains readable result feedback.
- Added a dependency-free Node ZIP packager with relative paths and runtime license notices. `npm run package` runs tests, build and packaging; it overwrites the old ZIP to prevent stale assets.

### Balance pass

The first 900-match CPU sweep showed Nyx winning only about 20–30% against other archetypes. She was approaching despite her Mid specialization. Improved Needle ray (14 damage / 12 stamina / speed 9), Prism lance (24 damage / speed 7), and zoner positioning weights. Retained 90 health and no Close-range light. The release sweep completed all 900 matches with mean pairing lengths of 13.0–20.4 exchanges. Off-diagonal win samples ranged 44–62%; these finite CPU samples are not human competitive-balance guarantees.

### Release verification

- 17 tests: all 2,187 fighter/range/action combinations; 729 mirrored action/fighter comparisons; defenses, resources, movement ordering, range, all signatures, cooldown expiry, victory/defeat/draw, illegal input, history bounds and adaptive CPU.
- 270 deterministic matches across all fighter pairings and difficulties terminate within the test bound.
- `npm run balance`: another 900 complete deterministic CPU matches with reported win/turn statistics.
- Browser checks: roster choices for Vector/Rook/Nyx; opponent and difficulty changes; movement via buttons and keyboard; signature availability and two-turn cooldown expiry; reduced-motion and sound toggle state; help and Escape; new defeat screen and rematch reset.
- Strict TypeScript and production build pass. No browser console errors observed in checked sessions. Production bundle retains Phaser’s non-fatal chunk-size warning (~1.25 MB JavaScript before compression).

### Remaining limits / next work

Human playtesting is still needed, especially Needle ray’s Mid pressure, repeated defense and recovering at Far. Browser checks use the available Chromium-based environment; Safari/Firefox and the actual hosted itch.io iframe need release-owner testing. Desktop is the supported target. Short displays scroll. Audio is effects-only, with no music; preferences are session-only. No external account access or publishing occurred. The next milestone should be tuning from human matches before expanding feature scope.

Final release checks: browser victory after 14 exchanges and defeat after 8; rejected unaffordable keyboard light at 2 stamina without advancing the turn. The final rebuilt bundle displays both signature states and correctly cancels a pending signature reveal on R restart, then resolves only the new match’s first exchange. No console warnings/errors in that session. `npm run package` completed; `unzip -t framebreak-itch.zip` passed all four entries. Development server still serves HTTP 200. Git diff whitespace check passed.

## 2026-09-23 — v5.0 combat depth pass

Added directional aerial attacks: movement aims air J attacks, and Down + J gives every fighter a distinct downward aerial hitbox with a reliable stun window. Added explicit per-target ultimate re-hit cooldowns, allowing lingering ultimate hitboxes to strike a fighter twice when they remain caught inside while preserving projectile parry reflection.

The CPU now edgeguards offstage opponents with directional aerials, selects down-air against targets below, steers toward the stage during hitstun (directional influence), fast-falls out of launches and maintains stage-aware recovery. New deterministic tests cover all four down-airs, diagonal aim, ultimate double hits and the previous parry/charge interactions. This is a competitive behavior pass, not a claim that heuristics replace human tournament play.
