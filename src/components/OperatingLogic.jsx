import { useState } from 'react';
import { Modal } from './Modal.jsx';

// "Operating logic" — a click-to-open reference on each screen carrying the reasoning,
// rules, and thresholds we defined per part. Dense facts live in compact tables; only
// genuine judgment calls stay as prose. Plain language, ready for director questions.
const CONTENT = {
  pipeline: {
    part: 'Part 1', title: 'Recruitment Pipeline — operating logic',
    q: 'Track candidates Sourced to Deployed; data per candidate and per project; compare channel quality.',
    groups: [
      { h: 'How a candidate is tracked', items: [
        'Stages are gates, not labels: each candidate carries stage + progress-in-stage + velocity (days vs SLA) + outcome, attributed to its channel.',
        'Drop-off is tracked by channel — leakage is the raw material of channel quality.',
      ] },
      { h: 'Recruitment lead time — why we start 6 weeks out', table: {
        cols: ['Step', 'Time'],
        rows: [
          ['Sourced → Screened', '≤ 5 days'],
          ['Screened → Onboarded', '≤ 10 days'],
          ['Onboarding', '≤ 12 days'],
          ['= Sourced-to-Ready', '≈ 27 days'],
          ['+ readiness safety buffer', '10 business days'],
          ['⇒ start recruiting', '≈ 6 weeks before delivery'],
        ],
      }, note: 'So for each project: recruit-by = delivery − 6 weeks · ready-by = delivery − 10 business days (the Readiness SLA). Miss the recruit-by and the buffer is gone.' },
      { h: 'Technicians needed (per project)', table: {
        cols: ['Project size', 'Techs'],
        rows: [['≤ 20 floors & 1 building', '1'], ['21-40 floors or 2 buildings', '2'], ['41+ floors', '3']],
      }, note: '≈ 20 floors / technician-day, so each initial install ≈ 1 site day; portfolio ≈ 18 technician-slots. The rule is a default — the OM can Accept a gap when the crew is enough.' },
      { h: 'Channel quality → the vendor case', items: [
        'Judged on cost per ready technician, not per lead.',
        'Craigslist floods leads but churns ~50% (2 of 4): cheap per lead, expensive per ready tech.',
        'Recommendation: shift toward the vendor model (Cloud Factory) to scale across regions — gated on standardising the process first (Part 5).',
      ] },
    ],
  },
  schedule: {
    part: 'Part 2', title: 'Project Schedule — operating logic',
    q: 'Read every project against one template; flag date changes with cause; surface risk at a glance.',
    groups: [
      { h: 'The principle', items: [
        'Manage change, not a static plan: each slip is made visible, given a cause, and re-runs the Readiness SLA clock. At-risk floats to the top.',
      ] },
      { h: 'Reading the timeline — one template, 3 fixed milestones', table: {
        cols: ['Marker', 'When', 'Means'],
        rows: [
          ['Step 1 · recruit-by', 'delivery − 6 wks', 'start recruiting'],
          ['Ready-by (amber)', 'delivery − 10 biz days', 'prep done, tech ready (SLA)'],
          ['First Install ◆', 'Requested delivery', 'the client promise'],
        ],
      }, note: 'Colour is live — set a stage status anywhere (drawer, square, Process board) and it updates here. Red = past its planned date and still open.' },
      { h: 'Date changes — two signals', table: {
        cols: ['Signal', 'Rule', 'Response'],
        rows: [
          ['Acceleration', 'date pulled earlier', 'critical — runway compressed'],
          ['Volatility', 'moved ≥3 times', 'unstable wherever it sits'],
        ],
      }, note: 'Cause tags the slip (construction · client · site access · internal); tech + RL acknowledge, a decline auto-reassigns.' },
    ],
  },
  quality: {
    part: 'Part 3', title: 'Technician Quality — operating logic',
    q: 'The 3 to 5 metrics for reliability over time; how you display them; the threshold that triggers review or removal.',
    groups: [
      { h: 'Five metrics → one weighted composite (1-5)', table: {
        cols: ['', 'Coverage', 'Reliability', 'On-time', 'Upload', 'Issues', 'Composite'],
        rows: [
          ['Weight', '30%', '25%', '20%', '15%', '10%', ''],
          ['Example tech', '5', '4', '4', '5', '4', '4.45'],
        ],
      }, note: 'Composite = the weighted average of the five 1-5 scores (here 4.45). Weighted by consequence; a no-show is caught separately by a hard gate (below), never left to the average.' },
      { h: 'Threshold ladder', table: {
        cols: ['Trigger', 'Action'],
        rows: [['Any no-show (hard gate)', 'Benched'], ['Rolling composite < 3.0', 'Benched'], ['< 2.0 sustained · 2nd no-show · failed review', 'Removed'], ['Clean review', 'back to Active']],
      }, note: 'Provisional until ≥3 installs — one bad first day should not end someone.' },
      { h: 'The judgment call', items: [
        'Attribute before you penalise: a coverage shortfall < 90% may be site-access or a wrong plan, not the technician — attribute cause first.',
        'Removals roll up into channel quality.',
      ] },
    ],
  },
  alerts: {
    part: 'Part 4', title: 'Alerts & Decision Logic — operating logic',
    q: 'What the system flags automatically; at least five trigger-to-action rules; how you prioritise urgent vs informational.',
    groups: [
      { h: 'The framework', items: [
        'Judged by what it does NOT interrupt you for. Three tiers by time-to-consequence × client-impact — Critical (act now), At risk (this week), Monitor (awareness only). Same three tiers everywhere: the board, the Mission Control queue, and here.',
        'Tie-break: anything threatening the Readiness SLA or client data outranks internal efficiency.',
        'The system watches all 12 signals; attention is curated to the five below.',
      ] },
      { h: 'The 5 triggers → action', table: {
        cols: ['#', 'Tier', 'Trigger', 'Action'],
        rows: [
          ['1', '🔴', 'Readiness gap — inside the 10-day buffer, no Ready tech', 'redeploy a returning tech / escalate'],
          ['2', '🔴', 'Acceleration breaches lead time', 'recompute runway; cover or escalate'],
          ['3', '🔴', 'No-show / cancel at deploy', 'pool reassignment; auto-bench'],
          ['4', '🟠', 'Recruitment window opens, no tech', 'start recruiting / reserve a pool tech'],
          ['5', '🟠', 'Coverage shortfall < 90%', 'attribute cause before penalising'],
        ],
      } },
      { h: 'Routing', table: {
        cols: ['Tier', 'How it reaches you'],
        rows: [['🔴 Critical', 'Slack + email now; pins to the Critical column'], ['🟠 At risk', 'This-week queue + daily digest'], ['🟢 Monitor', 'digest only — nobody pinged']],
      } },
    ],
  },
  process: {
    part: 'Part 5', title: 'Process & Optimisation — operating logic',
    q: 'Map the process; find bottlenecks; implement improvements; keep it documented; the tool you would use.',
    groups: [
      { h: 'The tool — one source of truth', items: [
        'Jira runs the 24-step workflow (steps to statuses), the board, and native automation (date propagation + the Part 4 alerts).',
        'Confluence holds the SOPs — the documented, repeatable workflow.',
        'Claude Code MCP + Skills are the intelligence layer we grow into: natural-language ops, auto-summaries, a prep-technician Skill. Echoes Buildots\' own Salesforce to Jira move.',
      ] },
      { h: 'The map as a live diagnostic', items: [
        'The 24-step / 7-phase template as a live aggregate lens: where projects clump right now is the live bottleneck (data-driven).',
        'Two pathways: new-hire (full 24 steps, ~6-wk lead) vs returning (skips Training + PPE).',
      ] },
      { h: 'Improvement levers — process now vs automation later', table: {
        cols: ['Lever we control now', 'Where automation could help'],
        rows: [
          ['Parallelise the readiness gates + write a Confluence SOP', 'a prep-technician Skill fires them from one action'],
          ['Cluster work per region (one-vendor-per-region) so reuse is possible', 'the board surfaces same-region availability'],
          ['Unify on Jira + SOPs in Confluence', 'native Jira automation carries propagation + alerts'],
        ],
      }, note: 'Sequence: standardise → cluster for reuse → automate → unlock the vendor scale-up. Automation is framed honestly — real near-term wins vs a layer we grow into.' },
    ],
  },
  mission: {
    part: 'Part 6', title: 'Dashboard — operating logic',
    q: 'The one screen you open every morning; a separate summary for your manager; what is different between them.',
    groups: [
      { h: 'One concept, two dashboards', items: [
        'Two dashboards, one per persona, sharing one north-star and separated by altitude.',
        'North-star on both: on-time delivery to the client — the stated #1 success metric (100% SLA adherence, zero dropped opportunities).',
      ] },
      { h: 'Readiness SLA — the leading indicator', items: [
        'The customer date is the promise; the Readiness SLA (ready 10 business days early) is how we protect it.',
        'A readiness miss is the early warning of a customer-date miss — we act on it before the client ever feels it.',
      ] },
      { h: 'The difference', table: {
        cols: ['', 'OM (you)', 'Manager'],
        rows: [
          ['Question', 'what do I do today?', 'is it healthy and on track?'],
          ['Detail', 'every tile, drill to any project', 'totals + only what is off-track'],
          ['Action list', 'yes — the daily queue', 'no — never task-level'],
          ['How often', 'continuously, all day', 'a weekly check'],
        ],
      } },
      { h: 'A deliberate restraint', items: [
        'Unified language and cut-manual-admin are not tiles: no honest log can measure them, so the design itself (Jira + standardisation) delivers them.',
      ] },
    ],
  },
};

export default function OperatingLogic({ part }) {
  const d = CONTENT[part];
  const [open, setOpen] = useState(false);
  if (!d) return null;
  return (
    <>
      <button className="btn btn-sm oplogic-btn" onClick={() => setOpen(true)} title="The reasoning, rules, and thresholds behind this screen — ready for questions">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 6h11M9 12h11M9 18h11" strokeLinecap="round" />
          <circle cx="4.5" cy="6" r="1.3" fill="currentColor" stroke="none" />
          <circle cx="4.5" cy="12" r="1.3" fill="currentColor" stroke="none" />
          <circle cx="4.5" cy="18" r="1.3" fill="currentColor" stroke="none" />
        </svg>
        Operating logic
      </button>
      {open && (
        <Modal title={d.title} onClose={() => setOpen(false)} footer={<button className="btn-text" onClick={() => setOpen(false)}>Close</button>}>
          <div className="oplogic">
            <div className="oplogic-q"><span className="lp-tag">{d.part}</span><span>{d.q}</span></div>
            {d.groups.map((g, i) => (
              <div key={i} className="oplogic-group">
                <div className="oplogic-h">{g.h}</div>
                {g.table ? (
                  <div className="oplogic-tablewrap">
                    <table className="oplogic-table">
                      <thead><tr>{g.table.cols.map((c, ci) => <th key={ci}>{c}</th>)}</tr></thead>
                      <tbody>{g.table.rows.map((r, ri) => <tr key={ri}>{r.map((cell, ci) => <td key={ci}>{cell}</td>)}</tr>)}</tbody>
                    </table>
                  </div>
                ) : (
                  <ul>{g.items.map((it, j) => <li key={j}>{it}</li>)}</ul>
                )}
                {g.note && <div className="oplogic-note">{g.note}</div>}
              </div>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}
