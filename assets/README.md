# assets/

| File | Purpose |
|---|---|
| `github-banner.svg` | Animated banner (1200 × 300). Used by default. |
| `github-banner-static.svg` | Identical design with no animation. Use it if you prefer a still image. |

Both files are self-contained: no JavaScript, no external fonts or images. The banner has its own dark background, so it looks the same in GitHub Light and Dark themes.

**Switch to the static banner:** in `data/settings.json` set `"useStaticBanner": true`, then run `npm run generate`.

**Add project screenshots:** drop real screenshots here (for example `assets/elders-veil.png`) and set `"image": "assets/elders-veil.png"` on the project in `data/projects.json`. Leave `image` empty if you have none. Do not use mock-ups of things that don't exist.

**Optional theme-specific banners:** add `bannerDark` and `bannerLight` paths in `data/profile.json` (both required). The README then uses a `<picture>` element so GitHub picks the right one.

Animation notes: GitHub may limit SVG animation in some contexts. Nothing important depends on it; the static look is complete on its own.
