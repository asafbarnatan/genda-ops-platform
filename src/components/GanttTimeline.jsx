import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { STEPS, TODAY } from '../data/seed';
import { plannedStepDates, effectiveStep, stepDisplayStatus, STEP_STATUSES, recruitBy, readinessBy, recurringVisits, parseDate, projectStatus, addDays, fmtDate } from '../data/derive';
import { StatusPill } from './bits.jsx';

// Zoomable, pannable stage Gantt. Two frozen columns on the left — project name, then the
// project-status pill (Critical / At risk / On track / Planning, the SAME status shown in the
// table and drawer) — then the 24 stage squares on a real time axis. Square colour =
// stepDisplayStatus(p, i) (the SAME derivation the drawer stepper + legend use). Step 1 =
// recruit-by (delivery − 6wk); prep closes on the Ready-by marker (delivery − 10 business days);
// First Installation (step 17) sits on the Requested-delivery ◆. Click a square to set its status.
const NAME_W = 90, STATUS_W = 132, LABEL_W = NAME_W + STATUS_W, ROW_H = 42, DAY = 86400000;
const RANGES = [{ k: '1W', d: 7 }, { k: '2W', d: 14 }, { k: '1M', d: 30 }, { k: '3M', d: 90 }, { k: '6M', d: 180 }, { k: '1Y', d: 365 }, { k: 'All', d: null }];
const STATUS_COLOR = { done: 'var(--bd-green)', doing: 'var(--bd-amber-s)', behind: 'var(--bd-red)', skipped: 'var(--bd-ink-3)', todo: '#EBECEE' };
const STATUS_LABEL = { done: 'Done', doing: 'In progress', behind: 'Behind', skipped: 'Skipped (returning path)', todo: 'Upcoming' };

export default function GanttTimeline({ projects, onOpen, onOpenStageGuide, onSetStep }) {
  const scrollRef = useRef(null);
  const [trackW, setTrackW] = useState(900);
  const [rangeKey, setRangeKey] = useState('6M');
  const [tip, setTip] = useState(null);
  const [editor, setEditor] = useState(null);

  const stamps = projects.flatMap((p) => [recruitBy(p), p.projectEnd || p.requestedDelivery]).filter(Boolean).map((d) => parseDate(d).getTime());
  const originMs = stamps.length ? Math.min(...stamps) : parseDate(TODAY).getTime();
  const endMs = stamps.length ? Math.max(...stamps) : originMs + 365 * DAY;
  const totalDays = Math.max(1, (endMs - originMs) / DAY);

  const range = RANGES.find((r) => r.k === rangeKey) || RANGES[4];
  const rangeDays = range.d || totalDays;
  const pxPerDay = Math.max(0.25, (trackW - LABEL_W) / rangeDays);
  const contentW = totalDays * pxPerDay;
  const x = (dstr) => { const t = parseDate(dstr)?.getTime(); return t == null ? 0 : ((t - originMs) / DAY) * pxPerDay; };

  useLayoutEffect(() => { if (scrollRef.current) setTrackW(scrollRef.current.clientWidth); }, []);
  useEffect(() => {
    const on = () => { if (scrollRef.current) setTrackW(scrollRef.current.clientWidth); };
    window.addEventListener('resize', on); return () => window.removeEventListener('resize', on);
  }, []);
  useEffect(() => {
    const el = scrollRef.current; if (!el) return;
    const todayX = LABEL_W + x(TODAY);
    el.scrollTo({ left: Math.max(0, todayX - (trackW - LABEL_W) * 0.28), behavior: 'smooth' });
  }, [rangeKey, trackW]); // eslint-disable-line react-hooks/exhaustive-deps

  const ticks = [];
  const start = new Date(originMs), end = new Date(endMs);
  const tx = (t) => ((t - originMs) / DAY) * pxPerDay;
  if (pxPerDay >= 20) {
    const d = new Date(start); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - d.getDay());
    for (; d <= end; d.setDate(d.getDate() + 7)) ticks.push({ x: tx(d.getTime()), label: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) });
  } else if (pxPerDay >= 3) {
    const d = new Date(start.getFullYear(), start.getMonth(), 1);
    for (; d <= end; d.setMonth(d.getMonth() + 1)) ticks.push({ x: tx(d.getTime()), label: d.toLocaleDateString('en-GB', pxPerDay < 6 ? { month: 'short', year: '2-digit' } : { month: 'short' }) });
  } else {
    const d = new Date(start.getFullYear(), Math.floor(start.getMonth() / 3) * 3, 1);
    for (; d <= end; d.setMonth(d.getMonth() + 3)) ticks.push({ x: tx(d.getTime()), label: d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) });
  }

  const showTip = (e, i, s, label, planned) => {
    if (editor) return;
    const r = e.currentTarget.getBoundingClientRect();
    setTip({ n: i + 1, name: s.name, info: s.info, label, planned, top: r.top, left: r.left + r.width / 2 });
  };
  const openEditor = (e, p, i, s) => {
    if (!onSetStep) return;
    e.stopPropagation();
    setTip(null);
    const r = e.currentTarget.getBoundingClientRect();
    setEditor({ pid: p.id, i, name: `${i + 1}. ${s.name}`, cur: stepDisplayStatus(p, i), overridden: p.stepState?.[i] != null, top: r.bottom + 4, left: r.left + r.width / 2 });
  };

  return (
    <div className="gantt">
      <div className="gantt-menu">
        <span className="micro" style={{ marginRight: 4 }}>View</span>
        {RANGES.map((r) => <button key={r.k} className={`gbtn ${rangeKey === r.k ? 'on' : ''}`} onClick={() => setRangeKey(r.k)}>{r.k}</button>)}
        <span className="spacer" />
        <span className="small muted">{onSetStep ? 'click a square to set its status · click a name to open' : 'scroll sideways to move through time'}</span>
        {onOpenStageGuide && <button className="btn btn-sm gantt-stageguide" onClick={onOpenStageGuide} title="What each of the 24 stage numbers means">Stage guide</button>}
      </div>
      <div className="gantt-scroll" ref={scrollRef} onScroll={() => { if (tip) setTip(null); if (editor) setEditor(null); }}>
        <div className="gantt-inner" style={{ width: LABEL_W + contentW }}>
          <div className="gantt-axis" style={{ width: LABEL_W + contentW }}>
            <div className="gantt-frozen gantt-frozen-head" style={{ width: LABEL_W }}>
              <div className="gah-cell" style={{ width: NAME_W }}>Project</div>
              <div className="gah-cell gah-status" style={{ width: STATUS_W }}>
                <span className="pill grey gah-lab">Project status</span>
                <span className="gah-sub">stage</span>
              </div>
            </div>
            {ticks.map((t, i) => <span key={i} className="gtick" style={{ left: LABEL_W + t.x }}>{t.label}</span>)}
          </div>
          <div className="gantt-today" style={{ left: LABEL_W + x(TODAY) }}><span>Today</span></div>
          {projects.map((p) => {
            const planned = plannedStepDates(p);
            const eff = effectiveStep(p);
            const disp = STEPS.map((s, i) => stepDisplayStatus(p, i, { planned }));
            const doneCount = disp.filter((d) => d === 'done').length;
            const behindCount = disp.filter((d) => d === 'behind').length;
            const rd = p.requestedDelivery, rb = readinessBy(p);
            return (
              <div className="gantt-row" key={p.id} style={{ height: ROW_H }}>
                <div className="gantt-frozen" style={{ width: LABEL_W }}>
                  <div className="gantt-name rowlink" style={{ width: NAME_W }} onClick={() => onOpen(p.id)} title={`Open ${p.name}`}>
                    <span className="gname">{p.name}</span>
                  </div>
                  <div className="gantt-status" style={{ width: STATUS_W }} onClick={() => onOpen(p.id)}>
                    <StatusPill status={projectStatus(p)} />
                    <div className="gstage-sum">{doneCount}/24 done{behindCount > 0 && <span className="gstage-behind"> · {behindCount} behind</span>}</div>
                  </div>
                </div>
                {STEPS.map((s, i) => {
                  const startD = planned[i]; if (!startD) return null;
                  const stopD = planned[i + 1] || addDays(startD, 12);
                  const left = LABEL_W + x(startD), w = Math.max(3, x(stopD) - x(startD));
                  const status = disp[i];
                  const lightBlk = status === 'todo';
                  return (
                    <div key={i} className={`gblock ${onSetStep ? 'editable' : ''} ${editor && editor.pid === p.id && editor.i === i ? 'editing' : ''}`}
                      onMouseEnter={(e) => showTip(e, i, s, STATUS_LABEL[status], startD)} onMouseLeave={() => setTip(null)}
                      onClick={(e) => openEditor(e, p, i, s)}
                      style={{ left, width: w, background: STATUS_COLOR[status] || STATUS_COLOR.todo, borderColor: lightBlk ? 'var(--bd-border)' : 'transparent' }}>
                      {w >= 15 && <span className="gblk-n" style={{ color: lightBlk ? '#8A8B8D' : '#fff' }}>{i + 1}</span>}
                    </div>
                  );
                })}
                {recurringVisits(p).map((rv, i) => <div key={`rv${i}`} className="gvisit" style={{ left: LABEL_W + x(rv) }} title={`recurring visit ${rv}`} />)}
                {rb && <div className="grd-ready" style={{ left: LABEL_W + x(rb) }} title={`Ready-by (Readiness SLA) — ${fmtDate(rb)}: prep should be done, technician ready ~10 business days early`} />}
                {rd && <div className="grd" style={{ left: LABEL_W + x(rd) }} title={`Requested delivery — ${fmtDate(rd)} (First Installation is due here)`} />}
                <div className="gcaret" style={{ left: LABEL_W + x(planned[eff] || TODAY) }} title={`Current stage — step ${eff + 1}: ${STEPS[eff].name}`} />
              </div>
            );
          })}
        </div>
      </div>
      {tip && (
        <div className="gtip" style={{ top: tip.top, left: tip.left }}>
          <div className="gtip-h">{tip.n}. {tip.name}</div>
          {tip.info && <div className="gtip-info">{tip.info}</div>}
          <div className="gtip-meta">Planned {fmtDate(tip.planned)} · {tip.label}</div>
        </div>
      )}
      {editor && (
        <>
          <div className="gedit-overlay" onClick={() => setEditor(null)} />
          <div className="gedit" style={{ top: editor.top, left: editor.left }}>
            <div className="gedit-h">{editor.name}</div>
            {STEP_STATUSES.map((o) => {
              const active = (editor.cur === 'behind' ? 'blocked' : editor.cur) === o.v;
              return (
                <button key={o.v} className={`gedit-opt ${active ? 'on' : ''}`} onClick={() => { onSetStep(editor.pid, editor.i, o.v); setEditor(null); }}>
                  <span className="gedit-sw" style={{ background: o.color, border: o.v === 'todo' ? '1px solid var(--bd-border)' : 'none' }} />{o.label}
                </button>
              );
            })}
            <button className="gedit-opt reset" onClick={() => { onSetStep(editor.pid, editor.i, 'auto'); setEditor(null); }} disabled={!editor.overridden}>↺ Auto (follow the flow)</button>
          </div>
        </>
      )}
    </div>
  );
}
