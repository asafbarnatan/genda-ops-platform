import { useStore } from '../data/store.jsx';
import { processTemplate } from '../data/seed';

// Where each project currently sits on the 24-step spine (by recruitment status).
// Onboarded projects queue at the readiness spine (Equipment) waiting on the kit → the visible bottleneck.
const LEVEL = { 'Pre-recruitment': 1, Onboarded: 3, Scheduled: 4, Deployed: 6 };
// phases 2 (Signature) is index1, Buildots Training index2, Equipment index3 = the readiness-spine bottleneck
const BOTTLENECKS = {
  2: { fix: '↻ Parallelize the gates + Confluence SOP', kind: 'readiness spine' },
  3: { fix: '⚙ "prep technician" Skill fires kit shipment on contract-sign', kind: 'readiness spine' },
};

export default function Process() {
  const { projects } = useStore();
  const active = projects.filter((p) => !p.junk);
  const countAt = (i) => active.filter((p) => (LEVEL[p.recruitmentStatus] ?? 1) === i).length;

  return (
    <div className="page">
      <div className="page-head">
        <div><h1 className="page-title">Process & Optimisation</h1><div className="page-sub">The 24-step template as an aggregate bottleneck lens · live counts from the portfolio</div></div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div className="micro" style={{ marginBottom: 8 }}>Two pathways to deployed</div>
        <div className="row wrap" style={{ gap: 24 }}>
          <div className="kv"><span className="pill indigo">New-hire</span> full 24-step path · ~6-week lead</div>
          <div className="kv"><span className="pill green">Returning</span> skips Buildots Training + PPE, still ships the kit · deployable in days</div>
          <div className="spacer" />
          <div className="small muted">Reuse is geography-driven: it needs a same-region trained tech → the case for one-vendor-per-region.</div>
        </div>
      </div>

      <div className="micro" style={{ margin: '4px 0 8px' }}>End-to-end workflow · projects currently at each phase</div>
      <div className="wf" style={{ marginBottom: 8 }}>
        {processTemplate.map((ph, i) => {
          const bn = BOTTLENECKS[i];
          return (
            <div className={`wf-phase ${bn ? 'bottleneck' : ''}`} key={ph.phase}>
              <div className="ph">{i + 1}. {ph.phase}</div>
              <div className="wf-count mono-num">{countAt(i)}</div>
              <div className="small muted">{ph.steps.length} steps · {ph.office ? 'office' : 'field'}</div>
              {bn && <div className="wf-fix">{bn.fix}</div>}
              {i === 4 && <div className="pill grey" style={{ marginTop: 6 }}>ownership boundary</div>}
            </div>
          );
        })}
      </div>
      <div className="small muted" style={{ marginBottom: 20 }}>Red-bordered phases are the concentrated bottleneck (the readiness spine). Every bottleneck gets a fix: solve-by-process (↻) or automate (⚙).</div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[
          { t: '1 · Readiness spine is serial', p: 'Parallelize OSHA10 / Training / Kit / PPE + write the SOP', a: 'A "prep technician" Claude Code Skill (illustrative, not over-promised)' },
          { t: '2 · Rebuilt from scratch', p: 'Geography-driven reuse: cluster per region, one-vendor-per-region', a: 'Tool surfaces same-region availability; no smart-matching pitch' },
          { t: '3 · Disconnected tooling', p: 'Single source of truth = Jira + Confluence SOPs', a: 'Native Jira automation now; Claude Code MCP/Skills grow into' },
        ].map((b) => (
          <div className="card card-pad" key={b.t}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{b.t}</div>
            <div className="small" style={{ marginBottom: 6 }}><span className="pill green">↻ process</span> {b.p}</div>
            <div className="small"><span className="pill indigo">⚙ automate</span> {b.a}</div>
          </div>
        ))}
      </div>

      <div className="card card-pad" style={{ marginTop: 18 }}>
        <div className="micro" style={{ marginBottom: 6 }}>The sequence (the punchline)</div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>Standardize → cluster/reuse → automate → unlock the vendor scale-up.</div>
        <div className="small muted" style={{ marginTop: 6 }}>Part 5 is the gate Part 1's vendor recommendation depends on: you cannot hand a process to a vendor, or automate it, until it is written down and stable. Tool recommendation: Jira + Confluence + Claude Code, layered honestly.</div>
      </div>
    </div>
  );
}
