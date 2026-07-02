import { useState } from 'react';
import { useStore } from '../data/store.jsx';
import { funnelLiquidity, channelScorecard, qualityComposite } from '../data/derive';
import { EntityModal } from '../components/Modal.jsx';
import { Icon, PoolPill, ProvDot, FilterBar } from '../components/bits.jsx';

const CHANNELS = ['Craigslist', 'Facebook', 'LinkedIn', 'Other', 'Vendor - Cloud Factory'];
const REGIONS = ['Texas', 'Southeast', 'West'];
const STAGES = ['Sourced', 'Screened', 'Onboarded', 'Deployed'];

function nextId(prefix, arr) {
  const nums = arr.map((r) => parseInt(String(r.id).replace(/\D/g, ''), 10)).filter((n) => !isNaN(n));
  return `${prefix}-${Math.max(0, ...nums) + 1}`;
}
const isVendor = (ch) => ch?.startsWith('Vendor');

const candFields = [
  { name: 'name', label: 'Name' },
  { name: 'channel', label: 'Channel', type: 'select', options: CHANNELS },
  { name: 'region', label: 'Region', type: 'select', options: REGIONS },
  { name: 'stage', label: 'Stage', type: 'select', options: STAGES },
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
  const [f, setF] = useState({ channel: 'All', region: 'All' });
  const [modal, setModal] = useState(null);

  const matchC = (r) => (f.channel === 'All' || r.channel === f.channel) && (f.region === 'All' || r.region === f.region);
  const cands = candidates.filter(matchC);
  const techs = technicians.filter(matchC);
  const liquidity = funnelLiquidity(candidates);
  const scorecard = channelScorecard(technicians);
  const deployed = techs.filter((t) => t.pool === 'Active');
  const benched = techs.filter((t) => t.pool === 'Benched');
  const removed = techs.filter((t) => t.pool === 'Removed');

  const openCand = (row) => setModal({ type: 'cand', row });
  const openTech = (row) => setModal({ type: 'tech', row });
  const saveCand = (v) => { if (v.id) update('candidates', v.id, v); else add('candidates', { ...v, id: nextId('C', candidates), stageSla: v.channel && isVendor(v.channel) ? 10 : 5, owner: 'OM', dropoff: '', note: '' }); };
  const saveTech = (v) => { if (v.id) update('technicians', v.id, v); else add('technicians', { ...v, id: nextId('T', technicians), metrics: { coverage: 3, reliability: 3, ontime: 3, upload: 3, issues: 3 }, installs: 0, projects: [], provisional: true, note: '' }); };

  const onDrop = (e, stage) => { const id = e.dataTransfer.getData('id'); if (id) update('candidates', id, { stage }); };
  const maxFunnel = Math.max(1, ...liquidity.map((r) => r.count), deployed.length);

  return (
    <div className="page">
      <div className="page-head">
        <div><h1 className="page-title">Recruitment Pipeline</h1><div className="page-sub">Sourced → Screened → Onboarded → Deployed · drag a card to advance it · one dataset, filter to compare channels</div></div>
        <div className="row">
          <button className="btn" onClick={() => openCand({ stage: 'Sourced', channel: 'Craigslist', region: 'Southeast', candidateScore: 3, daysInStage: 0 })}><Icon.plus /> Candidate</button>
          <button className="btn btn-primary" onClick={() => openTech({ pool: 'Active', channel: 'Craigslist', region: 'Southeast', lead: 'Gil', candidateScore: 3 })}><Icon.plus /> Technician</button>
        </div>
      </div>

      <FilterBar filters={[{ key: 'channel', label: 'Channel', options: CHANNELS }, { key: 'region', label: 'Region', options: REGIONS }]} values={f} onChange={(k, v) => setF((s) => ({ ...s, [k]: v }))} />

      {/* Kanban — candidates flow left; deployed & sidelined technicians live in the last two columns */}
      <div className="kanban" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 20, alignItems: 'start' }}>
        {['Sourced', 'Screened', 'Onboarded', 'Deployed'].map((s) => (
          <div className="kcol" key={s} onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, s)}>
            <div className="kcol-head"><span className="t">{s}</span><span className="pill grey">{cands.filter((c) => c.stage === s).length + (s === 'Deployed' ? deployed.length : 0)}</span></div>
            {cands.filter((c) => c.stage === s).map((c) => (
              <div className="kcard" key={c.id} draggable onDragStart={(e) => e.dataTransfer.setData('id', c.id)} onClick={() => openCand(c)} style={isVendor(c.channel) ? { borderColor: '#5B4FE9', borderLeftWidth: 3 } : {}}>
                <div className="n"><ProvDot provenance="fictive" /> {c.name}</div>
                <div className="m">{isVendor(c.channel) ? <span className="pill indigo">Cloud Factory</span> : <span>{c.channel}</span>} · <span>{c.region}</span>{c.daysInStage != null && <span className="pill grey">{c.daysInStage}d</span>}</div>
              </div>
            ))}
            {s === 'Deployed' && deployed.map((t) => (
              <div className="kcard" key={t.id} onClick={() => openTech(t)}>
                <div className="n"><ProvDot provenance="fictive" /> {t.name} <span className="pill green" style={{ fontSize: 9 }}>tech</span></div>
                <div className="m"><span>{t.channel}</span> · <span>Q {qualityComposite(t.metrics)}</span> · <span>{t.projects?.length || 0} proj</span></div>
              </div>
            ))}
            {cands.filter((c) => c.stage === s).length === 0 && !(s === 'Deployed' && deployed.length) && <div className="small muted" style={{ padding: 6 }}>drop here</div>}
          </div>
        ))}
        <div className="kcol" style={{ background: '#FBF0E2' }}>
          <div className="kcol-head"><span className="t">Benched</span><span className="pill grey">{benched.length}</span></div>
          {benched.map((t) => (
            <div className="kcard" key={t.id} onClick={() => openTech(t)}>
              <div className="n"><ProvDot provenance="fictive" /> {t.name}</div>
              <div className="m"><PoolPill pool="Benched" /> <span>Q {qualityComposite(t.metrics)}</span></div>
            </div>
          ))}
          {benched.length === 0 && <div className="small muted" style={{ padding: 6 }}>none</div>}
          <div className="micro" style={{ margin: '12px 0 6px' }}>Removed ({removed.length})</div>
          {removed.map((t) => (
            <div className="kcard" key={t.id} style={{ opacity: 0.6 }} onClick={() => openTech(t)}>
              <div className="n"><ProvDot provenance="fictive" /> {t.name}</div>
              <div className="m"><PoolPill pool="Removed" /> <span>Q {qualityComposite(t.metrics)}</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* Funnel / liquidity analysis */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-head"><h3>Funnel & liquidity</h3><span className="muted small">throughput, velocity, and where flow gets stuck</span></div>
        <div className="card-pad">
          <div className="funnel" style={{ marginBottom: 12 }}>
            {liquidity.map((r, i) => (
              <div className="funnel-row" key={r.stage}>
                <span className="funnel-lbl">{r.stage}</span>
                <div className="funnel-bar" style={{ width: `${Math.max(6, (r.count / maxFunnel) * 100)}%`, opacity: 0.55 + i * 0.12 }}>{r.count}</div>
                <span className="small muted">avg {r.avgDays}d in stage{r.aging > 0 && <span className="pill red" style={{ marginLeft: 6 }}>{r.aging} aging</span>}</span>
              </div>
            ))}
            <div className="funnel-row"><span className="funnel-lbl">Deployed roster</span><div className="funnel-bar" style={{ width: `${(deployed.length / maxFunnel) * 100}%`, background: 'var(--bd-green)' }}>{deployed.length}</div><span className="small muted">active technicians serving projects</span></div>
          </div>
          <div className="small muted">Liquidity read: the pipeline is intentionally thin — <b>2 Cloud Factory pre-vets</b> backfilling the 2 churned Craigslist techs, no aging. The operation is staffed; new inflow is the vendor pilot, not mass Craigslist sourcing.</div>
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
                <td><ProvDot provenance="fictive" /> <b>{r.channel}</b> {r.projected && <span className="pill indigo">projected</span>}</td>
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
