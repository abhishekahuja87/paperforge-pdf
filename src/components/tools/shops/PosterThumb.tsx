import React, { useEffect, useRef } from 'react';
import { findPosterTheme } from '../../../config/posterThemes';
import { POSTER_FORMATS, type FormatId } from '../../../lib/poster/layout';
import { renderPoster, type PosterInput } from '../../../lib/poster/render';

/** Small preview of one design drawn with the visitor's own details. `ready` changes when fonts finish loading, to draw again. */
export const PosterThumb: React.FC<{ themeId: string; format: FormatId; input: PosterInput; ready?: string; width?: number; className?: string }> = ({ themeId, format, input, ready, width = 180, className = 'h-auto w-full rounded' }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const f = POSTER_FORMATS[format];
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const scale = width / f.w;
    canvas.width = width;
    canvas.height = Math.round(f.h * scale);
    ctx.save();
    ctx.scale(scale, scale);
    renderPoster(ctx, findPosterTheme(themeId), f, input, input.products.length);
    ctx.restore();
  }, [themeId, f, input, ready, width]);
  return <canvas ref={ref} className={className} />;
};
