import { defineConfig, devices } from '@playwright/test';

// Dedicated ports so e2e tests never collide with `npm run dev` (5173 / 3001).
const API_PORT = 3101;
const WEB_PORT = 5174;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false, // the API uses a single in-memory store
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npx tsx server/src/index.ts',
      url: `http://localhost:${API_PORT}/api/health`,
      env: { PORT: String(API_PORT), E2E: '1' },
      reuseExistingServer: false,
    },
    {
      command: `npx vite --port ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}`,
      env: { API_PORT: String(API_PORT) },
      reuseExistingServer: false,
    },
  ],
});
