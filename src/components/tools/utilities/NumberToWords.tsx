import React, { useMemo, useState } from 'react';
import { CalcFooter, Note, NumberField, SelectField, calcCard } from '../../finance/ui';
import { ChoiceButtons, CopyButton } from './common';
import { MAX_WORDS_VALUE, amountToRupeeWords, integerToIndianWords, integerToInternationalWords } from '../../../lib/utilities/numberToWords';
import { parseAmount } from '../../../lib/finance/format';

type Style = 'normal' | 'upper' | 'cheque';

export const NumberToWords: React.FC = () => {
  const [amount, setAmount] = useState('1234567.50');
  const [system, setSystem] = useState<'indian' | 'international'>('indian');
  const [kind, setKind] = useState<'rupees' | 'plain'>('rupees');
  const [style, setStyle] = useState<Style>('normal');

  const base = useMemo(() => {
    if (amount.trim() === '') return null;
    const value = parseAmount(amount);
    if (kind === 'rupees') return amountToRupeeWords(value, system);
    if (!Number.isFinite(value) || value < 0 || value > MAX_WORDS_VALUE || value !== Math.floor(value)) return null;
    return system === 'indian' ? integerToIndianWords(value) : integerToInternationalWords(value);
  }, [amount, system, kind]);

  const words = base === null ? null : style === 'upper' ? base.toUpperCase() : style === 'cheque' ? `**${base.toUpperCase()}**` : base;
  const figure = amount.trim() === '' || !Number.isFinite(parseAmount(amount)) ? '' : parseAmount(amount).toLocaleString(system === 'indian' ? 'en-IN' : 'en-US', { minimumFractionDigits: kind === 'rupees' ? 2 : 0, maximumFractionDigits: 2 });

  return (
    <section className={calcCard}>
      <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
        <NumberField label="Number or amount" prefix={kind === 'rupees' ? '₹' : undefined} value={amount} onChange={setAmount} hint={kind === 'rupees' ? `Up to ${MAX_WORDS_VALUE.toLocaleString('en-IN')}, with paise` : 'Whole numbers only'} />
        <SelectField label="Number system" value={system} onChange={(value) => setSystem(value as 'indian' | 'international')} options={[
          { value: 'indian', label: 'Indian (lakh, crore)' }, { value: 'international', label: 'International (million, billion)' },
        ]} />
      </div>
      <div className="mt-3 space-y-3">
        <ChoiceButtons label="Write as" value={kind} onChange={(value) => setKind(value as 'rupees' | 'plain')} options={[{ value: 'rupees', label: 'Rupees and paise' }, { value: 'plain', label: 'Plain number' }]} />
        <ChoiceButtons label="Letter style" value={style} onChange={(value) => setStyle(value as Style)} options={[{ value: 'normal', label: 'Title Case' }, { value: 'upper', label: 'UPPERCASE' }, { value: 'cheque', label: '**CHEQUE STYLE**' }]} />
      </div>
      <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4" aria-live="polite">
        {figure && <p className="text-xs font-semibold text-slate-500">{kind === 'rupees' ? '₹ ' : ''}{figure}</p>}
        <p className="mt-1 text-base font-bold leading-snug text-orange-900">{words ?? (kind === 'plain' ? 'Enter a whole number from 0 to 999,999,999,999.' : 'Enter an amount from 0 to 999,999,999,999.')}</p>
      </div>
      <div className="mt-3"><CopyButton text={words ?? ''} label="Copy words" /></div>
      <Note>Amounts are rounded to the nearest paisa. Cheque style adds asterisks before and after the words to discourage alteration. Always check the wording against the figure before using it on a cheque or legal document.</Note>
      <CalcFooter />
    </section>
  );
};

export default NumberToWords;
