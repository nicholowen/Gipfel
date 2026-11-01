# Gipfel

Learn German words step by step, WaniKani style: small levels that unlock in order, named stages, typed answers, and grammatical gender drilled from day one. An installable, offline-first web app with no server; progress lives in the browser's IndexedDB.

## Run it

```sh
npm install
npm run dev            # local dev server
npm test               # Vitest: domain logic, content, data layer
npm run validate-content
npm run build          # typecheck + production build into dist/
```

## How it's organised

| Folder | What lives there |
| --- | --- |
| `content/` | Curriculum JSON: `curriculum.json` (levels) and one file per level in `levels/` |
| `src/domain/` | Pure logic, no React or Dexie: scheduler, answer checker, unlocking, review session, dashboard summary |
| `src/content/` | Loads and validates the curriculum |
| `src/data/` | Dexie database and the transactions that change progress |
| `src/features/` | Screens: dashboard, lessons, reviews, and the shared quiz |
| `src/ui/` | Answer input, item info panel, speech |

Item ids in content (`n-hund`, `v-gehen`) are permanent: progress is keyed on them.

## Deploy to Cloudflare

The site deploys as a Cloudflare Worker with static assets. `wrangler.jsonc` points at `dist/` and sends unknown paths to `index.html`, so routes like `/lessons` work on reload.

1. In the Cloudflare dashboard, go to **Workers & Pages → Create** and import this repo from GitHub.
2. Build command `npm run build`, deploy command `npx wrangler deploy` (the defaults).
3. If the build complains about Node, set a build variable `NODE_VERSION` to `22`.
4. After the first deploy, open the Worker's **Settings → Domains & Routes** and add the custom domain `gipfel.owennicholson.com`. This needs owennicholson.com's DNS to be on Cloudflare.
5. Every push to `main` redeploys automatically.

## Install on your phone

Open the site in Safari (iOS) or Chrome (Android) and choose **Add to Home Screen**. It then runs full screen and works offline.
