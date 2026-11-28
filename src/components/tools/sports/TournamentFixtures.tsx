import React, { useMemo, useState } from 'react';
import { Copy, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FIXTURE_PAGES } from '../../../config/fixturePages';
import { SimpleTable, calcCard, SelectField, NumberField, InputGrid } from '../../common/CalcKit';
import { Toggle } from '../../common/PanelKit';
import { parseAmount } from '../../../lib/finance/format';
import { usePersisted } from '../../../lib/screens/usePersisted';
import { knockoutRounds, parseTeams, pointsTable, roundRobin, type Result } from '../../../lib/sports/fixtures';
import { ConfirmButton } from '../shared/ConfirmButton';
import { ghostButton, smallInput } from '../shared/toolStyles';
import { FixturePrintSheet } from './FixturePrintSheet';
import { PrintCreditToggle } from '../../common/PrintCredit';
import { printAs } from '../../../lib/pdf/printName';

export type Format = 'single' | 'double' | 'knockout';
interface Saved {
  teamsText: string; format: Format; win: string; draw: string; scores: Record<string, [string, string]>; picks: Record<string, string>;
  /** How many times each team plays each other team, 1 to 4. */
  meets: string;
  title: string; venue: string; players: Record<string, string>; lines: string; printPoints: boolean; printPlayers: boolean; printScores: boolean;
}
const DEFAULT: Saved = { teamsText: 'Team A\nTeam B\nTeam C\nTeam D', format: 'single', win: '3', draw: '1', scores: {}, picks: {}, meets: '1', title: '', venue: '', players: {}, lines: '8', printPoints: true, printPlayers: true, printScores: false };

const read = (value: unknown): Saved | null => {
  const v = value as Partial<Saved> | null;
  if (!v || typeof v.teamsText !== 'string' || !['single', 'double', 'knockout'].includes(String(v.format))) return null;
  const meets = ['1', '2', '3', '4'].includes(String(v.meets)) ? String(v.meets) : v.format === 'double' ? '2' : '1';
  return {
    ...DEFAULT, ...v, format: v.format === 'double' ? 'single' : v.format, meets, teamsText: v.teamsText.slice(0, 2000),
    title: typeof v.title === 'string' ? v.title.slice(0, 80) : '', venue: typeof v.venue === 'string' ? v.venue.slice(0, 120) : '',
    scores: v.scores && typeof v.scores === 'object' ? v.scores : {}, picks: v.picks && typeof v.picks === 'object' ? v.picks : {}, players: v.players && typeof v.players === 'object' ? v.players : {},
  } as Saved;
};

const MAX_TEAMS = 32;
const TIMES = ['First time', 'Second time', 'Third time', 'Fourth time'];

/** `preset` is used by the tournament size pages (for example round robin for 6 teams): the team count and format start set, and the work is kept under its own key so it does not replace the main tool's saved work. */
export interface FixturePreset { teams: number; format: Format; storageKey: string }

export const TournamentFixtures: React.FC<{ preset?: FixturePreset }> = ({ preset }) => {
  const start: Saved = preset ? { ...DEFAULT, format: preset.format, teamsText: Array.from({ length: preset.teams }, (_, i) => `Team ${i + 1}`).join('\n') } : DEFAULT;
  const [saved, setSaved] = usePersisted<Saved>(preset?.storageKey ?? 'mdu-fixtures-v1', start, read);
  const [notice, setNotice] = useState('');
  const [preview, setPreview] = useState(false);
  /** What the Fill button writes when the team box is empty: the page's own number of teams, or 4 on the main tool. */
  const fillCount = preset?.teams ?? 4;
  const fillNames = Array.from({ length: fillCount }, (_, i) => `Team ${i + 1}`).join('\n');
  const teams = useMemo(() => parseTeams(saved.teamsText).slice(0, MAX_TEAMS), [saved.teamsText]);
  const meetings = Math.min(4, Math.max(1, parseInt(saved.meets, 10) || 1));
  const robin = useMemo(() => (saved.format === 'knockout' ? [] : roundRobin(teams, meetings)), [teams, saved.format, meetings]);
  const roundsPerMeeting = Math.max(1, Math.round(robin.length / meetings));
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
    if (saved.format === 'knockout') return bracket.map((round, ri) => `${round.name}\n${round.ties.map((tie) => `${tie.a || (ri === 0 ? 'Bye' : 'To be decided')} vs ${tie.b || (ri === 0 ? 'Bye' : 'To be decided')}`).join('\n')}`).join('\n\n');
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
          { value: 'single', label: 'Round robin (league)' }, { value: 'knockout', label: 'Knockout bracket' },
        ]} />
        {saved.format !== 'knockout' && <SelectField label="Each team plays each other team" value={saved.meets} onChange={(v) => setSaved({ ...saved, meets: v })} options={[
          { value: '1', label: 'Once' }, { value: '2', label: 'Twice (home and away)' }, { value: '3', label: 'Three times' }, { value: '4', label: 'Four times' },
        ]} />}
        {saved.format !== 'knockout' && <NumberField label="Points for a win" value={saved.win} onChange={(v) => setSaved({ ...saved, win: v })} step="1" />}
        {saved.format !== 'knockout' && <NumberField label="Points for a draw" value={saved.draw} onChange={(v) => setSaved({ ...saved, draw: v })} step="1" />}
      </InputGrid>

      {teams.length < 2 ? (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <span>Add at least two teams to make the fixtures.</span>
          <button type="button" onClick={() => setSaved({ ...saved, teamsText: fillNames })} className={ghostButton}>Fill with Team 1 to Team {fillCount}</button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => void copy()} className={ghostButton}><Copy className="h-4 w-4" aria-hidden="true" />Copy the fixtures</button>
            <ConfirmButton label="New tournament, same teams" confirmLabel="Tap again to clear the results" onConfirm={() => setSaved({ ...saved, scores: {}, picks: {} })} disabled={Object.keys(saved.scores).length === 0 && Object.keys(saved.picks).length === 0} />
            <ConfirmButton label="Clear team names" confirmLabel="Tap again to clear the names" onConfirm={() => setSaved({ ...saved, teamsText: '', scores: {}, picks: {}, players: {} })} />
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
                        ) : <p className="px-1 py-2 text-sm text-slate-700">{r === 0 && (tie.a || tie.b) ? `${tie.a || tie.b} has a bye` : tie.a || tie.b ? `${tie.a || tie.b} is waiting for the other match to finish` : 'Waiting for the earlier round'}</p>}
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
                    <h3 className="text-sm font-bold text-slate-900">Round {r + 1}{meetings > 1 ? <span className="ml-2 text-xs font-semibold text-slate-500">{TIMES[Math.floor(r / roundsPerMeeting)]}</span> : null}</h3>
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

          <div className="space-y-3 rounded-xl border border-slate-200 p-3">
            <h3 className="text-sm font-bold text-slate-900">Print the fixture sheet</h3>
            <p className="text-[11px] text-slate-500">An A4 sheet with every match and score boxes, {saved.format === 'knockout' ? '' : 'a points table to fill in (played, won, drawn, lost, points), '}and a page to write the players of each team. Fill it in by hand during the tournament.</p>
            <InputGrid>
              <label className="block text-xs font-semibold text-slate-700">Tournament name<input value={saved.title} maxLength={80} onChange={(e) => setSaved({ ...saved, title: e.target.value })} placeholder="Inter-school Cup" className={smallInput} /></label>
              <label className="block text-xs font-semibold text-slate-700">Venue and dates (optional)<input value={saved.venue} maxLength={120} onChange={(e) => setSaved({ ...saved, venue: e.target.value })} className={smallInput} /></label>
            </InputGrid>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {saved.format !== 'knockout' && <Toggle label="Points table at the bottom" checked={saved.printPoints} onChange={(v) => setSaved({ ...saved, printPoints: v })} />}
              <Toggle label="Page to write the players of each team" checked={saved.printPlayers} onChange={(v) => setSaved({ ...saved, printPlayers: v })} />
              <Toggle label="Print the scores I have entered" hint="Off prints empty boxes to fill in by hand." checked={saved.printScores} onChange={(v) => setSaved({ ...saved, printScores: v })} />
            </div>
            {saved.printPlayers && (
              <>
                <SelectField label="Blank lines for each team" value={saved.lines} onChange={(v) => setSaved({ ...saved, lines: v })} options={['5', '8', '11', '15', '20'].map((n) => ({ value: n, label: n }))} />
                <details className="text-xs text-slate-700">
                  <summary className="min-h-10 cursor-pointer py-2 font-semibold">Type the player names now (optional)</summary>
                  <div className="mt-2 space-y-2">
                    {teams.map((team) => (
                      <label key={team} className="block font-semibold">{team}
                        <input value={saved.players[team] ?? ''} maxLength={400} onChange={(e) => setSaved({ ...saved, players: { ...saved.players, [team]: e.target.value } })} placeholder="Names, separated by commas" className={smallInput} />
                      </label>
                    ))}
                  </div>
                </details>
              </>
            )}
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => printAs('fixtures', { base: saved.title || 'tournament', details: saved.venue || `${teams.length}-teams` })} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-700 px-4 py-2 text-sm font-bold text-white hover:bg-orange-800"><Printer className="h-4 w-4" aria-hidden="true" />Print or save as PDF</button><PrintCreditToggle />
              <button type="button" onClick={() => setPreview(!preview)} aria-pressed={preview} className={ghostButton}>{preview ? 'Hide the sheet' : 'Show the sheet here'}</button>
            </div>
          </div>
          <FixturePrintSheet
            id="fixtures-print" visible={preview} title={saved.title || 'Fixtures'} venue={saved.venue} teams={teams} rounds={robin} roundsPerMeeting={roundsPerMeeting} meetings={meetings}
            bracket={bracket} scores={saved.scores} table={table} rules={{ win: saved.win, draw: saved.draw }} players={saved.players}
            options={{ points: saved.printPoints, players: saved.printPlayers, scores: saved.printScores, lines: parseInt(saved.lines, 10) || 8 }}
            labels={{ round: 'Round', time: TIMES, fixtures: saved.format === 'knockout' ? 'Knockout' : 'Fixtures', pointsTable: 'Points table', players: 'Teams and players', winner: 'Winner', bye: 'Bye', rules: 'Win {win} points, draw {draw} point(s), loss 0.', date: 'Date' }}
          />
        </>
      )}
      {!preset && (
        <p className="text-xs text-slate-600">
          Ready-made match lists:{' '}
          {FIXTURE_PAGES.map((page, index) => <React.Fragment key={page.path}><Link to={page.path} className="font-semibold text-orange-800 underline">{page.name}</Link>{index < FIXTURE_PAGES.length - 1 ? ', ' : '.'}</React.Fragment>)}
        </p>
      )}
    </section>
  );
};

export default TournamentFixtures;
