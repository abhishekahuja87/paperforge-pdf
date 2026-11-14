import React, { useState } from 'react';
import { LearnTab } from './LearnTab';
import { QuizTab } from './QuizTab';
import { WorksheetTab } from './WorksheetTab';

const TABS = [
  { id: 'learn', label: 'Learn', Panel: LearnTab },
  { id: 'quiz', label: 'Quiz', Panel: QuizTab },
  { id: 'sheet', label: 'Worksheet', Panel: WorksheetTab },
] as const;

/** Learn the Clock: a clock to move by touch, a quiz with levels, and a printable worksheet. */
export const LearnTheClock: React.FC = () => {
  const [active, setActive] = useState<(typeof TABS)[number]['id']>('learn');
  const Panel = TABS.find((tab) => tab.id === active)?.Panel ?? LearnTab;
  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Learn the clock" className="grid grid-cols-3 gap-2 print:hidden">
        {TABS.map((tab) => (
          <button key={tab.id} type="button" role="tab" id={`clock-tab-${tab.id}`} aria-selected={active === tab.id} aria-controls="clock-panel" onClick={() => setActive(tab.id)}
            className={`min-h-14 rounded-2xl border-2 px-3 py-3 text-base font-black ${active === tab.id ? 'border-orange-600 bg-orange-600 text-white' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'}`}>{tab.label}</button>
        ))}
      </div>
      <div role="tabpanel" id="clock-panel" aria-labelledby={`clock-tab-${active}`}><Panel /></div>
    </div>
  );
};

export default LearnTheClock;
