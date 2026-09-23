import { FIGHTERS, type FighterId } from "../game/data";
/** Original SVG portraits share each fighter’s silhouette and colors with the arena. */
export function portrait(id: FighterId): string {
  const color = FIGHTERS[id].accent;
  const body =
    id === "rook"
      ? '<path d="M24 126 28 82 49 65 88 65 110 85 115 126Z"/><path d="M16 84 40 77 44 110 17 113ZM99 77 121 84 122 113 97 110Z"/>'
      : id === "nyx"
        ? '<path d="M22 128 44 68 91 68 117 128Z"/><path d="m44 68 24 29 23-29-10 61H55Z" fill="#1c2144"/>'
        : '<path d="m25 128 14-47 18-16h25l19 16 15 47Z"/><path d="M48 68 16 75 3 99 43 83Z" fill="#ff668c"/>';
  return `<svg viewBox="0 0 140 140" role="img" aria-label="${FIGHTERS[id].name} portrait"><defs><linearGradient id="p-${id}" x2="1" y2="1"><stop stop-color="${color}" stop-opacity=".3"/><stop offset="1" stop-color="#111529"/></linearGradient></defs><rect width="140" height="140" rx="16" fill="url(#p-${id})"/><circle cx="70" cy="62" r="47" fill="none" stroke="${color}" opacity=".4"/><g fill="${color}">${body}<path d="M49 31 64 22 86 29 94 48 87 65 56 65 46 48Z"/></g><path d="m51 40 41-3-5 14-31 3Z" fill="#15182e"/><path d="m64 44 20-2" stroke="#fff6ce" stroke-width="4"/><path d="m62 81 13 7-7 14-12-13Z" fill="#fff6ce"/>${id === "nyx" ? '<path d="m103 16 11 22-12 16" fill="none" stroke="#efbdff" stroke-width="4"/>' : ""}<path d="M15 130h110" stroke="${color}" stroke-width="2"/></svg>`;
}
