import React, { useMemo, useState } from 'react';
import { CalcFooter, Note, NumberField, SelectField, calcCard } from '../../finance/ui';
import { CopyButton } from './common';
import { MAX_WORDS_VALUE, amountToRupeeWords } from '../../../lib/utilities/numberToWords';
import { parseAmount } from '../../../lib/finance/format';

export const NumberToWords: React.FC = () => {
  const [amount, setAmount] = useState('1234567.50');
  const [system, setSystem] = useState<'indian' | 'international'>('indian');
  const words = useMemo(() => (amount.trim() === '' ? null : amountToRupeeWords(parseAmount(amount), system)), [amount, system]);
  return (
    <section className={calcCard}>
      <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
        <NumberField label="Amount" prefix="₹" value={amount} onChange={setAmount} hint={`Up to ${MAX_WORDS_VALUE.toLocaleString('en-IN')}, with paise`} />
        <SelectField label="Number system" value={system} onChange={(value) => setSystem(value as 'indian' | 'international')} options={[
          { value: 'indian', label: 'Indian (lakh, crore)' }, { value: 'international', label: 'International (million, billion)' },
        ]} />
      </div>
      <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4" aria-live="polite">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">In words</p>
        <p className="mt-1 text-base font-bold leading-snug text-orange-900">{words ?? 'Enter an amount from 0 to 999,999,999,999.'}</p>
      </div>
      <div className="mt-3"><CopyButton text={words ?? ''} label="Copy words" /></div>
      <Note>Amounts are rounded to the nearest paisa. Always check the wording against the figure before using it on a cheque or legal document.</Note>
      <CalcFooter />
    </section>
  );
};

export default NumberToWords;
