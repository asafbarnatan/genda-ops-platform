import { useState } from 'react';
import { useStore } from '../data/store.jsx';
import { projectStatus, STATUS_LABEL, techniciansNeeded, readinessBy, recruitBy, fmtDate, parseDate } from '../data/derive';
import { processTemplate } from '../data/seed';
import { StatusPill, ProvPill, Icon } from '../components/bits.jsx';
import { EntityModal } from '../components/Modal.jsx';

const REGIONS = ['Texas', 'Southeast', 'West'];
const projFields = [
  { name: 'name', label: 'Project name' },
  { name: 'account', label: 'Account' },
  { name: 'region', label: 'Region', type: 'select', options: REGIONS },
  { name: 'type', label: 'Type', type: 'select', options: ['Residential', 'Healthcare', 'Commercial', 'Education'] },
  { name: 'floors', label: 'Floors', type: 'number', min: 0 },
  { name: 'buildings', label: 'Buildings', type: 'number', min: 1 },
  { name: 'requestedDelivery', label: 'Requested delivery', type: 'date' },
  { name: 'projectEnd', label: 'Project end', type: 'date' },
  { name: 'recruitmentStatus', label: 'Recruitment status', type: 'select', options: ['Pre-recruitment', 'Onboarded', 'Scheduled', 'Deployed'] },
  { name: 'training', label: 'Training', type: 'select', options: ['Not Done', 'Done'] },
];

const STATUS_ORDER = { critical: 0, atrisk: 1, ontrack: 2, na: 3 };
const LEVEL = { 'Pre-recruitment': 1, Onboarded: 4, Scheduled: 5, Deployed: 6 };

function ProcessDrawer({ project, onClose, onEdit }) {
  const [tab, setTab] = useState('process');
  const level = LEVEL[project.recruitmentStatus] ?? 1;
  const [open, setOpen] = useState(processTemplate.map((p, i) => i === Math.min(level, 6)));
  const glyphFor = (phaseIdx) => phaseIdx < level ? 'done' : phaseIdx === level ? 'doing' : 'todo';
  const glyphChar = { done: '✓', doing: '◐', todo: '○', blocked: '✕', skip: '⊘' };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <div className="micro">Project</div>
            <h3 style={{ fontSize: 18, margin: '2px 0 6px' }}>{project.name} <StatusPill status={projectStatus(project)} /></h3>
            <div className="small muted">Blocker: {project.recruitmentStatus === 'Pre-recruitment' ? 'no technician sourced yet' : 'none'} · Next: {project.recruitmentStatus === 'Deployed' ? 'first installation' : 'advance readiness'}</div>
          </div>
          <button className="x" onClick={onClose}>×</button>
        </div>
        <div className="drawer-tabs">
          {['process', 'details', 'history'].map((t) => <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>)}
        </div>

        {tab === 'process' && (
          <div>
            {processTemplate.map((ph, i) => {
              const g = glyphFor(i);
              return (
                <div key={ph.phase}>
                  {i === 4 && <div className="boundary">◂ our ownership ends here · field execution (Gil) ▸</div>}
                  <div className="phase">
                    <div className="phase-head" onClick={() => setOpen((o) => o.map((v, j) => j === i ? !v : v))}>
                      <span className={`glyph ${g}`}>{glyphChar[g]}</span>
                      <span className="ph-t">{ph.phase}</span>
                      <span className="spacer" />
                      <span className="small muted">{ph.office ? 'office' : 'field'}</span>
                    </div>
                    {open[i] && (
                      <div className="phase-steps">
                        {ph.steps.map((s, si) => {
                          const sg = g === 'done' ? 'done' : g === 'doing' ? (si === 0 ? 'doing' : 'todo') : 'todo';
                          return <div className="step" key={s}><span className={`glyph ${sg}`} style={{ width: 16, height: 16, fontSize: 10 }}>{glyphChar[sg]}</span>{s}</div>;
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
            {[['Account', project.account], ['Region', project.region], ['Type', project.type], ['Floors', project.floors ?? '—'], ['Buildings', project.buildings ?? '—'], ['Technicians needed', techniciansNeeded(project)], ['Requested delivery', fmtDate(project.requestedDelivery)], ['Readiness-by (SLA)', fmtDate(readinessBy(project))], ['Recruit-by', fmtDate(recruitBy(project))], ['Project end', fmtDate(project.projectEnd)], ['Channel', project.channel], ['Opportunity Owner', `${project.owner} (sales rep)`], ['Assigned techs', project.assignedTechs?.join(', ') || '—'], ['Candidate score', project.candidateScore ?? '—']].map(([k, v]) => (
              <div className="kv" key={k} style={{ flexDirection: 'column', gap: 2 }}><span className="k">{k}</span><b>{v}</b></div>
            ))}
            {project.dataNote && <div className="field full"><span className="pill fictive" style={{ width: 'fit-content' }}>data note</span><div className="small muted">{project.dataNote}</div></div>}
          </div>
        )}

        {tab === 'history' && (
          <div className="card-pad">
            <div className="small muted" style={{ marginBottom: 8 }}>Change log (audit trail). Date changes recompute the Readiness SLA + status automatically.</div>
            <div className="step"><span className="glyph done">✓</span> Created · {fmtDate(project.requestedDelivery)} requested delivery set</div>
            <div className="step"><span className="glyph doing">◐</span> {project.recruitmentStatus} · training {project.training || '—'}</div>
          </div>
        )}

        <div className="modal-foot"><button className="btn btn-sm" onClick={onEdit}>Edit project</button><button className="btn btn-primary btn-sm" onClick={onClose}>Close</button></div>
      </div>
    </div>
  );
}

export default function Schedule() {
  const { projects, add, update, remove } = useStore();
  const [view, setView] = useState('timeline');
  const [fRegion, setFRegion] = useState('All');
  const [drawer, setDrawer] = useState(null);
  const [modal, setModal] = useState(null);

  const rows = projects.filter((p) => !p.junk && (fRegion === 'All' || p.region === fRegion));
  const sorted = [...rows].sort((a, b) => (STATUS_ORDER[projectStatus(a)] - STATUS_ORDER[projectStatus(b)]) || (parseDate(a.requestedDelivery) - parseDate(b.requestedDelivery)));

  const dates = rows.flatMap((p) => [p.requestedDelivery, p.projectEnd]).filter(Boolean).map(parseDate);
  const min = new Date(Math.min(...dates)), max = new Date(Math.max(...dates));
  const pct = (d) => { const t = parseDate(d); if (!t) return 0; return Math.max(0, Math.min(100, ((t - min) / (max - min)) * 100)); };
  const years = [2026, 2027, 2028, 2029];

  const saveProj = (v) => {
    if (v.id && projects.some((p) => p.id === v.id)) update('projects', v.id, v);
    else add('projects', { ...v, id: v.name, product: 'Genda Pro', country: 'United States', owner: 'OM', channel: v.channel || 'Craigslist', assignedTechs: [], stage: 'Qualification' });
  };

  return (
    <div className="page">
      <div className="page-head">
        <div><h1 className="page-title">Project Schedule</h1><div className="page-sub">Managing change: dates shift, risk is recomputed, at-risk floats to the top</div></div>
        <div className="row">
          <div className="seg"><button className={view === 'timeline' ? 'active' : ''} onClick={() => setView('timeline')}>Timeline</button><button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')}>Table</button></div>
          <button className="btn btn-primary" onClick={() => setModal({ region: 'Southeast', type: 'Residential', buildings: 1, recruitmentStatus: 'Pre-recruitment', training: 'Not Done' })}><Icon.plus /> Project</button>
        </div>
      </div>

      <div className="toolbar">
        <span className="micro">Filter</span>
        <select className="input" value={fRegion} onChange={(e) => setFRegion(e.target.value)}><option>All</option>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select>
        <span className="spacer" />
        <span className="small muted">Timeline & table are linked to the same data · click any project for its 24-step process</span>
      </div>

      {view === 'timeline' ? (
        <div className="card card-pad">
          <div className="tl-axis"><div /><div className="ticks">{years.map((y) => <span key={y}>{y}</span>)}</div></div>
          <div className="timeline">
            {sorted.map((p) => {
              const st = projectStatus(p);
              const left = pct(p.requestedDelivery), right = pct(p.projectEnd || p.requestedDelivery);
              return (
                <div className="tl-row" key={p.id}>
                  <div className="tl-name rowlink" onClick={() => setDrawer(p)}><span className={`dot-s ${st === 'ontrack' ? 'green' : st === 'atrisk' ? 'amber' : st === 'critical' ? 'red' : 'grey'}`} />{p.name}</div>
                  <div className="tl-track rowlink" onClick={() => setDrawer(p)}>
                    <div className={`tl-bar ${st}`} style={{ left: `${left}%`, width: `${Math.max(2, right - left)}%` }} />
                    <div className="tl-marker" style={{ left: `${left}%` }}>▲</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="small muted" style={{ marginTop: 10 }}>▲ = Requested Delivery (go-live). Bar = active window to Project End. Color = readiness status.</div>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead><tr><th>Project</th><th>Region</th><th>Account</th><th className="num">Floors</th><th className="num">Techs</th><th>Requested delivery</th><th>Status</th><th>Source</th></tr></thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={p.id} className="rowlink" onClick={() => setDrawer(p)}>
                  <td><b>{p.name}</b></td><td>{p.region}</td><td>{p.account}</td>
                  <td className="num">{p.floors ?? '—'}</td><td className="num">{techniciansNeeded(p)}</td>
                  <td>{fmtDate(p.requestedDelivery)}</td><td><StatusPill status={projectStatus(p)} /></td>
                  <td><ProvPill provenance={p.provenance} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-foot"><span>{sorted.length} projects</span><span>Rows per page: 100 · 1 of 1</span></div>
        </div>
      )}

      {drawer && <ProcessDrawer project={drawer} onClose={() => setDrawer(null)} onEdit={() => { setModal(drawer); setDrawer(null); }} />}
      {modal && <EntityModal title={modal.id ? `Edit ${modal.name}` : 'Add project'} fields={projFields} initial={modal} onSave={saveProj} onClose={() => setModal(null)} onDelete={modal.id ? () => remove('projects', modal.id) : undefined} />}
    </div>
  );
}
