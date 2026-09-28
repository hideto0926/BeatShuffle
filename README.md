# BeatShuffle — Product Site

Static product page for **BeatShuffle** (iOS). No build step. The hero is a three.js
scene (loaded from jsDelivr via an import map); if WebGL is unavailable the page falls
back to the CSS gradient background.

## Files
- `index.html` — product/landing page (EN/JA, auto-detected, toggle saved as `bs-lang`)
- `privacy.html` — privacy policy (EN/JA)
- `assets/style.css` — page styles
- `assets/site.js` — language toggle, scroll reveals, theme-color swatches, phone tilt
- `assets/scene.js` — three.js hero: 3D shuffle-arrow ribbons, records, particles, beat pulse
- `assets/shots/` — app screenshots per skin/language (`{skin}-{ja|en}-{screen}.jpg`)
- `assets/symbol.png`, `assets/wordmark.png`, `assets/icon.png`, `assets/og.png` — brand assets
- `.nojekyll` — serve files as-is on GitHub Pages

## Preview locally
```bash
python3 -m http.server 8000   # then open http://localhost:8000
```
(Opening index.html directly via file:// won't load the ES module scene.)

## Deploy (GitHub Pages)
Copy the **contents of this folder** to the root of the `BeatShuffle` repo
(published at https://hideto0926.github.io/BeatShuffle/), commit & push.

- Home: https://hideto0926.github.io/BeatShuffle/
- Privacy: https://hideto0926.github.io/BeatShuffle/privacy.html
