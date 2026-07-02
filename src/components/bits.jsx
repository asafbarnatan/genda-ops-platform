// Small shared UI atoms.
import { STATUS_LABEL } from '../data/derive';

const STATUS_CLASS = { ontrack: 'green', atrisk: 'amber', critical: 'red', na: 'grey' };

export function StatusPill({ status }) {
  return <span className={`pill ${STATUS_CLASS[status] || 'grey'}`}><span className={`dot-s ${STATUS_CLASS[status] || 'grey'}`} />{STATUS_LABEL[status] || status}</span>;
}

export function ProvPill({ provenance }) {
  return provenance === 'provided'
    ? <span className="pill provided" title="From Buildots' portfolio data">🟦 Provided</span>
    : <span className="pill fictive" title="Added by us (fictive)">🟧 Fictive</span>;
}

export function PoolPill({ pool }) {
  const cls = pool === 'Active' ? 'green' : pool === 'Benched' ? 'amber' : pool === 'Removed' ? 'red' : 'grey';
  return <span className={`pill ${cls}`}>{pool}</span>;
}

export function Legend() {
  return (
    <div className="legend">
      <span className="pill provided">🟦 Provided (Buildots data)</span>
      <span className="pill fictive">🟧 Fictive (added by us)</span>
    </div>
  );
}

export function Tile({ label, value, sub, accent }) {
  return (
    <div className={`tile ${accent ? 'accent ' + accent : ''}`}>
      <div className="lbl">{label}</div>
      <div className="val mono-num">{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

export const Icon = {
  search: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>,
  help: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .8-1 1.7" /><circle cx="12" cy="17" r=".6" fill="currentColor" /></svg>,
  building: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="3" width="16" height="18" rx="1" /><path d="M8 7h2M8 11h2M8 15h2M14 7h2M14 11h2M14 15h2" /></svg>,
  plus: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg>,
  reset: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>,
};
