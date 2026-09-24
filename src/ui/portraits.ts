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
  const cell = boss ? 627 : 512;
  const source = boss ? "solstice-bosses.png" : "solstice-crew.png";
  // Square atlas cells are contained within any host aspect ratio, never stretched.
  return `<svg class="portrait-art${boss ? " boss-portrait" : ""}" viewBox="0 0 ${cell} ${cell}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${FIGHTERS[id].name} portrait"><svg width="${cell}" height="${cell}" viewBox="${(index % columns) * cell} ${Math.floor(index / columns) * cell} ${cell} ${cell}" overflow="hidden"><image href="${import.meta.env.BASE_URL}art/${source}" width="${columns * cell}" height="${2 * cell}"/></svg></svg>`;
}
