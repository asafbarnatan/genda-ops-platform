# Genda Ops — Buildots Operations Manager platform (mockup)

**▶ Live demo: https://genda-ops-platform.vercel.app**

An interactive mockup of the **ideal Jira workspace** for the Genda beacon-installation
operation, built for the Buildots Operations Manager home assignment. It renders a full
operating system across six areas, driven by a strategy layer and a data layer.

**Live, interactive:** responsive charts and **create / edit / delete on every entity**
(projects, technicians, candidates, scores). Edits persist in the browser and recompute
tiles, alerts, and scorecards live. A **Reset demo data** button restores the seed.

Each screen carries an **Operating logic** button — a click-to-open reference with the
reasoning, rules, and thresholds behind that part (ready for questions).

## Screens
- **Mission Control** — daily OM view + a separate Manager view (persona toggle)
- **Recruitment Pipeline** — Kanban, funnel, channel-quality scorecard, per-project staffing demand
- **Project Schedule** — portfolio timeline + linked table + 24-step process drawer
- **Technician Quality** — monthly trend + a live-recompute technician scorecard
- **Alerts** — tiered trigger → action board, derived live from the data
- **Process** — the 24-step workflow as an aggregate bottleneck lens

## Data
- `src/data/seed.js` — 13 provided Buildots projects (untouched; the export's 14th row was a `qa` test artifact, excluded) + our fictive roster/candidates
- `src/data/adapter.js` — a swappable `dataAdapter`: `localStorage` today, Supabase-ready
- Every row carries a `provenance` tag (provided vs fictive); the provided-vs-fictive breakdown is walked through in the deck

## Run
```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

Stack: Vite + React + Recharts. Static hosting (Vercel). Brand extracted into `DESIGN.md`.
