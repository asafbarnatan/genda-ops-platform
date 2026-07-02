import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useStore } from '../data/store.jsx';
import { missionTiles, deriveAlerts, qualityTrend, activeTechs, projectStatus } from '../data/derive';
import { Tile, Icon } from '../components/bits.jsx';

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

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Mission Control</h1>
          <div className="page-sub">{isOM ? 'Your daily ops view — what needs action today' : 'Manager summary — is the operation healthy and on trajectory?'}</div>
        </div>
        <div className="seg">
          <button className={isOM ? 'active' : ''} onClick={() => setPersona('om')}>My view (OM)</button>
          <button className={!isOM ? 'active' : ''} onClick={() => setPersona('manager')}>Manager view</button>
        </div>
      </div>

      <div className="stat-strip" style={{ marginBottom: 16 }}>
        <Tile label="Active projects" value={m.projects} sub="Genda Pro installs across the portfolio" />
        <Tile label="Technicians" value={m.technicians} sub={`${m.techActive} active · ${m.techBenched} benched · ${m.techRemoved} removed`} />
        <Tile label="Regions" value={m.regions} sub="Texas · Southeast · West" />
        <Tile label="Deployments" value={m.deployments} sub="active tech-to-project assignments" />
        <Tile label="Pipeline" value={m.candidates} sub="Cloud Factory vendor pilot" />
      </div>

      <div className="micro" style={{ margin: '6px 0 8px' }}>North-star KPI</div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 18 }}>
        <Tile accent={m.readinessSlaAdherence >= 90 ? 'green' : 'amber'} label="Readiness SLA adherence" value={`${m.readinessSlaAdherence}%`} sub="ready ≥10 business days before delivery"
          hint="Share of near-term projects on pace to be fully ready at least 10 business days before their Requested Delivery Date. This is the operation's headline promise." />
        <Tile accent={m.droppedOpportunities === 0 ? 'green' : 'red'} label="Overdue & not ready" value={m.droppedOpportunities} sub="past Requested Delivery, still open"
          hint={`Projects past their Requested Delivery and not yet delivered — currently ${m.droppedOpportunities} (27th Street), derived from its provided delivery date. Maps to Roee's 'zero dropped opportunities' goal.`} />
        <Tile accent="indigo" label="% returning deployments" value={`${m.pctReturning}%`} sub="reuse vs new-hire — the scalability lever"
          hint="Share of deployments served by a returning technician (fast path) instead of a new hire. Higher = more reuse = faster, cheaper scaling. The vendor pilot is how we grow it." />
      </div>

      <div className="micro" style={{ margin: '6px 0 8px' }}>Operational health</div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 18 }}>
        <Tile label="Ready-tech coverage" value={`${m.techActive} ready`} sub="active roster vs near-term demand"
          hint="Active technicians available to deploy. Reused across projects, so this is smaller than the number of project slots — utilization, not headcount." />
        <Tile accent={m.atRisk > 2 ? 'amber' : 'green'} label="Projects at risk" value={m.atRisk} sub="amber + red, floated to the top"
          hint="Projects that are At risk (inside the readiness buffer) or Critical (overdue / no ready tech). These float to the top of the Schedule." />
        <Tile label="Avg technician quality" value={m.avgQuality} sub={`weighted 1-5 · ${m.flagged} flagged for review`}
          hint="Weighted average of the active roster's composite quality scores (Coverage 30 / Reliability 25 / On-time 20 / Upload 15 / Issues 10)." />
        <Tile label="Top bottleneck" value={<span style={{ fontSize: 15 }}>Readiness spine</span>} sub="most projects queue at Training → Kit"
          hint="The phase where projects dwell longest before deploying (OSHA10 → Training → Kit → PPE). The target for standardization + automation in Process." />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        <Tile accent="red" label="Alerts · critical" value={m.alertCritical} sub="act now, ~24-48h" hint="Alerts that hit a client outcome or breach the Readiness SLA. Act within 24-48h." />
        <Tile accent="amber" label="Alerts · action" value={m.alertAction} sub="handle this week" hint="Real issues you own the timing on — handle within the week." />
        <Tile accent="green" label="Alerts · info" value={m.alertInfo} sub="monitor only" hint="Awareness only, no action needed — e.g. a routine date change that auto-propagated." />
        <Tile label="Biggest pipeline leak" value={<span style={{ fontSize: 15 }}>Craigslist</span>} sub="50% churn → costly per ready tech"
          hint="The channel losing the most technicians to churn. Craigslist floods cheap leads but 2 of 4 washed out — expensive per ready tech. The case for the vendor model." />
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
                <div className="kv"><span className="dot-s green" /> On track &nbsp;<b className="mono-num">{m.projects - m.atRisk}</b></div>
                <div className="kv"><span className="dot-s amber" /> At risk / critical &nbsp;<b className="mono-num">{m.atRisk}</b></div>
                <div className="kv"><span className="dot-s red" /> Dropped (overdue) &nbsp;<b className="mono-num">{m.droppedOpportunities}</b></div>
                <hr className="sep" style={{ margin: '6px 0' }} />
                <div className="small muted">Manager view stays at altitude: rollups + trajectory, no task-level queue. Same north-star KPI as the OM view.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
