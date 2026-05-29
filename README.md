# FAQ viewer — IAG sandbox

A read-only React app that fetches the FAQ prototype corpus from the Contentful sandbox via the Delivery API and lets you filter by OpCo, hub, topic, and search. Built to validate the `applicableOpcos` filter visually before wiring the RAG pipeline.

Visual language follows the Avios **Alto** design system: Poppins body, the deep-blue (`#011dac`) accent, off-white background, white cards with radius-12. The Bw Mitga display font is licensed so we fall back to Poppins for headings — close enough for a sandbox tool.

## What it does

- **Top nav: OpCo pills** (All / BAEC / AerClub / Iberia) — the headline filter
- **Left sidebar**: hubs, expanding to topics, with live counts per the active OpCo filter
- **Main panel**: FAQ cards. Each shows the question, **internal name (copy-on-click)**, applicable OpCo badges, hub › topic breadcrumb, expandable answer (markdown rendered), question variants, search summary, last-reviewed date, RAG-included flag, and "Edit in Contentful ↗" deep-link
- **Search**: filters by question text or FAQ internalName
- **Language toggle**: flip between `en-GB` and `es-ES` content per FAQ
- **Debug view**: surfaces only FAQs where `applicableOpcos` is missing/empty/invalid
- **URL state**: every filter is in the query string, so views are deep-linkable

## Local development

### Prereqs

- Node 18+
- A Contentful **Delivery API token** (read-only) for the sandbox space. Create one at:
  `https://app.contentful.com/spaces/<space-id>/api/keys`

### Install + run

```bash
cp .env.example .env.local
# Fill in your Contentful space ID + delivery token in .env.local
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

### Build for production

```bash
npm run build
# Outputs to dist/
npm run preview  # local preview of the prod build
```

## Deploy to Netlify

### Step 1 — push to GitHub

```bash
git init
git add .
git commit -m "Initial FAQ viewer"
git remote add origin https://github.com/<you>/iag-faq-viewer.git
git push -u origin main
```

### Step 2 — Netlify site

1. Sign in to Netlify, click **Add new site → Import an existing project**
2. Connect your GitHub repo
3. Set build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: 18 or higher (Netlify usually auto-detects)
4. Add environment variables (Site configuration → Environment variables):
   - `VITE_CONTENTFUL_SPACE_ID` — same value as your `.env.local`
   - `VITE_CONTENTFUL_DELIVERY_TOKEN` — same value as your `.env.local`
   - `VITE_CONTENTFUL_ENVIRONMENT` — `master` (or your sandbox env name)
5. Deploy. Subsequent pushes to `main` auto-deploy.

### A note on the delivery token

The Contentful Delivery API token is **read-only** and scoped to a single space+environment. It's safe to bake into a client-side bundle for an internal sandbox tool. If you ever need to lock it down further (Netlify Edge Function proxy, basic auth, etc.) we can layer that on later.

## Updating content

When you edit a FAQ in Contentful — change the `applicableOpcos`, fix a question, retranslate Spanish — just refresh the viewer. It fetches fresh from CDA on every page load.

## Project layout

```
faq-viewer/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js     ← Alto design tokens
├── tsconfig*.json
├── .env.example
└── src/
    ├── main.tsx           ← entry
    ├── App.tsx            ← layout + state wiring
    ├── index.css          ← tailwind + markdown styles
    ├── types.ts           ← FAQ/Topic/Hub TS types
    ├── contentful.ts      ← CDA fetch + normalisation
    ├── useFilters.ts      ← filter state ↔ URL sync
    └── components/
        ├── TopNav.tsx
        ├── Sidebar.tsx
        └── FaqCard.tsx
```

## Known constraints

- Single Contentful environment per build (env var). If you want a runtime env switcher, easy enough to add.
- Marked is used for markdown rendering — minimal config, no HTML sanitisation. Fine for sandbox content authored by your team; not safe for untrusted markdown.
- No pagination — the corpus is ~164 entries, well under the 1000-item CDA limit. If it grows past ~800 we'll need to paginate the `fetchAll` helper.
- Search is client-side substring (case-insensitive). Good enough for a few hundred entries; if it grows, swap in a fuzzy matcher.
