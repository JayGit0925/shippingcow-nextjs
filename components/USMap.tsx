'use client';

import { useState, useRef } from 'react';

type State = { name: string; delivery: string; x: number; y: number; w: number; h: number; fill: string };

const STATES: State[] = [
  // Row 1
  { name: 'Washington', delivery: '2–3 Days', x: 80, y: 60, w: 90, h: 70, fill: '#3A7FDE' },
  { name: 'Idaho', delivery: '2–3 Days', x: 170, y: 60, w: 70, h: 90, fill: '#3A7FDE' },
  { name: 'Montana', delivery: '3 Days', x: 240, y: 60, w: 120, h: 70, fill: '#B0C8F0' },
  { name: 'North Dakota', delivery: '3 Days', x: 360, y: 60, w: 90, h: 60, fill: '#B0C8F0' },
  { name: 'Minnesota', delivery: '2–3 Days', x: 450, y: 60, w: 90, h: 80, fill: '#3A7FDE' },
  { name: 'Wisconsin', delivery: '2 Days', x: 540, y: 100, w: 70, h: 70, fill: '#0052C9' },
  { name: 'Michigan (UP)', delivery: '2 Days', x: 610, y: 90, w: 80, h: 40, fill: '#0052C9' },
  { name: 'Vermont', delivery: '3 Days', x: 770, y: 70, w: 30, h: 40, fill: '#B0C8F0' },
  { name: 'New Hampshire', delivery: '3 Days', x: 800, y: 70, w: 30, h: 40, fill: '#B0C8F0' },
  { name: 'Maine', delivery: '3 Days', x: 830, y: 50, w: 55, h: 75, fill: '#B0C8F0' },
  // Row 2
  { name: 'Oregon', delivery: '2–3 Days', x: 80, y: 130, w: 90, h: 70, fill: '#3A7FDE' },
  { name: 'Wyoming', delivery: '3 Days', x: 240, y: 130, w: 100, h: 70, fill: '#B0C8F0' },
  { name: 'South Dakota', delivery: '3 Days', x: 340, y: 120, w: 110, h: 60, fill: '#B0C8F0' },
  { name: 'Iowa', delivery: '2 Days', x: 450, y: 140, w: 90, h: 60, fill: '#0052C9' },
  { name: 'Illinois', delivery: '2 Days', x: 540, y: 170, w: 60, h: 90, fill: '#0052C9' },
  { name: 'Indiana', delivery: '2 Days', x: 600, y: 170, w: 50, h: 80, fill: '#0052C9' },
  { name: 'Ohio', delivery: '2 Days', x: 650, y: 160, w: 70, h: 70, fill: '#0052C9' },
  { name: 'Pennsylvania', delivery: '2–3 Days', x: 720, y: 150, w: 90, h: 60, fill: '#3A7FDE' },
  { name: 'New York', delivery: '2–3 Days', x: 750, y: 110, w: 80, h: 40, fill: '#3A7FDE' },
  { name: 'Massachusetts', delivery: '2–3 Days', x: 810, y: 110, w: 75, h: 30, fill: '#3A7FDE' },
  { name: 'Connecticut', delivery: '2–3 Days', x: 810, y: 140, w: 50, h: 20, fill: '#3A7FDE' },
  { name: 'Rhode Island', delivery: '2–3 Days', x: 860, y: 140, w: 25, h: 20, fill: '#3A7FDE' },
  { name: 'New Jersey', delivery: '2–3 Days', x: 810, y: 160, w: 40, h: 40, fill: '#3A7FDE' },
  // Row 3
  { name: 'California', delivery: '2 Days', x: 70, y: 200, w: 100, h: 140, fill: '#0052C9' },
  { name: 'Nevada', delivery: '2 Days', x: 170, y: 200, w: 70, h: 110, fill: '#0052C9' },
  { name: 'Utah', delivery: '2 Days', x: 240, y: 200, w: 70, h: 80, fill: '#0052C9' },
  { name: 'Colorado', delivery: '2 Days', x: 310, y: 200, w: 90, h: 80, fill: '#0052C9' },
  { name: 'Nebraska', delivery: '2 Days', x: 400, y: 200, w: 120, h: 50, fill: '#0052C9' },
  { name: 'Missouri', delivery: '2 Days', x: 475, y: 250, w: 95, h: 80, fill: '#0052C9' },
  { name: 'Kentucky', delivery: '2 Days', x: 570, y: 250, w: 110, h: 45, fill: '#0052C9' },
  { name: 'West Virginia', delivery: '2 Days', x: 680, y: 230, w: 60, h: 60, fill: '#0052C9' },
  { name: 'Virginia', delivery: '2 Days', x: 740, y: 230, w: 100, h: 50, fill: '#0052C9' },
  { name: 'Maryland', delivery: '2–3 Days', x: 800, y: 210, w: 60, h: 22, fill: '#3A7FDE' },
  { name: 'Delaware', delivery: '2–3 Days', x: 840, y: 200, w: 22, h: 35, fill: '#3A7FDE' },
  // Row 4
  { name: 'Arizona', delivery: '2 Days', x: 170, y: 310, w: 90, h: 110, fill: '#0052C9' },
  { name: 'New Mexico', delivery: '2 Days', x: 260, y: 280, w: 90, h: 110, fill: '#0052C9' },
  { name: 'Kansas', delivery: '2 Days', x: 350, y: 250, w: 125, h: 55, fill: '#0052C9' },
  { name: 'Oklahoma', delivery: '2 Days', x: 370, y: 305, w: 135, h: 50, fill: '#0052C9' },
  { name: 'Arkansas', delivery: '2 Days', x: 475, y: 330, w: 80, h: 60, fill: '#0052C9' },
  { name: 'Tennessee', delivery: '1 Day', x: 555, y: 295, w: 145, h: 45, fill: '#0052C9' },
  { name: 'North Carolina', delivery: '2 Days', x: 700, y: 280, w: 135, h: 45, fill: '#0052C9' },
  // Row 5
  { name: 'Texas', delivery: '1 Day', x: 250, y: 390, w: 220, h: 130, fill: '#0052C9' },
  { name: 'Louisiana', delivery: '2 Days', x: 470, y: 390, w: 80, h: 80, fill: '#0052C9' },
  { name: 'Mississippi', delivery: '2 Days', x: 550, y: 340, w: 50, h: 130, fill: '#0052C9' },
  { name: 'Alabama', delivery: '2 Days', x: 600, y: 340, w: 60, h: 130, fill: '#0052C9' },
  { name: 'Georgia', delivery: '2 Days', x: 660, y: 325, w: 80, h: 130, fill: '#0052C9' },
  { name: 'South Carolina', delivery: '2 Days', x: 740, y: 325, w: 85, h: 65, fill: '#0052C9' },
  { name: 'Florida', delivery: '2 Days', x: 660, y: 455, w: 150, h: 80, fill: '#0052C9' },
  { name: 'Michigan (LP)', delivery: '2 Days', x: 600, y: 130, w: 70, h: 60, fill: '#0052C9' },
];

const NODES = [
  { name: 'Dallas-Fort Worth Node', label: 'DFW', delivery: 'Primary Hub — Southern Network', cx: 365, cy: 440 },
  { name: 'Reno Node', label: 'RNO', delivery: 'Primary Hub — Western Network', cx: 195, cy: 240 },
  { name: 'Knoxville Node', label: 'TYS', delivery: 'Primary Hub — Eastern Network', cx: 650, cy: 315 },
];

export default function USMap() {
  const [tip, setTip] = useState<{ name: string; delivery: string; x: number; y: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const showTip = (e: React.MouseEvent, name: string, delivery: string) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTip({ name, delivery, x: e.clientX - rect.left + 12, y: e.clientY - rect.top + 12 });
  };

  const hideTip = () => setTip(null);

  return (
    <div
      ref={wrapRef}
      style={{ marginTop: '2.5rem', background: 'var(--white)', border: '4px solid var(--dark)', padding: '2rem', boxShadow: 'var(--shadow-pixel-lg)', position: 'relative' }}
    >
      {tip && (
        <div
          style={{
            position: 'absolute',
            left: tip.x,
            top: tip.y,
            background: 'var(--dark)',
            color: 'var(--white)',
            padding: '0.5rem 0.8rem',
            border: '2px solid var(--yellow)',
            fontSize: '0.8rem',
            pointerEvents: 'none',
            zIndex: 5,
            whiteSpace: 'nowrap',
          }}
        >
          <strong style={{ display: 'block', color: 'var(--yellow)', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {tip.name}
          </strong>
          <span>Est. Delivery: {tip.delivery}</span>
        </div>
      )}

      <svg viewBox="0 0 960 600" style={{ width: '100%', height: 'auto', maxHeight: 560, display: 'block' }} aria-label="US delivery coverage map">
        {STATES.map((s) => (
          <rect
            key={s.name}
            x={s.x}
            y={s.y}
            width={s.w}
            height={s.h}
            fill={s.fill}
            stroke="var(--dark)"
            strokeWidth={0.9}
            style={{ cursor: 'pointer', transition: 'fill 0.15s' }}
            onMouseEnter={(e) => showTip(e, s.name, s.delivery)}
            onMouseMove={(e) => showTip(e, s.name, s.delivery)}
            onMouseLeave={hideTip}
          />
        ))}

        {NODES.map((n) => (
          <g
            key={n.label}
            onMouseEnter={(e) => showTip(e, n.name, n.delivery)}
            onMouseMove={(e) => showTip(e, n.name, n.delivery)}
            onMouseLeave={hideTip}
            style={{ cursor: 'pointer' }}
          >
            <circle cx={n.cx} cy={n.cy} r={22} fill="none" stroke="#FEB81B" strokeWidth={2} opacity={0.5} />
            <circle cx={n.cx} cy={n.cy} r={12} fill="#FEB81B" stroke="#1A202C" strokeWidth={2} style={{ filter: 'drop-shadow(2px 2px 0 rgba(0,0,0,0.4))' }} />
            <text x={n.cx} y={n.cy + 5} textAnchor="middle" fontFamily="'Black Han Sans', sans-serif" fontSize={11} fill="#1A202C" fontWeight="bold">
              {n.label}
            </text>
          </g>
        ))}
      </svg>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.2rem', justifyContent: 'center', marginTop: '1.5rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: 16, height: 16, background: '#0052C9', border: '2px solid var(--dark)' }} />Zone 1–2: 1-Day
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: 16, height: 16, background: '#3A7FDE', border: '2px solid var(--dark)' }} />Zone 3–4: 2-Day
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: 16, height: 16, background: '#B0C8F0', border: '2px solid var(--dark)' }} />Zone 5+: 3-Day
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: 16, height: 16, background: '#FEB81B', borderRadius: '50%', border: '2px solid var(--dark)' }} />Fulfillment Node
        </span>
      </div>
    </div>
  );
}
