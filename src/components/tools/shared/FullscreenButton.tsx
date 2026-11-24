import React, { useEffect, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { ghostButton } from './toolStyles';

/** Shows the element in fullscreen, for a projector or a TV. Hidden where the browser cannot do it, such as an iPhone. */
export const FullscreenButton: React.FC<{ target: React.RefObject<HTMLElement | null> }> = ({ target }) => {
  const [on, setOn] = useState(false);
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    setSupported(typeof document !== 'undefined' && !!document.fullscreenEnabled);
    const change = () => setOn(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', change);
    return () => document.removeEventListener('fullscreenchange', change);
  }, []);
  if (!supported) return null;
  const toggle = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await target.current?.requestFullscreen();
    } catch { /* the browser refused, nothing to do */ }
  };
  return <button type="button" onClick={() => void toggle()} className={ghostButton}>{on ? <Minimize2 className="h-4 w-4" aria-hidden="true" /> : <Maximize2 className="h-4 w-4" aria-hidden="true" />}{on ? 'Leave full screen' : 'Show on a big screen'}</button>;
};
