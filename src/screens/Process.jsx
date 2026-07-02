import { useStore } from '../data/store.jsx';
import { STEPS } from '../data/seed';
import { projectsAtStep } from '../data/derive';

const BOTTLENECK_PHASES = new Set(['Buildots Training', 'Equipment Setup']);
const phaseSteps = (phase) => STEPS.filter((s) => s.phase === phase);

function PhaseBlock({ phase, atStep, onChip, small }) {
  const steps = phaseSteps(phase);
  const count = steps.reduce((n, s) => n + (atStep[s.i]?.length || 0), 0);
  const bottleneck = BOTTLENECK_PHASES.has(phase);
  return (
    <div className={`wf2-phase ${bottleneck ? 'bottleneck' : ''}`}>
      <div className="wf2-phead">
        <span className="pn">{phase}</span>
        <span className="pill grey">{steps[0].office ? 'office' : 'field'}</span>
        {bottleneck && <span className="pill red">skipped on returning path</span>}
        <span className="spacer" />
        <span className="small muted">{count} project{count === 1 ? '' : 's'} here</span>
      </div>
      <div className="wf2-steps" style={small ? { gridTemplateColumns: '1fr' } : {}}>
        {steps.map((s) => {
          const ps = atStep[s.i] || [];
          return (
            <div key={s.i} className={`wf2-step ${bottleneck && ps.length ? 'hot' : ''}`}>
              <div className="st-head"><span className="small muted mono-num">{s.i + 1}</span><span>{s.name}</span>{ps.length > 0 && <span className="c">{ps.length}</span>}</div>
              {ps.length > 0 && <div className="wf2-chips">{ps.map((p) => <span key={p.id} className="wf2-chip" onClick={() => onChip(p.id)}>{p.name}</span>)}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const INSIGHTS = [
  { problem: 'The readiness spine (OSHA10 → Training → Kit → PPE) runs in sequence — it is the phase projects dwell in longest before they can deploy.', fix: 'Parallelize the independent gates and write the flow down as a Confluence SOP.', detail: 'A "prep technician" Claude Code Skill can fire the parallel gates on contract-sign (illustrative, not over-promised).' },
  { problem: 'Every project is staffed from scratch on a ~6-week new-hire lead — no reuse of already-trained technicians.', fix: 'Default returning technicians to the fast path; cluster work per region so reuse is even possible.', detail: 'Reuse is geography-bound → the case for one-vendor-per-region. The tool surfaces same-region availability; no smart-matching pitch.' },
  { problem: 'The operation runs on disconnected, manual tools (Sheets, email) — dates go stale and feedback loops leak.', fix: 'One source of truth in Jira + documented SOPs in Confluence.', detail: 'Native Jira automation now; Claude Code MCP / Skills are the grow-into intelligence layer.' },
];

export default function Process() {
  const { projects, navigate } = useStore();
  const atStep = projectsAtStep(projects);
  const chip = (id) => navigate('schedule', id);
  const Arrow = () => <div className="wf2-arrow" style={{ textAlign: 'center' }}>↓</div>;

  return (
    <div className="page">
      <div className="page-head">
        <div><h1 className="page-title">Process & Optimisation</h1><div className="page-sub">The 24-step template as a live workflow · every step shows the projects sitting in it (click a name to open it)</div></div>
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
        <PhaseBlock phase="Pre-Signature" atStep={atStep} onChip={chip} />
        <Arrow />
        <PhaseBlock phase="Signature" atStep={atStep} onChip={chip} />

        {/* Fork: not every project needs Training + Equipment */}
        <div className="wf2-arrow" style={{ textAlign: 'center' }}>↓</div>
        <div className="bypass">
          <div className="bypass-opt">
            <div className="micro" style={{ marginBottom: 2 }}>New-hire only</div>
            <PhaseBlock phase="Buildots Training" atStep={atStep} onChip={chip} small />
            <PhaseBlock phase="Equipment Setup" atStep={atStep} onChip={chip} small />
          </div>
          <div className="bypass-lane">
            <div style={{ fontSize: 22 }}>↳</div>
            <div style={{ fontWeight: 700, fontSize: 13, margin: '4px 0' }}>Returning-tech fast path</div>
            <div className="small">Skips Training + PPE — jumps straight from Signature to First Installation.</div>
            <div style={{ fontSize: 22, marginTop: 6 }}>↓</div>
          </div>
        </div>

        <PhaseBlock phase="First Installation" atStep={atStep} onChip={chip} />
        <Arrow />
        <PhaseBlock phase="Operational Delivery" atStep={atStep} onChip={chip} />
        <Arrow />
        <PhaseBlock phase="Billing & Payments" atStep={atStep} onChip={chip} />
      </div>

      <div className="micro" style={{ margin: '22px 0 8px' }}>Bottleneck insights → fixes</div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {INSIGHTS.map((b, i) => (
          <div className="insight" key={i}>
            <div className="insight-top"><div className="k">🔴 Bottleneck {i + 1} · the problem</div><div style={{ fontWeight: 600, marginTop: 5, fontSize: 13 }}>{b.problem}</div></div>
            <div className="insight-body"><div className="k">↻ Proposed fix</div><div style={{ marginTop: 5, fontSize: 13 }}>{b.fix}</div><div className="small muted" style={{ marginTop: 8 }}><span className="pill indigo">⚙ automation</span> {b.detail}</div></div>
          </div>
        ))}
      </div>

      <div className="card card-pad" style={{ marginTop: 16 }}>
        <div className="micro" style={{ marginBottom: 6 }}>The sequence (the punchline)</div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>Standardize → cluster / reuse → automate → unlock the vendor scale-up.</div>
        <div className="small muted" style={{ marginTop: 6 }}>Part 5 is the gate Part 1's vendor recommendation depends on: you cannot hand a process to a vendor, or automate it, until it is written down and stable. Tool recommendation: Jira + Confluence + Claude Code, layered honestly.</div>
      </div>
    </div>
  );
}
