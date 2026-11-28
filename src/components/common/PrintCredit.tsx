import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { siteConfig } from '../../config/site';
import { Toggle } from './PanelKit';

const KEY = 'mdu.printCredit.v1';
const host = siteConfig.url.replace(/^https?:\/\/(www\.)?/, '');

/** The choice the visitor made themselves, or null when they have not chosen. It is shared by every printable tool on this device. */
function readChoice(): boolean | null {
  try { const v = window.localStorage.getItem(KEY); return v === 'on' ? true : v === 'off' ? false : null; } catch { return null; }
}

/**
 * A "Print a small credit at the bottom" switch for a printable tool, and the credit itself. The credit is a small grey line at the bottom left
 * of each printed page. It is added to the page body, so it prints whatever the tool's own print layout is, and it is never shown on screen.
 * `defaultOn` is used until the visitor chooses; their choice then applies to every printable tool on this device.
 */
export const PrintCreditToggle: React.FC<{ defaultOn?: boolean }> = ({ defaultOn = true }) => {
  const [mounted, setMounted] = useState(false);
  const [on, setOn] = useState(defaultOn);
  useEffect(() => { const choice = readChoice(); if (choice !== null) setOn(choice); setMounted(true); }, []);
  const change = (value: boolean): void => {
    setOn(value);
    try { window.localStorage.setItem(KEY, value ? 'on' : 'off'); } catch { /* storage unavailable */ }
  };
  return (
    <div className="w-full print:hidden">
      <Toggle label={`Print "Made with ${host}" at the bottom`} hint="A small grey line at the bottom left of each page. Turn it off for a clean sheet." checked={on} onChange={change} />
      {mounted && on && createPortal(
        <div className="mdu-print-credit" aria-hidden="true">
          <style>{'.mdu-print-credit{display:none}@media print{body .mdu-print-credit{display:block!important;visibility:visible!important;position:fixed;left:6mm;bottom:3mm;z-index:9999;font:7pt Arial,Helvetica,sans-serif;color:#9a9a9a}}'}</style>
          {`Made with ${host}`}
        </div>,
        document.body,
      )}
    </div>
  );
};
