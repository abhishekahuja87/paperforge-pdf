/** Fixtures for a tournament: round robin, knockout with byes, and a points table. Plain logic, no React. */

export const BYE = '';

/** Round robin by the circle method. Returns rounds of [home, away] pairs. A team with no opponent in a round (odd number of teams) is left out of that round. `meetings` is how many times each pair plays (1 to 4); true means 2. Every second set of rounds has home and away swapped. */
export function roundRobin(teams: string[], meetings: number | boolean = 1): Array<Array<[string, string]>> {
  const list = teams.slice();
  if (list.length < 2) return [];
  if (list.length % 2 === 1) list.push(BYE);
  const count = list.length;
  const rounds: Array<Array<[string, string]>> = [];
  const ring = list.slice(1);
  for (let round = 0; round < count - 1; round += 1) {
    const order = [list[0], ...ring];
    const pairs: Array<[string, string]> = [];
    for (let i = 0; i < count / 2; i += 1) {
      const a = order[i];
      const b = order[count - 1 - i];
      if (a === BYE || b === BYE) continue;
      // swap the first pair every other round so the first team is not always at home
      pairs.push(i === 0 && round % 2 === 1 ? [b, a] : [a, b]);
    }
    rounds.push(pairs);
    ring.unshift(ring.pop() as string);
  }
  const times = Math.min(4, Math.max(1, typeof meetings === 'boolean' ? (meetings ? 2 : 1) : Math.floor(meetings)));
  const all: Array<Array<[string, string]>> = [];
  for (let leg = 0; leg < times; leg += 1) rounds.forEach((round) => all.push(leg % 2 === 0 ? round : round.map(([a, b]) => [b, a] as [string, string])));
  return all;
}

/** Bracket slot order for a power of two: 1 plays the lowest seed, and the top seeds meet last. 8 -> 1,8,4,5,2,7,3,6. */
export function seedOrder(size: number): number[] {
  let order = [1];
  while (order.length < size) {
    const next = order.length * 2;
    order = order.flatMap((seed) => [seed, next + 1 - seed]);
  }
  return order;
}

export const nextPowerOfTwo = (count: number): number => { let size = 1; while (size < count) size *= 2; return size; };

export interface Tie { a: string; b: string }

/** First round of a knockout. Teams are in seed order (first is the top seed). A missing opponent is a bye, shown as an empty string. */
export function knockoutFirstRound(teams: string[]): Tie[] {
  const size = nextPowerOfTwo(Math.max(2, teams.length));
  const order = seedOrder(size);
  const slot = (seed: number) => (seed <= teams.length ? teams[seed - 1] : BYE);
  const ties: Tie[] = [];
  for (let i = 0; i < order.length; i += 2) ties.push({ a: slot(order[i]), b: slot(order[i + 1]) });
  return ties;
}

export const roundName = (tiesInRound: number): string => (tiesInRound === 1 ? 'Final' : tiesInRound === 2 ? 'Semi-finals' : tiesInRound === 4 ? 'Quarter-finals' : `Round of ${tiesInRound * 2}`);

export interface Result { home: string; away: string; homeScore: number; awayScore: number }
export interface Row { team: string; played: number; won: number; drawn: number; lost: number; for: number; against: number; diff: number; points: number }
export interface PointsRules { win: number; draw: number; loss: number }

/** Points table from results, best first. Ties are broken by points, then difference, then scored, then name. */
export function pointsTable(teams: string[], results: Result[], rules: PointsRules): Row[] {
  const rows = new Map<string, Row>(teams.map((team) => [team, { team, played: 0, won: 0, drawn: 0, lost: 0, for: 0, against: 0, diff: 0, points: 0 }]));
  for (const result of results) {
    const home = rows.get(result.home);
    const away = rows.get(result.away);
    if (!home || !away) continue;
    home.played += 1; away.played += 1;
    home.for += result.homeScore; home.against += result.awayScore;
    away.for += result.awayScore; away.against += result.homeScore;
    if (result.homeScore > result.awayScore) { home.won += 1; away.lost += 1; home.points += rules.win; away.points += rules.loss; }
    else if (result.homeScore < result.awayScore) { away.won += 1; home.lost += 1; away.points += rules.win; home.points += rules.loss; }
    else { home.drawn += 1; away.drawn += 1; home.points += rules.draw; away.points += rules.draw; }
  }
  const list = [...rows.values()];
  for (const row of list) row.diff = row.for - row.against;
  return list.sort((x, y) => y.points - x.points || y.diff - x.diff || y.for - x.for || x.team.localeCompare(y.team));
}

/** Names from a text box: one per line (or comma), trimmed, empty lines removed, repeats made unique with a number. */
export function parseTeams(text: string): string[] {
  const seen = new Map<string, number>();
  return text.split(/[\n,]/).map((line) => line.trim()).filter(Boolean).map((name) => {
    const count = (seen.get(name.toLowerCase()) ?? 0) + 1;
    seen.set(name.toLowerCase(), count);
    return count === 1 ? name : `${name} (${count})`;
  });
}

export interface KnockoutTie { a: string; b: string; winner: string }
export interface KnockoutRound { name: string; ties: KnockoutTie[] }

/**
 * The whole bracket. picks maps "round-tie" (such as "0-1") to the team chosen as the winner.
 * A tie with a bye is won by the team that has one; a tie with a team missing from an earlier pick stays open.
 */
export function knockoutRounds(teams: string[], picks: Record<string, string>): KnockoutRound[] {
  if (teams.length < 2) return [];
  let ties: Array<{ a: string; b: string }> = knockoutFirstRound(teams);
  const rounds: KnockoutRound[] = [];
  for (let round = 0; ties.length >= 1; round += 1) {
    const withWinners: KnockoutTie[] = ties.map((tie, index) => {
      let winner = '';
      // only the first round has byes; later, an empty side just means the earlier match is not decided yet
      if (round === 0 && tie.a && !tie.b) winner = tie.a;
      else if (round === 0 && tie.b && !tie.a) winner = tie.b;
      else if (tie.a && tie.b) {
        const pick = picks[`${round}-${index}`];
        if (pick && (pick === tie.a || pick === tie.b)) winner = pick;
      }
      return { ...tie, winner };
    });
    rounds.push({ name: roundName(ties.length), ties: withWinners });
    if (ties.length === 1) break;
    const next: Array<{ a: string; b: string }> = [];
    for (let i = 0; i < withWinners.length; i += 2) next.push({ a: withWinners[i].winner, b: withWinners[i + 1].winner });
    ties = next;
  }
  return rounds;
}
