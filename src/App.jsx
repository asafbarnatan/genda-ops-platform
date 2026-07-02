import Nav from './components/Nav.jsx';
import { Icon } from './components/bits.jsx';
import { useStore } from './data/store.jsx';
import MissionControl from './screens/MissionControl.jsx';
import Pipeline from './screens/Pipeline.jsx';
import Schedule from './screens/Schedule.jsx';
import Quality from './screens/Quality.jsx';
import Alerts from './screens/Alerts.jsx';
import Process from './screens/Process.jsx';

const SCREENS = [
  { id: 'mission', label: 'Mission Control', comp: MissionControl },
  { id: 'schedule', label: 'Schedule', comp: Schedule },
  { id: 'pipeline', label: 'Pipeline', comp: Pipeline },
  { id: 'quality', label: 'Quality', comp: Quality },
  { id: 'alerts', label: 'Alerts', comp: Alerts },
  { id: 'process', label: 'Process', comp: Process },
];

export default function App() {
  const { resetDemo, route, navigate } = useStore();
  const active = route.screen;
  const Comp = (SCREENS.find((s) => s.id === active) || SCREENS[0]).comp;

  return (
    <>
      <Nav screens={SCREENS} active={active} onNav={(id) => navigate(id)} />
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '10px 24px 0', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <button className="btn btn-sm" style={{ marginLeft: 'auto' }} onClick={resetDemo} title="Restore the original seed data">
          <Icon.reset /> Reset demo data
        </button>
      </div>
      <main>
        <Comp />
      </main>
    </>
  );
}
