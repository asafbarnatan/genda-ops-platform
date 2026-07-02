import { useState } from 'react';

export function Modal({ title, onClose, children, footer }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3 style={{ fontSize: 16 }}>{title}</h3>
          <button className="x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

// Generic add/edit form driven by a flat field schema.
// field: { name, label, type: 'text'|'number'|'select'|'date', options?, full?, min?, max?, step? }
export function EntityModal({ title, fields, initial, onSave, onClose, onDelete }) {
  const [vals, setVals] = useState(initial);
  const set = (k, v) => setVals((s) => ({ ...s, [k]: v }));
  const save = () => { onSave(vals); onClose(); };

  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          {onDelete && <button className="btn btn-danger btn-sm" style={{ marginRight: 'auto' }} onClick={() => { onDelete(); onClose(); }}>Delete</button>}
          <button className="btn-text" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>Save</button>
        </>
      }
    >
      <div className="form-grid">
        {fields.map((f) => (
          <div className={`field ${f.full ? 'full' : ''}`} key={f.name}>
            <label>{f.label}</label>
            {f.type === 'select' ? (
              <select className="input" value={vals[f.name] ?? ''} onChange={(e) => set(f.name, e.target.value)}>
                {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                className="input"
                type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                value={vals[f.name] ?? ''}
                min={f.min} max={f.max} step={f.step}
                onChange={(e) => set(f.name, f.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}
