# Living Dose

Healthy food, personal nutrition and care from experts, in one app.
Healthy living made affordable.

## Requirements

- Node.js 20.19+ or 22.12+ (check with `node -v`)
- npm 10+

## Getting started

```bash
npm install
cp .env.example .env.local   # then add your Supabase keys
npm run dev                  # opens http://localhost:5173
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the local dev server with hot reload |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Check the code with ESLint |

## Project structure

```
src/
  main.jsx            App entry: providers (React Query, i18n) and global styles
  App.jsx             Routes (pages load on demand)
  styles/
    tokens.css        Design tokens: colours, type, spacing, radius, motion
    global.css        Reset and base styles
  layouts/AppShell    Top nav on desktop, bottom tab bar on mobile
  components/
    brand/            Logo and mark
    ui/               Button, PageHeader, and future shared components
  pages/              One file per screen
  config/             Navigation and other app-wide settings
  i18n/               Translations (every UI string lives in locales/*.json)
  lib/                Supabase client, React Query client
```

## Conventions

- Import from `@/…` instead of long relative paths (`@` = `src`).
- Brand colours are fills; text on them uses `--ink`. Coloured text uses the `-deep` shades.
- Never hard-code UI text in components; add it to `src/i18n/locales/en.json`.
- Money stays out of the way: no prices or payment prompts until the user chooses to buy.
