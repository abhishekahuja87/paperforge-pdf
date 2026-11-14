import React, { useState } from 'react';
import { ExploreTab } from './ExploreTab';
import { QuizTab } from './QuizTab';

const TABS = [
  { id: 'explore', label: 'Explore', Panel: ExploreTab },
  { id: 'quiz', label: 'Quiz', Panel: QuizTab },
] as const;

/** Move the sun and watch the shadow, then take a quiz. */
export const ShadowExplorer: React.FC = () => {
  const [active, setActive] = useState<(typeof TABS)[number]['id']>('explore');
  const Panel = TABS.find((tab) => tab.id === active)?.Panel ?? ExploreTab;
  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Shadow explorer" className="grid grid-cols-2 gap-2">
        {TABS.map((tab) => (
          <button key={tab.id} type="button" role="tab" id={`sh-tab-${tab.id}`} aria-selected={active === tab.id} aria-controls="sh-panel" onClick={() => setActive(tab.id)}
            className={`min-h-14 rounded-2xl border-2 px-3 py-3 text-base font-black ${active === tab.id ? 'border-orange-600 bg-orange-600 text-white' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'}`}>{tab.label}</button>
        ))}
      </div>
      <div role="tabpanel" id="sh-panel" aria-labelledby={`sh-tab-${active}`}><Panel /></div>
    </div>
  );
};

export default ShadowExplorer;
