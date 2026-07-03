import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceArea, ReferenceLine } from 'recharts';
import { techColor } from '../data/derive';

// Shared monthly-composite trend used on BOTH the Quality tab and the Manager dashboard,
// so the two charts are identical: same per-technician colors (stable by id), one legend,
// one tooltip that maps each name to its curve colour, and the red danger-zones under the
// review (< 3.0) and removal (< 2.0) thresholds.

// Document-global SVG pattern defs — url(#..) works for any chart on the page.
function DangerDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <defs>
        <pattern id="hatchBench" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)">
          <rect width="7" height="7" fill="#E5533D" opacity="0.05" />
          <line x1="0" y1="0" x2="0" y2="7" stroke="#E5533D" strokeWidth="1.4" opacity="0.30" />
        </pattern>
        <pattern id="hatchRemove" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <rect width="6" height="6" fill="#E5533D" opacity="0.12" />
          <line x1="0" y1="0" x2="0" y2="6" stroke="#E5533D" strokeWidth="2" opacity="0.55" />
        </pattern>
      </defs>
    </svg>
  );
}

function QTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const rows = [...payload].filter((p) => p.value != null).sort((a, b) => b.value - a.value);
  return (
    <div style={{ background: 'var(--bd-ink)', color: '#fff', borderRadius: 8, padding: '8px 11px', fontSize: 12, boxShadow: 'var(--sh-modal)', minWidth: 150 }}>
      <div style={{ fontWeight: 700, marginBottom: 5, letterSpacing: '0.03em' }}>{label}</div>
      {rows.map((p) => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '1px 0' }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: p.color, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{p.name}</span>
          <b style={{ marginLeft: 10, fontVariantNumeric: 'tabular-nums', color: p.value < 2 ? '#ff9d8f' : p.value < 3 ? '#ffcaa8' : '#fff' }}>{p.value}</b>
        </div>
      ))}
    </div>
  );
}

export default function QualityTrendChart({ data, techs, height = 300 }) {
  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <DangerDefs />
      <ResponsiveContainer>
        <LineChart data={data} margin={{ left: -18, right: 14, top: 8 }}>
          <CartesianGrid stroke="#EFEFEF" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9A9B9D' }} axisLine={false} tickLine={false} />
          <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: '#9A9B9D' }} axisLine={false} tickLine={false} />
          <ReferenceArea y1={2} y2={3} fill="url(#hatchBench)" fillOpacity={1} ifOverflow="hidden" />
          <ReferenceArea y1={1} y2={2} fill="url(#hatchRemove)" fillOpacity={1} ifOverflow="hidden" />
          <ReferenceLine y={3} stroke="#E5533D" strokeDasharray="4 3" strokeOpacity={0.55} label={{ value: '3.0 · bench review', position: 'insideBottomRight', fontSize: 9, fill: '#b23524' }} />
          <ReferenceLine y={2} stroke="#E5533D" strokeDasharray="4 3" strokeOpacity={0.75} label={{ value: '2.0 · remove', position: 'insideBottomRight', fontSize: 9, fill: '#b23524' }} />
          <Tooltip content={<QTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {techs.map((t) => <Line key={t.id} type="monotone" dataKey={t.id} name={t.name} stroke={techColor(t.id)} strokeWidth={2} dot={{ r: 2 }} />)}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
