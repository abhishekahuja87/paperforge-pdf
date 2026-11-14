import React, { useState } from 'react';
import { NumberCaller } from './NumberCaller';
import { TicketMaker } from './TicketMaker';

const TABS = [
  { id: 'caller', label: 'Number caller', Panel: NumberCaller },
  { id: 'tickets', label: 'Tickets', Panel: TicketMaker },
] as const;

/** Tambola: print tickets and call the numbers, both on one page. */
export const TambolaTool: React.FC = () => {
  const [active, setActive] = useState<(typeof TABS)[number]['id']>('tickets');
  const Panel = TABS.find((tab) => tab.id === active)?.Panel ?? TicketMaker;
  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Tambola" className="grid grid-cols-2 gap-2">
        {TABS.map((tab) => (
          <button key={tab.id} type="button" role="tab" id={`tb-tab-${tab.id}`} aria-selected={active === tab.id} aria-controls="tb-panel" onClick={() => setActive(tab.id)}
            className={`min-h-14 rounded-2xl border-2 px-3 py-3 text-base font-black ${active === tab.id ? 'border-orange-600 bg-orange-600 text-white' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'}`}>{tab.label}</button>
        ))}
      </div>
      <div role="tabpanel" id="tb-panel" aria-labelledby={`tb-tab-${active}`}><Panel /></div>
    </div>
  );
};

export default TambolaTool;
