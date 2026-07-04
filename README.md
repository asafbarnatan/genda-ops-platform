# Genda Ops — Buildots Operations Manager platform

**▶ Live demo: https://genda-ops-platform.vercel.app**

An interactive operating system for the Genda beacon-installation operation, built for the
Buildots Operations Manager take-home. It renders a full ops platform across a dashboard and
six functional areas, driven by a strategy layer and a swappable data layer. Everything is
live: **create / edit / delete on every entity**, and edits recompute the tiles, alerts,
timeline, and scorecards instantly. A **Reset demo data** button restores the seed.

Each screen carries an **Operating logic** button — a click-to-open reference with the
reasoning, rules, and thresholds behind that part, ready for questions.

## Worth a look
- **Zoomable, pannable schedule Gantt** — every project's 24 process steps on a real time
  axis. One SLA template per project: recruit-by (delivery − 6 weeks) → Ready-by (delivery −
  10 business days) → First Installation on the delivery date. A stock-chart range menu
  (1W…All) scales every square and re-centres on today; a step still open past its planned
  date turns red = behind.
- **Two linked statuses, one source of truth** — a per-project status (Critical / At risk /
  On track / Planning) and a per-stage status (Done / In progress / Behind / Skipped /
  Upcoming). Set a stage from the drawer or a Gantt square and it recolours the timeline and
  moves the project on the Process board at the same time.
- **Live everything** — responsive charts, an Alerts triage board with snooze, a technician
  scorecard that recomputes the weighted composite + threshold ladder as you type, and quality
  danger-zone bands under 3.0 / 2.0.

## Screens
- **Mission Control** — daily OM view + a separate Manager view (persona toggle), one north-star
- **Project Schedule** — the zoomable Gantt + a linked editable table + a 24-step process drawer
- **Recruitment Pipeline** — Kanban, funnel, channel-quality scorecard, per-project staffing demand
- **Technician Quality** — monthly trend with danger zones + a live-recompute scorecard
- **Alerts & Decision Logic** — a triage board (Critical / At risk / Monitor / Snoozed), derived live
- **Process & Optimisation** — the 24-step / 7-phase workflow as a live bottleneck diagnostic

## Data — provided vs modeled
- `src/data/seed.js` — the **13 provided Buildots projects** (delivery / end dates untouched; the
  export's 14th row was a `qa` test artifact, correctly excluded) plus a **modeled operations
  layer** (technician roster, vendor candidates, per-project progress, scores) that makes the
  system demonstrable end to end.
- The columns left empty in the provided export (candidate score, training, recruitment status)
  are filled by the modeled layer and labeled fictive; every row carries a `provenance` tag.
- `src/data/adapter.js` — a swappable `dataAdapter`: `localStorage` today, Supabase-ready.

## Run
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build
```

Stack: Vite + React + Recharts, static-hosted on Vercel. Design tokens and brand notes in `DESIGN.md`.
