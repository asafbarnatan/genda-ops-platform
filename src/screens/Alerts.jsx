import { useStore } from '../data/store.jsx';
import { deriveAlerts } from '../data/derive';

const BANDS = [
  { tier: 'critical', dot: 'red', label: 'Critical — Act Now', window: '~24 to 48h' },
  { tier: 'action', dot: 'amber', label: 'Action — This Week', window: 'this week' },
  { tier: 'info', dot: 'green', label: 'Informational — Monitor', window: 'no action' },
];

export default function Alerts() {
  const { projects, technicians } = useStore();
  const alerts = deriveAlerts(projects, technicians);

  return (
    <div className="page">
      <div className="page-head">
        <div><h1 className="page-title">Alerts & Decision Logic</h1><div className="page-sub">Triaged by time-to-consequence × client-impact · derived live from the data</div></div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div className="micro" style={{ marginBottom: 6 }}>The tie-break rule</div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>Anything that threatens the <b>Readiness SLA</b> or a client's data outranks anything that is only internal efficiency.</div>
        <div className="small muted" style={{ marginTop: 8 }}>Routing (Jira automation): 🔴 Slack @mention + email + "Act Now" · 🟠 dashboard queue + daily digest · 🟢 ambient digest. Edit a date or a score and the alerts below recompute.</div>
      </div>

      {BANDS.map((b) => {
        const items = alerts.filter((a) => a.tier === b.tier);
        return (
          <div className="alert-band" key={b.tier}>
            <div className="alert-band-head">
              <span className={`dot-s ${b.dot}`} style={{ width: 11, height: 11 }} />
              <h3 style={{ fontSize: 15 }}>{b.label}</h3>
              <span className="pill grey">{items.length}</span>
              <span className="small muted">{b.window}</span>
            </div>
            {items.map((a) => (
              <div className="alert-card" key={a.id}>
                <div className={`alert-stripe ${a.tier}`} />
                <div className="alert-body">
                  <div className="trg">{a.trigger}</div>
                  <div className="subj">{a.subject}</div>
                  <div className="act">→ {a.action}</div>
                </div>
                <div className="alert-meta"><span className="pill grey">{a.family}</span><br />{a.owner}</div>
              </div>
            ))}
            {items.length === 0 && <div className="small muted" style={{ paddingLeft: 20 }}>None right now.</div>}
          </div>
        );
      })}
    </div>
  );
}
