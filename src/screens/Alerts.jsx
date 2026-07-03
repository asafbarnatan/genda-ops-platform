import { useState } from 'react';
import { useStore } from '../data/store.jsx';
import { deriveAlerts } from '../data/derive';
import { Icon } from '../components/bits.jsx';
import { EntityModal, Modal } from '../components/Modal.jsx';
import OperatingLogic from '../components/OperatingLogic.jsx';

// Action-first triage board. The prioritisation framework / tie-break / routing now live
// in the Operating-logic modal, so this tab is just the working queue.
const COLS = [
  { tier: 'critical', dot: 'red', label: 'Act now', sub: '~24-48h' },
  { tier: 'action', dot: 'amber', label: 'This week', sub: 'you own the timing' },
  { tier: 'info', dot: 'green', label: 'Monitor', sub: 'awareness only' },
];
const alertFields = [
  { name: 'tier', label: 'Priority', type: 'select', options: ['critical', 'action', 'info'] },
  { name: 'family', label: 'Family', type: 'select', options: ['Staffing', 'Schedule', 'Quality'] },
  { name: 'trigger', label: 'Trigger', full: true },
  { name: 'subject', label: 'Subject (project / technician)', full: true },
  { name: 'action', label: 'Action', full: true },
  { name: 'owner', label: 'Owner' },
];
const tierLabel = (t) => COLS.find((c) => c.tier === t)?.label || t;

export default function Alerts() {
  const { projects, technicians, navigate, acks, toggleAck, snoozed, toggleSnooze,
    manualAlerts, addManualAlert, updateManualAlert, removeManualAlert, alertNotes, setAlertNote, alertTier, setAlertTier } = useStore();
  const [addOpen, setAddOpen] = useState(false);
  const [detail, setDetail] = useState(null); // alert being viewed / commented
  const [edit, setEdit] = useState(null);      // manual alert being edited

  const all = [...deriveAlerts(projects, technicians), ...manualAlerts];
  const tierOf = (a) => alertTier[a.id] || a.tier;
  const active = all.filter((a) => !acks.includes(a.id) && !snoozed.includes(a.id));
  const snoozedList = all.filter((a) => snoozed.includes(a.id) && !acks.includes(a.id));
  const clearedCount = all.filter((a) => acks.includes(a.id)).length;
  const drop = (e, tier) => { const id = e.dataTransfer.getData('aid'); if (id) setAlertTier(id, tier); };

  return (
    <div className="page">
      <div className="page-head">
        <div><h1 className="page-title">Alerts & Decision Logic</h1><div className="page-sub">What to act on now — drag a card to re-prioritise, click it to comment or edit. The framework lives in Operating logic.</div></div>
        <div className="row"><OperatingLogic part="alerts" /><button className="btn btn-primary" onClick={() => setAddOpen(true)}><Icon.plus /> Add event</button></div>
      </div>

      <div className="triage-board">
        {COLS.map((c) => {
          const items = active.filter((a) => tierOf(a) === c.tier);
          return (
            <div key={c.tier} className={`tcol ${c.tier}`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => drop(e, c.tier)}>
              <div className="tcol-head"><span className={`dot-s ${c.dot}`} /><b>{c.label}</b><span className="pill grey">{items.length}</span><span className="spacer" /><span className="small muted">{c.sub}</span></div>
              {items.map((a) => (
                <div key={a.id} className={`tcard ${tierOf(a)}`} draggable onDragStart={(e) => e.dataTransfer.setData('aid', a.id)} onClick={() => setDetail(a)}>
                  <div className="tcard-subj">{a.subject}{a.manual && <span className="pill fictive" style={{ marginLeft: 6, fontSize: 9 }}>manual</span>}</div>
                  <div className="small muted tcard-trig">{a.trigger}</div>
                  <div className="small tcard-act">→ {a.action}</div>
                  {alertNotes[a.id] && <div className="tcard-note">💬 {alertNotes[a.id]}</div>}
                  <div className="tcard-foot">
                    <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); toggleAck(a.id); }}>Done</button>
                    <button className="btn btn-sm" title="Waiting / no resource to act now" onClick={(e) => { e.stopPropagation(); toggleSnooze(a.id); }}>Snooze</button>
                    {a.link && <button className="btn-text btn-sm" onClick={(e) => { e.stopPropagation(); navigate(a.link.screen, a.link.focus); }}>Open ↗</button>}
                  </div>
                  {a.why && <div className="pop">{a.why}</div>}
                </div>
              ))}
              {items.length === 0 && <div className="tcol-empty">Nothing here</div>}
            </div>
          );
        })}
      </div>

      {(snoozedList.length > 0 || clearedCount > 0) && (
        <div className="row wrap" style={{ gap: 20, marginTop: 14, alignItems: 'center' }}>
          {snoozedList.length > 0 && <span className="small muted">💤 Snoozed (waiting): <b>{snoozedList.map((a) => a.subject).join(', ')}</b> <button className="btn-text btn-sm" onClick={() => snoozedList.forEach((a) => toggleSnooze(a.id))}>un-snooze all</button></span>}
          {clearedCount > 0 && <span className="small muted">✓ {clearedCount} done <button className="btn-text btn-sm" onClick={() => all.forEach((a) => acks.includes(a.id) && toggleAck(a.id))}>reopen all</button></span>}
        </div>
      )}

      {addOpen && <EntityModal title="Add event" fields={alertFields} initial={{ tier: 'action', family: 'Schedule', owner: 'OM' }} onSave={(v) => addManualAlert(v)} onClose={() => setAddOpen(false)} />}

      {detail && !edit && (
        <Modal title={detail.subject} onClose={() => setDetail(null)}
          footer={<>
            {detail.manual && <button className="btn btn-danger btn-sm" style={{ marginRight: 'auto' }} onClick={() => { removeManualAlert(detail.id); setDetail(null); }}>Delete</button>}
            {detail.manual && <button className="btn btn-sm" onClick={() => setEdit(detail)}>Edit fields</button>}
            <button className="btn-text" onClick={() => setDetail(null)}>Close</button>
            {detail.link && <button className="btn btn-primary" onClick={() => { navigate(detail.link.screen, detail.link.focus); setDetail(null); }}>Open source ↗</button>}
          </>}>
          <div className="row wrap" style={{ gap: 8, marginBottom: 12 }}>
            <span className={`pill ${tierOf(detail) === 'critical' ? 'red' : tierOf(detail) === 'action' ? 'amber' : 'green'}`}>{tierLabel(tierOf(detail))}</span>
            <span className="pill grey">{detail.family}</span><span className="pill grey">{detail.owner}</span>
          </div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{detail.trigger}</div>
          <div className="small" style={{ marginBottom: 8 }}>→ {detail.action}</div>
          {detail.why && <div className="small muted" style={{ marginBottom: 14, lineHeight: 1.5 }}>{detail.why}</div>}
          <div className="field"><label>Comment / input</label>
            <textarea className="input" rows={3} value={alertNotes[detail.id] || ''} onChange={(e) => setAlertNote(detail.id, e.target.value)} placeholder="Add context, who you're waiting on, the next step…" />
          </div>
        </Modal>
      )}

      {edit && <EntityModal title={`Edit ${edit.subject || 'alert'}`} fields={alertFields} initial={edit} onSave={(v) => updateManualAlert(edit.id, v)} onClose={() => setEdit(null)} onDelete={() => { removeManualAlert(edit.id); setEdit(null); setDetail(null); }} />}
    </div>
  );
}
