import React, { useCallback, useMemo } from 'react';
import { EXAMPLES, isValid, makeFrames, randomExample, type Frame, type Op } from '../../../../lib/kids/placeValue';
import { DigitBoard } from './DigitBoard';
import { StepLesson, type Pair } from './StepLesson';

const sign = (op: Op) => (op === 'add' ? '+' : '−');

/** Addition with carrying or subtraction with borrowing, written as numbers in columns. */
export const CarryBorrow: React.FC<{ op: Op }> = ({ op }) => {
  const examples = useMemo<Pair[]>(() => EXAMPLES.filter((item) => item.op === op).map(({ x, y }) => ({ x, y })), [op]);
  const frames = useCallback((x: number, y: number) => makeFrames(op, x, y), [op]);
  const valid = useCallback((x: number, y: number) => isValid(op, x, y), [op]);
  const random = useCallback(() => { const { x, y } = randomExample(op); return { x, y }; }, [op]);
  const result = useCallback((x: number, y: number) => (op === 'add' ? x + y : x - y), [op]);

  // For taking away: every value each top digit has had up to this step, so old ones show crossed out.
  const board = (frame: Frame, all: Frame[], step: number, pair: Pair) => {
    const history: number[][] = Array.from({ length: frame.cols }, () => []);
    all.slice(0, step + 1).forEach((item) => item.a.forEach((value, c) => { if (history[c][history[c].length - 1] !== value) history[c].push(value); }));
    return <DigitBoard frame={frame} x={pair.x} y={pair.y} history={history} />;
  };

  return (
    <StepLesson<Frame>
      sign={sign(op)} examples={examples} makeFrames={frames} isValid={valid} random={random} result={result}
      ownHint={op === 'add' ? 'Use numbers that add up to less than 1000.' : 'The first number must be the bigger one, up to 999.'}
      askTitle={(ask) => (ask.labels ? (op === 'add' ? 'Write the ones, carry the ten' : 'Borrow') : ask.prompt)}
      renderBoard={board}
    />
  );
};

export const Addition: React.FC = () => <CarryBorrow op="add" />;
export const Subtraction: React.FC = () => <CarryBorrow op="sub" />;
