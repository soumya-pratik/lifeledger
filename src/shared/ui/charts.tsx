const PALETTE = ["#0284c7", "#0d9488", "#7c3aed", "#d97706", "#e11d48", "#2563eb", "#65a30d", "#db2777"];

export function chartColor(i: number): string {
  return PALETTE[i % PALETTE.length];
}

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

export function DonutChart({
  slices,
  center,
}: {
  slices: { label: string; value: number; color: string }[];
  center?: string;
}) {
  const total = slices.reduce((a, s) => a + s.value, 0);
  if (total <= 0) {
    return <p className="text-sm text-ll-muted">Nothing to chart yet.</p>;
  }
  const cx = 80;
  const cy = 80;
  const r = 58;
  const ir = 36;
  let angle = 0;
  const paths: { d: string; color: string; label: string }[] = [];
  for (const s of slices) {
    const sweep = (s.value / total) * 360;
    const start = angle;
    const end = angle + sweep;
    angle = end;
    if (sweep >= 359.9) {
      paths.push({
        d: `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} L ${cx - 0.01} ${cy - ir} A ${ir} ${ir} 0 1 0 ${cx} ${cy - ir} Z`,
        color: s.color,
        label: s.label,
      });
      continue;
    }
    if (sweep < 0.3) continue;
    const large = sweep > 180 ? 1 : 0;
    const [ox1, oy1] = polar(cx, cy, r, start);
    const [ox2, oy2] = polar(cx, cy, r, end);
    const [ix2, iy2] = polar(cx, cy, ir, end);
    const [ix1, iy1] = polar(cx, cy, ir, start);
    paths.push({
      d: `M ${ox1} ${oy1} A ${r} ${r} 0 ${large} 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${ir} ${ir} 0 ${large} 0 ${ix1} ${iy1} Z`,
      color: s.color,
      label: s.label,
    });
  }
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
      <svg viewBox="0 0 160 160" className="h-40 w-40 shrink-0" role="img" aria-label="Donut chart">
        {paths.map((p) => (
          <path key={p.label + p.d} d={p.d} fill={p.color} />
        ))}
        {center ? (
          <text x={cx} y={cy + 4} textAnchor="middle" className="fill-ll-text" fontSize="11" fontWeight="600">
            {center}
          </text>
        ) : null}
      </svg>
      <ul className="w-full space-y-1.5 text-sm">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
              <span className="truncate text-ll-text">{s.label}</span>
            </span>
            <span className="shrink-0 tabular-nums text-ll-muted">{Math.round((s.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HBarChart({
  rows,
}: {
  rows: { label: string; value: number; color?: string; hint?: string }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <p className="text-sm text-ll-muted">Nothing to chart yet.</p>;
  return (
    <ul className="space-y-2.5">
      {rows.map((r, i) => (
        <li key={r.label}>
          <div className="mb-1 flex items-center justify-between gap-2 text-xs">
            <span className="truncate text-ll-text">{r.label}</span>
            <span className="shrink-0 tabular-nums text-ll-muted">{r.hint}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-ll-bg">
            <div
              className="h-full rounded-full"
              style={{ width: `${(r.value / max) * 100}%`, background: r.color ?? chartColor(i) }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function LineChart({
  points,
  labels,
}: {
  points: number[];
  labels: string[];
}) {
  const w = 320;
  const h = 120;
  const pad = { l: 8, r: 8, t: 8, b: 22 };
  const max = Math.max(1, ...points);
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const n = Math.max(1, points.length - 1);
  const coords = points.map((v, i) => {
    const x = pad.l + (i / n) * innerW;
    const y = pad.t + innerH - (v / max) * innerH;
    return `${x},${y}`;
  });
  const area = `${pad.l},${pad.t + innerH} ${coords.join(" ")} ${pad.l + innerW},${pad.t + innerH}`;
  const ticks = labels
    .map((label, i) => ({ label, i }))
    .filter((_, i, arr) => i === 0 || i === arr.length - 1 || i === Math.floor(arr.length / 2));
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-32 w-full" role="img" aria-label="Line chart">
      <polygon points={area} fill="var(--ll-accent)" opacity="0.12" />
      <polyline points={coords.join(" ")} fill="none" stroke="var(--ll-accent)" strokeWidth="2" />
      {ticks.map((t) => {
        const x = pad.l + (t.i / n) * innerW;
        return (
          <text key={t.label + t.i} x={x} y={h - 6} textAnchor="middle" fontSize="9" fill="var(--ll-muted)">
            {t.label}
          </text>
        );
      })}
    </svg>
  );
}

export function GroupedBars({
  groups,
}: {
  groups: { label: string; a: number; b: number }[];
}) {
  const max = Math.max(1, ...groups.flatMap((g) => [g.a, g.b]));
  const w = 360;
  const h = 140;
  const pad = { l: 8, r: 8, t: 8, b: 28 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const slot = innerW / groups.length;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-40 w-full" role="img" aria-label="Income versus spend">
      {groups.map((g, i) => {
        const x = pad.l + i * slot;
        const bw = slot * 0.32;
        const ah = (g.a / max) * innerH;
        const bh = (g.b / max) * innerH;
        return (
          <g key={g.label}>
            <rect x={x + slot * 0.14} y={pad.t + innerH - ah} width={bw} height={ah} rx="2" fill="#0d9488" />
            <rect x={x + slot * 0.5} y={pad.t + innerH - bh} width={bw} height={bh} rx="2" fill="var(--ll-accent)" />
            <text x={x + slot / 2} y={h - 8} textAnchor="middle" fontSize="9" fill="var(--ll-muted)">
              {g.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
