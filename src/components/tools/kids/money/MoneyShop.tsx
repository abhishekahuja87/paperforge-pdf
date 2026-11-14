import React, { useEffect, useState } from 'react';
import { CheckCircle2, Minus, Plus, RotateCcw, Trash2, XCircle } from 'lucide-react';
import { card } from '../../paper/controls';
import { DEFAULT_SHOP, MONEY_LEVELS, breakdown, makeChangeQuestion, makePayQuestion, rupees, sum, type ChangeQuestion, type MoneyLevel, type PayQuestion, type ShopItem } from '../../../../lib/kids/rupees';
import { Money, MoneyPicker, Tray } from './Money';

const ROUND = 5;
const STORAGE_KEY = 'mdu-money-shop-v1';

const chip = (active: boolean) => `min-h-11 rounded-full border px-4 py-2 text-sm font-bold ${active ? 'border-orange-600 bg-orange-600 text-white' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'}`;
const bigButton = 'min-h-12 rounded-xl px-5 py-3 text-base font-bold disabled:opacity-50';

const Message: React.FC<{ good: boolean; children: React.ReactNode }> = ({ good, children }) => (
  <div role="status" className={`flex items-start gap-2 rounded-xl p-3 text-sm font-bold ${good ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'}`}>
    {good ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />}
    <span>{children}</span>
  </div>
);

const useTray = () => {
  const [values, setValues] = useState<number[]>([]);
  return {
    values,
    add: (value: number) => setValues((current) => [...current, value].sort((a, b) => b - a)),
    remove: (index: number) => setValues((current) => current.filter((_, i) => i !== index)),
    clear: () => setValues([]),
  };
};

const LevelPicker: React.FC<{ level: MoneyLevel; onChange: (level: MoneyLevel) => void }> = ({ level, onChange }) => (
  <div className={card}>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Level">
      {MONEY_LEVELS.map((item) => <button key={item.id} type="button" className={chip(level === item.id)} aria-pressed={level === item.id} title={item.hint} onClick={() => onChange(item.id)}>{item.label}</button>)}
    </div>
    <p className="mt-2 text-xs text-slate-600">{MONEY_LEVELS.find((item) => item.id === level)?.hint}. A round has {ROUND} questions.</p>
  </div>
);

const RoundEnd: React.FC<{ score: number; onAgain: () => void }> = ({ score, onAgain }) => (
  <button type="button" onClick={onAgain} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50">
    <RotateCcw className="h-4 w-4" aria-hidden="true" />You got {score} out of {ROUND}. Play again
  </button>
);

/** Customer: pay exactly the price shown. */
const PayExactly: React.FC = () => {
  const [level, setLevel] = useState<MoneyLevel>(1);
  const [question, setQuestion] = useState<PayQuestion>(() => makePayQuestion(1));
  const tray = useTray();
  const [result, setResult] = useState<'right' | 'short' | 'over' | null>(null);
  const [score, setScore] = useState(0);
  const [asked, setAsked] = useState(0);
  const total = sum(tray.values);
  const finished = asked >= ROUND && result === 'right';

  const restart = (next: MoneyLevel) => { setLevel(next); setQuestion(makePayQuestion(next)); tray.clear(); setResult(null); setScore(0); setAsked(0); };
  const pay = () => {
    if (result === 'right') return;
    if (total === question.price) { setResult('right'); setAsked((c) => c + 1); setScore((s) => s + 1); return; }
    setResult(total < question.price ? 'short' : 'over');
  };
  const next = () => { if (finished) { restart(level); return; } setQuestion(makePayQuestion(level, question.price)); tray.clear(); setResult(null); };
  const skip = () => { setAsked((c) => c + 1); setResult('right'); };

  return (
    <div className="space-y-4">
      <LevelPicker level={level} onChange={restart} />
      <div className={`${card} space-y-4`}>
        <p className="text-center text-sm font-bold text-slate-700" aria-live="polite">Question {Math.min(asked + (result === 'right' ? 0 : 1), ROUND)} of {ROUND} · Score {score}</p>
        <div className="mx-auto flex max-w-xs items-center justify-center gap-4 rounded-2xl border-2 border-orange-200 bg-orange-50 p-4">
          <span className="text-6xl" aria-hidden="true">{question.emoji}</span>
          <div><p className="text-lg font-bold capitalize text-slate-900">{question.name}</p><p className="text-4xl font-black text-orange-800">{rupees(question.price)}</p></div>
        </div>
        <p className="text-center text-base font-bold text-slate-800">Pay exactly {rupees(question.price)}.</p>
        <MoneyPicker onAdd={tray.add} disabled={result === 'right'} />
        <Tray values={tray.values} onRemove={tray.remove} label="Your payment" disabled={result === 'right'} />
        {result === 'short' && <Message good={false}>Not enough yet. You need {rupees(question.price - total)} more.</Message>}
        {result === 'over' && <Message good={false}>That is {rupees(total - question.price)} too much. Take some back, or try another mix.</Message>}
        {result === 'right' && <Message good>{total === question.price ? `Thank you! You paid exactly ${rupees(question.price)}.` : `Skipped. You could pay with ${breakdown(question.price).map(rupees).join(' + ')}.`}</Message>}
        <div className="flex flex-wrap gap-2">
          {result !== 'right' ? (
            <>
              <button type="button" onClick={pay} disabled={total === 0} className={`${bigButton} flex-1 bg-orange-700 text-white hover:bg-orange-800`}>Pay</button>
              <button type="button" onClick={tray.clear} disabled={total === 0} className={`${bigButton} border border-slate-300 bg-white text-slate-800`}>Clear</button>
              <button type="button" onClick={skip} className={`${bigButton} border border-slate-300 bg-white text-slate-600`}>Show me</button>
            </>
          ) : finished ? <RoundEnd score={score} onAgain={next} /> : <button type="button" onClick={next} className={`${bigButton} w-full border border-slate-300 bg-white text-slate-800`}>Next question</button>}
        </div>
      </div>
    </div>
  );
};

/** Shopkeeper: the customer paid with a note; give the right change. */
const GiveChange: React.FC = () => {
  const [level, setLevel] = useState<MoneyLevel>(1);
  const [question, setQuestion] = useState<ChangeQuestion>(() => makeChangeQuestion(1));
  const tray = useTray();
  const [result, setResult] = useState<'right' | 'wrong' | null>(null);
  const [score, setScore] = useState(0);
  const [asked, setAsked] = useState(0);
  const total = sum(tray.values);
  const finished = asked >= ROUND && result !== null;

  const restart = (next: MoneyLevel) => { setLevel(next); setQuestion(makeChangeQuestion(next)); tray.clear(); setResult(null); setScore(0); setAsked(0); };
  const give = () => {
    if (result) return;
    const right = total === question.change;
    setResult(right ? 'right' : 'wrong');
    setAsked((c) => c + 1);
    if (right) setScore((s) => s + 1);
  };
  const next = () => { if (finished) { restart(level); return; } setQuestion(makeChangeQuestion(level, question.price)); tray.clear(); setResult(null); };

  return (
    <div className="space-y-4">
      <LevelPicker level={level} onChange={restart} />
      <div className={`${card} space-y-4`}>
        <p className="text-center text-sm font-bold text-slate-700" aria-live="polite">Question {Math.min(asked + (result ? 0 : 1), ROUND)} of {ROUND} · Score {score}</p>
        <div className="mx-auto max-w-sm rounded-2xl border-2 border-orange-200 bg-orange-50 p-4 text-center">
          <p className="text-base font-bold text-slate-900"><span aria-hidden="true" className="text-3xl">{question.emoji}</span> The {question.name} costs <span className="text-orange-800">{rupees(question.price)}</span>.</p>
          <p className="mt-2 flex flex-wrap items-center justify-center gap-2 text-base font-bold text-slate-900">The customer pays with <Money value={question.paid} />, that is {rupees(question.paid)}.</p>
        </div>
        <p className="text-center text-base font-bold text-slate-800">You are the shopkeeper. Give back the change.</p>
        <MoneyPicker onAdd={tray.add} disabled={result !== null} />
        <Tray values={tray.values} onRemove={tray.remove} label="Change you give" disabled={result !== null} />
        {result === 'right' && <Message good>Correct! {rupees(question.paid)} − {rupees(question.price)} = {rupees(question.change)}.</Message>}
        {result === 'wrong' && <Message good={false}>Not quite. The change is {rupees(question.paid)} − {rupees(question.price)} = {rupees(question.change)}. You could give {breakdown(question.change).map(rupees).join(' + ')}.</Message>}
        <div className="flex flex-wrap gap-2">
          {result === null ? (
            <>
              <button type="button" onClick={give} disabled={total === 0} className={`${bigButton} flex-1 bg-orange-700 text-white hover:bg-orange-800`}>Give change</button>
              <button type="button" onClick={tray.clear} disabled={total === 0} className={`${bigButton} border border-slate-300 bg-white text-slate-800`}>Clear</button>
            </>
          ) : finished ? <RoundEnd score={score} onAgain={next} /> : <button type="button" onClick={next} className={`${bigButton} w-full border border-slate-300 bg-white text-slate-800`}>Next question</button>}
        </div>
      </div>
    </div>
  );
};

function loadShop(): ShopItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SHOP;
    const parsed = JSON.parse(raw) as ShopItem[];
    if (!Array.isArray(parsed) || parsed.length !== DEFAULT_SHOP.length) return DEFAULT_SHOP;
    return DEFAULT_SHOP.map((item, index) => {
      const saved = parsed[index];
      const price = Number(saved?.price);
      return { ...item, name: typeof saved?.name === 'string' && saved.name.trim() ? saved.name.slice(0, 20) : item.name, price: Number.isInteger(price) && price >= 1 && price <= 9999 ? price : item.price };
    });
  } catch { return DEFAULT_SHOP; }
}

/** Free play: fill a basket from the shelf, then pay. Parents can change the names and prices. */
const MyShop: React.FC = () => {
  const [items, setItems] = useState<ShopItem[]>(loadShop);
  const [basket, setBasket] = useState<Record<string, number>>({});
  const tray = useTray();
  const [paid, setPaid] = useState<number | null>(null);
  const due = items.reduce((total, item) => total + item.price * (basket[item.id] ?? 0), 0);
  const total = sum(tray.values);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* storage unavailable */ }
  }, [items]);

  const change = (id: string, by: number) => { setBasket((current) => ({ ...current, [id]: Math.max(0, Math.min(20, (current[id] ?? 0) + by)) })); setPaid(null); };
  const edit = (id: string, patch: Partial<ShopItem>) => setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  const pay = () => { if (due > 0 && total >= due) setPaid(total); };
  const again = () => { setBasket({}); tray.clear(); setPaid(null); };

  return (
    <div className="space-y-4">
      <div className={card}>
        <p className="text-sm font-bold text-slate-800">Fill your basket</p>
        <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-2xl border-2 border-slate-200 bg-white p-3 text-center">
              <p className="text-4xl" aria-hidden="true">{item.emoji}</p>
              <p className="text-sm font-bold text-slate-900">{item.name}</p>
              <p className="text-xl font-black text-orange-800">{rupees(item.price)}</p>
              <div className="mt-1 flex items-center justify-center gap-2">
                <button type="button" onClick={() => change(item.id, -1)} disabled={!basket[item.id]} aria-label={`One fewer ${item.name}`} className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 hover:bg-slate-50 disabled:opacity-40"><Minus className="h-4 w-4" aria-hidden="true" /></button>
                <span className="w-6 text-lg font-black tabular-nums" aria-live="polite">{basket[item.id] ?? 0}</span>
                <button type="button" onClick={() => change(item.id, 1)} aria-label={`One more ${item.name}`} className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-600 text-white hover:bg-orange-700"><Plus className="h-4 w-4" aria-hidden="true" /></button>
              </div>
            </li>
          ))}
        </ul>
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-semibold text-slate-600">Parents and teachers: change the names and prices</summary>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <span aria-hidden="true" className="text-2xl">{item.emoji}</span>
                <input aria-label={`Name of item ${item.emoji}`} value={item.name} maxLength={20} onChange={(event) => edit(item.id, { name: event.target.value })} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-2 text-sm" />
                <span aria-hidden="true">₹</span>
                <input aria-label={`Price of ${item.name} in rupees`} inputMode="numeric" value={item.price} onChange={(event) => { const n = Number(event.target.value.replace(/\D/g, '').slice(0, 4)); edit(item.id, { price: n }); }} className="w-20 rounded-lg border border-slate-200 px-2 py-2 text-sm" />
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setItems(DEFAULT_SHOP)} className="mt-2 text-xs font-semibold text-orange-700 underline">Put the original prices back</button>
        </details>
      </div>

      <div className={`${card} space-y-4`}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-800">Your basket</p>
          <p className="text-3xl font-black tabular-nums text-orange-800">{rupees(due)}</p>
        </div>
        {due === 0 ? <p className="text-sm text-slate-600">Tap + on the things you want to buy. Then pay with the notes and coins.</p> : (
          <>
            <p className="text-sm text-slate-700">{items.filter((item) => basket[item.id]).map((item) => `${basket[item.id]} × ${item.name} (${rupees(item.price * (basket[item.id] ?? 0))})`).join(', ')}</p>
            <MoneyPicker onAdd={tray.add} disabled={paid !== null} />
            <Tray values={tray.values} onRemove={tray.remove} label="Your payment" disabled={paid !== null} />
            {paid === null && total > 0 && total < due && <Message good={false}>You need {rupees(due - total)} more.</Message>}
            {paid !== null && (
              <Message good>
                {paid === due ? `Thank you! You paid exactly ${rupees(due)}.` : <>Thank you! You paid {rupees(paid)}. Your change is {rupees(paid - due)}: {breakdown(paid - due).map(rupees).join(' + ')}.</>}
              </Message>
            )}
            <div className="flex flex-wrap gap-2">
              {paid === null ? (
                <>
                  <button type="button" onClick={pay} disabled={total < due} className={`${bigButton} flex-1 bg-orange-700 text-white hover:bg-orange-800`}>Pay</button>
                  <button type="button" onClick={tray.clear} disabled={total === 0} className={`${bigButton} border border-slate-300 bg-white text-slate-800`}>Clear money</button>
                </>
              ) : <button type="button" onClick={again} className={`${bigButton} flex w-full items-center justify-center gap-2 border border-slate-300 bg-white text-slate-800`}><Trash2 className="h-4 w-4" aria-hidden="true" />Shop again</button>}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const TABS = [
  { id: 'pay', label: 'Pay', Panel: PayExactly },
  { id: 'change', label: 'Give change', Panel: GiveChange },
  { id: 'shop', label: 'My shop', Panel: MyShop },
] as const;

/** Money Shop: practise paying and giving change with play rupee notes and coins. */
export const MoneyShop: React.FC = () => {
  const [active, setActive] = useState<(typeof TABS)[number]['id']>('pay');
  const Panel = TABS.find((tab) => tab.id === active)?.Panel ?? PayExactly;
  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Money shop" className="grid grid-cols-3 gap-2">
        {TABS.map((tab) => (
          <button key={tab.id} type="button" role="tab" id={`ms-tab-${tab.id}`} aria-selected={active === tab.id} aria-controls="ms-panel" onClick={() => setActive(tab.id)}
            className={`min-h-14 rounded-2xl border-2 px-2 py-3 text-base font-black ${active === tab.id ? 'border-orange-600 bg-orange-600 text-white' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'}`}>{tab.label}</button>
        ))}
      </div>
      <div role="tabpanel" id="ms-panel" aria-labelledby={`ms-tab-${active}`}><Panel /></div>
    </div>
  );
};

export default MoneyShop;
