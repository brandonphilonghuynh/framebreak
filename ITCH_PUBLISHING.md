# Publish FRAMEBREAK — Neon Circuit 1.0 on itch.io

The prepared `framebreak-itch.zip` is the self-contained browser upload. No publishing or account access has been performed.

## Rebuild the upload after any change

From the project folder:

```sh
npm run package
npm run preview
```

The first command runs all tests, typechecks, builds and creates a fresh ZIP. The packager uses only Node; no Python or system ZIP utility is required. It overwrites the previous archive so stale hashed assets are never retained. The second command serves the exact production build locally (normally http://127.0.0.1:4173).

The ZIP root contains `index.html`, `assets/` and `THIRD_PARTY_LICENSES.txt`, with no enclosing `dist/` directory. Do not upload source files or node_modules.

## Manual upload

1. Sign in to itch.io yourself and create a project named **FRAMEBREAK — Neon Circuit**.
2. Choose **HTML Game** as the project kind.
3. Upload `framebreak-itch.zip` as the browser-playable file.
4. Choose **Click to launch in fullscreen**, or embed around 1240 × 1100 with scrollbars and the fullscreen button enabled. The interface can scroll on shorter desktop displays.
5. Keep the page in draft while previewing. Check all three roster choices, keyboard input, help, movement, signatures, audio toggle, a completed match and rematch. Click inside the game first if the iframe does not have keyboard focus.
6. Add a description, screenshots, tags and your chosen visibility. Leave **Mobile Friendly** unchecked: this release targets desktop. Publish manually when satisfied.

## Suggested page description

> Two minds. One moment. FRAMEBREAK is a tactical fighting game where you and your rival choose in secret, then clash simultaneously. Pick one of three fighters, own the distance, and punish the pattern. Nine actions. Three CPU levels. One neon rooftop.

Controls: click action cards or use 1–7. Q/E move in/out. H opens the field manual. R rematches. Sound is optional and starts off.

## Troubleshooting

- Blank screen: verify `index.html` is at the ZIP root and upload the complete archive.
- Missing assets: preserve filename case and folder structure. Vite already generates relative paths.
- No audio: click **Sound off** in the game header to enable it. Audio needs a user gesture.
- Controls below the fold: enable scrolling or launch fullscreen.
- Old version: upload a newly generated ZIP and refresh the page after itch.io processes it.

The game needs no CDN, server, API key or internet connection after its files load. Browser storage is not required. Hosted behavior still needs the manual preview above.

Reference: [itch.io’s official HTML5 upload documentation](https://itch.io/docs/creators/html5), checked September 23, 2026.
