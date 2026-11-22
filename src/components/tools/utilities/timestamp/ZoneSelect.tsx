import React, { useMemo } from 'react';
import { COMMON_ZONES } from '../../../../lib/utilities/dev';
import { allTimeZones } from '../../../../lib/utilities/timestampTools';
import { fieldClass } from '../common';

/** A time zone picker: the zones people use most first, then every zone the browser knows. Value "local" means the browser's own zone. */
export const ZoneSelect: React.FC<{ label: string; value: string; onChange: (zone: string) => void }> = ({ label, value, onChange }) => {
  const rest = useMemo(() => allTimeZones(COMMON_ZONES).filter((zone) => !COMMON_ZONES.includes(zone)), []);
  return (
    <label className="block text-xs font-semibold text-slate-700">{label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass}>
        <option value="local">My browser time zone</option>
        <optgroup label="Popular">{COMMON_ZONES.map((zone) => <option key={zone} value={zone}>{zone.replace(/_/g, ' ')}</option>)}</optgroup>
        {rest.length > 0 && <optgroup label="All time zones">{rest.map((zone) => <option key={zone} value={zone}>{zone.replace(/_/g, ' ')}</option>)}</optgroup>}
      </select>
    </label>
  );
};

/** The zone name to hand to Intl: "local" becomes the browser's zone. */
export const realZone = (value: string): string => (value === 'local' ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' : value);
