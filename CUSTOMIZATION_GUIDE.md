# Customization Guide

## Add a web project

Append an object to the `projects` array in `data/projects.json`:

```json
{
  "title": "My Next App",
  "description": "One honest sentence about what it does.",
  "category": "web",
  "stack": ["HTML", "CSS", "JavaScript"],
  "repo": "https://github.com/sridharvpr7/my-next-app",
  "demo": "",
  "status": "In progress",
  "image": "",
  "visible": true
}
```

## Add an ECE project

Same shape, with `"category": "ece"`, tools in `stack`, and an optional real image:

```json
{
  "title": "4-bit ALU in Verilog",
  "description": "What the circuit does and how it was simulated.",
  "category": "ece",
  "stack": ["Verilog", "Icarus Verilog", "GTKWave"],
  "repo": "https://github.com/sridharvpr7/alu-4bit",
  "demo": "",
  "status": "Completed",
  "image": "assets/alu-waveform.png",
  "visible": true
}
```
More ready-to-copy samples live in `data/examples/projects.examples.json` (never read by the scripts).

Link an ECE skill to the project by putting the repo URL in that skill's `project` field.

## Rules for honest content

- No user counts, performance numbers or "production-ready" claims unless you can prove them.
- Use only real screenshots. Leave `image` empty otherwise.
- The starter ECE entries are *Exploring / Learning*. Remove or hide any that don't match you yet.

## Colors and banner

Palette: background `#0a0d14`, cyan `#00e5ff`, violet `#8b5cf6`. To change banner text, open `assets/github-banner.svg` and `assets/github-banner-static.svg` and edit the two `<text>` elements. Keep both files in sync.

## Statistics cards

The cards come from third-party services (`github-readme-stats.vercel.app` and `streak-stats.demolab.com`). They can be slow or temporarily down; those services are outside your control, and they only show real data from your public GitHub activity. Each card can be switched off in `settings.json`, and a plain "view live activity on GitHub" link is always shown under the cards as a fallback.

## About `defaultTheme`

`defaultTheme` in `settings.json` is only a note for your own reference. GitHub decides Light or Dark from each visitor's settings; a profile README cannot force it. The banner is dark by design and readable on both; statistics cards switch colors automatically.

## Test in both themes

1. Open your profile while signed in → click your avatar → **Settings → Appearance**.
2. Choose **Light default**, reload `https://github.com/sridharvpr7`, check text and cards.
3. Switch to **Dark default** and check again.
4. Optionally view it signed out in a private window.
