/** Cricket arithmetic: overs, run rates, net run rate, averages. Plain maths, no React. */

/** Overs as people write them: 18.4 means 18 overs and 4 balls. Returns balls, or null if the text is not valid (more than 5 balls in the part-over, or not a number). */
export function oversToBalls(text: string): number | null {
  const clean = text.trim();
  if (!/^\d+(\.\d)?$/.test(clean)) return null;
  const [whole, part = '0'] = clean.split('.');
  const balls = Number(part);
  if (balls > 5) return null;
  return Number(whole) * 6 + balls;
}

/** 112 balls -> "18.4". */
export const ballsToOvers = (balls: number): string => `${Math.floor(balls / 6)}.${balls % 6}`;

/** Overs as a true decimal for rate sums: 18.4 overs is 18.667. */
export const ballsToDecimalOvers = (balls: number): number => balls / 6;

export const runRate = (runs: number, balls: number): number => (balls > 0 ? (runs * 6) / balls : 0);

export interface Chase {
  needed: number;
  ballsLeft: number;
  /** Runs needed per over from now. */
  required: number;
  current: number;
}

/** The chasing side's position. */
export function chase(target: number, runs: number, ballsBowled: number, totalBalls: number): Chase {
  const needed = Math.max(0, target - runs);
  const ballsLeft = Math.max(0, totalBalls - ballsBowled);
  return { needed, ballsLeft, required: ballsLeft > 0 ? (needed * 6) / ballsLeft : 0, current: runRate(runs, ballsBowled) };
}

export interface InningsLine {
  runs: number;
  /** Balls actually faced or bowled. */
  balls: number;
  allOut: boolean;
  /** The full quota of balls for the innings, such as 120 for a T20. */
  quota: number;
}

/** In net run rate, a side that is bowled out is counted as having faced its full quota of overs, not the overs it lasted. */
export const countedBalls = (line: InningsLine): number => (line.allOut ? line.quota : line.balls);

/** Net run rate: runs scored per over minus runs conceded per over, across all of a team's matches. */
export function netRunRate(batting: InningsLine[], bowling: InningsLine[]): number {
  const scoredBalls = batting.reduce((sum, line) => sum + countedBalls(line), 0);
  const concededBalls = bowling.reduce((sum, line) => sum + countedBalls(line), 0);
  const scored = batting.reduce((sum, line) => sum + line.runs, 0);
  const conceded = bowling.reduce((sum, line) => sum + line.runs, 0);
  return runRate(scored, scoredBalls) - runRate(conceded, concededBalls);
}

/** Batting average is runs per dismissal. Returns null when the batter has never been out. */
export const battingAverage = (runs: number, dismissals: number): number | null => (dismissals > 0 ? runs / dismissals : null);
export const strikeRate = (runs: number, balls: number): number => (balls > 0 ? (runs * 100) / balls : 0);
export const economy = (runs: number, balls: number): number => runRate(runs, balls);
export const bowlingAverage = (runs: number, wickets: number): number | null => (wickets > 0 ? runs / wickets : null);
export const bowlingStrikeRate = (balls: number, wickets: number): number | null => (wickets > 0 ? balls / wickets : null);
