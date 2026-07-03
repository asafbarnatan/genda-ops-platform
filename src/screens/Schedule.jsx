import { useState, useEffect } from 'react';
import { useStore } from '../data/store.jsx';
import {
  projectStatus, statusReason, STATUS_LABEL, techniciansNeeded, readinessBy, recruitBy, fmtDate, parseDate, daysBetween,
  stepStatus, effectiveStep, readinessPct, phaseOfProgress, recurringVisits, assignedNames, activeTechs,
} from '../data/derive';
import { STEPS, PHASES, BOUNDARY_STEP } from '../data/seed';
import { StatusPill, Icon, FilterBar } from '../components/bits.jsx';
import { EntityModal, Modal } from '../components/Modal.jsx';
import OperatingLogic from '../components/OperatingLogic.jsx';
import GanttTimeline from '../components/GanttTimeline.jsx';

const REGIONS = ['Texas', 'Southeast', 'West'];
const CAUSES = ['Construction ahead', 'Construction behind', 'Client update', 'Site access', 'Internal reschedule'];
const CHANNELS = ['Craigslist', 'Facebook', 'LinkedIn', 'Other', 'Vendor - Cloud Factory'];
const TYPES = ['Residential', 'Healthcare', 'Commercial', 'Education'];
const STATUS_ORDER = { critical: 0, atrisk: 1, ontrack: 2, na: 3 };
const GLYPH = { done: '✓', doing: '◐', blocked: '✕', todo: '○', skipped: '⊘' };

// inline-editable table cells
const Sel = ({ value, options, onChange, wide }) => <select className={`cell-edit ${wide ? 'wide' : ''}`} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select>;
const Num = ({ value, onChange }) => <input className="cell-edit num-edit" type="number" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} />;
const DateC = ({ value, onChange }) => <input className="cell-edit" type="date" value={value || ''} onChange={(e) => onChange(e.target.value)} />;

function ProcessDrawer({ project, technicians, onClose, onEdit, onToggleStep, onUpdate }) {
  const [tab, setTab] = useState('process');
  const [openPhases, setOpenPhases] = useState([phaseOfProgress(project)]);
  const [dField, setDField] = useState('Requested Delivery');
  const [dDate, setDDate] = useState('');
  const [cause, setCause] = useState(CAUSES[0]);
  const [visit, setVisit] = useState('');
  const [evt, setEvt] = useState('');
  const [savedMsg, setSavedMsg] = useState('');
  const names = assignedNames(project, technicians);
  const roster = activeTechs(technicians);
  const sc = projectStatus(project);
  const flash = (msg) => { setSavedMsg(msg); setTimeout(() => setSavedMsg(''), 1800); };
  const doUpdate = (patch, log) => { onUpdate(patch, log); flash('✓ Saved to the project'); };

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
            <div className="small" style={{ marginTop: 8, padding: '7px 10px', borderRadius: 6, background: sc === 'critical' ? 'var(--bd-red-bg)' : sc === 'atrisk' ? 'var(--bd-amber-bg)' : 'var(--bd-green-bg)', color: sc === 'critical' ? '#b23524' : sc === 'atrisk' ? '#a5641b' : '#1f7a54' }}><b>Why {STATUS_LABEL[sc]}:</b> {statusReason(project)}</div>
          </div>
          <button className="x" onClick={onClose}>×</button>
        </div>
        <div className="drawer-tabs">
          {['process', 'manage', 'details', 'history'].map((t) => <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}{t === 'history' && project.changeLog?.length ? ` (${project.changeLog.length})` : ''}</button>)}
        </div>

        {tab === 'process' && (
          <div>
            <div style={{ padding: '10px 24px 0', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span className="small muted">Open any number of phases at once — parallel work is normal. Click a step to mark it done / blocked; it writes to History and recomputes readiness.</span>
              {savedMsg && <span className="pill green">{savedMsg}</span>}
              <span className="spacer" />
              <button className="btn-text btn-sm" onClick={() => setOpenPhases(PHASES)}>Expand all</button>
              <button className="btn-text btn-sm" onClick={() => setOpenPhases([])}>Collapse all</button>
            </div>
            {PHASES.map((phase) => {
              const steps = STEPS.filter((s) => s.phase === phase);
              const expanded = openPhases.includes(phase);
              const doneCount = steps.filter((s) => ['done', 'skipped'].includes(stepStatus(project, s.i))).length;
              return (
                <div key={phase}>
                  {steps[0].i === BOUNDARY_STEP && <div className="boundary">▾ Handoff to the Regional Lead (Gil) · field execution ▾</div>}
                  <div className="phase">
                    <div className="phase-head" onClick={() => setOpenPhases((o) => o.includes(phase) ? o.filter((x) => x !== phase) : [...o, phase])}>
                      <span style={{ color: 'var(--bd-ink-3)', fontSize: 12 }}>{expanded ? '▾' : '▸'}</span>
                      <span className="ph-t">{phase}</span>
                      <span className="pill grey">{doneCount}/{steps.length}</span>
                      <span className="spacer" /><span className="small muted">{steps[0].office ? 'office' : 'field'}</span>
                    </div>
                    {expanded && (
                      <div className="phase-steps">
                        {steps.map((s) => {
                          const st = stepStatus(project, s.i);
                          return (
                            <div className="step" key={s.i} style={{ cursor: 'pointer' }} onClick={() => { onToggleStep(s.i, st); flash(st === 'done' ? '✓ Step marked blocked' : st === 'blocked' ? '✓ Step reset' : '✓ Step marked done'); }} title="click to toggle done / blocked">
                              <span className={`glyph ${st}`} style={{ width: 18, height: 18, fontSize: 11 }}>{GLYPH[st]}</span>
                              <span className="small muted mono-num" style={{ minWidth: 18 }}>{s.i + 1}.</span>
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
            <div className="kv" style={{ gridColumn: '1 / -1', flexDirection: 'column', gap: 3 }}><span className="k">Status &amp; why</span><div><StatusPill status={sc} /> <span className="small">{statusReason(project)}</span></div></div>
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
  const [stageGuide, setStageGuide] = useState(false);

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
  const editStep = (p, label) => {
    const idx = parseInt(label, 10) - 1;
    const cur = effectiveStep(p);
    if (idx === cur) return;
    // Clear any ✕-block overrides on steps *below* the target so effectiveStep actually
    // advances to idx — otherwise a stale block would pin the project back and silently
    // discard this edit. Log the "old" position from the rendered effectiveStep, not raw progress.
    const stepState = Object.fromEntries(Object.entries(p.stepState || {}).filter(([k]) => Number(k) >= idx));
    applyUpdate(p.id, { progress: idx, stepState }, { field: 'Step', old: `${cur + 1}. ${STEPS[cur].name}`, new: label, cause: 'Table edit', note: `Moved to step ${idx + 1}` });
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
    if (v.id && projects.some((p) => p.id === v.id)) {
      // keep the chosen "start step" authoritative: drop block overrides below it so effectiveStep lands there
      const stepState = Object.fromEntries(Object.entries(v.stepState || {}).filter(([k]) => Number(k) >= progress));
      update('projects', v.id, { ...v, progress, stepState });
    } else add('projects', { ...v, id: v.name, product: 'Genda Pro', country: 'United States', owner: 'OM', channel: v.channel || 'Craigslist', requestedDelivery: v.requestedDelivery || null, assignedTechs: [], stage: 'Qualification', recruitmentStatus: 'Pre-recruitment', training: 'Not Done', progress, stepState: {}, changeLog: [], changeCount: 0 });
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
          <OperatingLogic part="schedule" />
          <div className="seg"><button className={view === 'timeline' ? 'active' : ''} onClick={() => setView('timeline')}>Timeline</button><button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')}>Table</button></div>
          <button className="btn btn-primary" onClick={() => setModal({ region: 'Southeast', type: 'Residential', assignmentType: 'New-hire', buildings: 1, startStep: stepOptions[0] })}><Icon.plus /> Project</button>
        </div>
      </div>

      <FilterBar filters={filters} values={f} onChange={(k, v) => setF((s) => ({ ...s, [k]: v }))} right={<span className="small muted">{rows.length} projects · click any project to manage it</span>} />

      {view === 'timeline' ? (
        <>
          <div className="legend-tile">
            <div className="legend-row">
              <span className="legend-label">Square = stage status</span>
              <span className="lk"><span className="gswatch" style={{ background: 'var(--bd-green)' }} /> Done</span>
              <span className="lk"><span className="gswatch" style={{ background: 'var(--bd-amber-s)' }} /> In progress</span>
              <span className="lk"><span className="gswatch" style={{ background: 'var(--bd-red)' }} /> Behind</span>
              <span className="lk"><span className="gswatch" style={{ background: 'var(--bd-ink-3)' }} /> Skipped (returning)</span>
              <span className="lk"><span className="gswatch" style={{ background: '#EBECEE', border: '1px solid var(--bd-border)' }} /> Upcoming</span>
            </div>
            <div className="legend-row">
              <span className="legend-label">Markers</span>
              <span className="lk"><span className="grd-ready-legend" /> Ready-by · SLA (~10 days early)</span>
              <span className="lk"><span className="grd-legend" /> Requested delivery (First Installation)</span>
              <span className="lk"><span style={{ display: 'inline-block', width: 2, height: 12, background: 'var(--bd-ink-3)', verticalAlign: 'middle' }} /> Today</span>
              <span className="lk"><span style={{ display: 'inline-block', width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: '6px solid var(--bd-ink)', verticalAlign: 'middle' }} /> Current stage</span>
              <span className="lk"><span className="dot-s grey" /> Quarterly visit</span>
              <span className="spacer" />
              <span className="small muted">Hover a square for its definition and date · the reading guide lives in Operating logic</span>
            </div>
          </div>
          <GanttTimeline projects={sorted} onOpen={(id) => setDrawer(id)} onOpenStageGuide={() => setStageGuide(true)} />
          {stageGuide && (
            <Modal title="Stage guide — the 24 process steps" onClose={() => setStageGuide(false)} footer={<button className="btn-text" onClick={() => setStageGuide(false)}>Close</button>}>
              <div className="small muted" style={{ marginBottom: 12 }}>Every square on the timeline is one of these steps, grouped into the 7 phases. Returning-tech projects skip Buildots Training + PPE (the fast path).</div>
              {PHASES.map((ph) => (
                <div key={ph} className="stage-guide-phase">
                  <div className="stage-guide-h">{ph}</div>
                  {STEPS.filter((s) => s.phase === ph).map((s) => (
                    <div key={s.i} className="stage-guide-row">
                      <span className="stage-guide-n">{s.i + 1}</span>
                      <div><b>{s.name}</b><div className="small muted">{s.info}</div></div>
                    </div>
                  ))}
                </div>
              ))}
            </Modal>
          )}
        </>
      ) : (
        <div className="card table-scroll">
          <div className="small muted" style={{ padding: '10px 14px 0' }}>Cells are editable inline — change region, phase, dates, floors, and more; every edit flows to the timeline, the Process board, and the project. Click a project name to open its full drawer.</div>
          <table className="table">
            <thead><tr>
              <th>Project</th><th>Status</th><th>Account</th><th>Region</th><th>Lead</th><th>Assign</th><th>Step (of 24)</th><th>Type</th><th className="num">Floors</th><th className="num">Bldgs</th><th className="num">Techs</th><th>Assigned</th><th>Channel</th><th>Owner</th><th>Training</th><th>Requested</th><th>Ready-by</th><th>Recruit-by</th><th>End</th><th className="num">%Ready</th><th>Last change</th><th className="num">Vol</th>
            </tr></thead>
            <tbody>
              {sorted.map((p) => {
                const sc = projectStatus(p);
                const dotCls = sc === 'ontrack' ? 'green' : sc === 'atrisk' ? 'amber' : sc === 'critical' ? 'red' : 'grey';
                const names = assignedNames(p, technicians);
                return (
                  <tr key={p.id}>
                    <td><span className={`dot-s ${dotCls}`} /> <b className="rowlink" onClick={() => setDrawer(p.id)} style={{ textDecoration: 'underline dotted' }}>{p.name}</b></td>
                    <td><StatusPill status={sc} /></td>
                    <td><input className="cell-edit" value={p.account} onChange={(e) => editCell(p, 'account', e.target.value, 'Account')} /></td>
                    <td><Sel value={p.region} options={REGIONS} onChange={(v) => editCell(p, 'region', v, 'Region')} /></td>
                    <td>Gil</td>
                    <td><Sel value={p.assignmentType} options={['New-hire', 'Returning']} onChange={(v) => editCell(p, 'assignmentType', v, 'Assignment')} /></td>
                    <td><Sel wide value={`${effectiveStep(p) + 1}. ${STEPS[effectiveStep(p)].name}`} options={stepOptions} onChange={(v) => editStep(p, v)} /></td>
                    <td><Sel value={p.type} options={TYPES} onChange={(v) => editCell(p, 'type', v, 'Type')} /></td>
                    <td><Num value={p.floors} onChange={(v) => editCell(p, 'floors', v, 'Floors')} /></td>
                    <td><Num value={p.buildings} onChange={(v) => editCell(p, 'buildings', v, 'Buildings')} /></td>
                    <td className="num">{techniciansNeeded(p)}</td>
                    <td>{names.length ? names.map((n) => <span key={n} className="pill grey" style={{ marginRight: 4 }}>{n}</span>) : '—'}</td>
                    <td><Sel value={p.channel} options={CHANNELS} onChange={(v) => editCell(p, 'channel', v, 'Channel')} /></td>
                    <td>{p.owner}</td>
                    <td><Sel value={p.training || 'Not Done'} options={['Not Done', 'Done']} onChange={(v) => editCell(p, 'training', v, 'Training')} /></td>
                    <td><DateC value={p.requestedDelivery} onChange={(v) => editCell(p, 'requestedDelivery', v, 'Requested delivery')} /></td>
                    <td>{fmtDate(readinessBy(p))}</td><td>{fmtDate(recruitBy(p))}</td>
                    <td><DateC value={p.projectEnd} onChange={(v) => editCell(p, 'projectEnd', v, 'Project end')} /></td>
                    <td className="num">{readinessPct(p)}%</td>
                    <td>{changeBadge(p)}</td><td className="num">{p.changeCount || 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {drawerProject && <ProcessDrawer project={drawerProject} technicians={technicians} onClose={() => setDrawer(null)} onEdit={() => { setModal({ ...drawerProject, startStep: stepOptions[effectiveStep(drawerProject)] }); setDrawer(null); }} onToggleStep={(i, cur) => toggleStep(drawerProject.id, i, cur)} onUpdate={(patch, log) => applyUpdate(drawerProject.id, patch, log)} />}
      {modal && <EntityModal title={modal.id && projects.some((p) => p.id === modal.id) ? `Edit ${modal.name}` : 'Add project'} fields={projFields} initial={modal} onSave={saveProj} onClose={() => setModal(null)} onDelete={modal.id && projects.some((p) => p.id === modal.id) ? () => remove('projects', modal.id) : undefined} />}
    </div>
  );
}
