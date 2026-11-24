import React, { useMemo, useState } from 'react';
import { Copy } from 'lucide-react';
import { SimpleTable, calcCard, SelectField, NumberField, InputGrid } from '../../finance/ui';
import { parseAmount } from '../../../lib/finance/format';
import { usePersisted } from '../../../lib/screens/usePersisted';
import { knockoutRounds, parseTeams, pointsTable, roundRobin, type Result } from '../../../lib/sports/fixtures';
import { ConfirmButton } from '../shared/ConfirmButton';
import { ghostButton, smallInput } from '../shared/toolStyles';

type Format = 'single' | 'double' | 'knockout';
interface Saved { teamsText: string; format: Format; win: string; draw: string; scores: Record<string, [string, string]>; picks: Record<string, string> }
const DEFAULT: Saved = { teamsText: 'Team A\nTeam B\nTeam C\nTeam D', format: 'single', win: '3', draw: '1', scores: {}, picks: {} };

const read = (value: unknown): Saved | null => {
  const v = value as Partial<Saved> | null;
  if (!v || typeof v.teamsText !== 'string' || !['single', 'double', 'knockout'].includes(String(v.format))) return null;
  return { ...DEFAULT, ...v, teamsText: v.teamsText.slice(0, 2000), scores: v.scores && typeof v.scores === 'object' ? v.scores : {}, picks: v.picks && typeof v.picks === 'object' ? v.picks : {} } as Saved;
};

const MAX_TEAMS = 32;

export const TournamentFixtures: React.FC = () => {
  const [saved, setSaved] = usePersisted<Saved>('mdu-fixtures-v1', DEFAULT, read);
  const [notice, setNotice] = useState('');
  const teams = useMemo(() => parseTeams(saved.teamsText).slice(0, MAX_TEAMS), [saved.teamsText]);
  const robin = useMemo(() => (saved.format === 'knockout' ? [] : roundRobin(teams, saved.format === 'double')), [teams, saved.format]);
  const bracket = useMemo(() => (saved.format === 'knockout' ? knockoutRounds(teams, saved.picks) : []), [teams, saved.format, saved.picks]);

  const key = (round: number, index: number) => `${round}-${index}`;
  const setScore = (id: string, side: 0 | 1, value: string) => {
    const current = saved.scores[id] ?? ['', ''];
    const next: [string, string] = [current[0], current[1]];
    next[side] = value;
    setSaved({ ...saved, scores: { ...saved.scores, [id]: next } });
  };

  const results: Result[] = useMemo(() => robin.flatMap((round, r) => round.flatMap(([home, away], i) => {
    const pair = saved.scores[key(r, i)];
    if (!pair || pair[0] === '' || pair[1] === '') return [];
    return [{ home, away, homeScore: Math.max(0, Math.floor(parseAmount(pair[0]))), awayScore: Math.max(0, Math.floor(parseAmount(pair[1]))) }];
  })), [robin, saved.scores]);
  const table = useMemo(() => pointsTable(teams, results, { win: Math.max(0, parseAmount(saved.win)), draw: Math.max(0, parseAmount(saved.draw)), loss: 0 }), [teams, results, saved.win, saved.draw]);

  const asText = (): string => {
    if (saved.format === 'knockout') return bracket.map((round) => `${round.name}\n${round.ties.map((tie) => `${tie.a || 'Bye'} vs ${tie.b || 'Bye'}`).join('\n')}`).join('\n\n');
    return robin.map((round, r) => `Round ${r + 1}\n${round.map(([a, b]) => `${a} vs ${b}`).join('\n')}`).join('\n\n');
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(asText()); setNotice('Copied the fixtures.'); } catch { setNotice('Could not copy here. Select the text and copy it by hand.'); }
  };

  return (
    <section className={`${calcCard} space-y-4`}>
      <label className="block text-xs font-semibold text-slate-700">
        Teams or players, one on each line (up to {MAX_TEAMS})
        <textarea value={saved.teamsText} onChange={(event) => setSaved({ ...saved, teamsText: event.target.value })} rows={6} className={smallInput} />
        <span className="mt-1 block font-normal text-slate-500">{teams.length} {teams.length === 1 ? 'team' : 'teams'}. For a knockout, list the strongest first so they are kept apart.</span>
      </label>
      <InputGrid>
        <SelectField label="Format" value={saved.format} onChange={(v) => setSaved({ ...saved, format: v as Format })} options={[
          { value: 'single', label: 'Round robin, everyone plays once' }, { value: 'double', label: 'Round robin, home and away' }, { value: 'knockout', label: 'Knockout bracket' },
        ]} />
        {saved.format !== 'knockout' && <NumberField label="Points for a win" value={saved.win} onChange={(v) => setSaved({ ...saved, win: v })} step="1" />}
        {saved.format !== 'knockout' && <NumberField label="Points for a draw" value={saved.draw} onChange={(v) => setSaved({ ...saved, draw: v })} step="1" />}
      </InputGrid>

      {teams.length < 2 ? <p role="status" className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">Add at least two teams to make the fixtures.</p> : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => void copy()} className={ghostButton}><Copy className="h-4 w-4" aria-hidden="true" />Copy the fixtures</button>
            <ConfirmButton label="Clear all results" confirmLabel="Tap again to clear results" onConfirm={() => setSaved({ ...saved, scores: {}, picks: {} })} disabled={Object.keys(saved.scores).length === 0 && Object.keys(saved.picks).length === 0} />
            <ConfirmButton label="New tournament" confirmLabel="Tap again to clear the teams too" onConfirm={() => setSaved({ ...saved, teamsText: '', scores: {}, picks: {} })} />
            {notice && <span role="status" className="text-xs text-slate-600">{notice}</span>}
          </div>

          {saved.format === 'knockout' ? (
            <div className="space-y-4">
              {bracket.map((round, r) => (
                <div key={round.name}>
                  <h3 className="text-sm font-bold text-slate-900">{round.name}</h3>
                  <ul className="mt-2 space-y-2">
                    {round.ties.map((tie, i) => (
                      <li key={i} className="rounded-xl border border-slate-200 p-2">
                        {(tie.a && tie.b) ? (
                          <div className="grid grid-cols-2 gap-2" role="group" aria-label={`${tie.a} against ${tie.b}`}>
                            {[tie.a, tie.b].map((team) => (
                              <button key={team} type="button" aria-pressed={tie.winner === team} onClick={() => setSaved({ ...saved, picks: { ...saved.picks, [key(r, i)]: tie.winner === team ? '' : team } })}
                                className={`min-h-11 rounded-lg border px-2 py-2 text-sm font-semibold ${tie.winner === team ? 'border-green-300 bg-green-50 text-green-900' : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'}`}>{team}{tie.winner === team ? ' ✓' : ''}</button>
                            ))}
                          </div>
                        ) : <p className="px-1 py-2 text-sm text-slate-700">{tie.a || tie.b ? `${tie.a || tie.b} has a bye` : 'Waiting for the earlier round'}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {bracket.length > 0 && bracket[bracket.length - 1].ties[0].winner && <p role="status" className="rounded-xl bg-green-50 px-3 py-3 text-center text-base font-black text-green-800">Champion: {bracket[bracket.length - 1].ties[0].winner}</p>}
              <p className="text-[11px] text-slate-500">Tap the winner of each match. The winners move on to the next round.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {robin.map((round, r) => (
                  <div key={r}>
                    <h3 className="text-sm font-bold text-slate-900">Round {r + 1}</h3>
                    <ul className="mt-2 space-y-2">
                      {round.map(([home, away], i) => {
                        const pair = saved.scores[key(r, i)] ?? ['', ''];
                        return (
                          <li key={i} className="grid grid-cols-[1fr_3.5rem_auto_3.5rem_1fr] items-center gap-2 rounded-xl border border-slate-200 p-2 text-sm">
                            <span className="truncate text-right font-semibold text-slate-800">{home}</span>
                            <input aria-label={`${home} score`} inputMode="numeric" value={pair[0]} onChange={(event) => setScore(key(r, i), 0, event.target.value)} className="min-h-10 rounded-lg border border-slate-200 px-1 text-center" />
                            <span aria-hidden="true" className="text-slate-400">-</span>
                            <input aria-label={`${away} score`} inputMode="numeric" value={pair[1]} onChange={(event) => setScore(key(r, i), 1, event.target.value)} className="min-h-10 rounded-lg border border-slate-200 px-1 text-center" />
                            <span className="truncate font-semibold text-slate-800">{away}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
              <SimpleTable caption="Points table" head={['Team', 'P', 'W', 'D', 'L', 'For', 'Against', 'Diff', 'Pts']}
                rows={table.map((row) => [row.team, String(row.played), String(row.won), String(row.drawn), String(row.lost), String(row.for), String(row.against), (row.diff > 0 ? '+' : '') + row.diff, String(row.points)])} />
              <p className="text-[11px] text-slate-500">Teams level on points are ordered by score difference, then by scores for. Enter a score in both boxes of a match to count it.{teams.length % 2 === 1 ? ' With an odd number of teams, one team rests in each round.' : ''}</p>
            </>
          )}
        </>
      )}
    </section>
  );
};

export default TournamentFixtures;
