import { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend as RLegend } from 'recharts';
import { useStore } from '../data/store.jsx';
import { qualityComposite, suggestedPool, qualityTrend, activeTechs, WEIGHTS } from '../data/derive';
import { PoolPill, Icon } from '../components/bits.jsx';
import { Modal } from '../components/Modal.jsx';

const LINE_COLORS = ['#5B4FE9', '#3FB37F', '#E6B23C', '#8B7FE8', '#E5533D', '#2F6DB5'];
const METRICS = [
  ['coverage', 'Coverage completeness', '30%'],
  ['reliability', 'Reliability (no-show)', '25%'],
  ['ontime', 'On-time arrival', '20%'],
  ['upload', 'Upload on-time', '15%'],
  ['issues', 'Issue / rework', '10%'],
];

function Scorecard({ tech, onClose, onSave, onDelete }) {
  const [m, setM] = useState(tech.metrics);
  const [pool, setPool] = useState(tech.pool);
  const comp = qualityComposite(m);
  const suggested = suggestedPool({ ...tech, metrics: m });
  const set = (k, v) => setM((s) => ({ ...s, [k]: Math.max(1, Math.min(5, Number(v) || 1)) }));

  return (
    <Modal
      title={`${tech.name} · scorecard`}
      onClose={onClose}
      footer={<>
        {onDelete && <button className="btn btn-danger btn-sm" style={{ marginRight: 'auto' }} onClick={() => { onDelete(); onClose(); }}>Delete</button>}
        <button className="btn-text" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={() => { onSave({ metrics: m, pool }); onClose(); }}>Save</button>
      </>}
    >
      <div className="row" style={{ marginBottom: 14, gap: 24 }}>
        <div><div className="micro">Quality Score</div><div style={{ fontSize: 34, fontWeight: 700 }} className="mono-num">{comp}</div></div>
        <div><div className="micro">Candidate Score (pre-deploy)</div><div style={{ fontSize: 34, fontWeight: 700 }} className="mono-num">{tech.candidateScore ?? '—'}</div></div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}><div className="micro">Channel · Region</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 8 }}>{tech.channel} · {tech.region}</div><div className="small muted">{tech.installs} installs {tech.provisional && '· provisional'}</div></div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
        {METRICS.map(([k, label, w]) => (
          <div key={k} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 70px', alignItems: 'center', gap: 10 }}>
            <div><div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div><div className="small muted">weight {w}</div></div>
            <div className="scorebar"><span style={{ width: `${(m[k] / 5) * 100}%` }} /></div>
            <input className="input" type="number" min={1} max={5} step={1} value={m[k]} onChange={(e) => set(k, e.target.value)} style={{ minWidth: 0 }} />
          </div>
        ))}
      </div>

      <div className="field" style={{ marginBottom: 6 }}>
        <label>Pool state</label>
        <select className="input" value={pool} onChange={(e) => setPool(e.target.value)}>{['Active', 'Benched', 'Removed'].map((p) => <option key={p}>{p}</option>)}</select>
      </div>
      <div className={`pill ${suggested === 'Active' ? 'green' : suggested === 'Benched' ? 'amber' : 'red'}`}>Threshold ladder suggests: {suggested}</div>
      <div className="small muted" style={{ marginTop: 8 }}>{tech.note}</div>
    </Modal>
  );
}

export default function Quality() {
  const { technicians, update, remove } = useStore();
  const [fRegion, setFRegion] = useState('All');
  const [fChannel, setFChannel] = useState('All');
  const [sel, setSel] = useState(null);

  const match = (t) => (fRegion === 'All' || t.region === fRegion) && (fChannel === 'All' || t.channel === fChannel);
  const rows = technicians.filter(match);
  const trend = qualityTrend(technicians.filter(match));
  const acts = activeTechs(technicians.filter(match));

  return (
    <div className="page">
      <div className="page-head">
        <div><h1 className="page-title">Technician Quality</h1><div className="page-sub">Reliability over time · weighted composite · edit a score and everything recomputes live</div></div>
      </div>

      <div className="toolbar">
        <span className="micro">Filter</span>
        <select className="input" value={fRegion} onChange={(e) => setFRegion(e.target.value)}><option>All</option>{['Texas', 'Southeast', 'West'].map((r) => <option key={r}>{r}</option>)}</select>
        <select className="input" value={fChannel} onChange={(e) => setFChannel(e.target.value)}><option>All</option>{['Craigslist', 'Facebook', 'LinkedIn', 'Other'].map((c) => <option key={c}>{c}</option>)}</select>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-head"><h3>Monthly quality trend</h3><span className="muted small">X = month · Y = avg composite (1-5)</span></div>
        <div className="card-pad">
          <div className="chart-wrap">
            <ResponsiveContainer>
              <LineChart data={trend} margin={{ left: -18, right: 12, top: 8 }}>
                <CartesianGrid stroke="#EFEFEF" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9A9B9D' }} axisLine={false} tickLine={false} />
                <YAxis domain={[1, 5]} tick={{ fontSize: 11, fill: '#9A9B9D' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <RLegend wrapperStyle={{ fontSize: 11 }} />
                {acts.map((t, i) => <Line key={t.id} type="monotone" dataKey={t.id} name={t.name} stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2} dot={{ r: 2 }} />)}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Technician roster</h3><span className="muted small">click a row to open the scorecard</span></div>
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

      {sel && <Scorecard tech={sel} onClose={() => setSel(null)} onSave={(patch) => update('technicians', sel.id, patch)} onDelete={() => remove('technicians', sel.id)} />}
    </div>
  );
}
