import React, { useEffect, useRef } from 'react';
import { ADS_CONFIG } from '../../config/ads';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdBannerProps {
  slot: string;
  format?: 'auto' | 'horizontal' | 'rectangle';
  responsive?: boolean;
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  slot,
  format = 'auto',
  responsive = true,
  className = '',
}) => {
  const adRef = useRef<HTMLModElement | null>(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    // Only push when not in local dev mode and if not already pushed for this mount
    if (!ADS_CONFIG.isDevelopment && !pushedRef.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushedRef.current = true;
      } catch (err) {
        console.error('AdSense push error:', err);
      }
    }
  }, [slot]);

  // Visual placeholder in development mode so you can preview placement & prevent layout shifts
  if (ADS_CONFIG.isDevelopment) {
    return (
      <div
        className={`w-full min-h-[90px] border-2 border-dashed border-slate-300 bg-slate-100/70 rounded-xl flex flex-col items-center justify-center p-3 text-slate-400 text-xs ${className}`}
      >
        <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-500">
          Advertisement Space
        </span>
        <span className="text-[10px] text-slate-400 mt-0.5">Slot ID: {slot}</span>
      </div>
    );
  }

  return (
    <div className={`w-full min-h-[90px] overflow-hidden flex justify-center items-center ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle block w-full"
        style={{ display: 'block' }}
        data-ad-client={ADS_CONFIG.client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
};

export default AdBanner;