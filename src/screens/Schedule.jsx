import { useState, useEffect } from 'react';
import { useStore } from '../data/store.jsx';
import {
  projectStatus, techniciansNeeded, readinessBy, recruitBy, fmtDate, parseDate, daysBetween, addDays,
  stepStatus, readinessPct, phaseOfProgress, recurringVisits, assignedNames, activeTechs,
} from '../data/derive';
import { STEPS, PHASES, BOUNDARY_STEP } from '../data/seed';
import { StatusPill, ProvDot, Icon, FilterBar } from '../components/bits.jsx';
import { EntityModal } from '../components/Modal.jsx';

const REGIONS = ['Texas', 'Southeast', 'West'];
const CAUSES = ['Construction ahead', 'Construction behind', 'Client update', 'Site access', 'Internal reschedule'];
const CHANNELS = ['Craigslist', 'Facebook', 'LinkedIn', 'Other', 'Vendor - Cloud Factory'];
const TYPES = ['Residential', 'Healthcare', 'Commercial', 'Education'];
const STATUS_ORDER = { critical: 0, atrisk: 1, ontrack: 2, na: 3 };
const GLYPH = { done: '✓', doing: '◐', blocked: '✕', todo: '○', skipped: '⊘' };

// inline-editable table cells
const Sel = ({ value, options, onChange }) => <select className="cell-edit" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select>;
const Num = ({ value, onChange }) => <input className="cell-edit num-edit" type="number" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} />;
const DateC = ({ value, onChange }) => <input className="cell-edit" type="date" value={value || ''} onChange={(e) => onChange(e.target.value)} />;

function ProcessDrawer({ project, technicians, onClose, onEdit, onToggleStep, onUpdate }) {
  const [tab, setTab] = useState('process');
  const [openPhase, setOpenPhase] = useState(phaseOfProgress(project));
  const [dField, setDField] = useState('Requested Delivery');
  const [dDate, setDDate] = useState('');
  const [cause, setCause] = useState(CAUSES[0]);
  const [visit, setVisit] = useState('');
  const [evt, setEvt] = useState('');
  const [savedMsg, setSavedMsg] = useState('');
  const names = assignedNames(project, technicians);
  const roster = activeTechs(technicians);
  const doUpdate = (patch, log) => { onUpdate(patch, log); setSavedMsg('✓ Saved to the project'); setTimeout(() => setSavedMsg(''), 1800); };

  const applyDate = () => {
    if (!dDate) return;
    const key = dField === 'Requested Delivery' ? 'requestedDelivery' : 'projectEnd';
    doUpdate({ [key]: dDate }, { field: dField, old: project[key], new: dDate, delta: daysBetween(project[key], dDate) || 0, cause, note: 'Date changed via Manage' });
    setDDate('');
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <div className="micro">Project · {project.assignmentType}</div>
            <h3 style={{ fontSize: 18, margin: '2px 0 6px' }}>{project.name} <StatusPill status={projectStatus(project)} /></h3>
            <div className="small muted">Readiness {readinessPct(project)}% · phase: {phaseOfProgress(project)} · {names.length ? names.join(', ') : 'no tech assigned'}</div>
          </div>
          <button className="x" onClick={onClose}>×</button>
        </div>
        <div className="drawer-tabs">
          {['process', 'manage', 'details', 'history'].map((t) => <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}{t === 'history' && project.changeLog?.length ? ` (${project.changeLog.length})` : ''}</button>)}
        </div>

        {tab === 'process' && (
          <div>
            <div className="small muted" style={{ padding: '10px 24px 0' }}>Click a step to mark it done / blocked. Every change writes to History and recomputes the Readiness SLA.</div>
            {PHASES.map((phase) => {
              const steps = STEPS.filter((s) => s.phase === phase);
              const expanded = openPhase === phase;
              return (
                <div key={phase}>
                  {steps[0].i === BOUNDARY_STEP && <div className="boundary">▾ Handoff to the Regional Lead (Gil) · field execution ▾</div>}
                  <div className="phase">
                    <div className="phase-head" onClick={() => setOpenPhase(expanded ? null : phase)}>
                      <span className="ph-t">{phase}</span><span className="spacer" /><span className="small muted">{steps[0].office ? 'office' : 'field'}</span>
                    </div>
                    {expanded && (
                      <div className="phase-steps">
                        {steps.map((s) => {
                          const st = stepStatus(project, s.i);
                          return (
                            <div className="step" key={s.i} style={{ cursor: 'pointer' }} onClick={() => onToggleStep(s.i, st)} title="click to toggle done / blocked">
                              <span className={`glyph ${st}`} style={{ width: 18, height: 18, fontSize: 11 }}>{GLYPH[st]}</span>
                              <span style={{ textDecoration: st === 'skipped' ? 'line-through' : 'none' }}>{s.name}</span>
                              {st === 'skipped' && <span className="small muted"> — returning tech</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'manage' && (
          <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {savedMsg && <div style={{ background: 'var(--bd-green-bg)', color: '#1f7a54', border: '1px solid #bfe6d4', borderRadius: 6, padding: '9px 12px', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>{savedMsg} — it now shows in the timeline, table, and History.</div>}
            <div className="small muted">Each section below saves on its own button (or on click) — there's no single Save; changes apply instantly and flow to the timeline, table, alerts, and Mission Control. You'll see a green confirmation here.</div>

            <div>
              <div className="micro" style={{ marginBottom: 4 }}>Assign / change technicians · {techniciansNeeded(project)} needed</div>
              <div className="small muted" style={{ marginBottom: 7 }}>Click a name to toggle it on / off. ✓ = assigned to this project · "travel" = a different region than the site.</div>
              <div className="row wrap" style={{ gap: 8 }}>
                {roster.map((t) => {
                  const on = project.assignedTechs?.includes(t.id);
                  const sameRegion = t.region === project.region;
                  return (
                    <button key={t.id} className={`tech-toggle ${on ? 'on' : 'off'}`} onClick={() => doUpdate({ assignedTechs: on ? project.assignedTechs.filter((x) => x !== t.id) : [...(project.assignedTechs || []), t.id] }, { field: 'Assignment', old: '', new: t.name, cause: 'Manual', note: `${on ? 'Unassigned' : 'Assigned'} ${t.name}` })}>
                      {on ? '✓ ' : '+ '}{t.name}<span className="small muted" style={{ marginLeft: 4 }}>{sameRegion ? t.region : `${t.region} · travel`}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="micro" style={{ marginBottom: 4 }}>Change a date</div>
              <div className="small muted" style={{ marginBottom: 7 }}>Pick which date to move, the new date, and the reason. "Apply" saves it, logs the cause to History, and recomputes risk.</div>
              <div className="row wrap" style={{ gap: 10, alignItems: 'flex-end' }}>
                <div className="field"><label>Which date</label><select className="input" value={dField} onChange={(e) => setDField(e.target.value)}><option>Requested Delivery</option><option>Project End</option></select></div>
                <div className="field"><label>New date</label><input className="input" type="date" value={dDate} onChange={(e) => setDDate(e.target.value)} /></div>
                <div className="field"><label>Reason (cause)</label><select className="input" value={cause} onChange={(e) => setCause(e.target.value)}>{CAUSES.map((c) => <option key={c}>{c}</option>)}</select></div>
                <button className="btn btn-primary" onClick={applyDate}>Apply change</button>
              </div>
            </div>

            <div>
              <div className="micro" style={{ marginBottom: 4 }}>Visits</div>
              <div className="small muted">Quarterly recurring: {recurringVisits(project).length} visits · next {fmtDate(recurringVisits(project)[0])}. Add an ad-hoc visit below.</div>
              <div className="row" style={{ gap: 8, marginTop: 7, alignItems: 'flex-end' }}>
                <div className="field"><label>Ad-hoc visit date</label><input className="input" type="date" value={visit} onChange={(e) => setVisit(e.target.value)} /></div>
                <button className="btn" onClick={() => { if (visit) { doUpdate({ extraVisits: [...(project.extraVisits || []), visit] }, { field: 'Visit', new: visit, cause: 'Manual', note: 'Ad-hoc visit scheduled' }); setVisit(''); } }}>+ Add visit</button>
              </div>
              <div className="row wrap" style={{ gap: 6, marginTop: 7 }}>{(project.extraVisits || []).map((v) => <span className="pill grey" key={v}>{fmtDate(v)}</span>)}</div>
            </div>

            <div>
              <div className="micro" style={{ marginBottom: 4 }}>Log a project event</div>
              <div className="small muted" style={{ marginBottom: 7 }}>Free-text note — e.g. a call from the site PM. Saved to the History log with a timestamp.</div>
              <div className="row" style={{ gap: 8 }}>
                <input className="input" style={{ flex: 1 }} placeholder="e.g. PM called — finish floor 18 in April once built" value={evt} onChange={(e) => setEvt(e.target.value)} />
                <button className="btn btn-primary" onClick={() => { if (evt.trim()) { doUpdate({}, { field: 'Event', new: '', cause: 'Note', note: evt.trim() }); setEvt(''); } }}>Add event</button>
              </div>
            </div>
          </div>
        )}

        {tab === 'details' && (
          <div className="card-pad" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['Account', project.account], ['Region', project.region], ['Region Lead', 'Gil'], ['Type', project.type], ['Assignment', project.assignmentType],
              ['Stage', project.stage], ['Floors', project.floors ?? '—'], ['Buildings', project.buildings ?? '—'], ['Technicians needed', techniciansNeeded(project)],
              ['Assigned', names.length ? names.join(', ') : '—'], ['Requested delivery', fmtDate(project.requestedDelivery)], ['Readiness-by (SLA)', fmtDate(readinessBy(project))],
              ['Recruit-by', fmtDate(recruitBy(project))], ['Project end', fmtDate(project.projectEnd)], ['Duration (mo)', project.durationMo ?? '—'],
              ['Recurring visits', `${recurringVisits(project).length} (quarterly)`], ['Channel', project.channel], ['Opportunity Owner', `${project.owner} (sales rep)`],
              ['Candidate score', project.candidateScore ?? '—'], ['Training', project.training || '—'], ['Change count (volatility)', project.changeCount || 0],
            ].map(([k, v]) => (
              <div className="kv" key={k} style={{ flexDirection: 'column', gap: 2 }}><span className="k">{k}</span><b>{v}</b></div>
            ))}
          </div>
        )}

        {tab === 'history' && (
          <div className="card-pad">
            <div className="small muted" style={{ marginBottom: 10 }}>Change log (audit trail). Cause decides the action; acceleration + volatility become risk.</div>
            {(!project.changeLog || project.changeLog.length === 0) && <div className="muted small">No changes logged.</div>}
            {[...(project.changeLog || [])].reverse().map((c) => {
              const accel = c.delta < -10;
              return (
                <div key={c.id} className="step" style={{ alignItems: 'flex-start', borderBottom: '1px solid #F1F1F1', paddingBottom: 8, marginBottom: 6 }}>
                  <span className={`glyph ${accel ? 'blocked' : 'doing'}`} style={{ width: 18, height: 18, fontSize: 11 }}>{c.field === 'Event' ? '✎' : c.delta < 0 ? '⇤' : c.delta > 0 ? '⇥' : '•'}</span>
                  <div>
                    <div style={{ fontSize: 13 }}><b>{c.field}</b> {c.old && c.new && c.field !== 'Event' ? <>{fmtDate(c.old) !== '—' ? fmtDate(c.old) : c.old} → {fmtDate(c.new) !== '—' ? fmtDate(c.new) : c.new}</> : null} {c.delta ? <span className={accel ? 'pill red' : 'pill grey'}>{c.delta > 0 ? '+' : ''}{c.delta}d{accel ? ' · acceleration' : ''}</span> : null}</div>
                    <div className="small muted">{c.cause} · {c.by} · {fmtDate(c.ts)} — {c.note}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="modal-foot"><button className="btn btn-sm" onClick={onEdit}>Edit core fields</button><button className="btn btn-primary btn-sm" onClick={onClose}>Close</button></div>
      </div>
    </div>
  );
}

export default function Schedule() {
  const { projects, technicians, update, add, remove, route, clearFocus } = useStore();
  const [view, setView] = useState('timeline');
  const [f, setF] = useState({ region: 'All', account: 'All', type: 'All' });
  const [drawer, setDrawer] = useState(null);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    if (route.focus) { const p = projects.find((x) => x.id === route.focus); if (p) setDrawer(p.id); clearFocus(); }
  }, [route.focus]); // eslint-disable-line

  const drawerProject = drawer ? projects.find((p) => p.id === drawer) : null;
  const accounts = [...new Set(projects.map((p) => p.account))];
  const filters = [
    { key: 'region', label: 'Region', options: REGIONS },
    { key: 'account', label: 'Account', options: accounts },
    { key: 'type', label: 'Assignment', options: ['New-hire', 'Returning'] },
  ];
  const matches = (p) => (f.region === 'All' || p.region === f.region) && (f.account === 'All' || p.account === f.account) && (f.type === 'All' || p.assignmentType === f.type);
  const rows = projects.filter(matches);
  const sorted = [...rows].sort((a, b) => (STATUS_ORDER[projectStatus(a)] - STATUS_ORDER[projectStatus(b)]) || (parseDate(a.requestedDelivery) - parseDate(b.requestedDelivery)));

  const dates = rows.flatMap((p) => [p.requestedDelivery, p.projectEnd]).filter(Boolean).map(parseDate);
  const min = dates.length ? new Date(Math.min(...dates)) : new Date('2026-01-01');
  const max = dates.length ? new Date(Math.max(...dates)) : new Date('2029-12-31');
  const pct = (d) => { const t = parseDate(d); if (!t) return 0; return Math.max(0, Math.min(100, ((t - min) / (max - min)) * 100)); };
  const years = [2026, 2027, 2028, 2029];

  const applyUpdate = (projId, patch, log) => {
    const p = projects.find((x) => x.id === projId);
    const nowTs = new Date().toISOString().slice(0, 10);
    const changeLog = log ? [...(p.changeLog || []), { id: `c-${Date.now()}`, ts: nowTs, by: 'OM', delta: 0, ...log }] : (p.changeLog || []);
    const bumpVol = log && String(log.field).startsWith('Requested');
    update('projects', projId, { ...patch, changeLog, changeCount: (p.changeCount || 0) + (bumpVol ? 1 : 0) });
  };
  const toggleStep = (projId, i, current) => {
    const p = projects.find((x) => x.id === projId);
    const next = current === 'done' ? 'blocked' : current === 'blocked' ? undefined : 'done';
    const stepState = { ...(p.stepState || {}) };
    if (next === undefined) delete stepState[i]; else stepState[i] = next;
    applyUpdate(projId, { stepState }, { field: `Step: ${STEPS[i].name}`, old: current, new: next || 'default', cause: 'Manual update', note: `Marked ${next || 'reset'}` });
  };
  const editCell = (p, key, value, label) => {
    const isDate = key === 'requestedDelivery' || key === 'projectEnd';
    applyUpdate(p.id, { [key]: value }, { field: label, old: p[key], new: value, delta: isDate ? (daysBetween(p[key], value) || 0) : 0, cause: 'Table edit', note: `${label} updated in table` });
  };
  const editPhase = (p, phaseName) => {
    const firstStep = STEPS.find((s) => s.phase === phaseName)?.i ?? 0;
    applyUpdate(p.id, { progress: firstStep }, { field: 'Phase', old: phaseOfProgress(p), new: phaseName, cause: 'Table edit', note: `Moved to phase ${phaseName}` });
  };

  const stepOptions = STEPS.map((s) => `${s.i + 1}. ${s.name}`);
  const projFields = [
    { name: 'name', label: 'Project name' }, { name: 'account', label: 'Account' },
    { name: 'region', label: 'Region', type: 'select', options: REGIONS },
    { name: 'type', label: 'Type', type: 'select', options: ['Residential', 'Healthcare', 'Commercial', 'Education'] },
    { name: 'assignmentType', label: 'Assignment', type: 'select', options: ['New-hire', 'Returning'] },
    { name: 'floors', label: 'Floors', type: 'number', min: 0 }, { name: 'buildings', label: 'Buildings', type: 'number', min: 1 },
    { name: 'requestedDelivery', label: 'Requested delivery', type: 'date' }, { name: 'projectEnd', label: 'Project end', type: 'date' },
    { name: 'startStep', label: 'Start at step (of 24)', type: 'select', options: stepOptions, full: true },
  ];
  const saveProj = (v) => {
    const progress = v.startStep ? parseInt(v.startStep, 10) - 1 : 0;
    if (v.id && projects.some((p) => p.id === v.id)) update('projects', v.id, { ...v, progress });
    else add('projects', { ...v, id: v.name, product: 'Genda Pro', country: 'United States', owner: 'OM', channel: v.channel || 'Craigslist', assignedTechs: [], stage: 'Qualification', recruitmentStatus: 'Pre-recruitment', training: 'Not Done', progress, stepState: {}, changeLog: [], changeCount: 0 });
  };

  const changeBadge = (p) => {
    const c = [...(p.changeLog || [])].reverse().find((x) => x.delta);
    if (!c) return <span className="muted">—</span>;
    const accel = c.delta < -10;
    return <span className={accel ? 'pill red' : 'pill grey'} title={`${c.cause}: ${fmtDate(c.old)} → ${fmtDate(c.new)}`}>{c.delta > 0 ? '⇥ +' : '⇤ '}{c.delta}d</span>;
  };

  return (
    <div className="page">
      <div className="page-head">
        <div><h1 className="page-title">Project Schedule</h1><div className="page-sub">Managing change: dates shift, cause is captured, risk recomputes, at-risk floats to the top</div></div>
        <div className="row">
          <div className="seg"><button className={view === 'timeline' ? 'active' : ''} onClick={() => setView('timeline')}>Timeline</button><button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')}>Table</button></div>
          <button className="btn btn-primary" onClick={() => setModal({ region: 'Southeast', type: 'Residential', assignmentType: 'New-hire', buildings: 1, startStep: stepOptions[0] })}><Icon.plus /> Project</button>
        </div>
      </div>

      <FilterBar filters={filters} values={f} onChange={(k, v) => setF((s) => ({ ...s, [k]: v }))} right={<span className="small muted">{rows.length} projects · click any project to manage it</span>} />

      {view === 'timeline' ? (
        <>
          <div className="legend-tile">
            <span className="micro" style={{ letterSpacing: '0.05em' }}>Milestones</span>
            <span className="lk"><b style={{ color: 'var(--bd-indigo)' }}>★</b> Ready-by (SLA)</span>
            <span className="lk"><b>▲</b> Requested Delivery / First Installation</span>
            <span className="lk"><b>◆</b> First Upload</span>
            <span className="lk"><span className="dot-s grey" /> Quarterly recurring visit</span>
            <span className="lk"><span style={{ opacity: 0.4 }}>◇</span> Previous date (ghost)</span>
            <span className="lk"><span className="pill green" style={{ fontSize: 9, padding: '1px 6px' }}>↩</span> Returning-tech</span>
            <span style={{ flexBasis: '100%', height: 0 }} />
            <span className="micro" style={{ letterSpacing: '0.05em' }}>Status</span>
            <span className="lk"><span className="dot-s green" /> On track</span>
            <span className="lk"><span className="dot-s amber" /> At risk</span>
            <span className="lk"><span className="dot-s red" /> Critical</span>
          </div>
          <div className="card card-pad">
            <div className="tl-axis"><div /><div className="ticks">{years.map((y) => <span key={y}>{y}</span>)}</div></div>
            <div className="timeline">
              {sorted.map((p) => {
                const st = projectStatus(p);
                const left = pct(p.requestedDelivery), right = pct(p.projectEnd || p.requestedDelivery);
                const dotCls = st === 'ontrack' ? 'green' : st === 'atrisk' ? 'amber' : st === 'critical' ? 'red' : 'grey';
                const lastDated = [...(p.changeLog || [])].reverse().find((c) => c.delta);
                return (
                  <div className="tl-row" key={p.id}>
                    <div className="tl-name rowlink" onClick={() => setDrawer(p.id)}><span className={`dot-s ${dotCls}`} />{p.name} {p.assignmentType === 'Returning' && <span className="pill green" style={{ fontSize: 9 }}>↩</span>}</div>
                    <div className="tl-track rowlink" onClick={() => setDrawer(p.id)}>
                      <div className={`tl-bar ${st}`} style={{ left: `${left}%`, width: `${Math.max(2, right - left)}%` }} />
                      <div className="tl-marker" style={{ left: `${pct(readinessBy(p))}%`, color: 'var(--bd-indigo)' }}>★</div>
                      <div className="tl-marker" style={{ left: `${left}%` }}>▲</div>
                      <div className="tl-marker" style={{ left: `${pct(addDays(p.requestedDelivery, 4))}%`, top: 1, fontSize: 8 }}>◆</div>
                      {recurringVisits(p).map((rv, i) => <div key={i} className="dot-s grey" style={{ position: 'absolute', top: 9, left: `${pct(rv)}%`, width: 5, height: 5 }} title={`recurring visit ${fmtDate(rv)}`} />)}
                      {(p.extraVisits || []).map((rv, i) => <div key={`x${i}`} className="dot-s amber" style={{ position: 'absolute', top: 9, left: `${pct(rv)}%`, width: 6, height: 6 }} title={`ad-hoc visit ${fmtDate(rv)}`} />)}
                      {lastDated && <div className="tl-marker" style={{ left: `${pct(lastDated.old)}%`, top: 9, opacity: 0.4 }} title={`previous date ${fmtDate(lastDated.old)}`}>◇</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="card table-scroll">
          <div className="small muted" style={{ padding: '10px 14px 0' }}>Cells are editable inline — change region, phase, dates, floors, and more; every edit flows to the timeline, the Process board, and the project. Click a project name to open its full drawer.</div>
          <table className="table">
            <thead><tr>
              <th>Project</th><th>Account</th><th>Region</th><th>Lead</th><th>Assign</th><th>Phase</th><th>Type</th><th className="num">Floors</th><th className="num">Bldgs</th><th className="num">Techs</th><th>Assigned</th><th>Channel</th><th>Owner</th><th>Training</th><th>Requested</th><th>Ready-by</th><th>Recruit-by</th><th>End</th><th className="num">%Ready</th><th>Status</th><th>Last change</th><th className="num">Vol</th>
            </tr></thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={p.id}>
                  <td><ProvDot provenance={p.provenance} /> <b className="rowlink" onClick={() => setDrawer(p.id)} style={{ textDecoration: 'underline dotted' }}>{p.name}</b></td>
                  <td><input className="cell-edit" value={p.account} onChange={(e) => editCell(p, 'account', e.target.value, 'Account')} /></td>
                  <td><Sel value={p.region} options={REGIONS} onChange={(v) => editCell(p, 'region', v, 'Region')} /></td>
                  <td>Gil</td>
                  <td><Sel value={p.assignmentType} options={['New-hire', 'Returning']} onChange={(v) => editCell(p, 'assignmentType', v, 'Assignment')} /></td>
                  <td><Sel value={phaseOfProgress(p)} options={PHASES} onChange={(v) => editPhase(p, v)} /></td>
                  <td><Sel value={p.type} options={TYPES} onChange={(v) => editCell(p, 'type', v, 'Type')} /></td>
                  <td><Num value={p.floors} onChange={(v) => editCell(p, 'floors', v, 'Floors')} /></td>
                  <td><Num value={p.buildings} onChange={(v) => editCell(p, 'buildings', v, 'Buildings')} /></td>
                  <td className="num">{techniciansNeeded(p)}</td>
                  <td className="small">{assignedNames(p, technicians).join(', ') || '—'}</td>
                  <td><Sel value={p.channel} options={CHANNELS} onChange={(v) => editCell(p, 'channel', v, 'Channel')} /></td>
                  <td>{p.owner}</td>
                  <td><Sel value={p.training || 'Not Done'} options={['Not Done', 'Done']} onChange={(v) => editCell(p, 'training', v, 'Training')} /></td>
                  <td><DateC value={p.requestedDelivery} onChange={(v) => editCell(p, 'requestedDelivery', v, 'Requested delivery')} /></td>
                  <td>{fmtDate(readinessBy(p))}</td><td>{fmtDate(recruitBy(p))}</td>
                  <td><DateC value={p.projectEnd} onChange={(v) => editCell(p, 'projectEnd', v, 'Project end')} /></td>
                  <td className="num">{readinessPct(p)}%</td>
                  <td><StatusPill status={projectStatus(p)} /></td>
                  <td>{changeBadge(p)}</td><td className="num">{p.changeCount || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {drawerProject && <ProcessDrawer project={drawerProject} technicians={technicians} onClose={() => setDrawer(null)} onEdit={() => { setModal({ ...drawerProject, startStep: stepOptions[drawerProject.progress || 0] }); setDrawer(null); }} onToggleStep={(i, cur) => toggleStep(drawerProject.id, i, cur)} onUpdate={(patch, log) => applyUpdate(drawerProject.id, patch, log)} />}
      {modal && <EntityModal title={modal.id && projects.some((p) => p.id === modal.id) ? `Edit ${modal.name}` : 'Add project'} fields={projFields} initial={modal} onSave={saveProj} onClose={() => setModal(null)} onDelete={modal.id && projects.some((p) => p.id === modal.id) ? () => remove('projects', modal.id) : undefined} />}
    </div>
  );
}
