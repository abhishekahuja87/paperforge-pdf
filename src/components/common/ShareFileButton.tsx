import React, { useState } from 'react';
import { Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { canShareFiles, shareFile } from '../../lib/share/shareFile';

interface ShareFileButtonProps {
  /** Makes the file to share. It is called when the button is tapped, so a tool can build the file only when it is wanted. */
  getFile: () => Promise<File | null> | File | null;
  /** Shown by some apps as the subject. Defaults to the file name. */
  title?: string;
  /** Replaces the default look. Use `shareFileButtonClass` for the usual one. */
  className?: string;
  /** Replaces the word "Share", for example "Share picture". */
  label?: string;
}

/** The look of every Share button, matching the Save button next to it. */
export const shareFileButtonClass = 'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-orange-300 bg-white px-3 py-2 text-xs font-bold text-orange-800 transition hover:bg-orange-50 disabled:cursor-wait disabled:opacity-60';

/** The larger Share button used beside the big Download buttons of the makers. */
export const shareFileLargeClass = 'inline-flex min-h-11 items-center gap-2 rounded-xl border border-orange-300 bg-white px-4 py-2 text-sm font-semibold text-orange-800 transition hover:bg-orange-50 disabled:cursor-wait disabled:opacity-60';

/**
 * "Share" for a finished file: opens the phone's share sheet so the file goes straight to WhatsApp or another app.
 * It is not drawn at all in browsers that cannot share files, where the Save button is the way to get the file.
 */
export const ShareFileButton: React.FC<ShareFileButtonProps> = ({ getFile, title, className = shareFileButtonClass, label }) => {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!canShareFiles()) return null;

  const share = async () => {
    setBusy(true);
    setFailed(false);
    try {
      const file = await getFile();
      if (!file) return;
      const outcome = await shareFile(file, title);
      setFailed(outcome === 'failed' || outcome === 'unsupported');
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" onClick={() => void share()} disabled={busy} className={className}>
        <Share2 className="h-3.5 w-3.5" aria-hidden="true" />{label ?? t('shareFile.button', { defaultValue: 'Share' })}
      </button>
      {failed && <span role="status" className="basis-full text-[11px] text-red-700">{t('shareFile.failed', { defaultValue: 'Sharing did not open. Use Save instead.' })}</span>}
    </>
  );
};

export default ShareFileButton;
