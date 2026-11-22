/** Two photos per exercise fade into each other, like the Exercise Library. Still start photo when the device asks for reduced motion. */
export const FLIP_CSS = `
.mdu-wk-b { animation: mdu-wk-fade 3s ease-in-out infinite; }
@keyframes mdu-wk-fade { 0%, 30% { opacity: 0; } 50%, 80% { opacity: 1; } 100% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .mdu-wk-b { animation: none; opacity: 0; } }
`;
