import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Kept apart from vite.config.ts so tests do not load the OCR asset plugin or Tailwind.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
    css: false,
    testTimeout: 30_000,
  },
});
