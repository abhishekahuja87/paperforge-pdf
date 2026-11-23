/**
 * Score keeping for racket and net sports. Plain logic, no React.
 * A match is just the list of who won each point, so undo is removing the last point and every score is worked out from that list.
 */

export type ScoreSportId = 'badminton' | 'tableTennis' | 'volleyball' | 'squash' | 'pickleball' | 'tennis';
export type Side = 0 | 1;

export interface RallyRules {
  /** Points to win a game. */
  to: number;
  /** Points to win the deciding game, when different. */
  decidingTo?: number;
  /** A game must be won by this many points. */
  winBy: number;
  /** A game ends at this score even if the lead is smaller. */
  cap?: number;
  /** Words for a game: game or set. */
  unit: 'game' | 'set';
  /** When the players or teams change ends in the deciding game, as the leader's score. */
  deciderSwitchAt?: number;
  /** Teams change ends after every game or set. */
  switchEveryGame?: boolean;
}

export const SCORE_SPORTS: Array<{ id: ScoreSportId; label: string; defaultBestOf: number; bestOfChoices: number[]; rules?: RallyRules }> = [
  { id: 'badminton', label: 'Badminton', defaultBestOf: 3, bestOfChoices: [1, 3], rules: { to: 21, winBy: 2, cap: 30, unit: 'game', deciderSwitchAt: 11 } },
  { id: 'tableTennis', label: 'Table tennis', defaultBestOf: 5, bestOfChoices: [1, 3, 5, 7], rules: { to: 11, winBy: 2, unit: 'game', deciderSwitchAt: 5 } },
  { id: 'volleyball', label: 'Volleyball', defaultBestOf: 5, bestOfChoices: [1, 3, 5], rules: { to: 25, decidingTo: 15, winBy: 2, unit: 'set', switchEveryGame: true, deciderSwitchAt: 8 } },
  { id: 'squash', label: 'Squash', defaultBestOf: 5, bestOfChoices: [1, 3, 5], rules: { to: 11, winBy: 2, unit: 'game' } },
  { id: 'pickleball', label: 'Pickleball (rally scoring)', defaultBestOf: 3, bestOfChoices: [1, 3, 5], rules: { to: 11, winBy: 2, unit: 'game' } },
  { id: 'tennis', label: 'Tennis', defaultBestOf: 3, bestOfChoices: [1, 3, 5] },
];

export const sportInfo = (id: ScoreSportId) => SCORE_SPORTS.find((sport) => sport.id === id) ?? SCORE_SPORTS[0];

export interface MatchSetup { sport: ScoreSportId; bestOf: number; points: Side[] }

export interface MatchView {
  /** Finished games or sets as [first, second] scores. */
  finished: Array<[number, number]>;
  /** Games or sets won so far. */
  won: [number, number];
  /** What each side shows right now: points in a rally game, or 0, 15, 30, 40, Ad in tennis. */
  now: [string, string];
  /** For tennis, the games in the current set. */
  inSet?: [number, number];
  /** Short heading such as "Game 2" or "Set 1, tie-break". */
  heading: string;
  winner: Side | null;
  /** A reminder such as changing ends, or an empty string. */
  hint: string;
  /** Number of points played in total. */
  played: number;
}

const wins = (setup: MatchSetup): number => Math.ceil(setup.bestOf / 2);

/** True if a game at this score is over under the rules. */
export function gameOver(a: number, b: number, to: number, winBy: number, cap?: number): boolean {
  if (cap !== undefined && (a >= cap || b >= cap)) return true;
  return Math.max(a, b) >= to && Math.abs(a - b) >= winBy;
}

function rallyView(setup: MatchSetup, rules: RallyRules): MatchView {
  const finished: Array<[number, number]> = [];
  const won: [number, number] = [0, 0];
  let cur: [number, number] = [0, 0];
  let hint = '';
  let winner: Side | null = null;
  const need = wins(setup);
  for (const point of setup.points) {
    if (winner !== null) break;
    hint = '';
    cur[point] += 1;
    const decider = need > 1 && won[0] === need - 1 && won[1] === need - 1;
    const to = decider && rules.decidingTo ? rules.decidingTo : rules.to;
    if (gameOver(cur[0], cur[1], to, rules.winBy, rules.cap)) {
      const side: Side = cur[0] > cur[1] ? 0 : 1;
      won[side] += 1;
      finished.push(cur);
      cur = [0, 0];
      if (won[side] >= need) winner = side;
      else if (rules.switchEveryGame) hint = 'Teams change ends.';
    } else if (decider && rules.deciderSwitchAt !== undefined && cur[point] === rules.deciderSwitchAt && cur[1 - point] < rules.deciderSwitchAt) {
      hint = 'Change ends.';
    }
  }
  const number = finished.length + 1;
  const unit = rules.unit === 'set' ? 'Set' : 'Game';
  return {
    finished, won, now: [String(cur[0]), String(cur[1])], winner, hint, played: setup.points.length,
    heading: winner !== null ? 'Match over' : need === 1 ? unit : `${unit} ${number}`,
  };
}

const TENNIS_POINTS = ['0', '15', '30', '40'];

function tennisView(setup: MatchSetup): MatchView {
  const finished: Array<[number, number]> = [];
  const won: [number, number] = [0, 0];
  let games: [number, number] = [0, 0];
  let points: [number, number] = [0, 0];
  let tiebreak = false;
  let hint = '';
  let winner: Side | null = null;
  const need = wins(setup);
  for (const point of setup.points) {
    if (winner !== null) break;
    hint = '';
    const other = (1 - point) as Side;
    points[point] += 1;
    let gameDone = false;
    if (tiebreak) gameDone = points[point] >= 7 && points[point] - points[other] >= 2;
    else gameDone = points[point] >= 4 && points[point] - points[other] >= 2;
    if (tiebreak && !gameDone && (points[0] + points[1]) % 6 === 0) hint = 'Change ends.';
    if (!gameDone) continue;
    games[point] += 1;
    points = [0, 0];
    const setDone = tiebreak || (games[point] >= 6 && games[point] - games[other] >= 2);
    if (setDone) {
      finished.push(games);
      won[point] += 1;
      games = [0, 0];
      tiebreak = false;
      if (won[point] >= need) winner = point;
      else hint = 'Set over. Change ends if the total games were odd.';
    } else {
      if (games[0] === 6 && games[1] === 6) tiebreak = true;
      else if ((games[0] + games[1]) % 2 === 1) hint = 'Change ends.';
    }
  }
  let now: [string, string];
  if (tiebreak) now = [String(points[0]), String(points[1])];
  else if (points[0] >= 3 && points[1] >= 3) {
    now = points[0] === points[1] ? ['40', '40'] : points[0] > points[1] ? ['Ad', '40'] : ['40', 'Ad'];
  } else now = [TENNIS_POINTS[Math.min(3, points[0])], TENNIS_POINTS[Math.min(3, points[1])]];
  const setNumber = finished.length + 1;
  return {
    finished, won, now, inSet: games, winner, hint, played: setup.points.length,
    heading: winner !== null ? 'Match over' : `${need === 1 ? 'Set' : `Set ${setNumber}`}${tiebreak ? ', tie-break' : ''}`,
  };
}

/** Everything about the match worked out from the list of points. */
export function matchView(setup: MatchSetup): MatchView {
  const sport = sportInfo(setup.sport);
  return sport.rules ? rallyView(setup, sport.rules) : tennisView(setup);
}
