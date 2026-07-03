import { useState } from 'react';
import { useStore } from '../data/store.jsx';
import { funnelLiquidity, channelScorecard, qualityComposite, techniciansNeeded, recruitBy, fmtDate, activeProjects, daysBetween } from '../data/derive';
import { TODAY } from '../data/seed';
import { EntityModal, Modal } from '../components/Modal.jsx';
import { Icon, PoolPill, FilterBar } from '../components/bits.jsx';
import OperatingLogic from '../components/OperatingLogic.jsx';

const CHANNELS = ['Craigslist', 'Facebook', 'LinkedIn', 'Other', 'Vendor - Cloud Factory'];
const REGIONS = ['Texas', 'Southeast', 'West'];
const STAGES = ['Sourced', 'Screened', 'Onboarded', 'Deployed'];

// staffing-demand risk → pill. 'accepted' = the OM waived the gap by judgment (heuristic overridden).
const STAFF_RISK = { ok: ['green', 'Staffed'], accepted: ['green', 'Accepted · OM'], atrisk: ['amber', 'Recruit now'], critical: ['red', 'Gap inside SLA'], plan: ['grey', 'On plan'] };
const RISK_ORDER = { critical: 0, atrisk: 1, plan: 2, accepted: 3, ok: 4 };
const staffPill = (risk) => { const [cls, label] = STAFF_RISK[risk]; return <span className={`pill ${cls}`}><span className={`dot-s ${cls}`} />{label}</span>; };

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

// Drill-down: click a channel row → the technicians it produced (or, for the projected vendor, its pipeline candidates).
function ChannelDetail({ channel, projected, technicians, candidates, onClose }) {
  const techs = technicians.filter((t) => t.channel === channel);
  const cands = candidates.filter((c) => isVendor(c.channel));
  return (
    <Modal title={`${channel} · channel detail`} onClose={onClose} footer={<button className="btn-text" onClick={onClose}>Close</button>}>
      {projected ? (
        <>
          <div className="small muted" style={{ marginBottom: 12 }}>Projected channel — a vendor supplies pre-vetted technicians, so there is no deployed history to score yet. These {cands.length} candidates sit in the pipeline (they enter at Screened, skipping Sourcing).</div>
          <table className="table">
            <thead><tr><th>Candidate</th><th>Region</th><th>Stage</th><th className="num">Cand. score</th></tr></thead>
            <tbody>{cands.map((c) => <tr key={c.id}><td><b>{c.name}</b></td><td>{c.region}</td><td>{c.stage}</td><td className="num">{c.candidateScore ?? '—'}</td></tr>)}</tbody>
          </table>
        </>
      ) : techs.length === 0 ? <div className="muted">No technicians sourced through {channel} yet.</div> : (
        <>
          <div className="small muted" style={{ marginBottom: 12 }}>{techs.length} technician{techs.length === 1 ? '' : 's'} sourced through {channel}. Quality is the weighted 1-5 composite; pool state follows the Part 3 threshold ladder.</div>
          <table className="table">
            <thead><tr><th>Technician</th><th>Region</th><th className="num">Quality</th><th className="num">Installs</th><th>Pool</th></tr></thead>
            <tbody>{techs.map((t) => <tr key={t.id}><td><b>{t.name}</b> <span className="small muted">{t.id}</span></td><td>{t.region}</td><td className="num"><b>{qualityComposite(t.metrics)}</b></td><td className="num">{t.installs}</td><td><PoolPill pool={t.pool} /></td></tr>)}</tbody>
          </table>
        </>
      )}
    </Modal>
  );
}

export default function Pipeline() {
  const { candidates, technicians, projects, add, update, remove, navigate } = useStore();
  const [f, setF] = useState({ channel: 'All', region: 'All' });
  const [modal, setModal] = useState(null);
  const [channelSel, setChannelSel] = useState(null); // channel drill-down modal
  const [namePop, setNamePop] = useState(null);        // "assigned" → technician-names modal (holds the row)

  const matchC = (r) => (f.channel === 'All' || r.channel === f.channel) && (f.region === 'All' || r.region === f.region);
  const cands = candidates.filter(matchC);
  const techs = technicians.filter(matchC);
  const liquidity = funnelLiquidity(candidates);
  const scorecard = channelScorecard(technicians);
  const vendorInPipeline = candidates.filter((c) => isVendor(c.channel)).length; // keeps the projected vendor row honest as candidates change

  // Per-project staffing demand — recomputes live as techs are assigned or dates change.
  const staffingRows = activeProjects(projects).map((p) => {
    const needed = techniciansNeeded(p);
    const techs = (p.assignedTechs || []).map((id) => technicians.find((t) => t.id === id)).filter(Boolean);
    const assigned = p.assignedTechs?.length || 0;
    const gapRaw = Math.max(0, needed - assigned);
    const accepted = !!p.staffingOk && gapRaw > 0;   // OM judged the assigned crew sufficient — heuristic waived
    const gap = accepted ? 0 : gapRaw;               // an accepted gap counts as covered
    const d = daysBetween(TODAY, p.requestedDelivery);
    const risk = gapRaw === 0 ? 'ok' : accepted ? 'accepted' : (d != null && d <= 14) ? 'critical' : (d != null && d <= 42) ? 'atrisk' : 'plan';
    return { id: p.id, name: p.name, region: p.region, requestedDelivery: p.requestedDelivery, assignmentType: p.assignmentType, needed, techs, assigned, gapRaw, gap, accepted, recruitBy: recruitBy(p), risk };
  }).sort((a, b) => (RISK_ORDER[a.risk] - RISK_ORDER[b.risk]) || ((a.requestedDelivery || '') > (b.requestedDelivery || '') ? 1 : -1));
  const totalNeeded = staffingRows.reduce((s, r) => s + r.needed, 0);
  const totalAssigned = staffingRows.reduce((s, r) => s + r.assigned, 0);
  const totalGap = staffingRows.reduce((s, r) => s + r.gap, 0);
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
          <OperatingLogic part="pipeline" />
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
                <div className="n">{c.name}</div>
                <div className="m">{isVendor(c.channel) ? <span className="pill indigo">Cloud Factory</span> : <span>{c.channel}</span>} · <span>{c.region}</span>{c.daysInStage != null && <span className="pill grey">{c.daysInStage}d</span>}</div>
              </div>
            ))}
            {s === 'Deployed' && deployed.map((t) => (
              <div className="kcard" key={t.id} onClick={() => openTech(t)}>
                <div className="n">{t.name} <span className="pill green" style={{ fontSize: 9 }}>tech</span></div>
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
              <div className="n">{t.name}</div>
              <div className="m"><PoolPill pool="Benched" /> <span>Q {qualityComposite(t.metrics)}</span></div>
            </div>
          ))}
          {benched.length === 0 && <div className="small muted" style={{ padding: 6 }}>none</div>}
          <div className="micro" style={{ margin: '12px 0 6px' }}>Removed ({removed.length})</div>
          {removed.map((t) => (
            <div className="kcard" key={t.id} style={{ opacity: 0.6 }} onClick={() => openTech(t)}>
              <div className="n">{t.name}</div>
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

      {/* Staffing demand + channel scorecard, side by side */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', alignItems: 'start' }}>
        {/* Per-project staffing demand — the "per project" half of Part 1 */}
        <div className="card">
          <div className="card-head"><h3>Staffing demand by project</h3><span className="muted small">click Assigned for names · Accept a gap when the crew is enough</span></div>
          <div className="table-scroll">
            <table className="table" style={{ minWidth: 540 }}>
              <thead><tr><th>Project</th><th className="num">Needed</th><th className="num">Assigned</th><th className="num">Gap</th><th>Recruit by</th><th>Status</th></tr></thead>
              <tbody>
                {staffingRows.map((r) => (
                  <tr key={r.id} className="rowlink" onClick={() => navigate('schedule', r.id)}>
                    <td><b>{r.name}</b> <span className="small muted">{r.region}</span> {r.assignmentType === 'Returning' && <span className="pill green" style={{ fontSize: 9 }}>↩</span>}</td>
                    <td className="num">{r.needed}</td>
                    <td className="num"><button className="linknum" onClick={(e) => { e.stopPropagation(); setNamePop(r); }} title="Show assigned technicians">{r.assigned}{r.assigned > 0 ? ' ▾' : ''}</button></td>
                    <td className="num">{r.gapRaw > 0 ? (r.accepted ? <span className="muted" style={{ textDecoration: 'line-through' }}>{r.gapRaw}</span> : <b style={{ color: '#b23524' }}>{r.gapRaw}</b>) : '0'}</td>
                    <td className="small">{fmtDate(r.recruitBy)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {staffPill(r.risk)}
                        {r.gapRaw > 0 && (r.accepted
                          ? <button className="btn-text btn-sm" onClick={(e) => { e.stopPropagation(); update('projects', r.id, { staffingOk: false }); }} title="Re-open this gap">undo</button>
                          : <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); update('projects', r.id, { staffingOk: true }); }} title="Waive this gap — your call that the assigned crew is enough">Accept</button>)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="total-row">
                  <td><b>Total</b> <span className="small muted">{staffingRows.length} projects</span></td>
                  <td className="num"><b>{totalNeeded}</b></td>
                  <td className="num"><b>{totalAssigned}</b></td>
                  <td className="num">{totalGap > 0 ? <b style={{ color: '#b23524' }}>{totalGap}</b> : <b>0</b>}</td>
                  <td></td>
                  <td className="small muted">{totalGap} open gap{totalGap === 1 ? '' : 's'}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="table-foot"><span className="muted">Needed = floors/buildings heuristic (≤20 &amp; 1 bldg → 1 · 21-40 or 2 bldgs → 2 · 41+ → 3); the OM can Accept a gap when the crew is enough.</span></div>
        </div>

        {/* Channel scorecard — click a channel for its technicians */}
        <div className="card">
          <div className="card-head"><h3>Channel-quality scorecard</h3><span className="muted small">click a channel to see its technicians</span></div>
          <table className="table">
            <thead><tr><th>Channel</th><th className="num">Techs</th><th className="num">Avg Q</th><th className="num">Churn</th></tr></thead>
            <tbody>
              {scorecard.map((r) => (
                <tr key={r.channel} className="rowlink" onClick={() => setChannelSel({ channel: r.channel, projected: r.projected })}>
                  <td><b>{r.channel}</b> {r.projected && <span className="pill indigo">projected</span>} <span className="small muted">↗</span></td>
                  <td className="num">{r.projected ? vendorInPipeline : r.count}</td>
                  <td className="num">{r.avgQuality ?? '—'}</td>
                  <td className="num">{r.projected ? '—' : `${r.churnRate}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-foot"><span className="muted">Craigslist floods leads but churns ~50% → expensive per ready tech; vendors enter pre-vetted at Screened — the scale play.</span></div>
        </div>
      </div>

      {modal && (
        modal.type === 'cand'
          ? <EntityModal title={modal.row?.id ? `Edit ${modal.row.name}` : 'Add candidate'} fields={candFields} initial={modal.row || {}} onSave={saveCand} onClose={() => setModal(null)} onDelete={modal.row?.id ? () => remove('candidates', modal.row.id) : undefined} />
          : <EntityModal title={modal.row?.id ? `Edit ${modal.row.name}` : 'Add technician'} fields={techFields} initial={modal.row || {}} onSave={saveTech} onClose={() => setModal(null)} onDelete={modal.row?.id ? () => remove('technicians', modal.row.id) : undefined} />
      )}

      {channelSel && <ChannelDetail channel={channelSel.channel} projected={channelSel.projected} technicians={technicians} candidates={candidates} onClose={() => setChannelSel(null)} />}

      {namePop && (
        <Modal title={`${namePop.name} · assigned technicians`} onClose={() => setNamePop(null)} footer={<button className="btn-text" onClick={() => setNamePop(null)}>Close</button>}>
          {namePop.techs.length ? (
            <table className="table">
              <thead><tr><th>Technician</th><th>Region</th><th className="num">Quality</th><th>Pool</th></tr></thead>
              <tbody>{namePop.techs.map((t) => <tr key={t.id}><td><b>{t.name}</b> <span className="small muted">{t.id}</span></td><td>{t.region}</td><td className="num"><b>{qualityComposite(t.metrics)}</b></td><td><PoolPill pool={t.pool} /></td></tr>)}</tbody>
            </table>
          ) : <div className="muted">No technicians assigned to {namePop.name} yet — needs {namePop.needed}.</div>}
        </Modal>
      )}
    </div>
  );
}
