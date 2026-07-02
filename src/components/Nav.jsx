import Logo from '../brand/Logo.jsx';
import { Icon } from './bits.jsx';

export default function Nav({ screens, active, onNav }) {
  return (
    <nav className="nav">
      <Logo height={26} />
      <div className="nav-tabs">
        {screens.map((s) => (
          <button key={s.id} className={`nav-tab ${active === s.id ? 'active' : ''}`} onClick={() => onNav(s.id)}>
            {s.label}
          </button>
        ))}
      </div>
      <div className="nav-right">
        <span className="nav-proj"><span className="dot" />Genda Ops · US</span>
        <button className="icon-btn" title="Help"><Icon.help /></button>
        <span className="nav-avatar" title="Operations Manager">AB</span>
      </div>
    </nav>
  );
}
