# FRAMEBREAK 5.0 — Solstice Circuit design

The game is now a real-time, solar-themed platform fighter with persistent local progression. The earlier turn-based prototype is preserved at Git tag `v1.0.0`.

## Match loop

Quick play and ranked duels give both pilots three stocks and 180 simulation seconds. Bosses have two reinforced stocks against the player's three. Practice has unlimited respawns and constantly replenishes the player's ultimate meter. At timeout, most stocks wins, then lower damage; exact ties draw. Quick play and practice award no progression rewards.

A three-second deployment freezes physics, attacks, clocks and deliveries. Robots lower playable fighters into the arena; bosses enter with their own equipment.

## Movement and combat

A 1200 × 680 world runs at 60 fixed simulation steps per second. Gravity is 1650 units/s². Two jumps, short hops, full-lift air jumps, air steering, fast-fall, thin-platform dropping and one rising recovery per airtime support aerial combat. Only the first ground jump is shortened by releasing early, so an air jump remains a reliable route back to a platform. Landing restores jumps and recovery. Moving platforms carry standing fighters and resting pickups. There is no ledge grab or wall jump.

Blast boundaries are x < −190, x > 1390, y < −280 or y > 880. Ring-out resets damage and equipment, retains half meter, and preserves match totals. Boss respawns retain a boss weapon. Simultaneous final ring-outs can draw.

J chains three strikes in a 0.85-second window. The next strike can be buffered 160 ms early, while holding J still produces only one press. Early jab hits use less launch force and a longer recovery window so a clean sequence can finish before the opponent can act; ordinary hit-stun now lasts at least 0.5 seconds and up to 0.95 seconds, while the third hit launches. Movement and W/S aim aerials; each pilot has a downward stunning attack. Down-air stuns now last roughly 1.18–1.41 seconds, with a 1.8-second grace interval preserving setup without allowing repeated full stun locks. Weapon shape changes damage, reach and recovery: hammer launches harder, claws recover faster, spear extends reach, bow fires bolts and disc returns.

K charges a character-specific special for up to 1.3 seconds. I consumes full meter on release and reaches full charge at 2 seconds; releasing earlier still commits to a 0.5-second windup, and damage or parry interrupts it without spending meter. Normal combat meter gain is deliberately modest: 0.35 per damage dealt and 0.12 per damage received, with a 10-point perfect-parry bonus. W + K selects a rising recovery. Vector dashes, Rook strikes an expanding area, Nyx/Astra fire charged projectiles, Ember rises in a flame strike, and Solis throws a returning disc. Ultimate hitboxes can hit each target at most twice, with a 160 ms interval.

Launch grows with accumulated damage and shrinks with weight. Damage dealt grants 0.35× meter; damage received grants 0.12× meter. Damage totals and combo records persist across respawns.

## Defense and CPU

L opens a 155 ms frontal parry window at a shield cost, with a 0.5-second reset. Parries interrupt melee attacks or reflect projectiles, including ultimates. Held shields block regular frontal hits, drain over time and can break; ultimates bypass held shields. Shift gives brief invulnerability at a shield cost and cooldown.

Rookie, Standard and Expert CPUs observe world positions and visible attacks. They do not read player input. Expert decision intervals scale from about 112 ms toward 65 ms with opponent level. CPUs space for weapon range, defend against incoming hitboxes, aim aerials, contest nearby supplies, avoid retreating off ledges, steer inward during hitstun, and prioritize jumps/recovery offstage. These are heuristics with reaction intervals and probabilities, not tournament-level guarantees.

## Progression economy

A fresh profile contains Vector and 1,000 Lumens. Fighter prices rise from Rook at 2,500 to Astra at 40,000. Power tiers combine stats and tool access; they are not measured win-rate promises. All fighters can be trialed in practice without buying them.

Ranked rival tier is the greater of selected fighter tier and rank tier, capped at five. Rival level is player level + 1 + a rating increment, capped at 55. Arenas rotate with recorded wins. Ranked wins award 300 + 80 × opponent level + 120 × rank tier Lumens, plus up to 250 streak bonus. Wins award 140 + 15 × opponent level XP. Losses/draws award 35 XP and no Lumens. Losses can reduce rating, never below zero.

Each 250 XP grants a level, capped at 50. Rank tiers every 200 points are Seedling, Copperleaf, Sunstone, Auric, Radiant and Solar Ascendant.

## Boss contracts

| Boss           | Level |     Lumens / XP | Identity                                           |
| -------------- | ----: | --------------: | -------------------------------------------------- |
| Verdant Warden |     2 |     5,000 / 400 | Heavy garden guardian; regenerating awakened phase |
| Vesper         |     5 |    14,000 / 650 | Fast prism ranged fighter                          |
| Heliarch       |     9 |  42,000 / 1,100 | Heavy solar furnace bruiser                        |
| Eclipse        |    14 | 120,000 / 1,800 | Fast seraph with ranged control and regeneration   |

Boss damage scales with the greater of player level and contract level, within a capped multiplier. Bosses awaken at more than 85% damage or after losing a stock, then remain awakened. They switch signature weapons, move faster and gain meter faster. Boss IDs never enter player selection, shop or practice selectors.

Losses allow another attempt. Victories permanently add the boss to the profile's cleared contracts. Reward settlement checks match IDs and cleared bosses, preventing repeated UI callbacks from paying twice. Boss payouts grow substantially with contract level.

## Arenas, deliveries and hazards

Solstice Gardens is the main map. Helios Foundry and Aurora Spires retain the futuristic solar setting with distinct layouts. Each stage has at least one sinusoidally moving platform.

Playable pilots receive both unique weapons at 5 seconds and every 10 seconds thereafter. Shared blade/gadget pairs arrive every 10 seconds. Pickups fall onto platforms, expire after 15 seconds and require a fresh E press. Signature gear is owner-specific. Bosses spawn armed and get no signature delivery robots.

Shared gadgets rotate through repair (−20% damage), capacitor (+20 meter), aegis (shield refill and brief protection), and jet (restored jumps/recovery with an upward boost).

Optional hazards warn with red markers from 8.3 to 10 seconds in a repeating 12-second cycle. During the 0.35-second strike window, a fighter in the marked column can take 9 damage once. A timely parry deflects the hazard and grants meter. The falling spear visual represents a column hazard, not a separately simulated projectile.

## Presentation and saves

The hub uses sunlit city art, translucent green panels, ivory typography and gold accents. Six painted crew portraits and four non-playable boss portraits appear in roster, HUD and results. Combat uses articulated code-drawn rigs, readable attack effects, shields, drones and animated platforms.

Results show both combatants, damage dealt/received, ring-outs, hits, parries, best combo and rewards. Sound and synthesized music are optional. Reduced motion suppresses cosmetic effects while retaining platform motion.

Profiles save to localStorage at the current origin, with JSON export/import and validation. Invalid saved data is preserved until a valid import; storage errors display a backup warning. There is no backend, anti-cheat, online matchmaking or shared leaderboard. Local save files are user-editable.

## Validation and limits

Fifty-one automated tests cover movement, parries, charge/recovery, buffered combos, diagonal/down-air attacks, two-hit ultimates, moving platforms, deployment, scheduled gear, ownership, purchases, reward idempotence, saved data and bosses. The seeded balance harness runs 108 CPU matchups. Human playtesting remains necessary for pricing, advanced recovery, pressure escapes and high-level bosses. Desktop browser play is the current target.
