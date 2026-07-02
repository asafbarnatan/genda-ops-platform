import { useState } from 'react';
import { useStore } from '../data/store.jsx';
import { funnel, channelScorecard, qualityComposite, activeTechs } from '../data/derive';
import { EntityModal } from '../components/Modal.jsx';
import { Icon, PoolPill, ProvPill } from '../components/bits.jsx';

const CHANNELS = ['Craigslist', 'Facebook', 'LinkedIn', 'Other', 'Vendor - Cloud Factory'];
const REGIONS = ['Texas', 'Southeast', 'West'];

function nextId(prefix, arr) {
  const nums = arr.map((r) => parseInt(String(r.id).replace(/\D/g, ''), 10)).filter((n) => !isNaN(n));
  return `${prefix}-${(Math.max(0, ...nums) + 1)}`;
}

const candFields = [
  { name: 'name', label: 'Name' },
  { name: 'channel', label: 'Channel', type: 'select', options: CHANNELS },
  { name: 'region', label: 'Region', type: 'select', options: REGIONS },
  { name: 'stage', label: 'Stage', type: 'select', options: ['Sourced', 'Screened', 'Onboarded', 'Deployed'] },
  { name: 'daysInStage', label: 'Days in stage', type: 'number', min: 0 },
  { name: 'candidateScore', label: 'Candidate score (1-5)', type: 'number', min: 1, max: 5 },
  { name: 'nextAction', label: 'Next action', full: true },
];
const techFields = [
  { name: 'name', label: 'Name' },
  { name: 'channel', label: 'Channel', type: 'select', options: CHANNELS },
  { name: 'region', label: 'Region', type: 'select', options: REGIONS },
  { name: 'lead', label: 'Region Lead', type: 'select', options: ['Gil', 'Itamar'] },
  { name: 'pool', label: 'Pool state', type: 'select', options: ['Active', 'Benched', 'Removed'] },
  { name: 'candidateScore', label: 'Candidate score (1-5)', type: 'number', min: 1, max: 5 },
];

export default function Pipeline() {
  const { candidates, technicians, add, update, remove } = useStore();
  const [fChannel, setFChannel] = useState('All');
  const [fRegion, setFRegion] = useState('All');
  const [modal, setModal] = useState(null); // {type:'cand'|'tech', row?}

  const matchC = (r) => (fChannel === 'All' || r.channel === fChannel) && (fRegion === 'All' || r.region === fRegion);
  const cands = candidates.filter(matchC);
  const techs = technicians.filter(matchC);
  const f = funnel(candidates, technicians);
  const scorecard = channelScorecard(technicians);

  const byStage = (s) => cands.filter((c) => c.stage === s);
  const deployed = techs.filter((t) => t.pool === 'Active');
  const pool = techs.filter((t) => t.pool !== 'Active');

  const openCand = (row) => setModal({ type: 'cand', row });
  const openTech = (row) => setModal({ type: 'tech', row });

  const saveCand = (v) => {
    if (v.id) update('candidates', v.id, v);
    else add('candidates', { ...v, id: nextId('C', candidates), stageSla: 10, owner: 'OM', dropoff: '', note: '' });
  };
  const saveTech = (v) => {
    if (v.id) update('technicians', v.id, v);
    else add('technicians', { ...v, id: nextId('T', technicians), metrics: { coverage: 3, reliability: 3, ontime: 3, upload: 3, issues: 3 }, installs: 0, projects: [], provisional: true, note: '' });
  };

  return (
    <div className="page">
      <div className="page-head">
        <div><h1 className="page-title">Recruitment Pipeline</h1><div className="page-sub">Sourced → Screened → Onboarded → Deployed · one dataset, filter to compare channels</div></div>
        <div className="row">
          <button className="btn" onClick={() => openCand({ stage: 'Sourced', channel: 'Craigslist', region: 'Southeast', candidateScore: 3, daysInStage: 0 })}><Icon.plus /> Candidate</button>
          <button className="btn btn-primary" onClick={() => openTech({ pool: 'Active', channel: 'Craigslist', region: 'Southeast', lead: 'Gil', candidateScore: 3 })}><Icon.plus /> Technician</button>
        </div>
      </div>

      <div className="toolbar">
        <span className="micro">Filter</span>
        <select className="input" value={fChannel} onChange={(e) => setFChannel(e.target.value)}><option>All</option>{CHANNELS.map((c) => <option key={c}>{c}</option>)}</select>
        <select className="input" value={fRegion} onChange={(e) => setFRegion(e.target.value)}><option>All</option>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select>
        <span className="spacer" />
        <span className="small muted">Funnel: {f.counts.Sourced} sourced · {f.counts.Screened} screened · {f.counts.Onboarded} onboarded · {deployed.length} deployed · {pool.length} in pool</span>
      </div>

      {/* Kanban */}
      <div className="kanban" style={{ marginBottom: 24 }}>
        {['Sourced', 'Screened', 'Onboarded'].map((s) => (
          <div className="kcol" key={s}>
            <div className="kcol-head"><span className="t">{s}</span><span className="pill grey">{byStage(s).length}</span></div>
            {byStage(s).map((c) => (
              <div className="kcard" key={c.id} onClick={() => openCand(c)}>
                <div className="n">{c.name}</div>
                <div className="m"><span>{c.channel}</span>·<span>{c.region}</span>{c.daysInStage != null && <span className="pill grey">{c.daysInStage}d</span>}</div>
              </div>
            ))}
          </div>
        ))}
        <div className="kcol">
          <div className="kcol-head"><span className="t">Deployed</span><span className="pill grey">{deployed.length}</span></div>
          {deployed.map((t) => (
            <div className="kcard" key={t.id} onClick={() => openTech(t)}>
              <div className="n">{t.name}</div>
              <div className="m"><span>{t.channel}</span>·<span>Q {qualityComposite(t.metrics)}</span></div>
            </div>
          ))}
        </div>
        <div className="kcol" style={{ background: '#F2EEF9' }}>
          <div className="kcol-head"><span className="t">Pool (sidelined)</span><span className="pill grey">{pool.length}</span></div>
          {pool.map((t) => (
            <div className="kcard" key={t.id} onClick={() => openTech(t)}>
              <div className="n">{t.name}</div>
              <div className="m"><PoolPill pool={t.pool} /><span>Q {qualityComposite(t.metrics)}</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* Channel scorecard */}
      <div className="card">
        <div className="card-head"><h3>Channel-quality scorecard</h3><span className="muted small">the vendor case: Craigslist's own churn</span></div>
        <table className="table">
          <thead><tr><th>Channel</th><th className="num">Technicians</th><th className="num">Avg quality</th><th className="num">Churn rate</th><th>Read</th></tr></thead>
          <tbody>
            {scorecard.map((r) => (
              <tr key={r.channel}>
                <td><b>{r.channel}</b> {r.projected && <span className="pill indigo">projected</span>}</td>
                <td className="num">{r.projected ? '2 in pipeline' : r.count}</td>
                <td className="num">{r.avgQuality ?? '—'}</td>
                <td className="num">{r.projected ? '—' : `${r.churnRate}%`}</td>
                <td className="small muted">{r.channel === 'Craigslist' ? 'Floods leads, 50% churn → expensive per ready tech' : r.projected ? 'Pre-vetted, enters at Screened → the scale play' : r.count <= 2 ? 'Small sample' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        modal.type === 'cand'
          ? <EntityModal title={modal.row?.id ? `Edit ${modal.row.name}` : 'Add candidate'} fields={candFields} initial={modal.row || {}} onSave={saveCand} onClose={() => setModal(null)} onDelete={modal.row?.id ? () => remove('candidates', modal.row.id) : undefined} />
          : <EntityModal title={modal.row?.id ? `Edit ${modal.row.name}` : 'Add technician'} fields={techFields} initial={modal.row || {}} onSave={saveTech} onClose={() => setModal(null)} onDelete={modal.row?.id ? () => remove('technicians', modal.row.id) : undefined} />
      )}
    </div>
  );
}
