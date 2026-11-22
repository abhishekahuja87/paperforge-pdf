import React, { useState } from 'react';
import { PictureButton } from '../shared/PictureButton';

/** An optional logo or picture shown small in the corner of the big screen. */
export const LogoField: React.FC<{ logo: string; onChange: (logo: string) => void; label?: string }> = ({ logo, onChange, label = 'Logo or picture in the corner (optional)' }) => {
  const [error, setError] = useState('');
  return (
    <div className="space-y-1">
      <p className="text-xs font-bold text-stone-700">{label}</p>
      <PictureButton image={logo || undefined} label="Add a logo or picture" onPick={(image) => onChange(image ?? '')} onError={setError} />
      {error && <p role="alert" className="text-xs font-semibold text-red-700">{error}</p>}
    </div>
  );
};
