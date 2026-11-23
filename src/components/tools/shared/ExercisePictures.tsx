import React from 'react';
import { framesOf, imageUrl } from '../../../lib/fitness/exercises';

/**
 * The moving pictures of one exercise, stacked inside a wrapper that is relative and has a fixed shape.
 * Exercises have two pictures that fade into each other; yoga poses have four that play start, middle, middle, hold and back.
 * The page that uses this must also include FLIP_CSS and MOTION_CSS from flipCss.ts.
 */
export const ExercisePictures: React.FC<{ id: string; alt?: string; lazy?: boolean; twoClass?: string }> = ({ id, alt = '', lazy = false, twoClass = 'mdu-wk-b' }) => {
  const loading = lazy ? 'lazy' : undefined;
  const base = 'absolute inset-0 h-full w-full object-cover';
  if (framesOf(id) >= 4) {
    // 0 is the start and 1 the hold; 2 and 3 are the in-between pictures
    const order = [0, 2, 3, 1] as const;
    return (
      <>
        {order.map((frame, layer) => (
          <img key={frame} src={imageUrl(id, frame)} alt={layer === 0 ? alt : ''} aria-hidden={layer === 0 ? undefined : true} loading={loading} decoding="async" className={`${base}${layer === 0 ? '' : ` mdu-y${layer}`}`} />
        ))}
      </>
    );
  }
  return (
    <>
      <img src={imageUrl(id, 0)} alt={alt} loading={loading} decoding="async" className={base} />
      <img src={imageUrl(id, 1)} alt="" aria-hidden="true" loading={loading} decoding="async" className={`${base} ${twoClass}`} />
    </>
  );
};
