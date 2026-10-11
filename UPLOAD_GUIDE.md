# Upload Guide

Pick **Option A** (command line) or **Option B** (browser only).

## Option A: Git command line

Inside the unzipped project folder:

```bash
git init
git add .
git commit -m "Add cinematic GitHub profile"
git branch -M main
git remote add origin https://github.com/sridharvpr7/sridharvpr7.git
git push -u origin main
```
GitHub may ask you to sign in (use a Personal Access Token if prompted for a password).

## Option B: Upload in the browser

1. Open `https://github.com/sridharvpr7/sridharvpr7`.
2. Click **Add file → Upload files**.
3. Drag in **everything inside** the unzipped folder (not the folder itself): `README.md`, `data/`, `assets/`, `scripts/`, `package.json`, the guides, etc.
4. Click **Commit changes**.

## Verify

Visit `https://github.com/sridharvpr7`. Your README appears above your repositories. If the banner is missing, check that `assets/github-banner.svg` was uploaded with the same folder structure.

## Updating later

1. Edit JSON in `data/`.
2. `npm run validate` then `npm run generate`.
3. `git add . && git commit -m "Update profile" && git push`

## Optional

The four guide files don't appear on your profile page, but they will be visible inside the repository. You may delete them from the repo if you prefer a tidier repository; the generator doesn't need them.

## Troubleshooting

| Problem | Fix |
|---|---|
| Profile doesn't show the README | Repo must be public, named exactly `sridharvpr7`, with `README.md` in the root |
| Banner shows a broken image | `assets/` folder missing in the repo, or file name changed |
| Statistics cards are blank | Third-party service temporarily down; wait or turn that card off in `settings.json` |
| `npm run validate` fails | Read the message; it names the file and field |
