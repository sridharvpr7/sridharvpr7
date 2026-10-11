# README Editing Guide

Your profile `README.md` is **generated**. Do not edit it by hand; edit the JSON files in `data/` and regenerate. (GitHub only shows the committed `README.md`; it never reads the JSON by itself.)

## The workflow

```bash
npm run validate    # 1. check your JSON (helpful error messages)
npm run generate    # 2. rebuild README.md from the JSON
npm run check       # 3. confirm README.md matches the JSON
```
Then review `README.md` (preview in VS Code with `Ctrl+Shift+V`) and commit and push.

No `npm install` is needed: the scripts use only Node.js (version 16 or newer). Check with `node -v`.

## Which file controls what

| File | Controls |
|---|---|
| `profile.json` | Name, headline, short tagline, degree, institution, batch, banner paths |
| `about.json` | Intro paragraph, learning list, interests, optional extra highlights |
| `skills-ece.json` | ECE topics (name, category, icon, description, status, related project) |
| `skills-web.json` | Web technologies grouped by category |
| `projects.json` | Project cards, shown in the order listed |
| `education.json` | Education entries |
| `certificates.json` | Certificates (shown only if `verified: true` and a `url` is given) |
| `social-links.json` | GitHub, LinkedIn, email, portfolio, other links (empty = hidden) |
| `settings.json` | Section on/off switches, layout, statistics cards |

## Common edits

- **Change the intro:** edit `intro` in `data/about.json`.
- **Hide a skill without deleting it:** set `"visible": false`.
- **Hide a whole section:** set the matching `show...` switch to `false` in `settings.json`.
- **Turn off one statistics card:** set `statsCards.stats`, `.languages` or `.streak` to `false`.
- **Add LinkedIn / email / portfolio:** fill the value in `social-links.json`. Empty values never appear.
- **Add a certificate:** only a real one, with its credential link and `"verified": true`.

## Valid values

- Skill `status`: `Exploring`, `Learning`, `Practicing`, `Used in a project`
- Project `category`: `ece`, `web`, `other`
- JSON rules: double quotes only, no trailing commas. Keys starting with `_note` are just comments for you.

## If something fails

The validator names the file and field, for example `data/social-links.json: "email" must be empty or a valid email address`. Fix that line and run `npm run validate` again.
