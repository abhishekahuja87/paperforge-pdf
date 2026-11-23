/** Two photos per exercise fade into each other, like the Exercise Library. Still start photo when the device asks for reduced motion. */
const TWO_CSS = `
.mdu-wk-b { animation: mdu-wk-fade 3s ease-in-out infinite; }
@keyframes mdu-wk-fade { 0%, 30% { opacity: 0; } 50%, 80% { opacity: 1; } 100% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .mdu-wk-b { animation: none; opacity: 0; } }
`;

/**
 * Yoga poses have four pictures that play start, a third, two thirds, hold, and back again.
 * Each picture sits on top of the one before it and fades in, then out in the opposite order.
 */
export const MOTION_CSS = `
.mdu-y1 { animation: mdu-y1 6s ease-in-out infinite; }
.mdu-y2 { animation: mdu-y2 6s ease-in-out infinite; }
.mdu-y3 { animation: mdu-y3 6s ease-in-out infinite; }
@keyframes mdu-y1 { 0% { opacity: 0; } 12%, 88% { opacity: 1; } 100% { opacity: 0; } }
@keyframes mdu-y2 { 0%, 12% { opacity: 0; } 24%, 76% { opacity: 1; } 88%, 100% { opacity: 0; } }
@keyframes mdu-y3 { 0%, 24% { opacity: 0; } 36%, 64% { opacity: 1; } 76%, 100% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .mdu-y1, .mdu-y2, .mdu-y3 { animation: none; opacity: 0; } }
`;

/** Everything a page needs to play exercise pictures. */
export const FLIP_CSS = TWO_CSS + MOTION_CSS;
