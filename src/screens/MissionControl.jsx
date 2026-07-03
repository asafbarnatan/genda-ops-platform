import { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useStore } from '../data/store.jsx';
import { missionTiles, deriveAlerts, qualityTrend, activeTechs, activeProjects, projectStatus, qualityComposite, projectsByPhase, techniciansNeeded, assignedNames } from '../data/derive';
import { Tile } from '../components/bits.jsx';
import { Modal } from '../components/Modal.jsx';
import OperatingLogic from '../components/OperatingLogic.jsx';

function TileDetail({ d, onGo, onClose }) {
  return (
    <Modal title={d.title} onClose={onClose}
      footer={<><button className="btn-text" onClick={onClose}>Close</button>{d.link && <button className="btn btn-primary" onClick={() => onGo(d.link.screen)}>{d.link.label} ↗</button>}</>}>
      {(d.why || d.note) && <div style={{ fontSize: 13, color: 'var(--bd-ink-2)', marginBottom: 14, lineHeight: 1.5 }}><b>Why it matters:</b> {d.why || d.note}</div>}
      <div style={{ fontSize: 34, fontWeight: 700 }} className="mono-num">{d.value}</div>
      <div className="micro" style={{ margin: '14px 0 4px' }}>How it's computed</div>
      <div className="small">{d.formula}</div>
      {d.why && d.note && <div className="small muted" style={{ marginTop: 6 }}>{d.note}</div>}
      {d.items && d.items.length > 0 && (
        <>
          <div className="micro" style={{ margin: '16px 0 4px' }}>What feeds it</div>
          <div>
            {d.items.map((it, i) => (
              <div key={i} className="step" style={{ justifyContent: 'space-between', cursor: it.focus ? 'pointer' : 'default', borderBottom: '1px solid #F1F1F1', padding: '8px 0' }} onClick={() => it.focus && onGo(it.goScreen || d.link?.screen || 'schedule', it.focus)}>
                <span><span className={`dot-s ${it.bad ? 'red' : it.warn ? 'amber' : 'green'}`} /> <b>{it.name}</b></span>
                <span className="small muted">{it.note}{it.focus && ' ↗'}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Modal>
  );
}

function ActionRow({ a, onDone, onOpen }) {
  return (
    <div className={`acard ${a.tier}`} style={{ marginBottom: 8 }} onClick={onOpen}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{a.trigger}</div>
          <div className="small muted">{a.subject} · {a.family} · {a.owner}</div>
          <div className="small" style={{ marginTop: 4 }}>→ {a.action}</div>
        </div>
        <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); onDone(); }}>Done</button>
        <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); onOpen(); }}>Open ↗</button>
      </div>
      {a.why && <div className="pop">{a.why}</div>}
    </div>
  );
}

export default function MissionControl() {
  const { projects, technicians, candidates, persona, setPersona, navigate, acks, toggleAck } = useStore();
  const m = missionTiles(projects, technicians, candidates);
  const alerts = deriveAlerts(projects, technicians);
  const trend = qualityTrend(technicians);
  const acts = activeTechs(technicians);
  const isOM = persona === 'om';

  const open = alerts.filter((a) => a.tier !== 'info' && !acks.includes(a.id));
  const cleared = alerts.filter((a) => a.tier !== 'info' && acks.includes(a.id)).length;

  const [detail, setDetail] = useState(null);
  const aps = activeProjects(projects);
  const overdueList = aps.filter((p) => projectStatus(p) === 'critical');
  const atRiskList = aps.filter((p) => ['atrisk', 'critical'].includes(projectStatus(p)));
  const flaggedTechs = technicians.filter((t) => t.pool !== 'Active');
  const bnProjects = (projectsByPhase(projects)[m.topBottleneck]) || [];
  const gapProjects = aps.map((p) => ({ p, miss: Math.max(0, techniciansNeeded(p) - (p.assignedTechs?.length || 0)) })).filter((x) => x.miss > 0 && !x.p.staffingOk);
  // Portfolio-health RAG buckets — mutually exclusive, mirror the Schedule status legend.
  const onTrackCount = aps.filter((p) => projectStatus(p) === 'ontrack').length;
  const atRiskOnly = aps.filter((p) => projectStatus(p) === 'atrisk').length;
  const criticalCount = aps.filter((p) => projectStatus(p) === 'critical').length;
  const naCount = aps.length - onTrackCount - atRiskOnly - criticalCount;
  const returningProjects = aps.filter((p) => p.assignmentType === 'Returning');
  const goDetail = (screen, focus = null) => { navigate(screen, focus); setDetail(null); };

  const DETAILS = {
    customer: {
      title: 'Customer SLA adherence', value: `${m.customerSlaAdherence}%`, link: { screen: 'schedule', label: 'Open the Schedule' },
      why: 'This is the promise made to the client. Missing a committed delivery date is the fastest way to lose their trust and future work — it is the number the whole operation exists to protect.',
      formula: `Projects delivered on or before the committed date ÷ all active projects = ${aps.length - overdueList.length} of ${aps.length}.`,
      note: overdueList.length === 0 ? 'Every active project is on track to meet its committed date.' : overdueList.length === 1 ? `A single miss (${overdueList[0].name}) drops us below 100%.` : `${overdueList.length} misses (${overdueList.map((p) => p.name).join(', ')}) drop us below 100%.`,
      items: aps.map((p) => ({ name: p.name, note: projectStatus(p) === 'critical' ? 'missed / overdue' : 'on track to meet the date', bad: projectStatus(p) === 'critical', focus: p.id })),
    },
    dropped: {
      title: 'Dropped opportunities', value: m.droppedOpportunities, link: { screen: 'schedule', label: 'Open the Schedule' },
      why: 'A dropped opportunity is revenue and client trust lost by missing the committed date. The target is zero — one is already one too many.',
      formula: `Projects past their Requested Delivery date and not delivered. Count = ${overdueList.length}.`,
      items: overdueList.length ? overdueList.map((p) => ({ name: p.name, note: `delivery ${p.requestedDelivery} has passed`, bad: true, focus: p.id })) : [{ name: 'None', note: 'no projects overdue', bad: false }],
    },
    readiness: {
      title: 'Readiness SLA (internal)', value: `${m.readinessSlaAdherence}%`, link: { screen: 'schedule', label: 'Open the Schedule' },
      why: 'Being ready early is what makes the customer date safe. This internal buffer absorbs surprises before the client ever feels them — the leading indicator behind the headline KPI.',
      formula: 'Of projects due soon, the share on pace to be ready ≥10 business days before delivery (not Critical).',
      items: atRiskList.map((p) => ({ name: p.name, note: `${projectStatus(p) === 'critical' ? 'critical' : 'at risk'} — dragging it down`, bad: projectStatus(p) === 'critical', warn: projectStatus(p) === 'atrisk', focus: p.id })),
    },
    readyTech: {
      title: 'Ready-tech coverage', value: `${m.techActive} ready`, link: { screen: 'pipeline', label: 'Open the Pipeline' },
      formula: `Technicians currently in the Active pool = ${acts.length}.`,
      note: 'Reused across projects, so fewer than the number of project slots.',
      items: acts.map((t) => ({ name: t.name, note: `${t.region} · Q ${qualityComposite(t.metrics)}`, bad: false, focus: t.id, goScreen: 'quality' })),
    },
    returning: {
      title: '% returning deployments', value: `${m.pctReturning}%`, link: { screen: 'process', label: 'Open Process' },
      why: 'Reusing an already-trained technician skips the ~6-week new-hire lead — the lever that lets the operation scale without hiring from scratch every time.',
      formula: `Deployments served by a returning technician ÷ all deployments = ${m.returningDeploys} of ${m.totalDeploys}.`,
      note: 'The Cloud Factory vendor pilot is how we grow this further.',
      items: returningProjects.length ? returningProjects.map((p) => ({ name: p.name, note: `returning-tech · ${p.assignedTechs?.length || 0} deployment`, focus: p.id })) : [{ name: 'None yet', note: 'all current deployments are new-hire', bad: false }],
    },
    atRisk: {
      title: 'Projects at risk', value: m.atRisk, link: { screen: 'schedule', label: 'Open the Schedule' },
      formula: `Projects At risk (inside the readiness buffer) or Critical (overdue / no ready tech). Count = ${atRiskList.length}.`,
      items: atRiskList.map((p) => ({ name: p.name, note: projectStatus(p) === 'critical' ? 'critical' : 'at risk', bad: projectStatus(p) === 'critical', warn: projectStatus(p) === 'atrisk', focus: p.id })),
    },
    avgQuality: {
      title: 'Avg technician quality', value: m.avgQuality, link: { screen: 'quality', label: 'Open Quality' },
      formula: acts.length ? `Mean of the active roster's composites = (${acts.map((t) => qualityComposite(t.metrics)).join(' + ')}) ÷ ${acts.length}.` : 'No active technicians in the roster.',
      note: `${flaggedTechs.length} technicians flagged (benched / removed) sit outside this average.`,
      items: acts.map((t) => ({ name: t.name, note: `composite ${qualityComposite(t.metrics)}`, bad: qualityComposite(t.metrics) < 3, warn: qualityComposite(t.metrics) < 3.5, focus: t.id, goScreen: 'quality' })),
    },
    bottleneck: {
      title: 'Top bottleneck', value: m.topBottleneck, link: { screen: 'process', label: 'Open Process' },
      why: 'The phase holding the most projects is where the queue actually is — the first place to unblock to move the whole portfolio.',
      formula: `The process phase with the most projects right now: ${m.bottleneckCount} of ${aps.length} sit in "${m.topBottleneck}".`,
      items: bnProjects.map((p) => ({ name: p.name, note: 'in this phase', focus: p.id })),
    },
    alertCritical: { title: 'Alerts · critical', value: m.alertCritical, link: { screen: 'alerts', label: 'Open Alerts' }, formula: 'Alerts that hit a client outcome or breach the Readiness SLA.', items: alerts.filter((a) => a.tier === 'critical').map((a) => ({ name: a.trigger, note: a.subject, bad: true })) },
    alertAction: { title: 'Alerts · action', value: m.alertAction, link: { screen: 'alerts', label: 'Open Alerts' }, formula: 'Real issues you own the timing on — handle this week.', items: alerts.filter((a) => a.tier === 'action').map((a) => ({ name: a.trigger, note: a.subject, warn: true })) },
    missingTechs: {
      title: 'Missing technicians', value: m.missingTechs, link: { screen: 'pipeline', label: 'Open the Pipeline' },
      why: 'The unfilled staffing demand across the portfolio — how many more technicians the active projects still need. This is exactly what the recruitment pipeline and the vendor pilot exist to close.',
      formula: `Sum of (technicians needed − assigned) across active projects, excluding gaps the OM has accepted. Total = ${m.missingTechs}.`,
      items: gapProjects.length ? gapProjects.map((x) => ({ name: x.p.name, note: `${x.miss} missing · ${projectStatus(x.p) === 'critical' ? 'inside SLA' : 'on plan'}`, bad: projectStatus(x.p) === 'critical', warn: projectStatus(x.p) === 'atrisk', focus: x.p.id, goScreen: 'pipeline' })) : [{ name: 'None', note: 'every project is staffed or the gap is accepted', bad: false }],
    },
    // ---- Overview row (first-row stat tiles) ----
    projectsAll: {
      title: 'Active projects', value: m.projects, link: { screen: 'schedule', label: 'Open the Schedule' },
      formula: `All Genda Pro installs in the active portfolio = ${aps.length}.`,
      items: aps.map((p) => ({ name: p.name, note: `${p.region} · ${projectStatus(p) === 'critical' ? 'critical' : projectStatus(p) === 'atrisk' ? 'at risk' : 'on track'}`, bad: projectStatus(p) === 'critical', warn: projectStatus(p) === 'atrisk', focus: p.id })),
    },
    techniciansAll: {
      title: 'Technicians', value: m.technicians, link: { screen: 'quality', label: 'Open Quality' },
      formula: `The full roster: ${m.techActive} active · ${m.techBenched} benched · ${m.techRemoved} removed.`,
      items: technicians.map((t) => ({ name: t.name, note: `${t.pool} · ${t.region} · Q ${qualityComposite(t.metrics)}`, bad: t.pool === 'Removed', warn: t.pool === 'Benched', focus: t.id, goScreen: 'quality' })),
    },
    regionsAll: {
      title: 'Regions', value: m.regions,
      formula: 'The regions the active portfolio spans.',
      items: [...new Set(aps.map((p) => p.region))].map((r) => ({ name: r, note: `${aps.filter((p) => p.region === r).length} projects`, bad: false })),
    },
    deploymentsAll: {
      title: 'Deployments', value: m.deployments, link: { screen: 'schedule', label: 'Open the Schedule' },
      formula: `Active technician-to-project assignments = ${m.deployments} (one technician can serve several projects).`,
      items: aps.filter((p) => (p.assignedTechs?.length || 0) > 0).map((p) => ({ name: p.name, note: assignedNames(p, technicians).join(', '), focus: p.id })),
    },
    pipelineAll: {
      title: 'Technician pipeline', value: m.candidates, link: { screen: 'pipeline', label: 'Open the Pipeline' },
      formula: 'Pre-vetted candidates in the recruitment pipeline (the Cloud Factory vendor pilot).',
      items: candidates.map((c) => ({ name: c.name, note: `${c.channel} · ${c.stage}`, focus: c.id, goScreen: 'pipeline' })),
    },
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Mission Control</h1>
          <div className="page-sub">{isOM ? 'Your daily ops view — what needs action today' : 'Manager summary — is the operation healthy and on trajectory?'}</div>
        </div>
        <div className="row" style={{ alignItems: 'center' }}>
          <OperatingLogic part="mission" />
          <div className="seg">
            <button className={isOM ? 'active' : ''} onClick={() => setPersona('om')}>My view (OM)</button>
            <button className={!isOM ? 'active' : ''} onClick={() => setPersona('manager')}>Manager view</button>
          </div>
        </div>
      </div>

      <div className="micro" style={{ margin: '6px 0 8px' }}>Overview</div>
      <div className="stat-strip" style={{ marginBottom: 16 }}>
        <Tile label="Active projects" value={m.projects} onOpen={() => setDetail('projectsAll')} hint="Genda Pro installs across the active portfolio. Click for the list with status." />
        <Tile label="Technicians" value={m.technicians} onOpen={() => setDetail('techniciansAll')} hint={`The full roster: ${m.techActive} active · ${m.techBenched} benched · ${m.techRemoved} removed. Click to see each.`} />
        <Tile label="Regions" value={m.regions} onOpen={() => setDetail('regionsAll')} hint="The regions the portfolio spans: Texas · Southeast · West. Click for project counts." />
        <Tile label="Deployments" value={m.deployments} onOpen={() => setDetail('deploymentsAll')} hint="Active technician-to-project assignments (one tech can serve several). Click for the breakdown." />
        <Tile label="Technician pipeline" value={m.candidates} onOpen={() => setDetail('pipelineAll')} hint="Pre-vetted candidates in the recruitment pipeline — the Cloud Factory vendor pilot. Click to see them." />
      </div>

      <div className="micro" style={{ margin: '6px 0 8px' }}>North-star KPI — on-time delivery to the client</div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 18 }}>
        <Tile accent={m.customerSlaAdherence >= 95 ? 'green' : 'amber'} label="Customer SLA adherence" value={`${m.customerSlaAdherence}%`} onOpen={() => setDetail('customer')}
          hint="The primary KPI: the share of projects delivered on (or before) the date committed to the client. This is the external promise every other metric protects. Click for the breakdown." />
        <Tile accent={m.droppedOpportunities === 0 ? 'green' : 'red'} label="Dropped opportunities" value={m.droppedOpportunities} onOpen={() => setDetail('dropped')}
          hint="Opportunities lost by missing the committed delivery date. Target is zero. Click for the breakdown." />
        <Tile accent="indigo" label="Readiness SLA (internal)" value={`${m.readinessSlaAdherence}%`} onOpen={() => setDetail('readiness')}
          hint="Our internal early-warning metric: ready at least 10 business days before delivery. Secondary — the leading indicator that protects the customer SLA. Click for the breakdown." />
      </div>

      <div className="micro" style={{ margin: '6px 0 8px' }}>Operational health</div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 18 }}>
        <Tile label="Ready-tech coverage" value={`${m.techActive} ready`} onOpen={() => setDetail('readyTech')}
          hint="Active technicians available to deploy. Reused across projects — utilization, not headcount. Click to see who." />
        <Tile accent="indigo" label="% returning deployments" value={`${m.pctReturning}%`} onOpen={() => setDetail('returning')}
          hint="Deployments served by a returning technician instead of a new hire. Higher = faster, cheaper scaling. Click for detail." />
        <Tile accent={m.atRisk > 2 ? 'amber' : 'green'} label="Projects at risk" value={m.atRisk} onOpen={() => setDetail('atRisk')}
          hint="Projects At risk (inside the readiness buffer) or Critical (overdue / no ready tech). Click to see which." />
        <Tile label="Avg technician quality" value={m.avgQuality} onOpen={() => setDetail('avgQuality')}
          hint={`Weighted average of the active roster's composite scores (1-5). ${m.flagged} technicians are flagged for review. Click to see each contribution.`} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        <Tile label="Top bottleneck" value={<span style={{ fontSize: 15 }}>{m.topBottleneck}</span>} onOpen={() => setDetail('bottleneck')}
          hint={`The process phase with the most projects right now — where the queue actually is (${m.bottleneckCount} projects). Click for the list.`} />
        <Tile accent="red" label="Alerts · critical" value={m.alertCritical} onOpen={() => setDetail('alertCritical')} hint="Alerts that hit a client outcome or breach the Readiness SLA. Act now (~24-48h). Click to see them." />
        <Tile accent="amber" label="Alerts · action" value={m.alertAction} onOpen={() => setDetail('alertAction')} hint="Real issues you own the timing on — handle this week. Click to see them." />
        <Tile accent={m.missingTechs > 0 ? 'amber' : 'green'} label="Missing technicians" value={m.missingTechs} onOpen={() => setDetail('missingTechs')}
          hint="How many more technicians the active projects still need (needed − assigned), excluding gaps you've accepted. Click for the per-project breakdown." />
      </div>

      {isOM ? (
        <div className="card">
          <div className="card-head"><h3>Today · what needs action</h3><span className="muted small">🔴 Act Now → 🟠 This Week · hover for detail, Open to jump to the source</span></div>
          <div className="card-pad">
            {open.map((a) => (
              <ActionRow key={a.id} a={a} onDone={() => toggleAck(a.id)} onOpen={() => a.link && navigate(a.link.screen, a.link.focus)} />
            ))}
            {open.length === 0 && <div className="muted">All clear — nothing critical open.</div>}
            {cleared > 0 && <div className="small muted" style={{ marginTop: 8 }}>✓ {cleared} cleared today <button className="btn-text btn-sm" onClick={() => alerts.forEach((a) => acks.includes(a.id) && toggleAck(a.id))}>undo</button></div>}
          </div>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
          <div className="card">
            <div className="card-head"><h3>Technician quality — trajectory</h3><span className="muted small">avg composite, active roster</span></div>
            <div className="card-pad">
              <div className="chart-wrap" style={{ height: 260 }}>
                <ResponsiveContainer>
                  <AreaChart data={trend} margin={{ left: -18, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="qg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8B7FE8" stopOpacity={0.32} />
                        <stop offset="100%" stopColor="#8B7FE8" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#EFEFEF" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9A9B9D' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[2, 5]} tick={{ fontSize: 11, fill: '#9A9B9D' }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    {acts.map((t, i) => (
                      <Area key={t.id} type="monotone" dataKey={t.id} name={t.name} stroke="#8B7FE8" fill={i === 0 ? 'url(#qg)' : 'none'} strokeWidth={1.6} dot={false} />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-head"><h3>Portfolio health</h3></div>
            <div className="card-pad">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="kv"><span className="dot-s green" /> On track &nbsp;<b className="mono-num">{onTrackCount}</b></div>
                <div className="kv"><span className="dot-s amber" /> At risk &nbsp;<b className="mono-num">{atRiskOnly}</b></div>
                <div className="kv"><span className="dot-s red" /> Critical (dropped / overdue) &nbsp;<b className="mono-num">{criticalCount}</b></div>
                {naCount > 0 && <div className="kv"><span className="dot-s grey" /> Not assessable &nbsp;<b className="mono-num">{naCount}</b></div>}
                <hr className="sep" style={{ margin: '6px 0' }} />
                <div className="small muted">Same three statuses as the Schedule tab. On track + At risk + Critical{naCount > 0 ? ' + N/A' : ''} = {m.projects} active projects.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {detail && <TileDetail d={DETAILS[detail]} onGo={goDetail} onClose={() => setDetail(null)} />}
    </div>
  );
}
