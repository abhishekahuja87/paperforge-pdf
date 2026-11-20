import React, { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/** True on phones and tablets (touch is the main input), where a camera button is useful. Always false on the server. */
export function useTouchDevice(): boolean {
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    try {
      const query = window.matchMedia('(pointer: coarse)');
      setTouch(query.matches);
      const update = (event: MediaQueryListEvent) => setTouch(event.matches);
      query.addEventListener('change', update);
      return () => query.removeEventListener('change', update);
    } catch { return undefined; }
  }, []);
  return touch;
}

interface CameraButtonProps {
  /** Receives the one photo the phone's camera app returns. */
  onPhoto: (file: File) => void;
  /** Back camera for documents and forms (default); front camera for selfies. */
  facing?: 'environment' | 'user';
  disabled?: boolean;
  className?: string;
}

const DEFAULT_CLASS = 'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50';

/** "Take photo" button that opens the phone camera in one tap. Hidden on computers; the photo stays on the device. */
export const CameraButton: React.FC<CameraButtonProps> = ({ onPhoto, facing = 'environment', disabled = false, className = DEFAULT_CLASS }) => {
  const { t, i18n } = useTranslation();
  const touch = useTouchDevice();
  if (!touch) return null;
  return (
    <label className={`${className} ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
      <Camera className="h-4 w-4" aria-hidden="true" />
      <span lang={i18n.language}>{t('dropZone.takePhoto')}</span>
      <input
        type="file"
        accept="image/*"
        capture={facing}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) onPhoto(file);
        }}
      />
    </label>
  );
};
