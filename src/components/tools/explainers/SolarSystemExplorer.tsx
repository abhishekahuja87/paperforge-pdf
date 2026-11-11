import React, { useMemo, useState } from 'react';
import { calcCard } from '../../finance/ui';
import {
  PLANETS, WORLDS, ageOn, describeDay, describeYear, formatNumber, getWorld, lightMinutes, volumeRatio, weightOn, widthRatio,
} from '../../../lib/space/worlds';

const inputClass = 'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900';
const unitButton = (on: boolean) => `min-h-9 rounded-lg border px-3 py-1.5 text-xs font-semibold ${on ? 'border-orange-300 bg-orange-50 text-orange-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`;
const formatDate = (date: Date) => date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/** All eight planets side by side, drawn to the same scale. Labels alternate in height so small planets do not overlap. */
const LineUp: React.FC = () => {
  const largest = Math.max(...PLANETS.map((planet) => planet.diameterKm));
  const scale = 140 / largest;
  const gap = 22;
  let x = 10;
  const items = PLANETS.map((planet, index) => {
    const radius = (planet.diameterKm * scale) / 2;
    const centre = x + radius;
    x += radius * 2 + gap;
    return { planet, radius, centre, labelY: 190 + (index % 2) * 18 };
  });
  return (
    <svg viewBox={`0 0 ${Math.ceil(x)} 232`} role="img" aria-label="The eight planets drawn to the same scale, from Mercury to Neptune" className="w-full">
      {items.map(({ planet, radius, centre, labelY }) => (
        <g key={planet.id}>
          <circle cx={centre} cy={90} r={Math.max(radius, 1.5)} fill={planet.color} />
          <text x={centre} y={labelY} textAnchor="middle" fontSize={13} fontWeight={600} fill="#334155">{planet.name}</text>
        </g>
      ))}
    </svg>
  );
};

export const SolarSystemExplorer: React.FC = () => {
  const [birth, setBirth] = useState('');
  const [weight, setWeight] = useState('60');
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg');
  const [firstId, setFirstId] = useState('jupiter');
  const [secondId, setSecondId] = useState('earth');

  const birthDate = useMemo(() => (birth ? new Date(`${birth}T00:00:00`) : null), [birth]);
  const amount = Number(weight);
  const futureBirth = birthDate !== null && birthDate.getTime() > Date.now();
  const first = getWorld(firstId);
  const second = getWorld(secondId);
  const [big, small] = first.diameterKm >= second.diameterKm ? [first, second] : [second, first];
  const bigRadius = 70;
  const smallRadius = Math.max(2, (small.diameterKm / big.diameterKm) * bigRadius);

  return (
    <section className={calcCard}>
      <h2 className="text-base font-bold text-slate-900">Your age and weight on each planet</h2>
      <p className="mt-1 text-xs text-slate-600">A year on a planet is the time it takes to go once round the Sun, so your age in planet years depends on how fast it travels. Your weight depends on the pull of gravity at the surface; your mass stays the same.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="space-birth" className="block text-xs font-semibold text-slate-700">Your date of birth</label>
          <input id="space-birth" type="date" value={birth} max={new Date().toISOString().slice(0, 10)} onChange={(event) => setBirth(event.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="space-weight" className="block text-xs font-semibold text-slate-700">Your weight on Earth</label>
          <div className="mt-1 flex items-center gap-2">
            <input id="space-weight" type="number" inputMode="decimal" min="1" max="500" value={weight} onChange={(event) => setWeight(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900" />
            <div role="group" aria-label="Weight unit" className="flex gap-1.5">
              <button type="button" aria-pressed={unit === 'kg'} onClick={() => setUnit('kg')} className={unitButton(unit === 'kg')}>kg</button>
              <button type="button" aria-pressed={unit === 'lb'} onClick={() => setUnit('lb')} className={unitButton(unit === 'lb')}>lb</button>
            </div>
          </div>
        </div>
      </div>
      {futureBirth && <p role="status" className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">That date is in the future. Choose the day you were born.</p>}

      <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[34rem] text-left text-xs">
          <caption className="sr-only">Your age, next birthday and weight on each planet</caption>
          <thead className="bg-slate-50 text-slate-700">
            <tr><th scope="col" className="px-3 py-2">Planet</th><th scope="col" className="px-3 py-2">Your age</th><th scope="col" className="px-3 py-2">Next birthday</th><th scope="col" className="px-3 py-2">Your weight</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {PLANETS.map((planet) => {
              const age = ageOn(planet, birthDate && !futureBirth ? birthDate : null);
              const pull = Number.isFinite(amount) && amount > 0 ? weightOn(planet, amount) : null;
              return (
                <tr key={planet.id}>
                  <th scope="row" className="px-3 py-2 font-semibold text-slate-900"><span aria-hidden="true" className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: planet.color }} />{planet.name}</th>
                  <td className="px-3 py-2">{age ? `${formatNumber(age.years)} years` : '—'}</td>
                  <td className="px-3 py-2">{age ? `${formatDate(age.nextDate)} (age ${age.nextAge})` : '—'}</td>
                  <td className="px-3 py-2">{pull !== null ? `${formatNumber(pull)} ${unit}` : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-base font-bold text-slate-900">Compare two worlds</h2>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="space-first" className="block text-xs font-semibold text-slate-700">First world</label>
          <select id="space-first" value={firstId} onChange={(event) => setFirstId(event.target.value)} className={inputClass}>{WORLDS.map((world) => <option key={world.id} value={world.id}>{world.name}</option>)}</select>
        </div>
        <div>
          <label htmlFor="space-second" className="block text-xs font-semibold text-slate-700">Second world</label>
          <select id="space-second" value={secondId} onChange={(event) => setSecondId(event.target.value)} className={inputClass}>{WORLDS.map((world) => <option key={world.id} value={world.id}>{world.name}</option>)}</select>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center rounded-xl bg-slate-900 p-4">
        <svg viewBox="0 0 320 150" role="img" aria-label={`${big.name} and ${small.name} drawn to the same scale`} className="h-40 w-full max-w-md">
          <circle cx={90} cy={75} r={bigRadius} fill={big.color} />
          <circle cx={250} cy={75} r={smallRadius} fill={small.color} />
        </svg>
      </div>
      <p className="mt-2 text-sm text-slate-700" aria-live="polite">
        {big.id === small.id
          ? `You picked the same world twice. ${big.name} is ${formatNumber(big.diameterKm)} km wide.`
          : `${big.name} is ${formatNumber(widthRatio(big, small))} times wider than ${small.name} (${formatNumber(big.diameterKm)} km against ${formatNumber(small.diameterKm)} km). About ${formatNumber(volumeRatio(big, small))} ${small.name}s would fit inside ${big.name} by volume.`}
      </p>

      <h2 className="mt-8 text-base font-bold text-slate-900">The planets to scale</h2>
      <div className="mt-2 rounded-xl bg-slate-900 p-3"><div className="[&_text]:fill-slate-200"><LineUp /></div></div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[44rem] text-left text-xs">
          <caption className="sr-only">Key facts about each planet</caption>
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th scope="col" className="px-3 py-2">Planet</th><th scope="col" className="px-3 py-2">Type</th><th scope="col" className="px-3 py-2">Width</th><th scope="col" className="px-3 py-2">From the Sun</th>
              <th scope="col" className="px-3 py-2">Sunlight takes</th><th scope="col" className="px-3 py-2">One day</th><th scope="col" className="px-3 py-2">One year</th><th scope="col" className="px-3 py-2">Gravity</th><th scope="col" className="px-3 py-2">Moons</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {PLANETS.map((planet) => (
              <tr key={planet.id}>
                <th scope="row" className="px-3 py-2 font-semibold text-slate-900">{planet.name}</th>
                <td className="px-3 py-2 capitalize">{planet.kind}</td>
                <td className="px-3 py-2">{formatNumber(planet.diameterKm)} km</td>
                <td className="px-3 py-2">{formatNumber(planet.distanceMkm)} million km</td>
                <td className="px-3 py-2">{lightMinutes(planet) < 60 ? `${formatNumber(lightMinutes(planet))} min` : `${formatNumber(lightMinutes(planet) / 60)} hours`}</td>
                <td className="px-3 py-2">{describeDay(planet)}</td>
                <td className="px-3 py-2">{describeYear(planet)}</td>
                <td className="px-3 py-2">{planet.gravity} m/s²</td>
                <td className="px-3 py-2">{planet.moons}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-center text-[11px] text-slate-500">Figures are rounded from the NASA planetary fact sheets. Moon counts keep growing as astronomers find more. Everything is worked out in your browser.</p>
    </section>
  );
};

export default SolarSystemExplorer;
