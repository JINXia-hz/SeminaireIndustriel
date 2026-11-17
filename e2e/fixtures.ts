import { test as base, expect } from '@playwright/test';

export type SeedTask = { title: string; status: 'todo' | 'doing' | 'done' };
export type BoardState = { tasks: SeedTask[] };

/** Port of the API started by playwright.config.ts (E2E=1 enables the test routes). */
export const API_URL = 'http://localhost:3101';

/**
 * Every test starts from a known board state (empty by default).
 * Override it per file or per describe block with:
 *   test.use({ boardState: { tasks: [{ title: 'A', status: 'todo' }] } });
 * NB: the option is an object on purpose — Playwright interprets a bare array
 * passed to test.use() as a [value, options] fixture tuple.
 */
export const test = base.extend<{ boardState: BoardState }>({
  boardState: [{ tasks: [] }, { option: true }],
  page: async ({ page, request, boardState }, use) => {
    const res = await request.post(`${API_URL}/api/test/reset`, { data: boardState });
    expect(res.ok()).toBeTruthy();
    await use(page);
  },
});

export { expect };
