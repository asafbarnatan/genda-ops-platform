import { useState } from 'react';

// Operating-logic pane shown at the top of every screen.
// It maps the screen to its assignment part and states the core operational
// thinking in one line, with a one-click "reasoning" expander for the depth.
// Purpose: the platform must read as strategy made visible, not a UI demo —
// every screen leads with the logic, the answer to the brief's question.
const LOGIC = {
  mission: {
    part: 'Part 6', title: 'Dashboard — your view & your manager\'s view',
    q: 'The one screen you open every morning, a separate summary for your manager, and what is different between them.',
    thesis: 'Two dashboards, one per persona, sharing one north-star and separated by altitude. The OM view acts today (health tiles + an action cockpit); the manager view stays at rollups and trajectory — no task-level noise.',
    points: [
      'North-star on both views — on-time delivery to the client (Roee\'s stated #1) — so the OM and the manager are provably aligned.',
      'The difference is altitude, not different data: the manager view is the OM view zoomed out to exceptions.',
      'Goals no honest log can measure (e.g. "unified language") are deliberately kept off the scoreboard and answered by the design itself.',
    ],
  },
  schedule: {
    part: 'Part 2', title: 'Project schedule & date management',
    q: 'A portfolio scheduling view, the fields you need, and how you flag date changes, show their cause, and surface risk at a glance.',
    thesis: 'Manage change, not a static plan. Timeline primary + a linked table; every slip is made visible, attributed to a cause, and auto-converted into risk by re-running the Readiness SLA clock.',
    points: [
      'Acceleration-as-risk: a date pulled earlier silently compresses the runway — flagged critical, not "good news."',
      'Volatility: a project whose date moved many times is unstable regardless of where it sits now.',
      'Risk lives at schedule x process: 6 weeks out but still at Contract is the trouble neither view reveals alone.',
    ],
  },
  pipeline: {
    part: 'Part 1', title: 'Technician recruitment pipeline',
    q: 'How you track candidates Sourced to Deployed, what you show per candidate and per project, and how you compare channel quality.',
    thesis: 'Stages are gates, not labels — each candidate is tracked on position, progress, velocity, and outcome (attributed to its channel). Two inflows reach Deployed: the new-hire funnel (~6 weeks) and a returning-tech redeploy (days).',
    points: [
      'Channel quality is cost-per-ready-tech, not cost-per-lead: Craigslist is cheap per lead, expensive per ready tech (~50% churn).',
      'That earns the move toward vendors (the Cloud Factory pilot) — gated on standardizing the process first (Part 5).',
      'The pipeline is intentionally thin: the operation is staffed; new inflow is the vendor pilot, not mass sourcing.',
    ],
  },
  quality: {
    part: 'Part 3', title: 'Technician quality tracking',
    q: 'The 3 to 5 metrics you use for reliability over time, how you display them, and the threshold that triggers a review or removal.',
    thesis: 'Five metrics roll into one weighted composite (coverage 30 / reliability 25 / on-time 20 / upload 15 / issues 10), so a strong coverage score cannot offset a no-show. Hard gates sit above the average.',
    points: [
      'Attribute before you penalise: a coverage shortfall may be site-access or a wrong plan, not the technician.',
      'Provisional until 3+ installs — one bad first day should not end someone.',
      'Removals roll up into channel quality: a channel producing many removals is, by definition, low quality.',
    ],
  },
  alerts: {
    part: 'Part 4', title: 'Alerts & decision logic',
    q: 'What the system flags automatically, at least five trigger-to-action rules, and how you prioritise urgent vs informational.',
    thesis: 'A good alert system is judged by what it does not interrupt you for. Three tiers by time-to-consequence x client-impact; the tie-break: anything threatening the Readiness SLA or client data outranks internal efficiency.',
    points: [
      'The system watches all 12 signals; the manager\'s attention is curated to the six that matter.',
      'Same event, different tier: a routine date change is Informational, the same change breaching lead time is Critical.',
      'Signature call — acceleration-as-risk: watching for dates pulled earlier is the tell of a real OM.',
    ],
  },
  process: {
    part: 'Part 5', title: 'Process management & optimisation',
    q: 'How you map the process, find bottlenecks, implement improvements, keep the workflow documented, and the tool you would use.',
    thesis: 'The 24-step template rendered as a live aggregate lens: where projects clump is the bottleneck. Each fix separates the lever we control now (process) from where automation could help later — honest, not hype.',
    points: [
      'The sequence is the point: standardize, then cluster by geography for reuse, then automate, then unlock the vendor scale-up.',
      'Reuse is a geography problem, not a software one — "% returning" is naturally higher in dense regions.',
      'Tool: Jira (one source of truth) + Confluence (SOPs) + Claude Code as the intelligence layer we grow into.',
    ],
  },
};

export default function LogicPane({ part }) {
  const d = LOGIC[part];
  const [open, setOpen] = useState(false);
  if (!d) return null;
  return (
    <div className="logic-pane">
      <div className="lp-head">
        <span className="lp-tag">{d.part}</span>
        <span className="lp-title">{d.title}</span>
        <button className="lp-toggle" onClick={() => setOpen((s) => !s)}>{open ? '– hide reasoning' : '+ the reasoning'}</button>
      </div>
      <div className="lp-q"><span className="lp-qk">The brief asks</span>{d.q}</div>
      <div className="lp-thesis">{d.thesis}</div>
      {open && (
        <ul className="lp-points">
          {d.points.map((p, i) => <li key={i}>{p}</li>)}
        </ul>
      )}
    </div>
  );
}
