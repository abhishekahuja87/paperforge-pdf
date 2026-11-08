import React, { useEffect, useRef } from 'react';
import { ADS_CONFIG } from '../../config/ads';

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

interface AdBannerProps {
  slot: string;
  format?: 'auto' | 'horizontal' | 'rectangle';
  responsive?: boolean;
  className?: string;
}

/** Asks AdSense to fill the unit once, and never twice for the same element. */
function requestAd(element: HTMLElement | null): void {
  if (!element || element.dataset.adRequested === 'true') return;
  element.dataset.adRequested = 'true';
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch (err) {
    console.error('AdSense push error:', err);
  }
}

export const AdBanner: React.FC<AdBannerProps> = ({
  slot,
  format = 'auto',
  responsive = true,
  className = '',
}) => {
  const adRef = useRef<HTMLModElement | null>(null);

  useEffect(() => {
    if (ADS_CONFIG.isDevelopment) return undefined;
    const element = adRef.current;
    if (!element) return undefined;

    // Load the ad shortly before it scrolls into view. This keeps the first screen fast and
    // means ads are only requested when a visitor can actually see them.
    if (typeof IntersectionObserver === 'undefined') {
      requestAd(element);
      return undefined;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        requestAd(element);
      }
    }, { rootMargin: '300px 0px' });
    observer.observe(element);
    return () => observer.disconnect();
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
    <div className={`w-full min-w-0 min-h-[90px] flex justify-center items-center ${className}`}>
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
