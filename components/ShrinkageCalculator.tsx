'use client';

import { useMemo, useState } from 'react';

export default function ShrinkageCalculator() {
  const [aov, setAov] = useState(150);
  const [units, setUnits] = useState(12000);
  const [rate, setRate] = useState(3);

  const calc = useMemo(() => {
    const unitsLost = units * (rate / 100);
    const revLost = unitsLost * aov;
    const profitLost = revLost * 0.15;
    return { unitsLost: Math.round(unitsLost), revLost, profitLost, savings: revLost };
  }, [aov, units, rate]);

  const fmt = (n: number) => '$' + Math.round(n).toLocaleString();

  return (
    <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', background: 'var(--white)', border: '4px solid var(--dark)', padding: '2rem', boxShadow: 'var(--shadow-pixel-lg)' }} className="calc-grid">
      <div>
        <div style={{ marginBottom: '1.3rem' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: 'var(--blue)' }}>
            Average Order Value ($)
          </label>
          <input
            type="number"
            value={aov}
            onChange={(e) => setAov(parseFloat(e.target.value) || 0)}
            min={1}
            style={{ width: '100%', padding: '0.8rem 1rem', fontSize: '1.1rem', fontWeight: 500, border: '3px solid var(--dark)', background: 'var(--bg-light)', outline: 'none' }}
          />
        </div>
        <div style={{ marginBottom: '1.3rem' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: 'var(--blue)' }}>
            Annual Units Inventoried
          </label>
          <input
            type="number"
            value={units}
            onChange={(e) => setUnits(parseFloat(e.target.value) || 0)}
            min={1}
            style={{ width: '100%', padding: '0.8rem 1rem', fontSize: '1.1rem', fontWeight: 500, border: '3px solid var(--dark)', background: 'var(--bg-light)', outline: 'none' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: 'var(--blue)' }}>
            Industry Shrinkage Rate:{' '}
            <span style={{ display: 'inline-block', padding: '0.15rem 0.55rem', background: 'var(--yellow)', border: '2px solid var(--dark)', marginLeft: '0.4rem' }}>
              {rate.toFixed(1)}%
            </span>
          </label>
          <input
            type="range"
            min={2}
            max={10}
            value={rate}
            step={0.1}
            onChange={(e) => setRate(parseFloat(e.target.value))}
            style={{ width: '100%', height: 16, background: 'var(--blue-light)', border: '3px solid var(--dark)', outline: 'none', margin: '0.5rem 0', appearance: 'none', WebkitAppearance: 'none' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-pixel)', fontSize: '0.7rem', color: '#555' }}>
            <span>2%</span>
            <span>10%</span>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--dark)', color: 'var(--white)', padding: '1.8rem', border: '3px solid var(--dark)', position: 'relative' }}>
        {calc.savings > 5000 && (
          <span
            className="cow-logo cow-logo--calc"
            role="img"
            aria-label="Surprised cow"
            style={{ position: 'absolute', top: -30, right: -20, transform: 'rotate(6deg)' }}
          />
        )}
        <h4 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', color: 'var(--yellow)', marginBottom: '1rem', fontSize: '1.15rem', letterSpacing: '0.05em' }}>
          Your Shrinkage Reality
        </h4>
        {[
          ['Inventory Lost Per Year', `${calc.unitsLost.toLocaleString()} units`],
          ['Direct Revenue Lost', fmt(calc.revLost)],
          ['Lost Profit (at 15% margin)', fmt(calc.profitLost)],
          ['Your Cost with Shipping Cow', '$0'],
        ].map(([label, val]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.7rem 0', borderBottom: '1px dashed #55617a', fontSize: '0.95rem' }}>
            <span>{label}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: val === '$0' ? 'var(--yellow)' : 'var(--white)' }}>{val}</span>
          </div>
        ))}
        <div style={{ marginTop: '1.2rem', padding: '1rem', background: 'var(--yellow)', color: 'var(--dark)', textAlign: 'center', border: '3px solid var(--white)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>You Could Save</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', lineHeight: 1, marginTop: '0.3rem' }}>{fmt(calc.savings)}/year 🐄</div>
        </div>
      </div>
    </div>
  );
}
