# FRAMEBREAK — Neon Circuit 1.0 design

## Intent and release scope

“What does my opponent expect me to do next?” A compact complete single-player duel game: three selectable fighters, one neon rooftop, nine action choices, public resources/cooldowns, three levels of adaptive CPU reads, clear results, optional effects audio and reduced motion. No timer, campaign, online play, accounts, progression or saving.

## Turn pipeline

1. CPU privately commits using the completed state, before player input is enabled.
2. Player commits. Input locks; both choices are revealed at 400 ms.
3. At 850 ms, apply the pure resolver’s result and animate it.
4. At 2,050 ms, show the match outcome or commit the next CPU move and unlock input.

The resolver pays both costs and applies both movement commitments to a cloned starting state. Attacks use the resulting range. A faster in-range offensive move interrupts a slower in-range offensive move; equal speeds trade. Rendering order never decides priority. Costs and cooldowns are paid on misses, dodges and interruptions.

## Distance and footwork

Start at **Mid**. Bands are Close, Mid and Far. Advance costs 8 stamina and shifts −1; Retreat costs 8 and shifts +1. Both fighters’ shifts add before clamping to the arena boundaries. Two advances can cross Far to Close; opposing advance/retreat cancel. Boundary moves still cost stamina, and can counter opposing movement. Retreat has no invulnerability: a strike that still reaches hits normally.

Vector’s signature contributes −1 movement before attack checks, even if the strike is later interrupted. Rook’s signature knockback is a separate post-hit +1 shift and does not alter the other simultaneous attack’s range. It applies only on an unguarded damaging hit. Dodged, interrupted, missed or successfully blocked slams do not push.

Cards identify attacks requiring a range read. This preview includes the move’s own step, but cannot predict the opponent’s secret movement. Out-of-range moves remain selectable because anticipating an approach is a valid read.

## Shared defenses and resource rules

- **Block:** free to select. A light strike normally costs 10 guard stamina and does no damage. Heavy/signature chip and guard costs come from move data. If the full guard cost is unaffordable, drain remaining stamina and take full attack damage. Grab bypasses guard.
- **Dodge:** avoids strikes, but grabs catch it if in range. Consecutive costs are 25, 35, then 45 (capped). Any other action resets the streak.
- **Recover:** restore 30 stamina (Nyx: 32), capped at fighter maximum. Incoming damage ×1.4, rounded to the nearest integer. No health recovery. Stamina still restores on a lethal exchange, but cannot prevent knockout.
- **Signature:** two full intervening turns of cooldown. Cooldown is public for both sides and paid even if the attack fails. No additional meter.
- Health cannot go below zero; stamina cannot go negative. Unaffordable moves and signatures on cooldown are rejected before mutation and disabled in the UI. Free block/recover are always available.
- One round. Zero health loses; simultaneous knockouts draw. No automatic stamina regeneration.

## Fighter data

| Fighter | HP | Stamina | Personality | Strength / weakness |
| --- | --- | --- | --- | --- |
| Vector | 100 | 100 | Pressure | Fast flexible pressure; moderate damage |
| Rook | 120 | 90 | Grappler | Powerful Close game; slow and stamina-limited |
| Nyx | 90 | 110 | Zoner | Fast Mid pressure and Far threat; no Close light |

| Fighter / move | Damage | Cost | Speed | Reach | Other |
| --- | --- | --- | --- | --- | --- |
| Vector / Pulse jab | 11 | 14 | 8 | Close, Mid | No chip; 10 guard drain |
| Vector / Arc kick | 24 | 32 | 3 | Close, Mid | 8 chip; 25 guard drain |
| Vector / Tripwire | 15 | 20 | 5 | Close | Grab |
| Vector / Flash step | 18 | 30 | 6 | Close, Mid after step | Step −1; no chip; 10 guard drain |
| Rook / Knuckle check | 14 | 16 | 7 | Close | No chip; 10 guard drain |
| Rook / Wrecking blow | 29 | 36 | 2 | Close, Mid | 10 chip; 28 guard drain |
| Rook / Vice grip | 21 | 23 | 5 | Close | Grab |
| Rook / Fault line | 28 | 38 | 2 | Close, Mid | 9 chip; 26 guard drain; unguarded hit pushes +1 |
| Nyx / Needle ray | 14 | 12 | 9 | Mid | No chip; 10 guard drain |
| Nyx / Crescent cut | 23 | 30 | 4 | Close, Mid | 7 chip; 25 guard drain |
| Nyx / Phase snare | 13 | 18 | 5 | Close | Grab |
| Nyx / Prism lance | 24 | 28 | 7 | Mid, Far | 6 chip; 20 guard drain |

## CPU fairness and personality

The chooser accepts only the completed match and an injectable random function. There is no current player action input. Standard public information includes health, stamina, range, cooldowns and the last five player actions. Frequent blocks/dodges raise grab pressure; slow attacks raise light; recovery habits raise heavy; light habits raise defense/spacing. Low stamina raises recovery; low health raises block. Illegal actions are excluded.

Pressure favors light/step. Grappler seeks Close and favors grab/heavy. Zoner seeks Mid, gives Needle ray more weight there, retreats from Close and can threaten Far with its signature. Out-of-range attacks have greatly reduced weights; small residual weights permit movement reads. Rookie multiplies habit response by 0.3; Standard by 1; Expert by 1.7. No stat bonuses or cheating on any level.

## Presentation and architecture

Original code-drawn skyline, sunset, neon signs, armor/scarf/cloak silhouettes and SVG portraits. Action classes have different color accents. Health/stamina bars, range strip, both signature states and a persistent scrolling combat log expose rules clearly. Scene effects follow resolution metadata, including true blocks/dodges/interruptions. Low-health knockout silhouettes fade.

`data.ts` owns tuning. `combat.ts` is a pure snapshot resolver with no Phaser or DOM dependencies. `Arena.ts` reacts to match/reset/result events. `main.ts` handles DOM input, modals, CPU precommit and pacing. Restart cancels pending UI callbacks and restarts the Phaser scene, clearing effect timers/tweens. Sound is generated with Web Audio after an explicit user click. Reduced motion honors the OS at startup and has a session toggle.

## Balance evidence and limits

The deterministic `npm run balance` sweep runs 100 CPU-vs-CPU matches for each of nine pairings. All 900 finished; mean lengths ranged from 13.0 to 20.4 exchanges in the release sample. Off-diagonal player wins ranged from 44% to 62%. Mirror variation and directional differences reflect finite random samples, not turn-order advantage (covered independently by exhaustive symmetry tests).

The first sweep exposed Nyx’s weak ranged efficiency and unnecessary approaches. Needle ray now has speed 9 / damage 14 / cost 12, Prism lance speed 7 / damage 24, and the zoner holds Mid more often. She retains 90 HP and no Close-range light. This is a baseline, not a claim of tournament balance. Human players may expose repeated-light, defensive stall or recover-at-Far strategies that need future tuning.

## Future work, not part of 1.0

Human playtesting and tuning first; then additional arenas, an optional structured tutorial, controller support, or a small best-of-three mode. Campaigns, online multiplayer, progression and saves are separate projects, not unfinished release promises.
