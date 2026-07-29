/**
 * Hand-built SVG charts.
 *
 * No charting library: these five forms are all the CRM needs, and rolling them
 * keeps the bundle small and the marks consistent with the rest of the UI.
 *
 * Conventions kept across every chart here:
 *   - one measure per axis, never a second y-scale
 *   - 2px lines, 4px rounded data-ends, recessive grid
 *   - hover crosshair/tooltip by default
 *   - categorical fills always paired with a direct label (the series palette's
 *     gold step sits under 3:1 on white, so labels are the relief)
 */
import { useId, useMemo, useRef, useState } from 'react';

const SERIES = [
  'var(--series-1)',
  'var(--series-2)',
  'var(--series-3)',
  'var(--series-4)',
  'var(--series-5)',
  'var(--series-6)',
  'var(--series-7)',
];

export const seriesColour = (index) => SERIES[index % SERIES.length];

/** Catmull-Rom → cubic bezier, so the revenue line reads smooth but never overshoots. */
function smoothPath(points) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/**
 * Picks a round step (1/2/2.5/5 × 10ⁿ) and returns the axis top plus its ticks.
 * Dividing the raw max into equal parts is what produces labels like
 * "6.666666666666667" — stepping to a round number first avoids that entirely.
 */
function niceScale(rawMax, tickCount = 4) {
  if (!Number.isFinite(rawMax) || rawMax <= 0) return { max: 1, ticks: [0, 1] };

  const rough = rawMax / tickCount;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalised = rough / magnitude;
  const step =
    (normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 2.5 ? 2.5 : normalised <= 5 ? 5 : 10) * magnitude;

  const max = Math.ceil(rawMax / step) * step;
  const ticks = [];
  for (let value = 0; value <= max + step / 1000; value += step) {
    ticks.push(Math.round(value * 1e6) / 1e6);
  }
  return { max, ticks };
}

/* --- Area chart ----------------------------------------------------------- */

export function AreaChart({ data, xKey = 'label', yKey = 'value', height = 210, format = (v) => v, label = 'Value' }) {
  const [hover, setHover] = useState(null);
  const svgRef = useRef(null);
  const gradientId = useId();

  const pad = { top: 14, right: 8, bottom: 26, left: 44 };
  const width = 720;
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const { points, ticks, max } = useMemo(() => {
    const { max: maxValue, ticks: tickValues } = niceScale(
      Math.max(...data.map((d) => Number(d[yKey]) || 0), 1)
    );
    const step = data.length > 1 ? plotW / (data.length - 1) : 0;
    return {
      max: maxValue,
      ticks: tickValues,
      points: data.map((d, i) => ({
        x: pad.left + i * step,
        y: pad.top + plotH - ((Number(d[yKey]) || 0) / maxValue) * plotH,
        datum: d,
      })),
    };
  }, [data, yKey, plotW, plotH, pad.left, pad.top]);

  if (!data.length) return <div className="chart-empty">Nothing to plot yet</div>;

  const line = smoothPath(points);
  const area = `${line} L ${points.at(-1).x} ${pad.top + plotH} L ${points[0].x} ${pad.top + plotH} Z`;

  const onMove = (event) => {
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * width;
    let nearest = 0;
    let best = Infinity;
    points.forEach((point, index) => {
      const distance = Math.abs(point.x - x);
      if (distance < best) {
        best = distance;
        nearest = index;
      }
    });
    setHover(nearest);
  };

  const active = hover === null ? null : points[hover];

  return (
    <div className="chart">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="chart__svg"
        role="img"
        aria-label={`${label} over time`}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--series-1)" stopOpacity="0.20" />
            <stop offset="100%" stopColor="var(--series-1)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((tick) => {
          const y = pad.top + plotH - (tick / max) * plotH;
          return (
            <g key={tick}>
              <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="var(--grid)" strokeWidth="1" />
              <text x={pad.left - 9} y={y + 3.5} className="chart__axis" textAnchor="end">
                {format(tick, true)}
              </text>
            </g>
          );
        })}

        <path d={area} fill={`url(#${gradientId})`} />
        <path d={line} fill="none" stroke="var(--series-1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {data.map((d, i) => {
          // Thin the x labels so they never collide on narrow cards.
          const every = Math.ceil(data.length / 7);
          if (i % every !== 0) return null;
          return (
            <text key={i} x={points[i].x} y={height - 7} className="chart__axis" textAnchor="middle">
              {d[xKey]}
            </text>
          );
        })}

        {active && (
          <g>
            <line
              x1={active.x}
              x2={active.x}
              y1={pad.top}
              y2={pad.top + plotH}
              stroke="var(--ink-4)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <circle cx={active.x} cy={active.y} r="5.5" fill="var(--series-1)" stroke="var(--surface)" strokeWidth="2" />
          </g>
        )}
      </svg>

      {active && (
        <div
          className="chart__tip"
          style={{ left: `${(active.x / width) * 100}%`, top: `${(active.y / height) * 100}%` }}
        >
          <strong>{format(active.datum[yKey])}</strong>
          <span>{active.datum[xKey]}</span>
        </div>
      )}
    </div>
  );
}

/* --- Column chart --------------------------------------------------------- */

export function ColumnChart({ data, xKey = 'label', yKey = 'value', height = 210, format = (v) => v, label = 'Value' }) {
  const [hover, setHover] = useState(null);
  const pad = { top: 14, right: 8, bottom: 26, left: 40 };
  const width = 720;
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  if (!data.length) return <div className="chart-empty">Nothing to plot yet</div>;

  const { max, ticks } = niceScale(Math.max(...data.map((d) => Number(d[yKey]) || 0), 1), 3);
  const slot = plotW / data.length;
  const barW = Math.max(4, Math.min(26, slot - 8)); // 2px+ of surface between bars

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${width} ${height}`} className="chart__svg" role="img" aria-label={label}>
        {ticks.map((tick) => {
          const y = pad.top + plotH - (tick / max) * plotH;
          return (
            <g key={tick}>
              <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="var(--grid)" strokeWidth="1" />
              <text x={pad.left - 9} y={y + 3.5} className="chart__axis" textAnchor="end">
                {format(tick, true)}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const value = Number(d[yKey]) || 0;
          const barH = Math.max(value > 0 ? 3 : 0, (value / max) * plotH);
          const x = pad.left + i * slot + (slot - barW) / 2;
          const y = pad.top + plotH - barH;
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              {/* Generous invisible hit area — the bar itself is too thin to target. */}
              <rect x={pad.left + i * slot} y={pad.top} width={slot} height={plotH} fill="transparent" />
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx="4"
                fill={hover === i ? 'var(--seq-600)' : 'var(--series-1)'}
                opacity={hover === null || hover === i ? 1 : 0.42}
              />
              {hover === i && (
                <text x={x + barW / 2} y={y - 7} className="chart__value" textAnchor="middle">
                  {format(value)}
                </text>
              )}
            </g>
          );
        })}

        {data.map((d, i) => {
          const every = Math.ceil(data.length / 8);
          if (i % every !== 0) return null;
          return (
            <text key={i} x={pad.left + i * slot + slot / 2} y={height - 7} className="chart__axis" textAnchor="middle">
              {d[xKey]}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/* --- Horizontal bar list -------------------------------------------------- */

/**
 * Ranked magnitude. Single hue by default — rank is not identity, so it doesn't
 * earn categorical colour. Pass `categorical` when each row is a distinct person
 * or entity whose colour should stay put as the list is filtered.
 */
export function BarList({ data, labelKey = 'label', valueKey = 'value', format = (v) => v, categorical = false }) {
  if (!data.length) return <div className="chart-empty">Nothing to plot yet</div>;

  const max = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);

  return (
    <ul className="barlist">
      {data.map((d, i) => {
        const value = Number(d[valueKey]) || 0;
        return (
          <li key={d[labelKey] ?? i} className="barlist__row">
            <div className="barlist__head">
              <span className="barlist__label truncate">
                {categorical && <i className="barlist__swatch" style={{ background: d.colour ?? seriesColour(i) }} />}
                {d[labelKey]}
              </span>
              <span className="barlist__value numeric">{format(value)}</span>
            </div>
            <div className="barlist__track">
              <div
                className="barlist__fill"
                style={{
                  width: `${Math.max(2, (value / max) * 100)}%`,
                  background: categorical ? (d.colour ?? seriesColour(i)) : 'var(--series-1)',
                  opacity: categorical ? 1 : 1 - i * 0.09,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* --- Donut ---------------------------------------------------------------- */

export function DonutChart({ data, labelKey = 'label', valueKey = 'value', format = (v) => v, centreLabel }) {
  const [hover, setHover] = useState(null);
  const total = data.reduce((sum, d) => sum + (Number(d[valueKey]) || 0), 0);

  if (!total) return <div className="chart-empty">Nothing to plot yet</div>;

  const size = 168;
  const radius = 66;
  const stroke = 22;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="donut">
      <div className="donut__ring">
        <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={centreLabel ?? 'Breakdown'}>
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            {data.map((d, i) => {
              const value = Number(d[valueKey]) || 0;
              const fraction = value / total;
              // 2px of surface between segments so adjacent fills never touch.
              const gap = 2;
              const dash = Math.max(0, fraction * circumference - gap);
              const segment = (
                <circle
                  key={d[labelKey] ?? i}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={d.colour ?? seriesColour(i)}
                  strokeWidth={hover === i ? stroke + 4 : stroke}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                  opacity={hover === null || hover === i ? 1 : 0.4}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  style={{ transition: 'stroke-width 140ms ease, opacity 140ms ease' }}
                />
              );
              offset += fraction * circumference;
              return segment;
            })}
          </g>
        </svg>
        <div className="donut__centre">
          <strong className="numeric">{hover === null ? format(total) : format(data[hover][valueKey])}</strong>
          <span>{hover === null ? (centreLabel ?? 'Total') : data[hover][labelKey]}</span>
        </div>
      </div>

      <ul className="donut__legend">
        {data.map((d, i) => (
          <li
            key={d[labelKey] ?? i}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            data-dim={hover !== null && hover !== i}
          >
            <i style={{ background: d.colour ?? seriesColour(i) }} />
            <span className="truncate">{d[labelKey]}</span>
            <strong className="numeric">{format(d[valueKey])}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* --- Sparkline ------------------------------------------------------------ */

export function Sparkline({ data, valueKey = 'value', width = 96, height = 30, tone = 'var(--series-1)' }) {
  if (!data?.length) return null;

  const values = data.map((d) => Number(d[valueKey]) || 0);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const step = data.length > 1 ? width / (data.length - 1) : 0;

  const points = values.map((value, i) => ({
    x: i * step,
    y: height - 2 - ((value - min) / range) * (height - 4),
  }));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true" className="sparkline">
      <path d={smoothPath(points)} fill="none" stroke={tone} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points.at(-1).x} cy={points.at(-1).y} r="2.6" fill={tone} />
    </svg>
  );
}
