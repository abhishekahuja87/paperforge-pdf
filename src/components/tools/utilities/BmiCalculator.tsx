import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, Note, NumberField, ResultActions, SelectField, Stat, StatGrid, calcCard } from '../../finance/ui';
import { parseAmount } from '../../../lib/finance/format';
import { bmi, bmiCategory, dailyCalories, healthyRange, type ActivityLevel, type BmiScale } from '../../../lib/utilities/more';

export const BmiCalculator: React.FC = () => {
  const [weight, setWeight] = useState('70');
  const [height, setHeight] = useState('170');
  const [scale, setScale] = useState<BmiScale>('asian');
  const [age, setAge] = useState('30');
  const [sex, setSex] = useState('male');
  const [activity, setActivity] = useState<ActivityLevel>('light');

  const result = useMemo(() => {
    const w = parseAmount(weight);
    const h = parseAmount(height);
    if (w < 10 || w > 500 || h < 80 || h > 250) return null;
    const value = bmi(w, h);
    const range = healthyRange(h, scale);
    const a = parseAmount(age);
    const calories = a >= 15 && a <= 100 ? dailyCalories(w, h, a, sex === 'male', activity) : null;
    const target = w < range[0] ? `gain about ${(range[0] - w).toFixed(1)} kg to reach the healthy range` : w > range[1] ? `lose about ${(w - range[1]).toFixed(1)} kg to reach the healthy range` : 'already within the healthy range';
    return { value, category: bmiCategory(value, scale), range, calories, target };
  }, [weight, height, scale, age, sex, activity]);

  const summary = result ? `BMI ${result.value.toFixed(1)} (${result.category}); healthy range for this height ${result.range[0].toFixed(1)} to ${result.range[1].toFixed(1)} kg. mydailyutils.in` : '';

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
        <>
          <StatGrid>
            <Stat label="Your BMI" value={result.value.toFixed(1)} tone="strong" />
            <Stat label="Category" value={result.category} />
            <Stat label="Healthy weight range for your height" value={`${result.range[0].toFixed(1)} to ${result.range[1].toFixed(1)} kg`} tone="good" />
            <Stat label="Compared with that range" value={result.target.charAt(0).toUpperCase() + result.target.slice(1)} />
          </StatGrid>
          <h2 className="mt-6 text-sm font-bold text-slate-900">Daily calorie estimate (optional)</h2>
          <InputGrid>
            <NumberField label="Age" suffix="years" value={age} onChange={setAge} step="1" />
            <SelectField label="Sex" value={sex} onChange={setSex} options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} />
            <SelectField label="Activity level" value={activity} onChange={(v) => setActivity(v as ActivityLevel)} options={[
              { value: 'sedentary', label: 'Little or no exercise' }, { value: 'light', label: 'Light exercise 1-3 days a week' },
              { value: 'moderate', label: 'Moderate exercise 3-5 days a week' }, { value: 'active', label: 'Hard exercise 6-7 days a week' },
            ]} />
          </InputGrid>
          {result.calories ? (
            <StatGrid>
              <Stat label="Resting energy (BMR)" value={`${Math.round(result.calories.bmr).toLocaleString('en-IN')} kcal/day`} />
              <Stat label="To maintain your weight" value={`${Math.round(result.calories.maintain).toLocaleString('en-IN')} kcal/day`} tone="good" />
            </StatGrid>
          ) : <p className="mt-3 text-xs text-slate-500">Enter an age from 15 to 100 for a calorie estimate.</p>}
          <ResultActions summary={summary} />
        </>
      ) : <p className="mt-4 text-xs text-slate-500">Enter a weight of 10 to 500 kg and a height of 80 to 250 cm.</p>}
      <Note>BMI is a rough screening number. It does not separate muscle from fat and is not suitable for children, pregnancy or athletes. Calories use the Mifflin-St Jeor equation, which can be off by hundreds of kcal for an individual. None of this is medical advice; speak to a doctor or dietitian about your health.</Note>
      <CalcFooter />
    </section>
  );
};

export default BmiCalculator;
