import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, Note, NumberField, SelectField, Stat, StatGrid, calcCard } from '../../finance/ui';
import { parseAmount } from '../../../lib/finance/format';
import { bmi, bmiCategory, healthyRange, type BmiScale } from '../../../lib/utilities/more';

export const BmiCalculator: React.FC = () => {
  const [weight, setWeight] = useState('70');
  const [height, setHeight] = useState('170');
  const [scale, setScale] = useState<BmiScale>('asian');
  const result = useMemo(() => {
    const w = parseAmount(weight);
    const h = parseAmount(height);
    if (w < 10 || w > 500 || h < 80 || h > 250) return null;
    const value = bmi(w, h);
    return { value, category: bmiCategory(value, scale), range: healthyRange(h, scale) };
  }, [weight, height, scale]);
  return (
    <section className={calcCard}>
      <InputGrid>
        <NumberField label="Weight" suffix="kg" value={weight} onChange={setWeight} />
        <NumberField label="Height" suffix="cm" value={height} onChange={setHeight} />
        <SelectField label="Category scale" value={scale} onChange={(v) => setScale(v as BmiScale)} options={[
          { value: 'asian', label: 'Asian / Indian (overweight from 23)' }, { value: 'who', label: 'WHO standard (overweight from 25)' },
        ]} />
      </InputGrid>
      {result ? (
        <StatGrid>
          <Stat label="Your BMI" value={result.value.toFixed(1)} tone="strong" />
          <Stat label="Category" value={result.category} />
          <Stat label="Healthy weight range for your height" value={`${result.range[0].toFixed(1)} to ${result.range[1].toFixed(1)} kg`} tone="good" />
        </StatGrid>
      ) : <p className="mt-4 text-xs text-slate-500">Enter a weight of 10 to 500 kg and a height of 80 to 250 cm.</p>}
      <Note>BMI is a rough screening number. It does not separate muscle from fat and is not suitable for children, pregnancy or athletes. It is not medical advice; speak to a doctor about your health.</Note>
      <CalcFooter />
    </section>
  );
};

export default BmiCalculator;
