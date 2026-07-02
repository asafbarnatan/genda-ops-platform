import { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend as RLegend } from 'recharts';
import { useStore } from '../data/store.jsx';
import { qualityComposite, suggestedPool, qualityTrend, metricTrend, activeTechs, METRIC_DEFS, assignedNames } from '../data/derive';
import { PoolPill, FilterBar } from '../components/bits.jsx';
import { Modal } from '../components/Modal.jsx';
import LogicPane from '../components/LogicPane.jsx';

const LINE_COLORS = ['#5B4FE9', '#3FB37F', '#E6B23C', '#8B7FE8', '#E5533D', '#2F6DB5'];
const METRIC_LINE = { coverage: '#5B4FE9', reliability: '#3FB37F', ontime: '#E6B23C', upload: '#8B7FE8', issues: '#E5533D' };

function CopyRow({ label, link }) {
  const [state, setState] = useState('');
  const copy = () => { navigator.clipboard?.writeText(link); setState('copied'); setTimeout(() => setState(''), 1500); };
  const slack = () => { setState('slack'); setTimeout(() => setState(''), 1500); };
  return (
    <div className="fb-actions" style={{ alignItems: 'center' }}>
      <span className="small muted" style={{ minWidth: 130 }}>{label}</span>
      <button className="btn btn-sm" onClick={copy}>🔗 Copy link</button>
      <button className="btn btn-sm" onClick={slack}>Send via Slack</button>
      {state === 'copied' && <span className="copytick">✓ link copied</span>}
      {state === 'slack' && <span className="copytick">✓ sent to Gil on Slack</span>}
    </div>
  );
}

function Scorecard({ tech, onClose, onSave, onDelete }) {
  const [m, setM] = useState(tech.metrics);
  const [pool, setPool] = useState(tech.pool);
  const [showDefs, setShowDefs] = useState(false);
  const comp = qualityComposite(m);
  const suggested = suggestedPool({ ...tech, metrics: m });
  const set = (k, v) => setM((s) => ({ ...s, [k]: Math.max(1, Math.min(5, Number(v) || 1)) }));
  const mt = metricTrend({ ...tech, metrics: m });

  return (
    <Modal title={`${tech.name} · Regional Lead feedback + scorecard`} onClose={onClose}
      footer={<>
        {onDelete && <button className="btn btn-danger btn-sm" style={{ marginRight: 'auto' }} onClick={() => { onDelete(); onClose(); }}>Delete</button>}
        <button className="btn-text" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={() => { onSave({ metrics: m, pool }); onClose(); }}>Save feedback</button>
      </>}>
      <div className="row" style={{ marginBottom: 14, gap: 24 }}>
        <div><div className="micro">Quality Score</div><div style={{ fontSize: 34, fontWeight: 700 }} className="mono-num">{comp}</div></div>
        <div><div className="micro">Candidate Score</div><div style={{ fontSize: 34, fontWeight: 700 }} className="mono-num">{tech.candidateScore ?? '—'}</div></div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}><div className="micro">Channel · Region</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 8 }}>{tech.channel} · {tech.region}</div><div className="small muted">{tech.installs} installs {tech.provisional && '· provisional'}</div></div>
      </div>

      <div className="micro" style={{ margin: '4px 0 8px', display: 'flex', justifyContent: 'space-between' }}>
        <span>RL feedback — the 5 reliability metrics (1-5)</span>
        <button className="btn-text btn-sm" onClick={() => setShowDefs((s) => !s)}>{showDefs ? 'hide' : 'show'} definitions</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {METRIC_DEFS.map((d) => (
          <div key={d.key}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 64px', alignItems: 'center', gap: 10 }}>
              <div><div style={{ fontSize: 13, fontWeight: 600 }}>{d.label}</div><div className="small muted">weight {d.weight} · {d.source}</div></div>
              <div className="scorebar"><span style={{ width: `${(m[d.key] / 5) * 100}%`, background: METRIC_LINE[d.key] }} /></div>
              <input className="input" type="number" min={1} max={5} step={1} value={m[d.key]} onChange={(e) => set(d.key, e.target.value)} style={{ minWidth: 0 }} />
            </div>
            {showDefs && <div className="rub" style={{ paddingLeft: 2 }}>{d.rubric}</div>}
          </div>
        ))}
      </div>

      <div className="micro" style={{ margin: '10px 0 4px' }}>Each metric over time</div>
      <div style={{ height: 170, marginBottom: 12 }}>
        <ResponsiveContainer>
          <LineChart data={mt} margin={{ left: -22, right: 8, top: 6 }}>
            <CartesianGrid stroke="#EFEFEF" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9A9B9D' }} axisLine={false} tickLine={false} />
            <YAxis domain={[2, 5]} tick={{ fontSize: 10, fill: '#9A9B9D' }} axisLine={false} tickLine={false} />
            <Tooltip />
            {METRIC_DEFS.map((d) => <Line key={d.key} type="monotone" dataKey={d.key} name={d.label} stroke={METRIC_LINE[d.key]} strokeWidth={1.6} dot={false} />)}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="field" style={{ marginBottom: 8 }}>
        <label>Pool state</label>
        <select className="input" value={pool} onChange={(e) => setPool(e.target.value)}>{['Active', 'Benched', 'Removed'].map((p) => <option key={p}>{p}</option>)}</select>
      </div>
      <div className={`pill ${suggested === 'Active' ? 'green' : suggested === 'Benched' ? 'amber' : 'red'}`} style={{ marginBottom: 12 }}>Threshold ladder suggests: {suggested}</div>
      <hr className="sep" style={{ margin: '4px 0 12px' }} />
      <div className="micro" style={{ marginBottom: 6 }}>Send this feedback form to the Regional Lead</div>
      <CopyRow label="Feedback request →" link={`https://genda-ops.app/feedback/${tech.id}`} />
      <div className="small muted" style={{ marginTop: 8 }}>Auto-sent after each install; the copy-link / Slack options cover the manual case.</div>
    </Modal>
  );
}

export default function Quality() {
  const { technicians, projects, update, remove } = useStore();
  const [f, setF] = useState({ region: 'All', channel: 'All' });
  const [sel, setSel] = useState(null);

  const match = (t) => (f.region === 'All' || t.region === f.region) && (f.channel === 'All' || t.channel === f.channel);
  const rows = technicians.filter(match);
  const trend = qualityTrend(technicians.filter(match));
  const acts = activeTechs(technicians.filter(match));
  const filters = [{ key: 'region', label: 'Region', options: ['Texas', 'Southeast', 'West'] }, { key: 'channel', label: 'Channel', options: ['Craigslist', 'Facebook', 'LinkedIn', 'Other'] }];
  const multiTechProjects = projects.filter((p) => !p.junk && (p.assignedTechs?.length || 0) > 1);

  return (
    <div className="page">
      <div className="page-head">
        <div><h1 className="page-title">Technician Quality</h1><div className="page-sub">Reliability over time · a transparent weighted composite · RL feedback closes the loop</div></div>
      </div>

      <LogicPane part="quality" />

      <FilterBar filters={filters} values={f} onChange={(k, v) => setF((s) => ({ ...s, [k]: v }))} />

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-head"><h3>Monthly quality trend</h3><span className="muted small">X = month · Y = 2-5 (zoomed so volatility is visible)</span></div>
        <div className="card-pad">
          <div className="chart-wrap">
            <ResponsiveContainer>
              <LineChart data={trend} margin={{ left: -18, right: 12, top: 8 }}>
                <CartesianGrid stroke="#EFEFEF" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9A9B9D' }} axisLine={false} tickLine={false} />
                <YAxis domain={[2, 5]} tick={{ fontSize: 11, fill: '#9A9B9D' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <RLegend wrapperStyle={{ fontSize: 11 }} />
                {acts.map((t, i) => <Line key={t.id} type="monotone" dataKey={t.id} name={t.name} stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2} dot={{ r: 2 }} />)}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-head"><h3>Technician roster</h3><span className="muted small">click a row → RL feedback form + scorecard</span></div>
        <table className="table">
          <thead><tr><th>Technician</th><th>Channel</th><th>Region</th><th className="num">Cand.</th><th className="num">Quality</th><th className="num">Installs</th><th>Pool</th></tr></thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="rowlink" onClick={() => setSel(t)}>
                <td><b>{t.name}</b> <span className="small muted">{t.id}</span></td>
                <td>{t.channel}</td><td>{t.region}</td>
                <td className="num">{t.candidateScore ?? '—'}</td>
                <td className="num"><b>{qualityComposite(t.metrics)}</b></td>
                <td className="num">{t.installs}</td>
                <td><PoolPill pool={t.pool} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-foot"><span>{rows.length} technicians</span><span className="muted">Provisional until ≥3 installs · no-show = hard gate</span></div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Feedback packages by project</h3><span className="muted small">projects with a crew get one bundled request to the RL</span></div>
        <div className="card-pad">
          {multiTechProjects.length === 0 && <div className="muted small">No multi-technician projects in the current filter.</div>}
          {multiTechProjects.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px solid #F1F1F1' }}>
              <div><b>{p.name}</b> <span className="pill grey">{p.assignedTechs.length} techs</span><div className="small muted">{assignedNames(p, technicians).join(' · ')}</div></div>
              <span className="spacer" />
              <CopyRow label="" link={`https://genda-ops.app/feedback/project/${p.id}`} />
            </div>
          ))}
        </div>
      </div>

      {sel && <Scorecard tech={sel} onClose={() => setSel(null)} onSave={(patch) => update('technicians', sel.id, patch)} onDelete={() => remove('technicians', sel.id)} />}
    </div>
  );
}
