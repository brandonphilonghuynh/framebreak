# FRAMEBREAK — Neon Circuit 1.0

A finished, compact single-player tactical fighting game built with Phaser, TypeScript and Vite. Choose Vector, Rook or Nyx, read your rival’s habits, and commit a move in secret. Both choices reveal together. Footwork sets the distance; speed, reach and defensive state decide the exchange.

## Play locally

Requirements: Node.js 22.18+ (Node 24 recommended), npm, and a modern desktop browser. Dependencies are already installed in this checkout.

```sh
npm install
npm run dev
```

Open the address printed in the terminal (normally http://127.0.0.1:5173). Select a fighter, rival and difficulty, then **Enter the circuit**. On later visits, run only `npm run dev` from the project folder. Leave the terminal running; Ctrl+C stops it. Do not double-click index.html.

## Controls

| Key | Action |
| --- | --- |
| 1 | Fighter’s light attack |
| 2 | Fighter’s heavy attack |
| 3 | Block |
| 4 | Dodge |
| 5 | Fighter’s grab |
| 6 | Recover |
| 7 | Fighter’s signature move |
| Q | Advance one range band |
| E | Retreat one range band |
| H | Open/close field manual |
| Esc | Close field manual |
| R | Rematch during combat or after a result |

All moves also have mouse buttons. **Change fighters** or the logo opens the roster. Sound starts off; toggle it in the header. **Reduce motion** disables idle movement, lunges, particles and camera shake, and removes CSS transitions. It also respects the system’s reduced-motion setting at startup. Preferences are session-only.

## The roster

- **Vector / The Live Wire:** 100 health, 100 stamina. Fast pressure; Flash step closes distance before attacking.
- **Rook / The Immovable:** 120 health, 90 stamina. Powerful close-range grab; Fault line pushes rivals away on unguarded hits.
- **Nyx / The Afterimage:** 90 health, 110 stamina. Fast Mid-range light; Prism lance reaches Mid/Far. Close range is her weakness.

The action cards show the actual damage, speed, reach, cost and cooldown for your selected fighter. Both signature cooldowns are public in the HUD. Opponents have distinct pressure/grappler/zoner personalities. Rookie, Standard and Expert change adaptation strength, not stats or secret knowledge.

## How the reads work

CPU commits before player input. Q/E movement and Vector’s step combine before range is checked. Opposing steps cancel; matching steps stack. Faster in-range attacks interrupt slower ones; equal speeds trade. Block spends guard stamina when hit, dodge avoids strikes, grab catches defense at Close, and recovery exposes you to 40% extra damage. At zero health the match ends; double knockouts draw. There is no timer, passive regeneration or persistent progression.

## Development and release

```sh
npm test            # 17 deterministic rule/regression tests
npm run typecheck   # Strict TypeScript validation
npm run balance     # Reproducible 900-match CPU balance sweep
npm run build       # Typecheck and build dist/
npm run preview     # Play the production build locally
npm run package     # Tests + build + framebreak-itch.zip
```

The packager uses Node’s built-in modules and overwrites the previous ZIP, preventing stale assets. No lint framework is installed; TypeScript and combat tests are the required checks. `npm ci` installs the exact versions in package-lock.json.

## Project map

- `src/game/data.ts`: fighter/move data, controls, types and tuning.
- `src/game/combat.ts`: pure simultaneous resolver, range/cost checks, cooldowns and CPU.
- `src/game/audio.ts`: original optional synthesized sound effects.
- `src/scenes/Arena.ts`: original procedural neon skyline, fighters and effects.
- `src/ui/portraits.ts`: original inline SVG portraits.
- `src/main.ts`: roster, HUD, action input, reveal pacing, results and accessibility controls.
- `src/style.css`: responsive interface and visual theme.
- `tests/combat.test.ts`: exhaustive combinations, symmetry, resources, movement, signatures, AI and seeded matches.
- `scripts/simulate.ts`: deterministic balance observations.
- `scripts/package.mjs`: dependency-free production ZIP writer.
- `GAME_DESIGN.md`: complete implemented rules and balance notes.
- `DEVELOPMENT_LOG.md`: milestones, decisions, verification and limitations.
- `ASSET_LICENSES.md`: provenance and runtime license handling.
- `ITCH_PUBLISHING.md`: manual upload instructions.

## Release scope

V1.0 is the Neon Circuit single-player duel release: three fighters, one original arena, nine actions per fighter, three CPU levels, optional effects audio, roster/results/help and mouse/keyboard controls. No accounts, multiplayer, campaigns, saves or monetization. Nothing has been published externally. The build is self-contained with no CDN, external fonts, network services or runtime downloads. Build output, dependencies and ZIP archives are ignored by Git.
