# FRAMEBREAK — The Solstice Circuit

A single-player **solarpunk platform fighter** built with Phaser, TypeScript and Vite. Run, use distinct aerial movement, aim diagonally, deploy unique signature abilities and parry even an ultimate. Earn Lumens against competitive CPUs, recruit six pilots and defeat four non-playable solar bosses.

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
| Space / W / Up        | Jump ×2 (Ember ×3); air jumps retain full lift                      |
| S / Down              | Fast-fall; drop through thin platforms                              |
| J                     | Three-strike chain; tap the next strike slightly early to buffer it |
| Down + J in the air   | Character-specific stun aerial                                      |
| A/D + W/S + J         | Directional attacks; bows and discs aim diagonally                  |
| K                     | Activate a signature; Astra can hold and aim its release            |
| W + K, release K      | Rising recovery, once per airtime                                   |
| L                     | Tap at impact to parry; hold to shield                              |
| Shift                 | Dodge; Ember stores two charges, others one                         |
| Hold / release I      | Charge and fire an ultimate; full charge takes 2 seconds            |
| E                     | Pick up the nearest eligible weapon or gadget                       |
| Esc / P               | Pause / resume                                                      |

Keyboard is recommended for simultaneous controls. On-screen buttons also support mouse holds. Losing focus pauses the match. Sound effects and music start off; enable them in Settings. Reduced motion honors the OS preference and suppresses cosmetic shake and animation. Settings also has a 0–100% screen-shake slider; reduced motion overrides it.

The first **155 ms** of L parries frontal attacks. Projectile parries reflect ownership. Ultimates bypass a held shield but can be parried; their lingering hitboxes can strike each target **at most twice**, 160 ms apart. Ultimates cost 60 meter and take 2 seconds to reach full power. Even a tap commits to a 0.5-second windup (Rook: 0.65 seconds and solid footing). Normal stun is 0.5 seconds, cannot be refreshed during an existing stun, and ends with a 0.22-second escape window. Playable down-airs use 0.65 seconds plus repeated-spike grace. Their extra setup does not permit an infinite stun lock. Damage % increases knockback, rather than representing remaining health.

## Pilots and progression

| Pilot  |  Lumens | Role / difficulty              | Signature ability                     | Cooldown |
| ------ | ------: | ------------------------------ | ------------------------------------- | -------: |
| Vector | Starter | Balanced / Easy                | Solar Lance — directed beam           |       5s |
| Rook   |   3,000 | Heavyweight / Easy             | Seismic Bulwark — armored push        |       7s |
| Nyx    |   3,000 | Ranged spacing / Medium        | Starfall — three fixed-path stars     |     5.5s |
| Ember  |   5,000 | Aerial speed / Hard            | Phoenix Dash — blazing approach       |     4.8s |
| Solis  |   7,500 | Durable area control / Hard    | Eclipse Field — anchored slow/defense |       8s |
| Astra  |  25,000 | Technical versatility / Expert | Tidal Orbit — held water orb/vortex   |     6.5s |

Click a portrait, fighter name or dossier link for **Biography / Combat / Lore**. Cards show actual attack, defense, speed, jumps/dodges, control complexity and ultimate reach. Difficulty describes execution complexity, not power. Two original signature weapons per fighter are still delivered during matches.

K is independent of the ultimate meter. W + K recovery is independent of signature cooldowns. Astra can hold K for up to one second and release with S to aim downward; the sphere becomes a temporary vortex after contact, travel or striking a platform. Rook’s **Cataclysm** raises both fists before a ground smash and expanding quake; jump its advancing front, dodge, or parry. Playable ultimates have two-hit total damage budgets of roughly 175–200% of that fighter’s heaviest equipped third strike, before defense, charge and distance modifiers.

Start with Vector and 1,000 Lumens. Ranked wins grant currency, XP and rank points; stronger opponents pay more, with a capped streak bonus. Ranked losses grant 35 XP and no currency. Every 250 XP advances a level, up to level 50. Prices unlock different tools and complexity rather than universally stronger stats. Ranked opponents continue to advance with your selected progression tier.

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
npm test            # 70 regression tests
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
- `src/game/data.ts`, `roster.ts`, `equipment.ts`, `tuning.ts`: roster, physics, cooldowns, bosses, stages and weapon tuning.
- `src/game/lore.ts`, `src/ui/fighter-profile.ts`: pilot biographies and mechanically derived profile statistics.
- `src/scenes/`: articulated fighter rigs, moving arenas and effects.
- `src/main.ts`, `style.css`, `solstice.css`: hub, shop, HUD and dialogs.
- `public/art/`: generated environment and portrait atlases.
- `tests/`: combat, progression, save and boss regressions.

See [implemented design](GAME_DESIGN.md), [art provenance and generation briefs](ASSET_LICENSES.md), [development log](DEVELOPMENT_LOG.md) and [itch.io packaging notes](ITCH_PUBLISHING.md).

## Current limits

Desktop keyboard/mouse, one player versus CPU. No gamepad support or multiplayer. Painted portraits and scenery complement procedural animated combat rigs; this is a 2D game. The existing portraits are busts only; hyperrealistic full-body animation remains pending the assets specified in [ART_REQUIREMENTS.md](ART_REQUIREMENTS.md). CPU simulations verify stability, not human competitive balance. Nyx currently performs strongest in the seeded CPU sample; Astra’s technical options and Ember’s extra mobility need human testing. Safari, Firefox and the hosted itch.io iframe have not been verified. The original turn-based prototype is preserved at Git tag `v1.0.0`.
