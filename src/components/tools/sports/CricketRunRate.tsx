import React, { useMemo, useState } from 'react';
import { InputGrid, Note, NumberField, ResultActions, SelectField, Stat, StatGrid, calcCard } from '../../finance/ui';
import { parseAmount } from '../../../lib/finance/format';
import { chase, battingAverage, bowlingAverage, bowlingStrikeRate, economy, netRunRate, oversToBalls, runRate, strikeRate, type InningsLine } from '../../../lib/sports/cricket';
import { chipClass, ghostButton, smallInput } from '../shared/toolStyles';

type Tab = 'chase' | 'nrr' | 'stats';
const TABS: Array<{ id: Tab; label: string }> = [{ id: 'chase', label: 'Run chase' }, { id: 'nrr', label: 'Net run rate' }, { id: 'stats', label: 'Player stats' }];
const FORMATS = [{ value: '5', label: '5 overs' }, { value: '10', label: 'T10, 10 overs' }, { value: '20', label: 'T20, 20 overs' }, { value: '50', label: 'One day, 50 overs' }, { value: '15', label: '15 overs' }, { value: '30', label: '30 overs' }, { value: '8', label: '8 overs' }];
const fmt = (value: number | null, digits = 2): string => (value === null ? 'n/a' : value.toFixed(digits));
const whole = (text: string): number => Math.max(0, Math.round(parseAmount(text)));

interface Match { scored: string; faced: string; facedAllOut: boolean; conceded: string; bowled: string; bowledAllOut: boolean }
const blankMatch = (): Match => ({ scored: '', faced: '', facedAllOut: false, conceded: '', bowled: '', bowledAllOut: false });

const OversField: React.FC<{ label: string; value: string; onChange: (value: string) => void; quota?: number }> = ({ label, value, onChange, quota }) => {
  const balls = oversToBalls(value);
  const bad = value !== '' && (balls === null || (quota !== undefined && balls > quota * 6));
  return (
    <label className="block text-xs font-semibold text-slate-700">
      {label}
      <input type="text" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={bad} placeholder="e.g. 18.4" className={`${smallInput} ${bad ? 'border-red-400' : ''}`} />
      <span className={`mt-1 block font-normal ${bad ? 'text-red-700' : 'text-slate-500'}`}>{bad ? `Write overs like 18.4, which is 18 overs and 4 balls${quota ? `, up to ${quota} overs` : ''}.` : 'Balls after the dot: 18.4 is 18 overs and 4 balls'}</span>
    </label>
  );
};

const ChaseTab: React.FC = () => {
  const [format, setFormat] = useState('20');
  const [target, setTarget] = useState('180');
  const [score, setScore] = useState('92');
  const [overs, setOvers] = useState('10.0');
  const quota = Number(format);
  const result = useMemo(() => {
    const balls = oversToBalls(overs);
    const t = whole(target);
    if (balls === null || balls > quota * 6 || t < 1) return null;
    const c = chase(t, whole(score), balls, quota * 6);
    return { ...c, projected: c.current * quota, runs: whole(score) };
  }, [target, score, overs, quota]);
  return (
    <div className="space-y-4">
      <InputGrid>
        <SelectField label="Match length" value={format} onChange={setFormat} options={FORMATS} />
        <NumberField label="Target to win" suffix="runs" value={target} onChange={setTarget} step="1" hint="The first innings score plus 1 to win, or the same score to tie" />
        <NumberField label="Score so far" suffix="runs" value={score} onChange={setScore} step="1" />
        <OversField label="Overs bowled" value={overs} onChange={setOvers} quota={quota} />
      </InputGrid>
      {result ? (
        <>
          <StatGrid>
            <Stat label="Required run rate" value={result.ballsLeft > 0 ? result.required.toFixed(2) : 'Innings over'} tone="strong" />
            <Stat label="Current run rate" value={result.current.toFixed(2)} />
            <Stat label="Runs needed" value={String(result.needed)} />
            <Stat label="Balls left" value={`${result.ballsLeft} (${Math.floor(result.ballsLeft / 6)}.${result.ballsLeft % 6} overs)`} />
            <Stat label="Score at the current rate" value={`${Math.round(result.projected)} runs`} />
          </StatGrid>
          <ResultActions summary={`Need ${result.needed} from ${result.ballsLeft} balls, required run rate ${result.required.toFixed(2)}, current ${result.current.toFixed(2)}. mydailyutils.in`} />
        </>
      ) : <p role="status" className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">Enter a target and overs like 10.0 or 18.4 to see the required run rate.</p>}
    </div>
  );
};

const NrrTab: React.FC = () => {
  const [format, setFormat] = useState('20');
  const [matches, setMatches] = useState<Match[]>([blankMatch()]);
  const quota = Number(format);
  const change = (index: number, patch: Partial<Match>) => setMatches((list) => list.map((match, i) => (i === index ? { ...match, ...patch } : match)));

  const result = useMemo(() => {
    const batting: InningsLine[] = [];
    const bowling: InningsLine[] = [];
    for (const match of matches) {
      const faced = oversToBalls(match.faced);
      const bowled = oversToBalls(match.bowled);
      if (faced === null || bowled === null || match.scored === '' || match.conceded === '') continue;
      if (faced > quota * 6 || bowled > quota * 6) continue;
      batting.push({ runs: whole(match.scored), balls: faced, allOut: match.facedAllOut, quota: quota * 6 });
      bowling.push({ runs: whole(match.conceded), balls: bowled, allOut: match.bowledAllOut, quota: quota * 6 });
    }
    if (batting.length === 0) return null;
    const scored = batting.reduce((sum, line) => sum + line.runs, 0);
    const conceded = bowling.reduce((sum, line) => sum + line.runs, 0);
    const sb = batting.reduce((sum, line) => sum + (line.allOut ? line.quota : line.balls), 0);
    const cb = bowling.reduce((sum, line) => sum + (line.allOut ? line.quota : line.balls), 0);
    return { count: batting.length, nrr: netRunRate(batting, bowling), forRate: runRate(scored, sb), againstRate: runRate(conceded, cb) };
  }, [matches, quota]);

  return (
    <div className="space-y-4">
      <SelectField label="Match length" value={format} onChange={setFormat} options={FORMATS} />
      {matches.map((match, index) => (
        <fieldset key={index} className="rounded-xl border border-slate-200 p-3">
          <legend className="px-1 text-xs font-bold text-slate-700">Match {index + 1}</legend>
          <InputGrid>
            <NumberField label="Runs your team scored" value={match.scored} onChange={(v) => change(index, { scored: v })} step="1" />
            <OversField label="Overs your team faced" value={match.faced} onChange={(v) => change(index, { faced: v })} quota={quota} />
            <NumberField label="Runs your team conceded" value={match.conceded} onChange={(v) => change(index, { conceded: v })} step="1" />
            <OversField label="Overs your team bowled" value={match.bowled} onChange={(v) => change(index, { bowled: v })} quota={quota} />
          </InputGrid>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-700">
            <label className="flex items-center gap-2"><input type="checkbox" checked={match.facedAllOut} onChange={(event) => change(index, { facedAllOut: event.target.checked })} className="h-4 w-4 accent-orange-600" />Your team was bowled out</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={match.bowledAllOut} onChange={(event) => change(index, { bowledAllOut: event.target.checked })} className="h-4 w-4 accent-orange-600" />The other team was bowled out</label>
            {matches.length > 1 && <button type="button" onClick={() => setMatches((list) => list.filter((_, i) => i !== index))} className="font-bold text-orange-800 underline">Remove this match</button>}
          </div>
        </fieldset>
      ))}
      <button type="button" onClick={() => setMatches((list) => [...list, blankMatch()])} disabled={matches.length >= 12} className={ghostButton}>Add another match</button>
      {result ? (
        <>
          <StatGrid>
            <Stat label={`Net run rate after ${result.count} ${result.count === 1 ? 'match' : 'matches'}`} value={(result.nrr >= 0 ? '+' : '') + result.nrr.toFixed(3)} tone="strong" />
            <Stat label="Runs per over scored" value={result.forRate.toFixed(3)} />
            <Stat label="Runs per over conceded" value={result.againstRate.toFixed(3)} />
          </StatGrid>
          <ResultActions summary={`Net run rate ${(result.nrr >= 0 ? '+' : '') + result.nrr.toFixed(3)} after ${result.count} matches. mydailyutils.in`} />
        </>
      ) : <p role="status" className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">Fill in the runs and overs for at least one match to see the net run rate.</p>}
      <Note>If a team is bowled out, tournament rules count it as having faced its full quota of overs, not the overs it lasted. This tool does that when you tick the box. Rules for rain-reduced matches differ between tournaments, so enter those by their official figures.</Note>
    </div>
  );
};

const StatsTab: React.FC = () => {
  const [runs, setRuns] = useState('620');
  const [facedBalls, setFacedBalls] = useState('540');
  const [innings, setInnings] = useState('20');
  const [notOuts, setNotOuts] = useState('3');
  const [conceded, setConceded] = useState('310');
  const [bowledOvers, setBowledOvers] = useState('48.3');
  const [wickets, setWickets] = useState('12');
  const out = Math.max(0, whole(innings) - whole(notOuts));
  const bowledBalls = oversToBalls(bowledOvers);
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-bold text-slate-900">Batting</h3>
        <InputGrid>
          <NumberField label="Total runs" value={runs} onChange={setRuns} step="1" />
          <NumberField label="Balls faced" value={facedBalls} onChange={setFacedBalls} step="1" />
          <NumberField label="Innings" value={innings} onChange={setInnings} step="1" />
          <NumberField label="Not outs" value={notOuts} onChange={setNotOuts} step="1" />
        </InputGrid>
        <StatGrid>
          <Stat label="Batting average" value={fmt(battingAverage(whole(runs), out))} tone="strong" />
          <Stat label="Strike rate" value={fmt(strikeRate(whole(runs), whole(facedBalls)))} />
          <Stat label="Times out" value={String(out)} />
        </StatGrid>
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-900">Bowling</h3>
        <InputGrid>
          <NumberField label="Runs conceded" value={conceded} onChange={setConceded} step="1" />
          <OversField label="Overs bowled" value={bowledOvers} onChange={setBowledOvers} />
          <NumberField label="Wickets" value={wickets} onChange={setWickets} step="1" />
        </InputGrid>
        <StatGrid>
          <Stat label="Economy rate" value={bowledBalls ? fmt(economy(whole(conceded), bowledBalls)) : 'n/a'} tone="strong" />
          <Stat label="Bowling average" value={fmt(bowlingAverage(whole(conceded), whole(wickets)))} />
          <Stat label="Balls per wicket" value={bowledBalls ? fmt(bowlingStrikeRate(bowledBalls, whole(wickets)), 1) : 'n/a'} />
        </StatGrid>
      </div>
    </div>
  );
};

export const CricketRunRate: React.FC = () => {
  const [tab, setTab] = useState<Tab>('chase');
  return (
    <section className={`${calcCard} space-y-4`}>
      <div role="tablist" aria-label="Calculator" className="flex flex-wrap gap-2">
        {TABS.map((entry) => <button key={entry.id} type="button" role="tab" aria-selected={tab === entry.id} onClick={() => setTab(entry.id)} className={chipClass(tab === entry.id)}>{entry.label}</button>)}
      </div>
      {tab === 'chase' && <ChaseTab />}
      {tab === 'nrr' && <NrrTab />}
      {tab === 'stats' && <StatsTab />}
    </section>
  );
};

export default CricketRunRate;
