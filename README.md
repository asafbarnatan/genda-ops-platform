# Genda Ops — Buildots Operations Manager platform (mockup)

An interactive mockup of the **ideal Jira workspace** for the Genda beacon-installation
operation, built for the Buildots Operations Manager home assignment. It renders a full
operating system across six areas, driven by a strategy layer and a data layer.

**Live, interactive:** responsive charts and **create / edit / delete on every entity**
(projects, technicians, candidates, scores). Edits persist in the browser and recompute
tiles, alerts, and scorecards live. A **Reset demo data** button restores the seed.

## Screens
- **Mission Control** — daily OM view + a separate Manager view (persona toggle)
- **Pipeline** — recruitment Kanban, funnel, channel-quality scorecard
- **Schedule** — portfolio timeline + table + 24-step process drawer
- **Quality** — monthly trend + a live-recompute technician scorecard
- **Alerts** — tiered trigger → action board, derived live from the data
- **Process** — the 24-step workflow as an aggregate bottleneck lens

## Data
- `src/data/seed.js` — 14 provided Buildots projects (untouched) + our fictive roster/candidates
- `src/data/adapter.js` — a swappable `dataAdapter`: `localStorage` today, Supabase-ready
- A global 🟦 Provided / 🟧 Fictive legend keeps source provenance visible

## Run
```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

Stack: Vite + React + Recharts. Static hosting (Vercel). Brand extracted into `DESIGN.md`.
