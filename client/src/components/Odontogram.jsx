import { useState } from 'react';
import { LOWER_LEFT, LOWER_RIGHT, TOOTH_STATUS, UPPER_LEFT, UPPER_RIGHT } from '../lib/constants.js';

/**
 * Dental chart in FDI notation, drawn from the clinician's viewpoint:
 * the patient's right sits on the left of the screen, upper arch on top.
 *
 * Each tooth is a small crown glyph rather than a plain square — it takes a few
 * more path points but makes the chart scannable at a glance, which is the whole
 * point of charting.
 */

function Tooth({ number, entry, onSelect, readOnly, lower }) {
  const status = entry?.status ?? 'healthy';
  const meta = TOOTH_STATUS[status];
  const isMissing = status === 'missing';

  return (
    <button
      type="button"
      className="tooth"
      data-status={status}
      data-arch={lower ? 'lower' : 'upper'}
      disabled={readOnly}
      onClick={() => onSelect?.(number, entry)}
      title={`${number} — ${meta.label}${entry?.surfaces?.length ? ` (${entry.surfaces.join('')})` : ''}`}
      aria-label={`Tooth ${number}, ${meta.label}`}
    >
      {/* Crown + two roots — a real tooth silhouette reads far faster across 32
          of them than a row of identical pills. The glyph is drawn crown-up, so
          the UPPER arch is the one that gets flipped: its crowns must face down
          toward the occlusal plane, with the roots above. */}
      <svg viewBox="0 0 34 46" aria-hidden="true" className="tooth__glyph">
        <g transform={lower ? undefined : 'translate(0 46) scale(1 -1)'}>
          <path
            className="tooth__crown"
            d="M17 2.4C11.5 2.4 7.4 4.6 5.6 8.8c-1.4 3.4-1.4 7.6-.4 11.4.8 3 2 5.2 3 8.4 1 3.2 1.6 7.8 2.2 11.6.4 2.6 1 3.8 2 3.8 1.2 0 1.6-2 2-5 .5-3.8 1-7.4 2.6-7.4s2.1 3.6 2.6 7.4c.4 3 .8 5 2 5 1 0 1.6-1.2 2-3.8.6-3.8 1.2-8.4 2.2-11.6 1-3.2 2.2-5.4 3-8.4 1-3.8 1-8-.4-11.4C26.6 4.6 22.5 2.4 17 2.4Z"
            fill={isMissing ? 'transparent' : meta.colour}
            stroke={isMissing ? 'var(--line-strong)' : status === 'healthy' ? 'var(--line-strong)' : meta.colour}
            strokeWidth="1.4"
            strokeLinejoin="round"
            strokeDasharray={isMissing ? '3 2.5' : undefined}
          />
          {entry?.surfaces?.length > 0 && !isMissing && (
            <circle cx="17" cy="16" r="3.6" fill={meta.ink} opacity="0.5" />
          )}
          {/* Inside the group so it lands on the crown in either arch. */}
          {isMissing && (
            <path d="M11 10 L23 22 M23 10 L11 22" stroke="var(--ink-4)" strokeWidth="2" strokeLinecap="round" />
          )}
        </g>
      </svg>
      <span className="tooth__no numeric">{number}</span>
    </button>
  );
}

function Quadrant({ teeth, chart, onSelect, readOnly, lower }) {
  return (
    <div className="odontogram__quadrant">
      {teeth.map((number) => (
        <Tooth
          key={number}
          number={number}
          entry={chart.find((item) => item.tooth === number)}
          onSelect={onSelect}
          readOnly={readOnly}
          lower={lower}
        />
      ))}
    </div>
  );
}

export default function Odontogram({ chart = [], onSelect, readOnly = false }) {
  const [legendOpen, setLegendOpen] = useState(true);

  const counts = chart.reduce((accumulator, entry) => {
    if (entry.status && entry.status !== 'healthy') {
      accumulator[entry.status] = (accumulator[entry.status] ?? 0) + 1;
    }
    return accumulator;
  }, {});

  return (
    <div className="odontogram">
      <div className="odontogram__arches">
        <div className="odontogram__arch">
          <Quadrant teeth={UPPER_RIGHT} chart={chart} onSelect={onSelect} readOnly={readOnly} />
          <span className="odontogram__midline" />
          <Quadrant teeth={UPPER_LEFT} chart={chart} onSelect={onSelect} readOnly={readOnly} />
        </div>

        <div className="odontogram__labels">
          <span>Upper right</span>
          <span>Upper left</span>
        </div>

        <div className="odontogram__labels">
          <span>Lower right</span>
          <span>Lower left</span>
        </div>

        <div className="odontogram__arch">
          <Quadrant teeth={LOWER_RIGHT} chart={chart} onSelect={onSelect} readOnly={readOnly} lower />
          <span className="odontogram__midline" />
          <Quadrant teeth={LOWER_LEFT} chart={chart} onSelect={onSelect} readOnly={readOnly} lower />
        </div>
      </div>

      <div className="odontogram__legend">
        <button type="button" className="odontogram__legend-toggle" onClick={() => setLegendOpen((open) => !open)}>
          {legendOpen ? 'Hide key' : 'Show key'}
        </button>
        {legendOpen && (
          <ul>
            {Object.entries(TOOTH_STATUS)
              .filter(([key]) => key !== 'healthy')
              .map(([key, meta]) => (
                <li key={key}>
                  <i style={{ background: meta.colour, borderColor: key === 'missing' ? 'var(--line-strong)' : meta.colour }} />
                  {meta.label}
                  {counts[key] ? <strong className="numeric">{counts[key]}</strong> : null}
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
