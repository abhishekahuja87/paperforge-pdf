import React, { useEffect, useRef } from 'react';
import { CARD_H, CARD_W, drawCard, type CardData } from '../../../lib/cards/cardRender';
import type { CardTemplateSpec } from '../../../lib/cards/cardTemplates';

/** Small preview of one template, drawn from the same details as the big card. */
export const CardThumb: React.FC<{ spec: CardTemplateSpec; data: CardData; accent: string }> = ({ spec, data, accent }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.width = 420;
    canvas.height = 240;
    ctx.save();
    ctx.scale(420 / CARD_W, 240 / CARD_H);
    drawCard(ctx, spec, data, accent, null);
    ctx.restore();
  }, [spec, data, accent]);
  return <canvas ref={ref} aria-hidden="true" className="block h-auto w-full rounded border border-slate-200" style={{ aspectRatio: `${CARD_W} / ${CARD_H}` }} />;
};
