import { useStore } from '../data/store.jsx';
import { STEPS } from '../data/seed';
import { projectsAtStep } from '../data/derive';

const BOTTLENECK_PHASES = new Set(['Buildots Training', 'Equipment Setup']);
const phaseSteps = (phase) => STEPS.filter((s) => s.phase === phase);

function PhaseBlock({ phase, atStep, onChip, onMove, small, half }) {
  const steps = phaseSteps(phase);
  const count = steps.reduce((n, s) => n + (atStep[s.i]?.length || 0), 0);
  const bottleneck = BOTTLENECK_PHASES.has(phase);
  return (
    <div className={`wf2-phase ${bottleneck ? 'bottleneck' : ''}`} style={half ? { flex: 1 } : {}}>
      <div className="wf2-phead">
        <span className="pn">{phase}</span>
        <span className="pill grey">{steps[0].office ? 'office' : 'field'}</span>
        {bottleneck && <span className="pill red">skipped on returning path</span>}
        <span className="spacer" />
        <span className="small muted">{count} project{count === 1 ? '' : 's'} here</span>
      </div>
      <div className="wf2-steps" style={small || half ? { gridTemplateColumns: '1fr' } : {}}>
        {steps.map((s) => {
          const ps = atStep[s.i] || [];
          return (
            <div key={s.i} className={`wf2-step ${bottleneck && ps.length ? 'hot' : ''}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { const id = e.dataTransfer.getData('pid'); if (id) onMove(id, s.i); }}>
              <div className="st-head"><span className="small muted mono-num">{s.i + 1}</span><span>{s.name}</span>{ps.length > 0 && <span className="c">{ps.length}</span>}</div>
              {ps.length > 0 && <div className="wf2-chips">{ps.map((p) => <span key={p.id} className="wf2-chip" draggable onDragStart={(e) => e.dataTransfer.setData('pid', p.id)} onClick={() => onChip(p.id)} title="drag to another step, or click to open">{p.name}</span>)}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const INSIGHTS = [
  { problem: 'The readiness spine (OSHA10 → Training → Kit → PPE) runs in sequence — the phase projects dwell in longest before they can deploy.', fix: 'Run the independent gates in parallel and document the flow as a Confluence SOP.', auto: 'A "prep technician" Skill fires the parallel gates the moment the contract is signed.' },
  { problem: 'Every project is staffed from scratch on a ~6-week new-hire lead — no reuse of already-trained technicians.', fix: 'Default returning technicians to the fast path; cluster work per region (one-vendor-per-region) so reuse is possible.', auto: 'The board surfaces same-region technician availability as soon as a project needs staffing.' },
  { problem: 'The operation runs on disconnected, manual tools — dates go stale and feedback loops leak.', fix: 'One source of truth in Jira, with SOPs documented in Confluence.', auto: 'Jira automation handles propagation and alerts; Claude Code adds natural-language ops and auto-summaries.' },
];

export default function Process() {
  const { projects, navigate, update } = useStore();
  const atStep = projectsAtStep(projects);
  const chip = (id) => navigate('schedule', id);
  const move = (id, stepIndex) => {
    const p = projects.find((x) => x.id === id);
    if (!p || p.progress === stepIndex) return;
    const entry = { id: `c-${Date.now()}`, ts: new Date().toISOString().slice(0, 10), field: 'Progress', old: STEPS[p.progress]?.name, new: STEPS[stepIndex].name, delta: 0, cause: 'Moved on Process board', by: 'OM', note: `Advanced to step ${stepIndex + 1}` };
    update('projects', id, { progress: stepIndex, changeLog: [...(p.changeLog || []), entry] });
  };
  const Arrow = () => <div className="wf2-arrow" style={{ textAlign: 'center' }}>↓</div>;

  return (
    <div className="page">
      <div className="page-head">
        <div><h1 className="page-title">Process & Optimisation</h1><div className="page-sub">The 24-step template as a live workflow · drag a project between steps to advance it — the change flows to the Schedule, timeline, table, and the project itself</div></div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="micro" style={{ marginBottom: 8 }}>Two pathways to deployed</div>
        <div className="row wrap" style={{ gap: 24, alignItems: 'center' }}>
          <div className="kv"><span className="pill indigo">New-hire</span> full 24-step path · ~6-week lead</div>
          <div className="kv"><span className="pill green">Returning</span> skips Buildots Training + PPE, still ships the kit · deployable in days</div>
          <span className="spacer" />
          <div className="small muted">Reuse is geography-driven → the case for one-vendor-per-region.</div>
        </div>
      </div>

      <div className="wf2">
        <PhaseBlock phase="Pre-Signature" atStep={atStep} onChip={chip} onMove={move} />
        <Arrow />
        <PhaseBlock phase="Signature" atStep={atStep} onChip={chip} onMove={move} />

        {/* Fork: the returning path is an alternative route around Training + Equipment */}
        <div className="wf2-arrow" style={{ textAlign: 'center' }}>↓</div>
        <div className="bypass">
          <div className="bypass-opt">
            <div className="micro" style={{ marginBottom: 2 }}>New-hire only</div>
            <PhaseBlock phase="Buildots Training" atStep={atStep} onChip={chip} onMove={move} small />
            <PhaseBlock phase="Equipment Setup" atStep={atStep} onChip={chip} onMove={move} small />
          </div>
          <div className="bypass-lane">
            <div className="small" style={{ fontWeight: 600 }}>from Signature</div>
            <div style={{ fontSize: 22, lineHeight: 1 }}>↓</div>
            <div style={{ fontWeight: 700, fontSize: 13, margin: '2px 0' }}>Returning-tech fast path</div>
            <div className="small">skips Training + PPE</div>
            <div style={{ fontSize: 22, lineHeight: 1, marginTop: 2 }}>↓</div>
            <div className="small" style={{ fontWeight: 600 }}>to First Installation</div>
          </div>
        </div>

        <PhaseBlock phase="First Installation" atStep={atStep} onChip={chip} onMove={move} />
        <Arrow />
        {/* Billing runs monthly, in parallel with Operational Delivery */}
        <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
          <PhaseBlock phase="Operational Delivery" atStep={atStep} onChip={chip} onMove={move} half />
          <PhaseBlock phase="Billing & Payments" atStep={atStep} onChip={chip} onMove={move} half />
        </div>
        <div className="small muted" style={{ textAlign: 'center', marginTop: 6 }}>Billing (Monthly Payment Approval) runs every month in parallel with ongoing delivery — shown side by side, not after.</div>
      </div>

      <div className="micro" style={{ margin: '22px 0 8px' }}>Bottleneck insights → fixes</div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {INSIGHTS.map((b, i) => (
          <div className="insight" key={i}>
            <div className="insight-top"><div className="k">🔴 Bottleneck {i + 1} · the problem</div><div style={{ fontWeight: 600, marginTop: 5, fontSize: 13 }}>{b.problem}</div></div>
            <div className="insight-body"><div className="k">↻ Proposed fix</div><div style={{ marginTop: 5, fontSize: 13 }}>{b.fix}</div><div className="small muted" style={{ marginTop: 8 }}><span className="pill indigo">⚙ automation</span> {b.auto}</div></div>
          </div>
        ))}
      </div>

      <div className="card card-pad" style={{ marginTop: 16 }}>
        <div className="micro" style={{ marginBottom: 6 }}>The sequence (the punchline)</div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>Standardize → cluster / reuse → automate → unlock the vendor scale-up.</div>
        <div className="small muted" style={{ marginTop: 6 }}>Part 5 is the gate Part 1's vendor recommendation depends on: you cannot hand a process to a vendor, or automate it, until it is written down and stable. Tool recommendation: Jira + Confluence + Claude Code.</div>
      </div>
    </div>
  );
}
