# FRAMEBREAK — design, version 0.1

## Goal and turn sequence

“What does my opponent expect me to do next?” Each turn starts with Rook committing privately from public stats and completed history. The player chooses; the UI locks; both moves reveal at 450 ms; resolution/impact occurs at 950 ms; the next selection becomes available at 2,200 ms. Attack order is determined from the same snapshot, never by which UI button was clicked first.

Both fighters start at 100 health and 100 stamina. No timer or passive recovery. One round; zero health loses. Equal-speed lethal trades draw. Both pay their action costs even when interrupted or evaded. Stamina cannot go negative. Health cannot go below zero. Recovery caps at 100. The log records both damage explanations and net stamina changes.

## Move data

| Move | Cost | Damage | Speed | Range | Effect |
| --- | --- | --- | --- | --- | --- |
| Light | 15 | 12 | 8 | Close, Mid | Interrupts slower offensive moves |
| Heavy | 35 | 25 | 3 | Close, Mid | 8 chip through guard; costs defender 25 stamina |
| Block | 0 to select | 0 | Defensive | Any | Light costs 10 guard stamina, prevents all damage |
| Dodge | 25 / 35 / 45 | 0 | Defensive | Any | Evades strikes, but grab catches it |
| Grab | 20 | 15 | 5 | Close | Ignores block, catches dodge, interrupts heavy |
| Recover | 0; restores 30 | 0 | Recovery | Any | Receives 1.4× damage (rounded) |

Dodge costs increase for consecutive uses, capped at 45; any different action resets that streak. Block only consumes stamina when absorbing a strike. If the defender cannot pay the full guard cost, their remaining stamina is drained and the attack deals full damage. This lets an exhausted fighter select block but makes it risky; recover always remains selectable.

Light and heavy share a reach in V0.1; grab is short range. All live matches stay Close. Mid/Far are supported and tested in the engine; movement is deferred. A faster in-range offensive action interrupts a slower in-range offensive action. Equal speeds trade. An out-of-range attack misses and cannot interrupt. Defensive states apply before incoming damage. Recovery restores stamina even if that exchange knocks the fighter out; it never restores health.

## CPU

Weighted randomness creates variation, with baseline preference for light over heavy. Low CPU stamina boosts recovery; low CPU health boosts blocking. The last five player moves raise counters: grab against frequent block/dodge, light against heavy, heavy against recovery, block/dodge against light. Low player stamina raises heavy pressure. Unaffordable moves are excluded and out-of-range grabs receive zero weight. The chooser has no parameter for the current player action; `src/main.ts` calls it before enabling input.

## Presentation and architecture

Pure combat state and resolution are independent of Phaser. The Phaser scene draws the training room and two procedural fighters, animating attacks, evade, guard/recovery rings, impact flashes, shake, and floating damage. HTML owns controls, modals, bars, keyboard focus and combat history. Input is locked during resolution. Restart invalidates queued UI callbacks so old exchanges cannot change a new match.

Move properties (speed/range/type/cost/damage/guard/recovery vulnerability) drive combat, rather than a UI matchup table. Fighter definitions expose name, caps, moves, color, and optional portrait/passive/personality fields. Distinct caps/passives/move rosters are schema extension points only; current resolver assumes the shared V0.1 caps. Wire those fields fully before introducing archetypes.

## Balance assumptions and concerns

- Light is reliable and may be too efficient. Monitor light/block loops.
- Grab has broad coverage at Close, but light interrupts it. Range changes should limit this coverage in V0.2.
- Heavy is a read against recovery (35 damage) or guard, not a neutral default.
- Recovery is intentionally punishable; there is no passive regeneration to remove that decision.
- Repeated block loses stamina and invites grab; repeated dodge becomes expensive.
- Stochastic tests validate rules, not fun or competitive balance. Human playtesting should measure dominant moves and typical match length before changing values.

## Next, not implemented

V0.2: meaningful discrete movement first, then distinct fighter archetypes with unique move sets and stronger personality differences. Later: specials, status effects, tournaments, progression, sound/music, settings, saving, controller support, and eventually multiplayer. No accounts, database, monetization or campaigns in this prototype.
