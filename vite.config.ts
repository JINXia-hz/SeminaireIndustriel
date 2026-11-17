import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const API_PORT = Number(process.env.API_PORT ?? 3001);

export default defineConfig({
  root: 'web',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': `http://localhost:${API_PORT}`,
    },
  },
  build: {
    outDir: '../dist/web',
    emptyOutDir: true,
  },
  test: {
    root: '.',
    include: ['server/**/*.test.ts', 'web/**/*.test.{ts,tsx}'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['server/src/**', 'web/src/**'],
      reporter: ['text', 'json-summary'],
    },
  },
});
