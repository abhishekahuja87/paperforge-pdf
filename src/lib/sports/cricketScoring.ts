/**
 * Ball by ball cricket scoring with no setup. Plain logic, no React.
 * The innings is just the list of balls, so undo removes the last ball and every figure is worked out again from the list.
 */

export type BallKind = 'ok' | 'wd' | 'nb' | 'bye' | 'lb';

export interface Ball {
  kind: BallKind;
  /** Runs off the bat for ok and nb. Runs run for bye and lb. Extra runs run for a wide. */
  runs: number;
  wicket: boolean;
}

export interface InningsView {
  runs: number;
  wickets: number;
  /** Legal balls bowled. */
  balls: number;
  /** "3.4" for 3 overs and 4 balls. */
  overs: string;
  runRate: number;
  extras: number;
  fours: number;
  sixes: number;
  /** Runs and balls since the last wicket. */
  partnership: { runs: number; balls: number };
  /** The balls of the over being bowled, or of the last over if a new one has not started. */
  thisOver: Ball[];
  /** True when the next ball is a free hit, which follows a no-ball. */
  freeHit: boolean;
  /** The innings is over: all out, or the overs are used up. */
  over: boolean;
}

export const isLegal = (ball: Ball): boolean => ball.kind === 'ok' || ball.kind === 'bye' || ball.kind === 'lb';

/** Runs the batting side gets from one ball: wides and no-balls add 1. */
export const ballRuns = (ball: Ball): number => ball.runs + (ball.kind === 'wd' || ball.kind === 'nb' ? 1 : 0);

export const MAX_WICKETS = 10;

export const oversText = (balls: number): string => `${Math.floor(balls / 6)}.${balls % 6}`;

/** One short label for a ball: 0, 1, 4, W, wd, nb+4, b2, lb1. */
export function ballLabel(ball: Ball): string {
  if (ball.wicket && ball.kind === 'ok' && ball.runs === 0) return 'W';
  const base = ball.kind === 'ok' ? String(ball.runs) : ball.kind === 'wd' ? (ball.runs ? `wd+${ball.runs}` : 'wd') : ball.kind === 'nb' ? (ball.runs ? `nb+${ball.runs}` : 'nb') : `${ball.kind === 'bye' ? 'b' : 'lb'}${ball.runs}`;
  return ball.wicket ? `${base}W` : base;
}

/** The figures for an innings. oversLimit of 0 means no limit. */
export function inningsView(balls: Ball[], oversLimit = 0): InningsView {
  let runs = 0, wickets = 0, legal = 0, extras = 0, fours = 0, sixes = 0;
  let partnershipRuns = 0, partnershipBalls = 0;
  for (const ball of balls) {
    const total = ballRuns(ball);
    runs += total;
    partnershipRuns += total;
    if (isLegal(ball)) { legal += 1; partnershipBalls += 1; }
    if (ball.kind === 'wd' || ball.kind === 'nb') extras += 1;
    if (ball.kind === 'wd') extras += ball.runs;
    if (ball.kind === 'bye' || ball.kind === 'lb') extras += ball.runs;
    if ((ball.kind === 'ok' || ball.kind === 'nb') && ball.runs === 4) fours += 1;
    if ((ball.kind === 'ok' || ball.kind === 'nb') && ball.runs === 6) sixes += 1;
    if (ball.wicket) { wickets += 1; partnershipRuns = 0; partnershipBalls = 0; }
  }
  // the balls of the over in progress, or the last finished over
  const overStart = (legal % 6 === 0 && legal > 0 ? legal - 6 : legal - (legal % 6));
  const thisOver: Ball[] = [];
  let seen = 0;
  for (const ball of balls) {
    if (seen >= overStart && (seen < overStart + 6 || thisOver.length === 0)) thisOver.push(ball);
    if (isLegal(ball)) seen += 1;
    if (seen >= overStart + 6 && isLegal(ball)) break;
  }
  const last = balls[balls.length - 1];
  const limit = oversLimit > 0 ? oversLimit * 6 : 0;
  return {
    runs, wickets, balls: legal, overs: oversText(legal), runRate: legal > 0 ? (runs * 6) / legal : 0, extras, fours, sixes,
    partnership: { runs: partnershipRuns, balls: partnershipBalls }, thisOver, freeHit: !!last && last.kind === 'nb',
    over: wickets >= MAX_WICKETS || (limit > 0 && legal >= limit),
  };
}

export interface ChaseView { needed: number; ballsLeft: number; required: number; won: boolean }

/** The chase against a target, when there is a limit of overs. */
export function chaseView(view: InningsView, target: number, oversLimit: number): ChaseView {
  const needed = Math.max(0, target - view.runs);
  const ballsLeft = oversLimit > 0 ? Math.max(0, oversLimit * 6 - view.balls) : 0;
  return { needed, ballsLeft, required: ballsLeft > 0 ? (needed * 6) / ballsLeft : 0, won: view.runs >= target };
}

/** Score at the current run rate over the full overs, rounded. Only meaningful with a limit and at least one over. */
export const projected = (view: InningsView, oversLimit: number): number | null => (oversLimit > 0 && view.balls >= 6 ? Math.round(view.runRate * oversLimit) : null);

export interface OverLine {
  /** 1 for the first over. */
  over: number;
  balls: Ball[];
  /** Runs scored in this over, extras included. */
  runs: number;
  wickets: number;
  /** Score and wickets at the end of this over, or so far for the over in progress. */
  total: number;
  totalWickets: number;
  /** Six fair balls have been bowled. */
  complete: boolean;
}

/** Every over so far, oldest first. Wides and no-balls stay in the over they were bowled in, and an over ends on its sixth fair ball. */
export function overHistory(balls: Ball[]): OverLine[] {
  const lines: OverLine[] = [];
  let current: Ball[] = [];
  let legal = 0, total = 0, totalWickets = 0;
  const close = (complete: boolean) => {
    const runs = current.reduce((sum, ball) => sum + ballRuns(ball), 0);
    const wickets = current.filter((ball) => ball.wicket).length;
    total += runs;
    totalWickets += wickets;
    lines.push({ over: lines.length + 1, balls: current, runs, wickets, total, totalWickets, complete });
    current = [];
    legal = 0;
  };
  for (const ball of balls) {
    current.push(ball);
    if (isLegal(ball)) legal += 1;
    if (legal === 6) close(true);
  }
  if (current.length > 0) close(false);
  return lines;
}
