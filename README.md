# FRAMEBREAK — The Solstice Circuit

A single-player **solarpunk platform fighter** built with Phaser, TypeScript and Vite. Run, double-jump, aim diagonally, charge signature moves and parry even an ultimate. Earn Lumens against competitive CPUs, recruit six pilots and defeat four non-playable solar bosses.

[Public GitHub repository](https://github.com/brandonphilonghuynh/framebreak)

![Solstice Gardens](public/art/solstice-gardens.png)

## Play locally

Use Node.js 22.18+ (Node 24 recommended), npm and a modern desktop browser.

```sh
npm ci
npm run dev
```

Open the address printed in the terminal, normally http://127.0.0.1:5173. Leave the terminal running; Ctrl+C stops it. Do not double-click index.html.

Start with **Practice lab** to learn movement or choose **Fighters → Try** to test any locked pilot for free. **Ranked circuit** selects an Expert CPU rival appropriate to your rank, level and fighter tier. **Boss contracts** unlock as you level up.

## Controls

| Key                   | Action                                                              |
| --------------------- | ------------------------------------------------------------------- |
| A / D or Left / Right | Run and steer in the air                                            |
| Space / W / Up        | Jump and double-jump; the air jump keeps its full lift              |
| S / Down              | Fast-fall; drop through thin platforms                              |
| J                     | Three-strike chain; tap the next strike slightly early to buffer it |
| Down + J in the air   | Character-specific stun aerial                                      |
| A/D + W/S + J         | Directional attacks; bows and discs aim diagonally                  |
| Hold / release K      | Charge and fire a signature special                                 |
| W + K, release K      | Rising recovery, once per airtime                                   |
| L                     | Tap at impact to parry; hold to shield                              |
| Shift                 | Dodge at a shield cost                                              |
| Hold / release I      | Charge and fire an ultimate; full charge takes 2 seconds            |
| E                     | Pick up the nearest eligible weapon or gadget                       |
| Esc / P               | Pause / resume                                                      |

Keyboard is recommended for simultaneous controls. On-screen buttons also support mouse holds. Losing focus pauses the match. Sound effects and music start off; enable them in Settings. Reduced motion honors the OS preference and suppresses cosmetic shake and animation.

The first **155 ms** of L parries frontal attacks. Projectile parries reflect ownership. Ultimates bypass a held shield but can be parried; their lingering hitboxes can strike each target **at most twice**, 160 ms apart. Ultimates take 2 seconds to fully charge and commit to a 0.5-second windup even when released early. Down-air stuns last longer, with repeated spikes using a grace interval to prevent infinite locks. Damage % increases knockback, rather than representing remaining health.

## Pilots and progression

| Pilot  |  Lumens | Role                  | Signature weapons            |
| ------ | ------: | --------------------- | ---------------------------- |
| Vector | Starter | Fast rushdown         | Helio sabre / Arc talons     |
| Rook   |   2,500 | Heavy launch power    | Canopy maul / Root pike      |
| Nyx    |   6,500 | Ranged control        | Prism bow / Crescent mirror  |
| Ember  |  12,000 | Aerial pressure       | Flare claws / Meteor cleaver |
| Solis  |  22,000 | Heavy solar control   | Corona aegis / Dawn hammer   |
| Astra  |  40,000 | Fast advanced duelist | Orbit lance / Sunstring      |

Start with Vector and 1,000 Lumens. Ranked wins grant currency, XP and rank points; stronger opponents pay more, with a capped streak bonus. Ranked losses grant 35 XP and no currency. Every 250 XP advances a level, up to level 50. Higher-priced fighters offer stronger stats or expanded tools, while ranked opponents also advance with your selected tier.

| Boss           | Unlock level | One-time bounty |    XP |
| -------------- | -----------: | --------------: | ----: |
| Verdant Warden |            2 |           5,000 |   400 |
| Vesper         |            5 |          14,000 |   650 |
| Heliarch       |            9 |          42,000 | 1,100 |
| Eclipse        |           14 |         120,000 | 1,800 |

Bosses are never playable. They enter armed, scale with your level and awaken a second phase with a new weapon. You have three stocks; bosses have two reinforced stocks. Losses can be retried. A victory permanently clears that contract and awards its bounty once per profile.

Progress auto-saves in this browser at this address. **Profile → Export save** creates a portable JSON backup. Import validates a save and asks before replacing your profile. Clearing browser data removes the local save unless you have a backup. This is an offline CPU ladder, with no online leaderboard, account or server verification. Practice starts with normal meter pacing; **Unlimited ultimate meter** is an explicit Flight check option.

## Living arenas

- **Solstice Gardens:** a sunlit floating city, waterfalls and drifting garden platforms.
- **Helios Foundry:** an orbital solar forge with a rising central platform.
- **Aurora Spires:** floating islands and a moving bridge across a wide gap.

Each match starts with a three-second robot deployment. Each playable fighter's two signature weapons arrive at **5, 15, 25… seconds**. Shared weapons and rotating gadgets arrive at **10, 20, 30… seconds**. Gadgets repair damage, charge meter, restore shields or refresh aerial recovery. E equips nearby eligible gear; opponents cannot take your signature drops. Bosses receive no signature delivery drones.

Red warnings precede optional falling solar spears. Results show both portraits, total damage dealt/received across all stocks, ring-outs, hits, parries, best combos and progression rewards.

## Development

```sh
npm test            # 51 regression tests
npm run typecheck   # Strict TypeScript
npm run balance     # 108 seeded CPU matchups
npm run build       # Production dist/
npm run preview     # Production preview, normally port 4173
npm run package     # Tests + build + framebreak-itch.zip
```

The build bundles its artwork and runtime assets locally. No CDN, external fonts, API keys or game server is required. Vite reports a non-fatal Phaser bundle-size warning.

- `src/game/simulation.ts`: fixed-step rules, physics, equipment and results.
- `src/game/cpu.ts`: visible-state CPU spacing, defense, edgeguards and recovery.
- `src/game/progression.ts`: profile validation, purchases and reward settlement.
- `src/game/data.ts`, `equipment.ts`: roster, bosses, stages and weapon tuning.
- `src/scenes/`: articulated fighter rigs, moving arenas and effects.
- `src/main.ts`, `style.css`, `solstice.css`: hub, shop, HUD and dialogs.
- `public/art/`: generated environment and portrait atlases.
- `tests/`: combat, progression, save and boss regressions.

See [implemented design](GAME_DESIGN.md), [art provenance and generation briefs](ASSET_LICENSES.md), [development log](DEVELOPMENT_LOG.md) and [itch.io packaging notes](ITCH_PUBLISHING.md).

## Current limits

Desktop keyboard/mouse, one player versus CPU. No gamepad support or multiplayer. Painted portraits and scenery complement procedural animated combat rigs; this is a 2D game. CPU simulations verify stability, not human competitive balance. Progression pricing, Ember's CPU performance, recoveries and parry timing need real-player tuning. Safari, Firefox and the hosted itch.io iframe have not been verified. The original turn-based prototype is preserved at Git tag `v1.0.0`.
