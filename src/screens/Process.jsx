import { useState } from 'react';
import { useStore } from '../data/store.jsx';
import { STEPS, PHASES, BOUNDARY_STEP } from '../data/seed';
import { projectsAtStep, projectStatus } from '../data/derive';
import { StatusPill } from '../components/bits.jsx';

const BOTTLENECK_PHASES = new Set(['Buildots Training', 'Equipment Setup']);

export default function Process() {
  const { projects, navigate } = useStore();
  const atStep = projectsAtStep(projects);
  const [drill, setDrill] = useState(null); // step index

  const phaseCount = (phase) => STEPS.filter((s) => s.phase === phase).reduce((n, s) => n + (atStep[s.i]?.length || 0), 0);
  const drillStep = drill != null ? STEPS[drill] : null;
  const drillProjects = drill != null ? atStep[drill] : [];

  return (
    <div className="page">
      <div className="page-head">
        <div><h1 className="page-title">Process & Optimisation</h1><div className="page-sub">The 24-step template as a live workflow + aggregate bottleneck lens · click any step to see the projects in it</div></div>
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

      <div className="row" style={{ gap: 16, alignItems: 'flex-start' }}>
        {/* Top-down workflow */}
        <div style={{ flex: drill != null ? '1 1 60%' : '1 1 100%', minWidth: 0 }}>
          <div className="wf2">
            {PHASES.map((phase, pi) => {
              const steps = STEPS.filter((s) => s.phase === phase);
              const isField = !steps[0].office;
              const bottleneck = BOTTLENECK_PHASES.has(phase);
              return (
                <div key={phase}>
                  {steps[0].i === BOUNDARY_STEP && (
                    <div className="boundary" style={{ margin: '4px 0 10px', borderRadius: 6 }}>▾ Handoff to the Regional Lead (Gil) · field execution begins ▾</div>
                  )}
                  <div className={`wf2-phase ${bottleneck ? 'bottleneck' : ''}`}>
                    <div className="wf2-phead">
                      <span className="pn">{pi + 1}. {phase}</span>
                      <span className="pill grey">{isField ? 'field' : 'office'}</span>
                      {bottleneck && <span className="pill red">bottleneck · readiness spine</span>}
                      <span className="spacer" />
                      <span className="small muted">{phaseCount(phase)} project{phaseCount(phase) === 1 ? '' : 's'} here</span>
                    </div>
                    <div className="wf2-steps">
                      {steps.map((s) => {
                        const n = atStep[s.i]?.length || 0;
                        return (
                          <div key={s.i} className={`wf2-step ${bottleneck && n > 0 ? 'hot' : ''} ${drill === s.i ? 'hot' : ''}`} onClick={() => setDrill(drill === s.i ? null : s.i)}>
                            <span className="small muted mono-num">{s.i + 1}</span>
                            <span>{s.name}</span>
                            {n > 0 && <span className="c">{n}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {pi < PHASES.length - 1 && <div className="wf2-arrow" style={{ textAlign: 'center' }}>↓</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Drill panel */}
        {drill != null && (
          <div className="card" style={{ flex: '1 1 40%', position: 'sticky', top: 76, minWidth: 300 }}>
            <div className="card-head"><h3>Step {drill + 1}: {drillStep.name}</h3><button className="x" onClick={() => setDrill(null)}>×</button></div>
            <div className="card-pad">
              <div className="small muted" style={{ marginBottom: 10 }}>{drillProjects.length} project{drillProjects.length === 1 ? '' : 's'} currently at this step · {drillStep.office ? 'office-owned' : 'field (Regional Lead)'}</div>
              {drillProjects.length === 0 && <div className="muted small">No projects sit here right now.</div>}
              {drillProjects.map((p) => (
                <div key={p.id} className="acard" style={{ marginBottom: 8, cursor: 'pointer' }} onClick={() => navigate('schedule', p.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <b>{p.name}</b><StatusPill status={projectStatus(p)} /><span className="spacer" /><span className="go">open ↗</span>
                  </div>
                  <div className="small muted">{p.account} · {p.region} · {p.assignmentType} · {p.floors ?? '—'} floors</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottleneck fixes */}
      <div className="micro" style={{ margin: '22px 0 8px' }}>Three bottlenecks → fixes (process fix carries the weight; automation is a forward layer)</div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[
          { t: '1 · Readiness spine is serial', p: 'Parallelize OSHA10 / Training / Kit / PPE + write the SOP in Confluence', a: 'A "prep technician" Claude Code Skill fires the parallel gates (illustrative, not over-promised)' },
          { t: '2 · Rebuilt from scratch', p: 'Geography-driven reuse: cluster per region, one-vendor-per-region', a: 'The tool surfaces same-region availability; no smart-matching pitch' },
          { t: '3 · Disconnected tooling', p: 'Single source of truth = Jira + Confluence SOPs', a: 'Native Jira automation now; Claude Code MCP / Skills as the grow-into layer' },
        ].map((b) => (
          <div className="card card-pad" key={b.t}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{b.t}</div>
            <div className="small" style={{ marginBottom: 6 }}><span className="pill green">↻ process</span> {b.p}</div>
            <div className="small"><span className="pill indigo">⚙ automate</span> {b.a}</div>
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
