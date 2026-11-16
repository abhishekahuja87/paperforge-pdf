import React from 'react';
import { MUL_EXAMPLES, isValidMul, mulFrames, randomMul, type MulFrame } from '../../../../lib/kids/multiply';
import { MultiplyBoard } from './MultiplyBoard';
import { StepLesson } from './StepLesson';

const result = (x: number, y: number) => x * y;

/** Column multiplication: one digit of the second number at a time, with carrying, then the rows added. */
export const Multiplication: React.FC = () => (
  <StepLesson<MulFrame>
    sign={'×'} examples={MUL_EXAMPLES} makeFrames={mulFrames} isValid={isValidMul} random={randomMul} result={result}
    ownDigits={[3, 2]} ownHint="Use a number up to 999 times a number from 2 to 99."
    askTitle={(ask) => (ask.labels ? 'Write the ones, carry the rest' : ask.prompt)}
    renderBoard={(frame, _frames, _step, pair) => <MultiplyBoard frame={frame} x={pair.x} y={pair.y} />}
  />
);

export default Multiplication;
