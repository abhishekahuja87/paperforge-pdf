import React, { useEffect, useRef } from 'react';
import { palOf, type Design, type InviteSize, type Pal } from '../../../lib/invites/data';
import { renderInvite, type InviteContent, type InvitePhoto } from '../../../lib/invites/render';

/** A small picture of one design, drawn with the visitor's own words. `ready` changes when fonts finish loading, to draw again. */
export const InviteThumb: React.FC<{ design: Design; size: InviteSize; content: InviteContent; pal: Pal | null; photo: InvitePhoto | null; ready: string; width?: number }> = ({ design, size, content, pal, photo, ready, width = 200 }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current, ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(width * ratio * (size.h / size.w));
    renderInvite(ctx, canvas.width, canvas.height, content, { design, pal: pal ?? palOf(design.pal), headFont: design.headFont, bodyFont: design.bodyFont, scale: 1, decorations: true, border: true, photo, photoShape: design.photo });
  }, [design, size, content, pal, photo, ready, width]);
  return <canvas ref={ref} className="h-auto w-full rounded shadow-sm" />;
};
