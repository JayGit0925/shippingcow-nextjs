'use client';

import { useMemo, useState } from 'react';
import { getLastMileRate, getHandlingFee, getPriceCliffWarning } from '@/data/location1-rates';

const TYPICAL_CARRIER_MARKUP = 1.45; // typical published rate vs our rate

export default function ShrinkageCalculator() {
  const [aov, setAov] = useState(150);
  const [units, setUnits] = useState(12000);
  const [rate, setRate] = useState(3);
  const [weight, setWeight] = useState(25);

  const calc = useMemo(() => {
    const unitsLost = units * (rate / 100);
    const revLost = unitsLost * aov;
    const profitLost = revLost * 0.15;

    const { price: lastMile, carrier } = getLastMileRate(weight);
    const handling = getHandlingFee(weight);
    const ourCost = lastMile + handling;
    const theirCost = ourCost * TYPICAL_CARRIER_MARKUP;
    const shippingSavingsPerLabel = theirCost - ourCost;
    const annualShippingSavings = shippingSavingsPerLabel * units;
    const cliff = getPriceCliffWarning(weight);

    return {
      unitsLost: Math.round(unitsLost),
      revLost,
      profitLost,
      shrinkageSavings: revLost,
      ourCost,
      theirCost,
      shippingSavingsPerLabel,
      annualShippingSavings,
      totalSavings: revLost + annualShippingSavings,
      carrier,
      cliff,
    };
  }, [aov, units, rate, weight]);

  const fmt = (n: number) => '$' + Math.round(n).toLocaleString();
  const fmtD = (n: number) => '$' + n.toFixed(2);

  return (
    <div style={{ marginTop: '3rem' }} className="calc-grid">

      {/* Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', background: 'var(--white)', border: '4px solid var(--dark)', padding: '2rem', boxShadow: 'var(--shadow-pixel-lg)', marginBottom: '1.5rem' }}>
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
              Annual Units Shipped
            </label>
            <input
              type="number"
              value={units}
              onChange={(e) => setUnits(parseFloat(e.target.value) || 0)}
              min={1}
              style={{ width: '100%', padding: '0.8rem 1rem', fontSize: '1.1rem', fontWeight: 500, border: '3px solid var(--dark)', background: 'var(--bg-light)', outline: 'none' }}
            />
          </div>
        </div>
        <div>
          <div style={{ marginBottom: '1.3rem' }}>
            <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: 'var(--blue)' }}>
              Typical Package Weight (lbs):{' '}
              <span style={{ display: 'inline-block', padding: '0.15rem 0.55rem', background: 'var(--yellow)', border: '2px solid var(--dark)', marginLeft: '0.4rem' }}>
                {weight} lbs
              </span>
            </label>
            <input
              type="range"
              min={1}
              max={149}
              value={weight}
              step={1}
              onChange={(e) => setWeight(parseInt(e.target.value))}
              style={{ width: '100%', height: 16, background: 'var(--blue-light)', border: '3px solid var(--dark)', outline: 'none', margin: '0.5rem 0', appearance: 'none', WebkitAppearance: 'none' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-pixel)', fontSize: '0.65rem', color: '#555' }}>
              <span>1 lb</span><span>GOFO</span><span>FedEx Gnd</span><span>FedEx Heavy</span><span>149 lbs</span>
            </div>
            {calc.cliff && (
              <div style={{ marginTop: '0.6rem', padding: '0.5rem 0.75rem', background: '#FEF3C7', border: '2px solid #F59E0B', fontSize: '0.8rem', color: '#92400E' }}>
                ⚠ {calc.cliff}
              </div>
            )}
          </div>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: 'var(--blue)' }}>
              3PL Shrinkage Rate:{' '}
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
              <span>2%</span><span>Industry avg</span><span>10%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Results — two panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Shrinkage panel */}
        <div style={{ background: 'var(--dark)', color: 'var(--white)', padding: '1.8rem', border: '3px solid var(--dark)', position: 'relative' }}>
          {calc.shrinkageSavings > 5000 && (
            <span
              className="cow-logo cow-logo--calc"
              role="img"
              aria-label="Surprised cow"
              style={{ position: 'absolute', top: -30, right: -20, transform: 'rotate(6deg)' }}
            />
          )}
          <h4 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', color: 'var(--yellow)', marginBottom: '1rem', fontSize: '1.05rem', letterSpacing: '0.05em' }}>
            Shrinkage Reality
          </h4>
          {[
            ['Inventory Lost / Year', `${calc.unitsLost.toLocaleString()} units`],
            ['Direct Revenue Lost', fmt(calc.revLost)],
            ['Lost Profit (15% margin)', fmt(calc.profitLost)],
            ['Cost at Shipping Cow', '$0'],
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px dashed #55617a', fontSize: '0.9rem' }}>
              <span>{label}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: val === '$0' ? 'var(--yellow)' : 'var(--white)' }}>{val}</span>
            </div>
          ))}
          <div style={{ marginTop: '1rem', padding: '0.9rem', background: 'var(--yellow)', color: 'var(--dark)', textAlign: 'center', border: '3px solid var(--white)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Shrinkage Savings</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', lineHeight: 1, marginTop: '0.3rem' }}>{fmt(calc.shrinkageSavings)}/yr</div>
          </div>
        </div>

        {/* Shipping rate panel */}
        <div style={{ background: '#0052C9', color: 'var(--white)', padding: '1.8rem', border: '3px solid var(--dark)', position: 'relative' }}>
          <h4 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', color: 'var(--yellow)', marginBottom: '0.4rem', fontSize: '1.05rem', letterSpacing: '0.05em' }}>
            Shipping Rate Reality
          </h4>
          <div style={{ fontSize: '0.75rem', color: '#B0C8F0', marginBottom: '1rem' }}>
            Carrier: <strong style={{ color: '#fff' }}>{calc.carrier}</strong> · {weight} lb package
          </div>
          {[
            ['Typical Published Rate', fmtD(calc.theirCost)],
            ['Last Mile (ShippingCow)', fmtD(getLastMileRate(weight).price)],
            ['Handling Fee', fmtD(getHandlingFee(weight))],
            ['Your Total per Label', fmtD(calc.ourCost)],
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px dashed rgba(255,255,255,0.2)', fontSize: '0.9rem' }}>
              <span>{label}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: label === 'Your Total per Label' ? 'var(--yellow)' : 'var(--white)' }}>{val}</span>
            </div>
          ))}
          <div style={{ marginTop: '1rem', padding: '0.9rem', background: 'var(--yellow)', color: 'var(--dark)', textAlign: 'center', border: '3px solid var(--white)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Shipping Savings</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', lineHeight: 1, marginTop: '0.3rem' }}>{fmt(calc.annualShippingSavings)}/yr</div>
          </div>
        </div>
      </div>

      {/* Grand total */}
      <div style={{ marginTop: '1.5rem', background: 'var(--yellow)', border: '4px solid var(--dark)', padding: '1.5rem 2rem', boxShadow: 'var(--shadow-pixel-lg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--dark)' }}>Total Annual Savings with Shipping Cow 🐄</div>
          <div style={{ fontSize: '0.85rem', color: '#3a4454', marginTop: '0.2rem' }}>Shrinkage eliminated + shipping rate reduction combined</div>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', color: 'var(--dark)', lineHeight: 1 }}>{fmt(calc.totalSavings)}</div>
      </div>
    </div>
  );
}
