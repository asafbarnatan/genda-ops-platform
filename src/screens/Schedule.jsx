import { useState, useEffect } from 'react';
import { useStore } from '../data/store.jsx';
import {
  projectStatus, techniciansNeeded, readinessBy, recruitBy, fmtDate, parseDate,
  stepStatus, readinessPct, phaseOfProgress, recurringVisits, assignedNames,
} from '../data/derive';
import { STEPS, PHASES, BOUNDARY_STEP } from '../data/seed';
import { StatusPill, ProvDot, Icon } from '../components/bits.jsx';
import { FilterBar } from '../components/bits.jsx';
import { Modal, EntityModal } from '../components/Modal.jsx';

const REGIONS = ['Texas', 'Southeast', 'West'];
const STATUS_ORDER = { critical: 0, atrisk: 1, ontrack: 2, na: 3 };
const GLYPH = { done: '✓', doing: '◐', blocked: '✕', todo: '○', skipped: '⊘' };

function ProcessDrawer({ project, technicians, onClose, onEdit, onToggleStep }) {
  const [tab, setTab] = useState('process');
  const [openPhase, setOpenPhase] = useState(phaseOfProgress(project));
  const names = assignedNames(project, technicians);
  const lastChange = project.changeLog?.[project.changeLog.length - 1];

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <div className="micro">Project · {project.assignmentType}</div>
            <h3 style={{ fontSize: 18, margin: '2px 0 6px' }}>{project.name} <StatusPill status={projectStatus(project)} /></h3>
            <div className="small muted">Readiness {readinessPct(project)}% · phase: {phaseOfProgress(project)} · blocker: {Object.values(project.stepState || {}).includes('blocked') ? 'a step is blocked' : 'none'}</div>
          </div>
          <button className="x" onClick={onClose}>×</button>
        </div>
        <div className="drawer-tabs">
          {['process', 'details', 'history'].map((t) => <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}{t === 'history' && project.changeLog?.length ? ` (${project.changeLog.length})` : ''}</button>)}
        </div>

        {tab === 'process' && (
          <div>
            <div className="small muted" style={{ padding: '10px 24px 0' }}>Click a step to mark it done / blocked. Every change writes to the History log and recomputes the Readiness SLA.</div>
            {PHASES.map((phase) => {
              const steps = STEPS.filter((s) => s.phase === phase);
              const expanded = openPhase === phase;
              return (
                <div key={phase}>
                  {steps[0].i === BOUNDARY_STEP && <div className="boundary">▾ Handoff to the Regional Lead (Gil) · field execution ▾</div>}
                  <div className="phase">
                    <div className="phase-head" onClick={() => setOpenPhase(expanded ? null : phase)}>
                      <span className="ph-t">{phase}</span><span className="spacer" />
                      <span className="small muted">{steps[0].office ? 'office' : 'field'}</span>
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

        {tab === 'details' && (
          <div className="card-pad" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['Account', project.account], ['Region', project.region], ['Region Lead', 'Gil'], ['Type', project.type], ['Assignment', project.assignmentType],
              ['Floors', project.floors ?? '—'], ['Buildings', project.buildings ?? '—'], ['Technicians needed', techniciansNeeded(project)],
              ['Assigned', names.length ? names.join(', ') : '—'], ['Requested delivery', fmtDate(project.requestedDelivery)],
              ['Readiness-by (SLA)', fmtDate(readinessBy(project))], ['Recruit-by', fmtDate(recruitBy(project))], ['Project end', fmtDate(project.projectEnd)],
              ['Recurring visits', `${recurringVisits(project).length} (quarterly)`], ['Channel', project.channel], ['Opportunity Owner', `${project.owner} (sales rep)`],
              ['Candidate score', project.candidateScore ?? '—'], ['Change count (volatility)', project.changeCount || 0],
            ].map(([k, v]) => (
              <div className="kv" key={k} style={{ flexDirection: 'column', gap: 2 }}><span className="k">{k}</span><b>{v}</b></div>
            ))}
            {project.dataNote && <div className="field full"><span className="pill fictive" style={{ width: 'fit-content' }}>data note</span><div className="small muted">{project.dataNote}</div></div>}
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
                  <span className={`glyph ${accel ? 'blocked' : 'doing'}`} style={{ width: 18, height: 18, fontSize: 11 }}>{c.delta < 0 ? '⇤' : c.delta > 0 ? '⇥' : '•'}</span>
                  <div>
                    <div style={{ fontSize: 13 }}><b>{c.field}</b> {fmtDate(c.old)} → {fmtDate(c.new)} <span className={accel ? 'pill red' : 'pill grey'}>{c.delta > 0 ? '+' : ''}{c.delta}d{accel ? ' · acceleration' : ''}</span></div>
                    <div className="small muted">{c.cause} · {c.by} · {fmtDate(c.ts)} — {c.note}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="modal-foot"><button className="btn btn-sm" onClick={onEdit}>Edit fields</button><button className="btn btn-primary btn-sm" onClick={onClose}>Close</button></div>
      </div>
    </div>
  );
}

export default function Schedule() {
  const { projects, technicians, update, add, remove, route, clearFocus, navigate } = useStore();
  const [view, setView] = useState('timeline');
  const [f, setF] = useState({ region: 'All', account: 'All', type: 'All' });
  const [drawer, setDrawer] = useState(null);
  const [modal, setModal] = useState(null);

  // deep-link: open a project drawer when navigated with focus
  useEffect(() => {
    if (route.focus) {
      const p = projects.find((x) => x.id === route.focus);
      if (p) setDrawer(p.id);
      clearFocus();
    }
  }, [route.focus]); // eslint-disable-line

  const drawerProject = drawer ? projects.find((p) => p.id === drawer) : null;
  const accounts = [...new Set(projects.filter((p) => !p.junk).map((p) => p.account))];
  const filters = [
    { key: 'region', label: 'Region', options: REGIONS },
    { key: 'account', label: 'Account', options: accounts },
    { key: 'type', label: 'Assignment', options: ['New-hire', 'Returning'] },
  ];
  const matches = (p) => (f.region === 'All' || p.region === f.region) && (f.account === 'All' || p.account === f.account) && (f.type === 'All' || p.assignmentType === f.type);

  const real = projects.filter((p) => !p.junk && matches(p));
  const junk = projects.filter((p) => p.junk && matches(p));
  const sorted = [...real].sort((a, b) => (STATUS_ORDER[projectStatus(a)] - STATUS_ORDER[projectStatus(b)]) || (parseDate(a.requestedDelivery) - parseDate(b.requestedDelivery)));
  const tableRows = [...sorted, ...junk];

  const dates = real.flatMap((p) => [p.requestedDelivery, p.projectEnd]).filter(Boolean).map(parseDate);
  const min = dates.length ? new Date(Math.min(...dates)) : new Date('2026-01-01');
  const max = dates.length ? new Date(Math.max(...dates)) : new Date('2029-12-31');
  const pct = (d) => { const t = parseDate(d); if (!t) return 0; return Math.max(0, Math.min(100, ((t - min) / (max - min)) * 100)); };
  const years = [2026, 2027, 2028, 2029];

  const toggleStep = (projId, stepIndex, current) => {
    const p = projects.find((x) => x.id === projId);
    const next = current === 'done' ? 'blocked' : current === 'blocked' ? undefined : 'done';
    const stepState = { ...(p.stepState || {}) };
    if (next === undefined) delete stepState[stepIndex]; else stepState[stepIndex] = next;
    const entry = { id: `c-${Date.now()}`, ts: new Date().toISOString().slice(0, 10), field: `Step: ${STEPS[stepIndex].name}`, old: current, new: next || 'default', delta: 0, cause: 'Manual update', by: 'OM', note: `Marked ${next || 'reset'}` };
    update('projects', projId, { stepState, changeLog: [...(p.changeLog || []), entry] });
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
    const c = p.changeLog?.[p.changeLog.length - 1];
    if (!c || c.delta === 0) return null;
    const accel = c.delta < -10;
    return <span className={accel ? 'pill red' : 'pill grey'} title={`${c.cause}: ${c.old} → ${c.new}`}>{c.delta > 0 ? '⇥ +' : '⇤ '}{c.delta}d</span>;
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

      <FilterBar filters={filters} values={f} onChange={(k, v) => setF((s) => ({ ...s, [k]: v }))} right={<span className="small muted">{real.length} active + {projects.filter((p) => p.junk).length} flagged = 14 provided · timeline & table share one dataset</span>} />

      {view === 'timeline' ? (
        <div className="card card-pad">
          <div className="tl-axis"><div /><div className="ticks">{years.map((y) => <span key={y}>{y}</span>)}</div></div>
          <div className="timeline">
            {sorted.map((p) => {
              const st = projectStatus(p);
              const left = pct(p.requestedDelivery), right = pct(p.projectEnd || p.requestedDelivery);
              const dotCls = st === 'ontrack' ? 'green' : st === 'atrisk' ? 'amber' : st === 'critical' ? 'red' : 'grey';
              return (
                <div className="tl-row" key={p.id}>
                  <div className="tl-name rowlink" onClick={() => setDrawer(p.id)}><span className={`dot-s ${dotCls}`} />{p.name} {p.assignmentType === 'Returning' && <span className="pill green" style={{ fontSize: 9 }}>↩</span>}</div>
                  <div className="tl-track rowlink" onClick={() => setDrawer(p.id)}>
                    <div className={`tl-bar ${st}`} style={{ left: `${left}%`, width: `${Math.max(2, right - left)}%` }} />
                    <div className="tl-marker" style={{ left: `${left}%` }}>▲</div>
                    {recurringVisits(p).map((rv, i) => <div key={i} className="dot-s grey" style={{ position: 'absolute', top: 9, left: `${pct(rv)}%`, width: 5, height: 5 }} title={`recurring visit ${fmtDate(rv)}`} />)}
                    {p.changeLog?.length > 0 && <div className="tl-marker" style={{ left: `${pct(p.changeLog[p.changeLog.length - 1].old)}%`, top: 9, opacity: 0.4 }} title="previous date">◇</div>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="small muted" style={{ marginTop: 10 }}>▲ Requested Delivery · ◇ previous date (ghost) · • quarterly recurring visit · ↩ returning-tech (short runway). Bar color = readiness status.</div>
        </div>
      ) : (
        <div className="card table-scroll">
          <table className="table">
            <thead><tr>
              <th>Project</th><th>Account</th><th>Region</th><th>Lead</th><th>Assign</th><th className="num">Floors</th><th className="num">Techs</th><th>Assigned</th><th>Requested</th><th>Ready-by</th><th>Recruit-by</th><th>Phase</th><th className="num">%Ready</th><th>Status</th><th>Last change</th><th className="num">Vol</th>
            </tr></thead>
            <tbody>
              {tableRows.map((p) => p.junk ? (
                <tr key={p.id} style={{ opacity: 0.5 }}>
                  <td><ProvDot provenance="provided" /> <b>{p.name}</b> <span className="pill grey">junk row</span></td>
                  <td colSpan={15} className="small muted">Suspected test/junk row — missing floors/buildings/end date; excluded from ops math (kept so the count reconciles to the 14 provided).</td>
                </tr>
              ) : (
                <tr key={p.id} className="rowlink" onClick={() => setDrawer(p.id)}>
                  <td><ProvDot provenance={p.provenance} /> <b>{p.name}</b></td>
                  <td>{p.account}</td><td>{p.region}</td><td>Gil</td>
                  <td>{p.assignmentType === 'Returning' ? <span className="pill green">Returning</span> : <span className="pill grey">New-hire</span>}</td>
                  <td className="num">{p.floors}</td><td className="num">{techniciansNeeded(p)}</td>
                  <td className="small">{assignedNames(p, technicians).join(', ') || '—'}</td>
                  <td>{fmtDate(p.requestedDelivery)}</td><td>{fmtDate(readinessBy(p))}</td><td>{fmtDate(recruitBy(p))}</td>
                  <td className="small">{phaseOfProgress(p)}</td><td className="num">{readinessPct(p)}%</td>
                  <td><StatusPill status={projectStatus(p)} /></td>
                  <td>{changeBadge(p) || <span className="muted">—</span>}</td>
                  <td className="num">{p.changeCount || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {drawerProject && <ProcessDrawer project={drawerProject} technicians={technicians} onClose={() => setDrawer(null)} onEdit={() => { setModal({ ...drawerProject, startStep: stepOptions[drawerProject.progress || 0] }); setDrawer(null); }} onToggleStep={(i, cur) => toggleStep(drawerProject.id, i, cur)} />}
      {modal && <EntityModal title={modal.id && projects.some((p) => p.id === modal.id) ? `Edit ${modal.name}` : 'Add project'} fields={projFields} initial={modal} onSave={saveProj} onClose={() => setModal(null)} onDelete={modal.id && projects.some((p) => p.id === modal.id) ? () => remove('projects', modal.id) : undefined} />}
    </div>
  );
}
