# FRAMEBREAK

A desktop browser tactical fighting prototype made with Phaser, TypeScript, and Vite. You play Vector against Rook. Choose one of six moves, reveal both choices, and resolve the exchange simultaneously. Rook adapts to your last five actions and commits before seeing your current choice.

## Start playing

Requirements: Node.js 22.18+ (Node 24 recommended), npm, and a modern desktop browser. Dependencies are already installed in this checkout.

```sh
npm install
npm run dev
```

Open the local address printed in the terminal (normally http://127.0.0.1:5173). Click **Enter the arena**. Leave the terminal running; Ctrl+C stops the server. On later visits, just run `npm run dev` from this folder. Do not double-click index.html; Vite serves the game correctly.

## Controls

Click an action card or press:

| Key | Action |
| --- | --- |
| 1 | Light attack |
| 2 | Heavy attack |
| 3 | Block |
| 4 | Dodge |
| 5 | Grab |
| 6 | Recover |
| H | Open/close help |
| R | Restart the match |
| Esc | Close help |

The FRAMEBREAK logo returns to the title between exchanges. Rematch resets both fighters and the CPU’s memory. Moves you cannot afford are disabled. A selected move cannot be changed. After a short reveal, read the combat log and choose again. The match ends when either fighter reaches zero health; simultaneous knockouts are a draw.

## Development commands

```sh
npm test            # Node’s built-in test runner; no test dependency
npm run typecheck   # Strict TypeScript validation
npm run build       # Typecheck and create dist/
npm run preview     # Serve the production build locally
```

No lint framework is configured. The project uses strict TypeScript and combat tests. Dependencies are pinned reproducibly by package-lock.json; use `npm ci` for a clean reproducible install.

## Files

- `src/game/combat.ts`: move/fighter definitions, match state, pure combat resolver, weighted CPU.
- `src/scenes/Arena.ts`: Phaser arena and procedural fighter/effect rendering.
- `src/main.ts`: accessible HTML controls, turn pacing, secret CPU commitment, menus, and history.
- `src/style.css`: responsive desktop interface.
- `tests/combat.test.ts`: matchups, resources, outcomes, range, AI and simulations.
- `GAME_DESIGN.md`: exact current mechanics and balance assumptions.
- `DEVELOPMENT_LOG.md`: milestones, verification and next work.
- `ASSET_LICENSES.md`: asset provenance and future asset checklist.
- `ITCH_PUBLISHING.md`: manual upload instructions.
- `vite.config.ts`: relative asset paths for embedded hosting.

The production build is self-contained: no CDN, external fonts, backend, account, analytics, or runtime downloads. `dist/`, dependencies, and the upload ZIP are intentionally ignored by Git.

## Current scope

One arena, one round, one player fighter, one adaptive CPU. Range-aware rules support Close/Mid/Far; V0.1 gameplay stays at Close. No sound, saving, multiplayer, or movement yet. See the design document before changing combat rules.
