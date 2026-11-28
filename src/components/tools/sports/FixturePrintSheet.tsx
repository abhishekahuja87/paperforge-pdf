import React from 'react';
import type { KnockoutRound, Row } from '../../../lib/sports/fixtures';

export interface PrintOptions { points: boolean; players: boolean; scores: boolean; lines: number }
export interface PrintProps {
  id: string;
  visible: boolean;
  title: string;
  venue: string;
  teams: string[];
  /** Round robin rounds of [home, away]; empty for a knockout. */
  rounds: Array<Array<[string, string]>>;
  roundsPerMeeting: number;
  meetings: number;
  bracket: KnockoutRound[];
  /** Entered scores by "round-match", used when the sheet is printed with scores. */
  scores: Record<string, [string, string]>;
  table: Row[];
  rules: { win: string; draw: string };
  players: Record<string, string>;
  options: PrintOptions;
  labels: { round: string; time: string[]; fixtures: string; pointsTable: string; players: string; winner: string; bye: string; rules: string; date: string };
}

const box = 'inline-block h-[7mm] w-[10mm] border border-black align-middle';
const cell = 'border border-black px-1 text-center';

/** The sheet that is printed: fixtures with score boxes, a points table to fill in, and a page to write each team's players. Hidden on screen unless the preview is open. */
export const FixturePrintSheet: React.FC<PrintProps> = ({ id, visible, title, venue, teams, rounds, roundsPerMeeting, meetings, bracket, scores, table, rules, players, options, labels }) => {
  const names = (team: string): string[] => (players[team] ?? '').split(/[\n,]/).map((x) => x.trim()).filter(Boolean);
  const shown = options.scores ? table : teams.map((team) => ({ team, played: 0, won: 0, drawn: 0, lost: 0, for: 0, against: 0, diff: 0, points: 0 }));
  return (
    <div id={id} className={`${visible ? 'block' : 'hidden'} rounded-lg border border-slate-300 bg-white p-4 text-black`} style={{ fontSize: '11px' }}>
      <style>{`@media print { body * { visibility: hidden !important; } #${id}, #${id} * { visibility: visible !important; } #${id} { display: block !important; position: absolute; left: 0; top: 0; width: 100%; border: 0 !important; padding: 0 !important; background: #fff; } @page { size: A4 portrait; margin: 12mm; } #${id} .fx-break { break-before: page; } #${id} .fx-avoid { break-inside: avoid; } }`}</style>
      <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>{title || ' '}</h2>
      {venue.trim() && <p style={{ margin: '2px 0 0' }}>{venue}</p>}

      <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '10px 0 4px' }}>{labels.fixtures}</h3>
      {bracket.length > 0 ? bracket.map((round, ri) => (
        <div key={round.name} className="fx-avoid" style={{ marginBottom: '8px' }}>
          <p style={{ fontWeight: 700, margin: '4px 0' }}>{round.name}</p>
          {round.ties.map((tie, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 0', borderBottom: '1px solid #bbb' }}>
              <span style={{ width: '6mm' }}>{i + 1}</span>
              <span style={{ flex: 1, textAlign: 'right' }}>{tie.a || (tie.b && ri === 0 ? labels.bye : '______________')}</span>
              <span className={box} /><span>-</span><span className={box} />
              <span style={{ flex: 1 }}>{tie.b || (tie.a && ri === 0 ? labels.bye : '______________')}</span>
              <span style={{ width: '48mm' }}>{labels.winner}: ____________</span>
            </div>
          ))}
        </div>
      )) : (
        <div style={{ columnCount: 2, columnGap: '8mm' }}>
          {rounds.map((round, r) => (
            <div key={r} className="fx-avoid" style={{ marginBottom: '6px' }}>
              <p style={{ fontWeight: 700, margin: '4px 0 2px' }}>{labels.round} {r + 1}{meetings > 1 ? ` (${labels.time[Math.floor(r / roundsPerMeeting)] ?? ''})` : ''}</p>
              {round.map(([home, away], i) => {
                const pair = options.scores ? scores[`${r}-${i}`] : undefined;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 0', borderBottom: '1px solid #ccc' }}>
                    <span style={{ flex: 1, textAlign: 'right' }}>{home}</span>
                    <span className={box} style={{ textAlign: 'center', lineHeight: '7mm' }}>{pair?.[0] ?? ''}</span><span>-</span><span className={box} style={{ textAlign: 'center', lineHeight: '7mm' }}>{pair?.[1] ?? ''}</span>
                    <span style={{ flex: 1 }}>{away}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {options.points && rounds.length > 0 && (
        <div className="fx-avoid">
          <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '12px 0 4px' }}>{labels.pointsTable}</h3>
          <p style={{ margin: '0 0 4px' }}>{labels.rules.replace('{win}', rules.win).replace('{draw}', rules.draw)}</p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['#', 'Team', 'P', 'W', 'D', 'L', 'For', 'Against', 'Diff', 'Pts'].map((h) => <th key={h} className={cell} style={{ background: '#eee' }}>{h}</th>)}</tr></thead>
            <tbody>
              {shown.map((row, i) => (
                <tr key={row.team} style={{ height: '8mm' }}>
                  <td className={cell}>{i + 1}</td><td className={cell} style={{ textAlign: 'left', width: '40%' }}>{row.team}</td>
                  {[row.played, row.won, row.drawn, row.lost, row.for, row.against, row.diff, row.points].map((v, j) => <td key={j} className={cell}>{options.scores ? v : ''}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {options.players && (
        <div className="fx-break">
          <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 6px' }}>{labels.players}</h3>
          <div style={{ columnCount: 2, columnGap: '8mm' }}>
            {teams.map((team) => {
              const typed = names(team), count = Math.max(options.lines, typed.length);
              return (
                <div key={team} className="fx-avoid" style={{ border: '1px solid #000', marginBottom: '6px', padding: '4px 6px' }}>
                  <p style={{ fontWeight: 700, margin: '0 0 2px' }}>{team}</p>
                  {Array.from({ length: count }, (_, i) => (
                    <div key={i} style={{ display: 'flex', gap: '4px', height: '6.5mm', alignItems: 'flex-end', borderBottom: '1px solid #999' }}><span style={{ width: '5mm' }}>{i + 1}.</span><span>{typed[i] ?? ''}</span></div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
