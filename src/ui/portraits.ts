import {
  FIGHTERS,
  FIGHTER_IDS,
  BOSS_IDS,
  isBoss,
  type CombatantId,
  type FighterId,
  type BossId,
} from "../game/data";

/** Portrait atlases are bundled locally; bosses never enter the playable roster. */
export function portrait(id: CombatantId): string {
  const boss = isBoss(id);
  const index = boss
    ? BOSS_IDS.indexOf(id as BossId)
    : FIGHTER_IDS.indexOf(id as FighterId);
  const columns = boss ? 2 : 3;
  return `<span class="portrait-art${boss ? " boss-portrait" : ""}" style="--col:${index % columns};--row:${Math.floor(index / columns)}" role="img" aria-label="${FIGHTERS[id].name} portrait"></span>`;
}
