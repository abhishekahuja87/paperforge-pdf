import React from 'react';
import { adsAndAnalyticsConfig } from '../../config/adsAndAnalytics';

interface AdSlotProps {
  slotId: string;
  format?: 'banner' | 'rectangle' | 'compact';
  className?: string;
}

export const AdSlot: React.FC<AdSlotProps> = ({ slotId, format = 'banner', className = '' }) => {
  if (!adsAndAnalyticsConfig.ads.enabled) {
    return null;
  }

  const heightClasses = {
    banner: 'min-h-[90px]',
    rectangle: 'min-h-[120px]',
    compact: 'min-h-[60px]',
  }[format];

  return (
    <div
      className={`w-full bg-slate-100/80 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-center p-3 transition-colors ${heightClasses} ${className}`}
    >
      <div className="space-y-1">
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
          Sponsored Advertisement
        </span>
        <span className="text-[11px] text-slate-400">
          Ad Slot: {slotId}
        </span>
      </div>
    </div>
  );
};