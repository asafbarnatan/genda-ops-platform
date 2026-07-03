import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { STEPS, TODAY } from '../data/seed';
import { plannedStepDates, plannedStepToday, effectiveStep, stepStatus, recruitBy, recurringVisits, parseDate, projectStatus, addDays } from '../data/derive';

// Zoomable, pannable stage Gantt. Each project's 24 steps are blocks on a real time axis;
// block colour = stepStatus(p, i) (the SAME derivation the Process board + drawer use, so
// any edit there recolours the square live). Today line = where you should be (planned);
// the caret = where you are (effectiveStep). Range menu zooms; scroll sideways to pan.
const NAME_W = 152, ROW_H = 34, DAY = 86400000;
const RANGES = [{ k: '1W', d: 7 }, { k: '2W', d: 14 }, { k: '1M', d: 30 }, { k: '3M', d: 90 }, { k: '6M', d: 180 }, { k: '1Y', d: 365 }, { k: 'All', d: null }];
const STATUS_COLOR = { done: 'var(--bd-green)', doing: 'var(--bd-amber-s)', blocked: 'var(--bd-red)', skipped: 'var(--bd-ink-3)', todo: '#EBECEE' };

export default function GanttTimeline({ projects, onOpen }) {
  const scrollRef = useRef(null);
  const [trackW, setTrackW] = useState(900);
  const [rangeKey, setRangeKey] = useState('6M');

  const stamps = projects.flatMap((p) => [recruitBy(p), p.projectEnd || p.requestedDelivery]).filter(Boolean).map((d) => parseDate(d).getTime());
  const originMs = stamps.length ? Math.min(...stamps) : parseDate(TODAY).getTime();
  const endMs = stamps.length ? Math.max(...stamps) : originMs + 365 * DAY;
  const totalDays = Math.max(1, (endMs - originMs) / DAY);

  const range = RANGES.find((r) => r.k === rangeKey) || RANGES[4];
  const rangeDays = range.d || totalDays;
  const pxPerDay = Math.max(0.25, (trackW - NAME_W) / rangeDays);
  const contentW = totalDays * pxPerDay;
  const x = (dstr) => { const t = parseDate(dstr)?.getTime(); return t == null ? 0 : ((t - originMs) / DAY) * pxPerDay; };

  useLayoutEffect(() => { if (scrollRef.current) setTrackW(scrollRef.current.clientWidth); }, []);
  useEffect(() => {
    const on = () => { if (scrollRef.current) setTrackW(scrollRef.current.clientWidth); };
    window.addEventListener('resize', on); return () => window.removeEventListener('resize', on);
  }, []);
  // re-center on today whenever the zoom changes
  useEffect(() => {
    const el = scrollRef.current; if (!el) return;
    const todayX = NAME_W + x(TODAY);
    el.scrollTo({ left: Math.max(0, todayX - (trackW - NAME_W) * 0.28), behavior: 'smooth' });
  }, [rangeKey, trackW]); // eslint-disable-line react-hooks/exhaustive-deps

  // adaptive ticks
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

  return (
    <div className="gantt">
      <div className="gantt-menu">
        <span className="micro" style={{ marginRight: 4 }}>View</span>
        {RANGES.map((r) => <button key={r.k} className={`gbtn ${rangeKey === r.k ? 'on' : ''}`} onClick={() => setRangeKey(r.k)}>{r.k}</button>)}
        <span className="spacer" />
        <span className="small muted">scroll sideways to move through time · click a project to open</span>
      </div>
      <div className="gantt-scroll" ref={scrollRef}>
        <div className="gantt-inner" style={{ width: NAME_W + contentW }}>
          <div className="gantt-axis" style={{ width: NAME_W + contentW }}>
            {ticks.map((t, i) => <span key={i} className="gtick" style={{ left: NAME_W + t.x }}>{t.label}</span>)}
          </div>
          <div className="gantt-today" style={{ left: NAME_W + x(TODAY) }}><span>Today</span></div>
          {projects.map((p) => {
            const planned = plannedStepDates(p);
            const eff = effectiveStep(p);
            const should = plannedStepToday(p);
            const gap = should - eff; // >0 behind
            const st = projectStatus(p);
            const dot = st === 'ontrack' ? 'green' : st === 'atrisk' ? 'amber' : st === 'critical' ? 'red' : 'grey';
            return (
              <div className="gantt-row" key={p.id} style={{ height: ROW_H }}>
                <div className="gantt-name rowlink" style={{ width: NAME_W }} onClick={() => onOpen(p.id)} title={`Open ${p.name}`}>
                  <span className={`dot-s ${dot}`} /><span className="gname">{p.name}</span>
                  {gap > 0 ? <span className="gbadge behind">{gap} behind</span> : gap < 0 ? <span className="gbadge ahead">{-gap} ahead</span> : <span className="gbadge ontrack">on track</span>}
                </div>
                {STEPS.map((s, i) => {
                  const startD = planned[i]; if (!startD) return null;
                  const stopD = planned[i + 1] || addDays(startD, 12);
                  const left = NAME_W + x(startD), w = Math.max(3, x(stopD) - x(startD));
                  const status = stepStatus(p, i);
                  return (
                    <div key={i} className="gblock" title={`${i + 1}. ${s.name}${s.info ? ' — ' + s.info : ''}`}
                      style={{ left, width: w, background: STATUS_COLOR[status] || STATUS_COLOR.todo, borderColor: status === 'todo' ? 'var(--bd-border)' : 'transparent' }}>
                      {w >= 15 && <span className="gblk-n" style={{ color: status === 'todo' ? '#8A8B8D' : '#fff' }}>{i + 1}</span>}
                    </div>
                  );
                })}
                {recurringVisits(p).map((rv, i) => <div key={`rv${i}`} className="gvisit" style={{ left: NAME_W + x(rv) }} title={`recurring visit ${rv}`} />)}
                <div className="gcaret" style={{ left: NAME_W + x(planned[eff] || TODAY) }} title={`you are at step ${eff + 1} of 24`} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
