# Package FRAMEBREAK — The Solstice Circuit for itch.io

`framebreak-itch.zip` is the self-contained browser build. Source lives on GitHub. No itch.io publication has been performed.

## Rebuild and preview

```sh
npm run package
npm run preview
```

Packaging runs tests, typechecks, builds and replaces the previous ZIP. Preview serves production at the terminal's address, normally http://127.0.0.1:4173.

The ZIP must contain `index.html`, `assets/`, `art/` and `THIRD_PARTY_LICENSES.txt` at its root. Do not upload source or node_modules.

## Upload checklist

1. Create or edit an itch.io HTML game project and upload the ZIP as a browser-playable file.
2. Prefer fullscreen launch, or a desktop embed around 1280 × 800 with scrolling and a fullscreen button.
3. In draft, check all six pilot trials, three stages, countdown, moving platforms, weapon pickup, charge/recovery, parries, results/rematch and optional audio.
4. Check ranked rewards, profile reload/export/import, character purchases and boss contract gating. Saves belong to the hosted origin; export local progress before moving it.
5. Focus the iframe before using keys. Keep Mobile Friendly unchecked; this is a desktop keyboard/mouse build.
6. Publish manually after checking the hosted game. Account setup, upload and publication remain release-owner actions.

## Suggested description

> A brighter kind of battle. FRAMEBREAK is a solarpunk platform fighter with six pilots, moving skybridges and four formidable solar bosses. Earn Lumens in a competitive CPU circuit, recruit your crew and claim one-time boss bounties. Charge your signature move, control the air and turn even an ultimate aside with a perfect parry.

Controls: A/D move; Space/W double-jump; S fast-fall/drop; J strike; Down+J stun aerial; hold/release K special; W+K recovery; L parry/shield; Shift dodge; hold/release I ultimate; E pickup; Esc/P pause.

## Troubleshooting

- Missing assets: upload the complete ZIP, preserving folders and filename case.
- No sound: enable sound/music in Settings after a user gesture.
- No input: close dialogs, resume and focus the iframe. Losing focus pauses intentionally.
- Menus clipped: allow scrolling or launch fullscreen.
- Save warning: export a backup; browser storage may be unavailable in that context.
- Old build: package again, upload the new ZIP and reload after processing.

No CDN, API key or game server is required. Persistent progress uses browser storage. Safari, Firefox and the actual hosted iframe still need testing.

Reference for the uploader: [itch.io HTML5 documentation](https://itch.io/docs/creators/html5).
