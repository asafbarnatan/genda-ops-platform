import { useState } from 'react';
import { useStore } from '../data/store.jsx';
import { deriveAlerts } from '../data/derive';
import { Icon } from '../components/bits.jsx';
import { EntityModal } from '../components/Modal.jsx';
import LogicPane from '../components/LogicPane.jsx';

const TIERS = [
  { tier: 'critical', dot: 'red', label: 'Critical — Act Now', window: '~24 to 48h', meaning: 'Hits a client outcome or breaches the Readiness SLA', test: '"Does a client feel this if I don\'t move today?"' },
  { tier: 'action', dot: 'amber', label: 'Action — This Week', window: 'this week', meaning: 'Real, but I own the timing', test: '"Must be handled, not today"' },
  { tier: 'info', dot: 'green', label: 'Informational — Monitor', window: 'no action', meaning: 'Awareness only', test: '"Nice to know, nothing to do"' },
];

const alertFields = [
  { name: 'tier', label: 'Priority', type: 'select', options: ['critical', 'action', 'info'] },
  { name: 'family', label: 'Family', type: 'select', options: ['Staffing', 'Schedule', 'Quality'] },
  { name: 'trigger', label: 'Trigger', full: true },
  { name: 'subject', label: 'Subject (project / technician)', full: true },
  { name: 'action', label: 'Action', full: true },
  { name: 'owner', label: 'Owner' },
];

export default function Alerts() {
  const { projects, technicians, navigate, acks, toggleAck, manualAlerts, addManualAlert, removeManualAlert } = useStore();
  const [modal, setModal] = useState(null);
  const derived = deriveAlerts(projects, technicians);
  const all = [...derived, ...manualAlerts];

  return (
    <div className="page">
      <div className="page-head">
        <div><h1 className="page-title">Alerts & Decision Logic</h1><div className="page-sub">What the system flags automatically, how urgent each one is, and what to do — updated live as the data changes.</div></div>
        <button className="btn btn-primary" onClick={() => setModal({ tier: 'action', family: 'Schedule', owner: 'OM' })}><Icon.plus /> Add event</button>
      </div>

      <LogicPane part="alerts" />

      {/* Tie-break as a table (the prioritisation framework) */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-head"><h3>Prioritisation framework</h3><span className="muted small">how every alert is triaged</span></div>
        <table className="table">
          <thead><tr><th>Tier</th><th>What it means</th><th>Act within</th><th>The test</th></tr></thead>
          <tbody>
            {TIERS.map((t) => (
              <tr key={t.tier}><td><span className={`pill ${t.dot === 'red' ? 'red' : t.dot === 'amber' ? 'amber' : 'green'}`}><span className={`dot-s ${t.dot}`} />{t.label}</span></td><td>{t.meaning}</td><td>{t.window}</td><td className="small muted">{t.test}</td></tr>
            ))}
          </tbody>
        </table>
        <div className="card-pad" style={{ paddingTop: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>Tie-break, when two alerts compete: the one that could hurt a client — a breach of the <b>Readiness SLA</b> or their data — always wins over anything that is only internal efficiency.</div>
          <div className="micro" style={{ margin: '12px 0 6px' }}>How each tier reaches the team (auto-routed by Jira)</div>
          <div className="small" style={{ display: 'grid', gap: 4 }}>
            <div><span className="pill red">🔴 Critical</span> instant Slack ping + email to the OM &amp; Regional Lead, and it pins to the "Act Now" strip.</div>
            <div><span className="pill amber">🟠 Action</span> added to the dashboard "This Week" queue and the once-daily digest — no interruption.</div>
            <div><span className="pill green">🟢 Info</span> logged quietly in the daily digest. Nobody is pinged.</div>
          </div>
        </div>
      </div>

      {TIERS.map((b) => {
        const items = all.filter((a) => a.tier === b.tier);
        return (
          <div key={b.tier} style={{ marginBottom: 22 }}>
            <div className="alert-band-head">
              <span className={`dot-s ${b.dot}`} style={{ width: 11, height: 11 }} />
              <h3 style={{ fontSize: 15 }}>{b.label}</h3>
              <span className="pill grey">{items.length}</span>
              <span className="small muted">{b.window} · hover for detail, click to jump to the source</span>
            </div>
            <div className="mini-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
              {items.map((a) => {
                const done = acks.includes(a.id);
                return (
                  <div key={a.id} className={`acard ${a.tier}`} style={{ opacity: done ? 0.5 : 1 }} onClick={() => a.link && navigate(a.link.screen, a.link.focus)}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, textDecoration: done ? 'line-through' : 'none' }}>{a.trigger}</div>
                        <div className="small muted">{a.subject}</div>
                        <div className="small" style={{ marginTop: 5 }}>→ {a.action}</div>
                        <div className="small muted" style={{ marginTop: 5 }}><span className="pill grey">{a.family}</span> {a.owner} {a.manual && <span className="pill fictive">manual</span>} {a.link && <span className="go">· click to open ↗</span>}</div>
                      </div>
                    </div>
                    <div className="fb-actions" style={{ marginTop: 8 }}>
                      <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); toggleAck(a.id); }}>{done ? 'Reopen' : 'Mark done'}</button>
                      {a.manual && <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); removeManualAlert(a.id); }}>Delete</button>}
                    </div>
                    {a.why && <div className="pop">{a.why}</div>}
                  </div>
                );
              })}
              {items.length === 0 && <div className="small muted">None right now.</div>}
            </div>
          </div>
        );
      })}

      {modal && <EntityModal title="Add event" fields={alertFields} initial={modal} onSave={(v) => addManualAlert(v)} onClose={() => setModal(null)} />}
    </div>
  );
}
