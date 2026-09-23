# Upload FRAMEBREAK to itch.io

The prepared `framebreak-itch.zip` is the browser upload. Nothing has been published or uploaded for you.

## Rebuild after changes

From the project folder:

```sh
npm run build
npm run preview
```

Play the local production preview, then stop it with Ctrl+C. On macOS, create a fresh archive using:

```sh
cd dist
zip -r ../framebreak-itch.zip .
cd ..
```

If updating an existing archive after filenames changed, remove only the old `framebreak-itch.zip` first to avoid retaining stale assets. The ZIP root must contain `index.html`, `assets/`, and `THIRD_PARTY_LICENSES.txt`, without an enclosing `dist/` folder. Never upload node_modules or the source repository.

## Manual publishing

1. Sign in to itch.io yourself and create a new project.
2. Name it FRAMEBREAK and choose **HTML Game** as the project kind.
3. Upload `framebreak-itch.zip` as the browser-playable file.
4. Choose **Click to launch in fullscreen**, or embed at approximately 1200 × 1100 with scrollbars and the fullscreen button enabled. The page can scroll on shorter desktop screens.
5. Keep the page in draft while previewing. Check start, help, all six actions, a complete match and rematch. Do not mark Mobile Friendly; this prototype targets desktop.
6. Add your description, screenshots and desired visibility, then publish manually when satisfied.

Relative asset paths are configured in Vite. No external servers or API keys are needed. If a hosted build is blank, confirm the ZIP root and case-sensitive filenames, then inspect the browser console.

Reference: [itch.io official HTML5 upload documentation](https://itch.io/docs/creators/html5), checked September 23, 2026.
