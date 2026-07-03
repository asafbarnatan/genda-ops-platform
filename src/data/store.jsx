// Global store: holds raw state (projects/technicians/candidates), exposes CRUD,
// persists through the dataAdapter, and tracks the OM/Manager persona.
import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { activeAdapter } from './adapter';

const StoreCtx = createContext(null);

export function StoreProvider({ children }) {
  const [state, setState] = useState(() => activeAdapter.load());
  const [persona, setPersona] = useState('om'); // 'om' | 'manager'
  const [route, setRoute] = useState({ screen: 'mission', focus: null }); // focus = entity id to auto-open
  const [acks, setAcks] = useState([]);       // acknowledged/"done" alert ids
  const [manualAlerts, setManualAlerts] = useState([]); // manually-added events
  const manualSeq = useRef(0); // monotonic id counter — never reused, so delete-then-add can't collide
  const [snoozed, setSnoozed] = useState([]);        // alerts snoozed (waiting / no resource)
  const [alertNotes, setAlertNotes] = useState({});  // alert id -> comment/note
  const [alertTier, setAlertTierMap] = useState({}); // alert id -> manual tier override (drag)

  useEffect(() => {
    activeAdapter.save({ projects: state.projects, technicians: state.technicians, candidates: state.candidates });
  }, [state]);

  const mutate = useCallback((coll, fn) => {
    setState((s) => ({ ...s, [coll]: fn(s[coll]) }));
  }, []);

  const api = useMemo(() => ({
    projects: state.projects,
    technicians: state.technicians,
    candidates: state.candidates,
    persona, setPersona,
    route, navigate: (screen, focus = null) => setRoute({ screen, focus }),
    clearFocus: () => setRoute((r) => ({ ...r, focus: null })),
    acks, toggleAck: (id) => setAcks((a) => a.includes(id) ? a.filter((x) => x !== id) : [...a, id]),
    manualAlerts, addManualAlert: (a) => setManualAlerts((m) => [...m, { ...a, id: `M-${++manualSeq.current}`, manual: true }]),
    updateManualAlert: (id, patch) => setManualAlerts((m) => m.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    removeManualAlert: (id) => setManualAlerts((m) => m.filter((x) => x.id !== id)),
    snoozed, toggleSnooze: (id) => setSnoozed((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]),
    alertNotes, setAlertNote: (id, text) => setAlertNotes((n) => ({ ...n, [id]: text })),
    alertTier, setAlertTier: (id, tier) => setAlertTierMap((t) => ({ ...t, [id]: tier })),

    // generic CRUD, provenance auto-tagged fictive for user-added rows
    add: (coll, row) => mutate(coll, (arr) => [...arr, { ...row, provenance: row.provenance || 'fictive' }]),
    update: (coll, id, patch) => mutate(coll, (arr) => arr.map((r) => (r.id === id ? { ...r, ...patch } : r))),
    remove: (coll, id) => mutate(coll, (arr) => arr.filter((r) => r.id !== id)),

    resetDemo: () => setState(activeAdapter.reset()),
    adapterName: activeAdapter.name,
  }), [state, persona, route, acks, manualAlerts, snoozed, alertNotes, alertTier, mutate]);

  return <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
