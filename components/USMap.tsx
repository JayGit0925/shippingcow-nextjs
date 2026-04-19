'use client';

import { useState } from 'react';

// Tile map: each state = one square cell
// col/row positions based on standard geographic tile layout
type TileState = {
  abbr: string;
  name: string;
  col: number;
  row: number;
  zone: 1 | 2 | 3; // 1=1-day, 2=2-day, 3=3-day
};

const ZONE_COLOR = { 1: '#0052C9', 2: '#3A7FDE', 3: '#B0C8F0' } as const;
const ZONE_LABEL = { 1: '1–2 Day', 2: '2 Day', 3: '2–3 Day' } as const;

// 10 cols × 8 rows pixel tile map
const TILES: TileState[] = [
  // Row 0
  { abbr: 'AK', name: 'Alaska',        col: 0, row: 0, zone: 3 },
  { abbr: 'ME', name: 'Maine',          col: 9, row: 0, zone: 2 },
  // Row 1
  { abbr: 'WA', name: 'Washington',     col: 0, row: 1, zone: 2 },
  { abbr: 'MT', name: 'Montana',        col: 1, row: 1, zone: 3 },
  { abbr: 'ND', name: 'North Dakota',   col: 2, row: 1, zone: 3 },
  { abbr: 'MN', name: 'Minnesota',      col: 3, row: 1, zone: 2 },
  { abbr: 'WI', name: 'Wisconsin',      col: 4, row: 1, zone: 2 },
  { abbr: 'MI', name: 'Michigan',       col: 5, row: 1, zone: 2 },
  { abbr: 'VT', name: 'Vermont',        col: 8, row: 1, zone: 2 },
  { abbr: 'NH', name: 'New Hampshire',  col: 9, row: 1, zone: 2 },
  // Row 2
  { abbr: 'OR', name: 'Oregon',         col: 0, row: 2, zone: 2 },
  { abbr: 'ID', name: 'Idaho',          col: 1, row: 2, zone: 2 },
  { abbr: 'WY', name: 'Wyoming',        col: 2, row: 2, zone: 3 },
  { abbr: 'SD', name: 'South Dakota',   col: 3, row: 2, zone: 3 },
  { abbr: 'IA', name: 'Iowa',           col: 4, row: 2, zone: 2 },
  { abbr: 'IL', name: 'Illinois',       col: 5, row: 2, zone: 1 },
  { abbr: 'IN', name: 'Indiana',        col: 6, row: 2, zone: 1 },
  { abbr: 'OH', name: 'Ohio',           col: 7, row: 2, zone: 2 },
  { abbr: 'NY', name: 'New York',       col: 8, row: 2, zone: 2 },
  { abbr: 'MA', name: 'Massachusetts',  col: 9, row: 2, zone: 2 },
  // Row 3
  { abbr: 'CA', name: 'California',     col: 0, row: 3, zone: 1 },
  { abbr: 'NV', name: 'Nevada',         col: 1, row: 3, zone: 1 },
  { abbr: 'UT', name: 'Utah',           col: 2, row: 3, zone: 2 },
  { abbr: 'CO', name: 'Colorado',       col: 3, row: 3, zone: 2 },
  { abbr: 'NE', name: 'Nebraska',       col: 4, row: 3, zone: 2 },
  { abbr: 'MO', name: 'Missouri',       col: 5, row: 3, zone: 1 },
  { abbr: 'KY', name: 'Kentucky',       col: 6, row: 3, zone: 1 },
  { abbr: 'WV', name: 'West Virginia',  col: 7, row: 3, zone: 2 },
  { abbr: 'PA', name: 'Pennsylvania',   col: 8, row: 3, zone: 1 },
  { abbr: 'NJ', name: 'New Jersey',     col: 9, row: 3, zone: 1 },
  // Row 4
  { abbr: 'AZ', name: 'Arizona',        col: 1, row: 4, zone: 1 },
  { abbr: 'NM', name: 'New Mexico',     col: 2, row: 4, zone: 1 },
  { abbr: 'KS', name: 'Kansas',         col: 3, row: 4, zone: 1 },
  { abbr: 'OK', name: 'Oklahoma',       col: 4, row: 4, zone: 1 },
  { abbr: 'AR', name: 'Arkansas',       col: 5, row: 4, zone: 1 },
  { abbr: 'TN', name: 'Tennessee',      col: 6, row: 4, zone: 1 },
  { abbr: 'VA', name: 'Virginia',       col: 7, row: 4, zone: 1 },
  { abbr: 'MD', name: 'Maryland',       col: 8, row: 4, zone: 1 },
  { abbr: 'CT', name: 'Connecticut',    col: 9, row: 4, zone: 2 },
  // Row 5
  { abbr: 'TX', name: 'Texas',          col: 2, row: 5, zone: 1 },
  { abbr: 'LA', name: 'Louisiana',      col: 3, row: 5, zone: 1 },
  { abbr: 'MS', name: 'Mississippi',    col: 4, row: 5, zone: 1 },
  { abbr: 'AL', name: 'Alabama',        col: 5, row: 5, zone: 1 },
  { abbr: 'NC', name: 'North Carolina', col: 7, row: 5, zone: 1 },
  { abbr: 'SC', name: 'South Carolina', col: 8, row: 5, zone: 1 },
  { abbr: 'DE', name: 'Delaware',       col: 9, row: 5, zone: 1 },
  // Row 6
  { abbr: 'GA', name: 'Georgia',        col: 5, row: 6, zone: 1 },
  { abbr: 'FL', name: 'Florida',        col: 6, row: 6, zone: 1 },
  { abbr: 'HI', name: 'Hawaii',         col: 8, row: 6, zone: 3 },
  { abbr: 'RI', name: 'Rhode Island',   col: 9, row: 6, zone: 2 },
];

// Warehouses — pinned to their tile
const WAREHOUSES = [
  { label: 'NJ', name: 'New Brunswick, NJ', col: 9, row: 3 },
  { label: 'CA', name: 'Ontario, CA',        col: 0, row: 3 },
  { label: 'TX', name: 'Missouri City, TX',  col: 2, row: 5 },
];

const TILE = 52;
const GAP  = 3;
const STEP = TILE + GAP;
const COLS = 10;
const ROWS = 7;
const W    = COLS * STEP - GAP;
const H    = ROWS * STEP - GAP;

export default function USMap() {
  const [tip, setTip] = useState<{ name: string; zone: 1|2|3; x: number; y: number } | null>(null);

  function px(col: number) { return col * STEP; }
  function py(row: number) { return row * STEP; }

  return (
    <div style={{
      marginTop: '2.5rem',
      background: '#1A202C',
      border: '4px solid #1A202C',
      padding: '1.5rem',
      boxShadow: 'var(--shadow-pixel-lg)',
      position: 'relative',
    }}>
      {tip && (
        <div style={{
          position: 'absolute',
          left: tip.x + 12,
          top: tip.y + 12,
          background: '#1A202C',
          color: '#fff',
          padding: '0.4rem 0.75rem',
          border: '2px solid #FEB81B',
          fontSize: '0.78rem',
          pointerEvents: 'none',
          zIndex: 10,
          whiteSpace: 'nowrap',
          fontFamily: 'var(--font-display)',
        }}>
          <span style={{ color: '#FEB81B', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {tip.name}
          </span>
          <span style={{ color: '#B0C8F0', fontSize: '0.72rem' }}>
            {ZONE_LABEL[tip.zone]} Delivery
          </span>
        </div>
      )}

      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        aria-label="US delivery coverage map"
      >
        {/* Tiles */}
        {TILES.map((t) => {
          const x = px(t.col);
          const y = py(t.row);
          const color = ZONE_COLOR[t.zone];
          const isWH = WAREHOUSES.some(w => w.col === t.col && w.row === t.row);

          return (
            <g
              key={t.abbr}
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => {
                const rect = (e.currentTarget.closest('svg')!.parentElement as HTMLElement).getBoundingClientRect();
                setTip({ name: t.name, zone: t.zone, x: e.clientX - rect.left, y: e.clientY - rect.top });
              }}
              onMouseMove={(e) => {
                const rect = (e.currentTarget.closest('svg')!.parentElement as HTMLElement).getBoundingClientRect();
                setTip({ name: t.name, zone: t.zone, x: e.clientX - rect.left, y: e.clientY - rect.top });
              }}
              onMouseLeave={() => setTip(null)}
            >
              {/* Pixel shadow */}
              <rect x={x + 3} y={y + 3} width={TILE} height={TILE} fill="rgba(0,0,0,0.4)" />
              {/* Tile */}
              <rect x={x} y={y} width={TILE} height={TILE} fill={isWH ? '#FEB81B' : color} stroke="#1A202C" strokeWidth={1.5} />
              {/* Abbr */}
              <text
                x={x + TILE / 2}
                y={y + TILE / 2 + 5}
                textAnchor="middle"
                fontFamily="'Black Han Sans', sans-serif"
                fontSize={13}
                fill={isWH ? '#1A202C' : '#fff'}
                fontWeight="bold"
                style={{ userSelect: 'none', pointerEvents: 'none' }}
              >
                {t.abbr}
              </text>
              {/* Warehouse star */}
              {isWH && (
                <text
                  x={x + TILE / 2}
                  y={y + 13}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#1A202C"
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  ★WH
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        justifyContent: 'center',
        marginTop: '1.2rem',
        fontFamily: 'var(--font-display)',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}>
        {[
          { color: '#0052C9', label: '1–2 Day Delivery' },
          { color: '#3A7FDE', label: '2 Day Delivery' },
          { color: '#B0C8F0', label: '2–3 Day Delivery' },
          { color: '#FEB81B', label: '★ Warehouse' },
        ].map(l => (
          <span key={l.label} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#fff' }}>
            <span style={{ width: 14, height: 14, background: l.color, border: '2px solid rgba(255,255,255,0.3)', flexShrink: 0, display: 'inline-block' }} />
            {l.label}
          </span>
        ))}
      </div>

      {/* Warehouse callouts */}
      <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
        {WAREHOUSES.map(w => (
          <div key={w.label} style={{
            background: 'rgba(254,184,27,0.15)',
            border: '2px solid #FEB81B',
            padding: '0.3rem 0.8rem',
            fontFamily: 'var(--font-display)',
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#FEB81B',
          }}>
            ★ {w.label} — {w.name}
          </div>
        ))}
      </div>
    </div>
  );
}
