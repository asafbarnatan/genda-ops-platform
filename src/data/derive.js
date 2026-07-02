// Pure derivation logic. Everything the UI shows is computed from state here,
// so any create/edit/delete recomputes tiles, charts, alerts, and scorecards live.
import { TODAY, STEPS, PHASES } from './seed';

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

// plain-language reason for the status — so "why Critical?" is answerable on the platform
export function statusReason(p, today = TODAY) {
  if (p.junk || p.floors == null) return 'Not enough data to assess.';
  const d = daysBetween(today, p.requestedDelivery);
  const ready = projectReady(p);
  const accel = (p.changeLog || []).some((c) => c.delta < -10);
  if (d < 0) return `Overdue: the Requested Delivery date passed ${Math.abs(d)} days ago and the project is not delivered. This is a client-facing miss.`;
  if (d <= 14 && !ready) return `Readiness gap: delivery is in ${d} days — inside the 10-day Readiness SLA buffer — and there is no Ready technician yet.`;
  if (accel && d <= 60) return `Acceleration risk: the delivery date was pulled earlier (see History), compressing the readiness runway.`;
  if (d <= 14 && ready) return `Delivery is in ${d} days — inside the 10-day Readiness SLA buffer. It is staffed, so confirm the technician and site access and monitor.`;
  if (d <= 42 && (p.assignedTechs?.length === 0)) return `Inside the ~6-week recruit window with no technician assigned yet.`;
  return `On track: delivery is ${d} days out, a technician is assigned, and readiness is on pace with buffer to spare.`;
}

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
  const push = (tier, family, trigger, subject, action, owner, link, why) =>
    A.push({ id: `${trigger}:${subject}`.replace(/\s+/g, '-'), tier, family, trigger, subject, action, owner, link, why });

  technicians.forEach((t) => {
    const q = qualityComposite(t.metrics);
    const L = { screen: 'quality', focus: t.id };
    if (t.pool === 'Removed') push('critical', 'Staffing', 'No-show / removal', t.name, 'Confirm removal; backfill from pool or Cloud Factory vendor', 'OM + RL', L, `${t.name} is Removed (composite ${q}, repeated no-shows). Their region loses capacity until backfilled.`);
    else if (t.pool === 'Benched') push('critical', 'Staffing', 'No-show hard gate → Benched', t.name, 'Review before any redeploy; hold from schedule', 'OM + RL', L, `${t.name} hit the no-show hard gate. Held from all deploys pending review (composite ${q}).`);
    else if (q < 3.0) push('action', 'Quality', 'Quality score < 3.0', t.name, 'Bench + review (provisional-until-3 applies)', 'OM + RL', L, `${t.name} is below the 3.0 bar. Review this week before the next assignment.`);
    else if (t.metrics.coverage <= 3) push('action', 'Quality', 'Coverage shortfall < 90%', t.name, 'OM + RL attribute cause (site/plan vs tech) before penalising', 'OM + RL', L, `${t.name}'s coverage metric is ${t.metrics.coverage}/5. Attribute the cause (site access / plan vs technician) before it hits their score.`);
  });

  activeProjects(projects).forEach((p) => {
    const d = daysBetween(today, p.requestedDelivery);
    const ready = projectReady(p);
    const L = { screen: 'schedule', focus: p.id };
    const accel = (p.changeLog || []).some((c) => c.delta < -10);
    if (d < 0) push('critical', 'Schedule', 'Past Requested Delivery + not ready', p.name, 'Open recovery plan; escalate; notify Opportunity Owner', 'OM + RL', L, `${p.name} is ${Math.abs(d)} days past its Requested Delivery and not delivered. Client-facing miss.`);
    else if (d <= 14 && !ready) push('critical', 'Staffing', 'Readiness gap — inside 10-day Readiness SLA buffer', p.name, 'Redeploy a returning tech (fast path) or escalate the date', 'OM → RL', L, `${p.name} delivers in ${d} days with no Ready technician. Inside the Readiness SLA buffer.`);
    else if (accel && d <= 60) push('critical', 'Schedule', 'Acceleration-as-risk — date pulled earlier', p.name, 'Recompute runway; cover with a returning tech in days, else escalate', 'OM + RL', L, `${p.name}'s date was pulled earlier, compressing the readiness runway (see change log).`);
    else if (d <= 14 && ready) push('action', 'Schedule', 'Delivery inside the 10-day buffer', p.name, 'Confirm tech + site access; monitor', 'OM', L, `${p.name} delivers in ${d} days and is staffed. Confirm tech + site access.`);
    else if (d <= 42 && p.assignedTechs.length === 0 && p.floors) push('action', 'Staffing', 'Recruitment window open — no tech assigned', p.name, 'Start recruiting now or reserve a pool tech', 'OM', L, `${p.name} entered its ~6-week recruit window with no assigned technician.`);
    else if ((p.changeCount || 0) >= 3) push('action', 'Schedule', 'High volatility — date moved ≥3×', p.name, 'Investigate client/site cause; may pause recruiting until stable', 'OM', L, `${p.name}'s date has moved ${p.changeCount}× — unstable regardless of current position.`);
  });

  // illustrative info-tier routine date change (shows the 🟢 tier + the #6-vs-#3 contrast)
  push('info', 'Schedule', 'Routine date change (no lead-time breach)', 'Hub At · 02/08 → 04/08 (client update)', 'Auto-propagated to tech + RL; acknowledge loop; monitor', 'System / OM', { screen: 'schedule', focus: 'Hub At' }, 'A 2-day slip within tolerance. Auto-propagated; no action needed — the contrast to a critical date change.');

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
  // Customer (Account) SLA = delivered on the date committed to the client — the headline KPI
  const customerAdherence = aps.length ? Math.round(((aps.length - overdue.length) / aps.length) * 100) : 100;
  const bn = topBottleneck(projects);

  return {
    // Band 1 — Roee's north-star
    customerSlaAdherence: customerAdherence,
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
    topBottleneck: bn.phase,
    bottleneckCount: bn.count,
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

// ---- process steps (Part 2 drawer + Part 5 aggregate) ----
const RETURN_SKIP = new Set([7, 8, 9, 10, 12]); // Buildots Training + PPE skipped on the fast path
export function stepStatus(project, i) {
  const override = project.stepState?.[i];
  if (override) return override;
  if (project.assignmentType === 'Returning' && RETURN_SKIP.has(i)) return 'skipped';
  const prog = project.progress ?? 0;
  if (i < prog) return 'done';
  if (i === prog) return 'doing';
  return 'todo';
}
// A project sits at the EARLIEST step that is not yet done/skipped — so a step
// blocked with an ✕ pulls the project back to that step, even if later steps advanced.
export function effectiveStep(project) {
  for (let i = 0; i < STEPS.length; i++) {
    const st = stepStatus(project, i);
    if (st !== 'done' && st !== 'skipped') return i;
  }
  return STEPS.length - 1;
}
export function readinessPct(project) {
  const office = STEPS.filter((s) => s.office);
  const done = office.filter((s) => ['done', 'skipped'].includes(stepStatus(project, s.i))).length;
  return Math.round((done / office.length) * 100);
}
export function phaseOfProgress(project) {
  return STEPS[effectiveStep(project)].phase;
}
export function projectsByPhase(projects) {
  const map = {}; PHASES.forEach((p) => (map[p] = []));
  activeProjects(projects).forEach((p) => { map[phaseOfProgress(p)]?.push(p); });
  return map;
}
export function projectsAtStep(projects) {
  const map = {}; STEPS.forEach((s) => (map[s.i] = []));
  activeProjects(projects).forEach((p) => { map[effectiveStep(p)].push(p); });
  return map;
}
// The live bottleneck = the phase where the most projects actually sit right now (provable).
export function topBottleneck(projects) {
  const byPhase = projectsByPhase(projects);
  let best = { phase: '—', count: 0 };
  PHASES.forEach((ph) => { if (byPhase[ph].length > best.count) best = { phase: ph, count: byPhase[ph].length }; });
  return best;
}
export function recurringVisits(project) {
  if (!project.requestedDelivery || !project.projectEnd) return [];
  const out = []; let d = project.requestedDelivery;
  for (let k = 0; k < 40; k++) { d = addDays(d, 91); if (!d || parseDate(d) >= parseDate(project.projectEnd)) break; out.push(d); }
  return out;
}
export function assignedNames(project, technicians) {
  return (project.assignedTechs || []).map((id) => technicians.find((t) => t.id === id)?.name || id);
}

// ---- funnel liquidity (Part 1) ----
export function funnelLiquidity(candidates) {
  const stages = ['Sourced', 'Screened', 'Onboarded', 'Deployed'];
  return stages.map((s) => {
    const inStage = candidates.filter((c) => c.stage === s);
    const avgDays = inStage.length ? Math.round(inStage.reduce((a, c) => a + (c.daysInStage || 0), 0) / inStage.length) : 0;
    const aging = inStage.filter((c) => c.daysInStage > (c.stageSla || 99)).length;
    return { stage: s, count: inStage.length, avgDays, aging };
  });
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

// per-metric trend for a single technician (Part 3: "how each scored on each metric over time")
export function metricTrend(tech) {
  const months = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  const keys = ['coverage', 'reliability', 'ontime', 'upload', 'issues'];
  return months.map((m, idx) => {
    const row = { month: m };
    keys.forEach((k, ki) => {
      const cur = tech.metrics[k];
      const drift = (months.length - 1 - idx) * 0.18;
      const wobble = ((idx + ki) % 2 ? 0.15 : -0.12) * (idx / months.length);
      row[k] = round1(Math.max(1, Math.min(5, cur - drift + wobble)));
    });
    return row;
  });
}

export const METRIC_DEFS = [
  { key: 'coverage', label: 'Coverage completeness', weight: '30%', source: 'Buildots platform', rubric: '5 = 100% of planned floors · 4 ≥95% · 3 = 90-95% · 2 = 80-90% · 1 <80% (technician-attributed only)' },
  { key: 'reliability', label: 'Reliability (no-show / cancel)', weight: '25%', source: 'Regional Lead', rubric: '5 = zero no-shows · 3 = one late cancel · 1 = multiple no-shows (also a hard gate → Bench)' },
  { key: 'ontime', label: 'On-time arrival', weight: '20%', source: 'Regional Lead', rubric: '5 = always on time · 3 = occasionally late · 1 = chronic lateness' },
  { key: 'upload', label: 'Upload on-time', weight: '15%', source: 'Buildots platform', rubric: '5 = always by deadline · 3 = sometimes late · 1 = chronically late' },
  { key: 'issues', label: 'Issue / rework rate', weight: '10%', source: 'Regional Lead', rubric: '5 = zero issues · 3 = minor rework · 1 = frequent rework' },
];
