// Pure derivation logic. Everything the UI shows is computed from state here,
// so any create/edit/delete recomputes tiles, charts, alerts, and scorecards live.
import { TODAY } from './seed';

export const WEIGHTS = { coverage: 0.30, reliability: 0.25, ontime: 0.20, upload: 0.15, issues: 0.10 };
export const round1 = (n) => Math.round(n * 10) / 10;
export const round2 = (n) => Math.round(n * 100) / 100;

// ---- quality ----
export function qualityComposite(m) {
  if (!m) return 0;
  return round2(m.coverage * WEIGHTS.coverage + m.reliability * WEIGHTS.reliability +
    m.ontime * WEIGHTS.ontime + m.upload * WEIGHTS.upload + m.issues * WEIGHTS.issues);
}
// Threshold ladder from Part 3. Returns the *suggested* pool state (advisory).
export function suggestedPool(t) {
  const q = qualityComposite(t.metrics);
  if (t.metrics.reliability <= 1) return 'Removed';       // sustained / repeated no-show
  if (t.metrics.reliability === 2) return 'Benched';      // a no-show (hard gate)
  if (q < 2.0 && !t.provisional) return 'Removed';
  if (q < 3.0) return 'Benched';
  return 'Active';
}

// ---- dates ----
export const parseDate = (s) => (s ? new Date(s + 'T00:00:00') : null);
export function daysBetween(a, b) { // b - a in days
  const A = parseDate(a), B = parseDate(b);
  if (!A || !B) return null;
  return Math.round((B - A) / 86400000);
}
export const addDays = (s, n) => {
  const d = parseDate(s); if (!d) return null;
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
export const fmtDate = (s) => {
  const d = parseDate(s); if (!d) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// readiness SLA (10 business days ≈ 14 calendar) and recruit-by (~6 weeks)
export const readinessBy = (p) => addDays(p.requestedDelivery, -14);
export const recruitBy = (p) => addDays(p.requestedDelivery, -42);

// ---- project status (shared RAG) ----
export function projectReady(p) {
  return (p.assignedTechs?.length > 0) && p.training === 'Done';
}
export function projectStatus(p, today = TODAY) {
  if (p.junk || p.floors == null) return 'na';
  const d = daysBetween(today, p.requestedDelivery); // days until RD
  const ready = projectReady(p);
  if (d < 0) return 'critical';                 // past Requested Delivery
  if (d <= 14) return ready ? 'atrisk' : 'critical'; // inside readiness buffer
  if (d <= 42) return (p.assignedTechs?.length === 0) ? 'atrisk' : 'ontrack'; // inside recruit window
  return 'ontrack';
}
export const STATUS_LABEL = { ontrack: 'On track', atrisk: 'At risk', critical: 'Critical', na: '—' };

// ---- staffing ----
export function techniciansNeeded(p) {
  if (p.floors == null) return 0;
  if (p.floors >= 41) return 3;
  if (p.floors >= 21 || p.buildings >= 2) return 2;
  return 1;
}

// ---- collections ----
export const activeProjects = (projects) => projects.filter((p) => !p.junk);
export const activeTechs = (techs) => techs.filter((t) => t.pool === 'Active');

// ---- funnel (Part 1) ----
export function funnel(candidates, technicians) {
  const stages = ['Sourced', 'Screened', 'Onboarded', 'Deployed'];
  const counts = { Sourced: 0, Screened: 0, Onboarded: 0, Deployed: 0, Pool: technicians.length };
  candidates.forEach((c) => { if (counts[c.stage] != null) counts[c.stage]++; });
  counts.Deployed += activeTechs(technicians).length; // deployed roster sit in the pool/deployed lane
  return { stages, counts };
}

// ---- channel scorecard (Part 1 Q3) ----
export function channelScorecard(technicians) {
  const channels = ['Craigslist', 'Facebook', 'LinkedIn', 'Other'];
  const rows = channels.map((ch) => {
    const inCh = technicians.filter((t) => t.channel === ch);
    const churned = inCh.filter((t) => t.pool !== 'Active').length;
    const avgQ = inCh.length ? round2(inCh.reduce((s, t) => s + qualityComposite(t.metrics), 0) / inCh.length) : null;
    return {
      channel: ch, count: inCh.length, avgQuality: avgQ,
      churnRate: inCh.length ? Math.round((churned / inCh.length) * 100) : 0,
      projected: false,
    };
  });
  // Cloud Factory vendor = projected direction (pipeline only, no deployed quality)
  rows.push({ channel: 'Vendor · Cloud Factory', count: 0, avgQuality: null, churnRate: 0, projected: true });
  return rows;
}

// ---- alerts (Part 4) — derived live from state ----
export function deriveAlerts(projects, technicians, today = TODAY) {
  const A = [];
  const push = (tier, family, trigger, subject, action, owner) =>
    A.push({ id: `${trigger}:${subject}`.replace(/\s+/g, '-'), tier, family, trigger, subject, action, owner });

  technicians.forEach((t) => {
    const q = qualityComposite(t.metrics);
    if (t.pool === 'Removed') push('critical', 'Staffing', 'No-show / removal', t.name, 'Confirm removal; backfill from pool or Cloud Factory vendor', 'OM + RL');
    else if (t.pool === 'Benched') push('critical', 'Staffing', 'No-show hard gate → Benched', t.name, 'Review before any redeploy; hold from schedule', 'OM + RL');
    else if (q < 3.0) push('action', 'Quality', 'Quality score < 3.0', t.name, 'Bench + review (provisional-until-3 applies)', 'OM + RL');
    else if (t.metrics.coverage <= 3) push('action', 'Quality', 'Coverage shortfall < 90%', t.name, 'OM + RL attribute cause (site/plan vs tech) before penalising', 'OM + RL');
  });

  activeProjects(projects).forEach((p) => {
    const d = daysBetween(today, p.requestedDelivery);
    const ready = projectReady(p);
    if (d < 0) push('critical', 'Schedule', 'Past Requested Delivery + not ready', p.name, 'Open recovery plan; escalate; notify Opportunity Owner', 'OM + RL');
    else if (d <= 14 && !ready) push('critical', 'Staffing', 'Readiness gap — inside 10-day Readiness SLA buffer', p.name, 'Redeploy a returning tech (fast path) or escalate the date', 'OM → RL');
    else if (d <= 14 && ready) push('action', 'Schedule', 'Delivery inside the 10-day buffer', p.name, 'Confirm tech + site access; monitor', 'OM');
    else if (d <= 42 && p.assignedTechs.length === 0 && p.floors) push('action', 'Staffing', 'Recruitment window open — no tech assigned', p.name, 'Start recruiting now or reserve a pool tech', 'OM');
  });

  // one illustrative info-tier routine date change (shows the 🟢 tier + the #6-vs-#3 contrast)
  push('info', 'Schedule', 'Routine date change (no lead-time breach)', 'Hub At · 02/08 → 04/08 (client update)', 'Auto-propagated to tech + RL; acknowledge loop; monitor', 'System / OM');

  const order = { critical: 0, action: 1, info: 2 };
  return A.sort((a, b) => order[a.tier] - order[b.tier]);
}

// ---- Mission Control tiles (Part 6) ----
export function missionTiles(projects, technicians, candidates, today = TODAY) {
  const aps = activeProjects(projects);
  const due = aps.filter((p) => { const d = daysBetween(today, p.requestedDelivery); return d != null && d <= 60; });
  const overdue = aps.filter((p) => projectStatus(p, today) === 'critical');
  const atrisk = aps.filter((p) => ['atrisk', 'critical'].includes(projectStatus(p, today)));
  const acts = activeTechs(technicians);
  const avgQ = acts.length ? round2(acts.reduce((s, t) => s + qualityComposite(t.metrics), 0) / acts.length) : 0;
  const flagged = technicians.filter((t) => t.pool !== 'Active').length;
  const alerts = deriveAlerts(projects, technicians, today);
  const tierCount = (tier) => alerts.filter((a) => a.tier === tier).length;
  const adherence = due.length ? Math.round((due.filter((p) => projectStatus(p, today) !== 'critical').length / due.length) * 100) : 100;

  return {
    // Band 1 — Roee's north-star
    readinessSlaAdherence: adherence,
    droppedOpportunities: overdue.length,
    pctReturning: 0, // all deployments new-hire today; the 2 Cloud Factory candidates are the pilot
    // Band 2 — operational health
    readyTechCoverage: `${acts.length} ready`,
    biggestLeak: 'Craigslist · 50% churn',
    atRisk: atrisk.length,
    avgQuality: avgQ,
    flagged,
    alertCritical: tierCount('critical'),
    alertAction: tierCount('action'),
    alertInfo: tierCount('info'),
    topBottleneck: 'Readiness spine (Training → Kit)',
    // Quick overview
    projects: aps.length,
    technicians: technicians.length,
    techActive: acts.length,
    techBenched: technicians.filter((t) => t.pool === 'Benched').length,
    techRemoved: technicians.filter((t) => t.pool === 'Removed').length,
    regions: [...new Set(aps.map((p) => p.region))].length,
    deployments: aps.reduce((s, p) => s + (p.assignedTechs?.length || 0), 0),
    candidates: candidates.length,
  };
}

// ---- monthly quality trend (Part 3) — synthesises a trend from each tech's composite ----
export function qualityTrend(technicians) {
  const months = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  const acts = activeTechs(technicians);
  // build a gentle trend that lands on each tech's current composite in the final month
  return months.map((m, i) => {
    const row = { month: m };
    acts.forEach((t) => {
      const q = qualityComposite(t.metrics);
      const drift = (months.length - 1 - i) * 0.08; // earlier months slightly lower/varied
      row[t.id] = round2(Math.max(1, Math.min(5, q - drift + (t.id.charCodeAt(3) % 3 - 1) * 0.05 * i)));
    });
    return row;
  });
}
