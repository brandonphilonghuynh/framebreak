# FRAMEBREAK 5.0 — Solstice Circuit design

The game is now a real-time, solar-themed platform fighter with persistent local progression. The earlier turn-based prototype is preserved at Git tag `v1.0.0`.

## Match loop

Quick play and ranked duels give both pilots three stocks and 180 simulation seconds. A boss contract gives the player three stocks against one heavily reinforced boss life. The player must ring out the boss before time expires; a boss-contract timeout is a loss. Practice has unlimited respawns and starts with full ultimate meter; continuous refilling is explicitly opt-in. Duel timeouts use most stocks, then lower damage; exact ties draw. Quick play and practice award no progression rewards.

A three-second deployment freezes physics, attacks, clocks and deliveries. Robots lower playable fighters into the arena; bosses enter with their own equipment.

## Movement and combat

A 1200 × 680 world runs at 60 fixed simulation steps per second. Gravity is 1650 units/s². Two jumps (three for Ember), short hops, full-lift air jumps, air steering, fast-fall, thin-platform dropping and one rising recovery per airtime support aerial combat. Walking or being knocked off a platform consumes the ground-jump opportunity, leaving one air jump, or two for Ember. `roster.ts` defines individual acceleration, air control/speed, air-jump strength, collision dimensions, damage resistance, reach and rig proportions. Rook is slow/heavy; Ember is fast/light; Astra has the strongest air steering, not the highest damage. Only the first ground jump is shortened by releasing early, so an air jump remains a reliable route back to a platform. Landing restores jumps and recovery. Moving platforms carry standing fighters and resting pickups. There is no ledge grab or wall jump.

Blast boundaries are x < −190, x > 1390, y < −280 or y > 880. Ring-out resets damage and equipment, retains half meter, and preserves match totals. Boss respawns retain a boss weapon. Simultaneous final ring-outs can draw.

J chains three strikes in a 0.85-second window with a 160 ms input buffer. Early jabs have less knockback; the third launches. Normal stun is exactly 0.5 simulation seconds (hitstop pauses simulation). Hits cannot refresh a running stun. Its expiry grants a 0.22-second control window: hits still deal damage but do not interrupt movement or defense. Playable down-airs use 0.65 seconds, with a 1.8-second repeated-spike grace. Shield break remains a distinct 0.8-second penalty. Boss down-airs retain their longer signature timing. Directional attacks and all weapon shapes remain available.

Neutral K activates a unique special, starting its cooldown immediately even if interrupted:

| Fighter | Special         | Cooldown | Behavior                                                                                                                                                                       |
| ------- | --------------- | -------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Vector  | Solar Lance     |       5s | 0.3s telegraph, fixed horizontal 430-unit beam                                                                                                                                 |
| Nyx     | Starfall        |     5.5s | Three separately parryable stars with fixed spread; no homing                                                                                                                  |
| Rook    | Seismic Bulwark |       7s | 0.45s armored brace, 30% damage reduction, ordinary interruption immunity, then radial push; ultimates/parries counter it                                                      |
| Ember   | Phoenix Dash    |     4.8s | Short forward burst and one hit; no invulnerability                                                                                                                            |
| Solis   | Eclipse Field   |       8s | Anchored 150-unit-radius field for 2.6s, 25% enemy movement penalty and 20% owner damage reduction inside; no root                                                             |
| Astra   | Tidal Orbit     |     6.5s | Hold up to 1s, release horizontally or downward with S; orb becomes a 90-unit-radius vortex after travel, contact or landing; one shared damage opportunity and escapable pull |

W + K still charges a rising recovery for up to 1.3 seconds, once per airtime, independent of a playable fighter’s signature cooldown. Bosses keep their existing charged specials.

I requires 60 meter. Combat earns 0.5 meter per damage dealt and 0.2 per damage received; perfect parries give 10. Ultimates cannot refill their owner through their own hits. Full windup power still takes 2 seconds; minimum release is 0.5 seconds, or 0.65 for Rook. Both pulses together deal 175–200% of the fighter’s heaviest signature-weapon third strike before modifiers. Each target can take at most two ultimate hits, 160 ms apart. Projectile size, velocity, direction, launch and damage vary by fighter. Meter is displayed normalized to 100% with a ready cue.

Cataclysm raises both fists, waits for ground if airborne, then sends an expanding quake across 850 units. Damage falls to 55% of epicenter damage at distance. The moving front leaves its origin, allowing a jump to avoid it rather than trapping the landing in a lingering full-area hitbox. Ultimates remain parryable; held shields cannot block them.

Launch grows with damage and shrinks with weight. Damage totals and combo records survive respawns. Solis and Rook gain durability but larger hurtboxes and slower movement; expensive fighters do not receive a blanket damage/speed/defense increase.

## Defense and CPU

L opens a 155 ms frontal parry window at a shield cost, with a 0.5-second reset. Parries interrupt melee attacks or reflect projectiles, including ultimates. Held shields block regular frontal hits, drain over time and can break; ultimates bypass held shields. Shift gives 0.24 seconds of invulnerability at an 18-point shield cost. Ember stores two dodge charges and restores one every 1.65 seconds; other pilots store one and restore it every 1.15 seconds. A 0.28-second minimum gap prevents overlapping dodges. Landing does not bypass charge regeneration.

Rookie, Standard and Expert CPUs observe world positions and visible attacks. They do not read player input. Expert decision intervals scale from about 112 ms toward 65 ms with opponent level. CPUs space for weapon range, defend against incoming hitboxes, aim aerials, contest nearby supplies, avoid retreating off ledges, steer inward during hitstun, and prioritize jumps/recovery offstage. These are heuristics with reaction intervals and probabilities, not tournament-level guarantees.

## Progression economy

A fresh profile contains Vector and 1,000 Lumens. Prices are Rook 3,000; Nyx 3,000; Ember 5,000; Solis 7,500; Astra 25,000. Progression tiers only retain the existing ranked opponent selection ladder; the shop shows roles and execution difficulty instead of a price-based power rating. All fighters can be trialed in practice without buying them.

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

The hub uses sunlit city art, translucent green panels, ivory typography and gold accents. Six painted crew portraits and four non-playable boss portraits appear in roster, HUD and results. Portrait atlas cells are clipped and contained at their native aspect ratio, including HUD, results, boss cards and detailed profiles. Combat retains articulated code-drawn rigs with per-character body proportions and portrait-based palettes; they are not realistic full-body animation. ART_REQUIREMENTS.md documents the missing assets. Signature effects include beam guides, stars, seismic cracks/debris, flame afterimages, eclipse coronas and water vortices. A gold-gradient FrameBreak wordmark stays upper-left.

Results show both combatants, damage dealt/received, ring-outs, hits, parries, best combo and rewards. Sound and synthesized music are optional. Reduced motion suppresses cosmetic effects while retaining platform motion. A screen-shake slider independently controls impact intensity; reduced motion overrides it. Character profiles expose Biography, Combat and Lore, and the HUD displays ability readiness/cooldowns, jumps, dodges and recovery.

Profiles save to localStorage at the current origin, with JSON export/import and validation. Invalid saved data is preserved until a valid import; storage errors display a backup warning. There is no backend, anti-cheat, online matchmaking or shared leaderboard. Local save files are user-editable.

## Validation and limits

Seventy automated tests cover movement, parries, charge/recovery, buffered combos, diagonal/down-air attacks, two-hit ultimates, moving platforms, deployment, scheduled gear, ownership, purchases, reward idempotence, saved data and bosses. The seeded balance harness runs 108 CPU matchups and reports ultimate usage. Targeted tests cover all six specials, stun escape, Ember’s extra movement, Cataclysm counterplay, lower meter cost, every purchase price and profile content. Human playtesting remains necessary for pricing, advanced recovery, pressure escapes and high-level bosses. Desktop browser play is the current target.
