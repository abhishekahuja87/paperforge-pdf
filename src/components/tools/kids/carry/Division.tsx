import React from 'react';
import { DIV_EXAMPLES, divFrames, divResult, isValidDiv, randomDiv, type DivFrame } from '../../../../lib/kids/divide';
import { DivideBoard } from './DivideBoard';
import { StepLesson } from './StepLesson';

/** Long division by one digit: divide, multiply, subtract, bring down. */
export const Division: React.FC = () => (
  <StepLesson<DivFrame>
    sign={'÷'} examples={DIV_EXAMPLES} makeFrames={divFrames} isValid={isValidDiv} random={randomDiv} result={divResult}
    ownDigits={[3, 1]} ownHint="Use a number from 10 to 999 and divide it by a number from 2 to 9."
    askTitle={(ask) => ask.prompt}
    renderBoard={(frame, _frames, _step, pair) => <DivideBoard frame={frame} x={pair.x} y={pair.y} />}
  />
);

export default Division;
