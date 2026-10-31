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

## Deploy to Cloudflare Pages

1. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages → Connect to Git** and pick this repo.
2. Build settings: framework preset **Vite** (or none), build command `npm run build`, output directory `dist`.
3. Under **Environment variables**, set `NODE_VERSION` to `22`.
4. After the first deploy, open the project's **Custom domains** tab and add `gipfel.owennicholson.com`. If owennicholson.com's DNS is on Cloudflare, the record is created for you; otherwise add the CNAME it shows at your DNS provider.
5. Every branch gets its own preview URL, handy for testing changes on your phone.

Cloudflare Pages serves `index.html` for unknown paths by default, so the client-side routes work without extra config.

## Install on your phone

Open the site in Safari (iOS) or Chrome (Android) and choose **Add to Home Screen**. It then runs full screen and works offline.
