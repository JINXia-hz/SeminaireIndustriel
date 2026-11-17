import { expect, test } from './fixtures.ts';

test.describe('Board', () => {
  test.use({
    boardState: {
      tasks: [
        { title: 'Already doing', status: 'doing' },
        { title: 'Already done', status: 'done' },
      ],
    },
  });

  test('shows the three columns with their tasks', async ({ page }) => {
    await page.goto('/');

    for (const name of ['To do', 'Doing', 'Done']) {
      await expect(
        page.getByRole('heading', { level: 2, name: new RegExp(`^${name}`) }),
      ).toBeVisible();
    }

    const doing = page.getByRole('region', { name: /^Doing/ });
    await expect(doing.getByRole('article', { name: 'Already doing' })).toBeVisible();
  });

  test('creates a task in the "To do" column', async ({ page }) => {
    await page.goto('/');

    await page.getByLabel('Task title').fill('Write the tester agent');
    await page.getByRole('button', { name: 'Add task' }).click();

    const todo = page.getByRole('region', { name: /^To do/ });
    await expect(todo.getByRole('article', { name: 'Write the tester agent' })).toBeVisible();
    await expect(page.getByLabel('Task title')).toHaveValue('');
  });

  test('shows a validation error for a blank title', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Add task' }).click();

    await expect(page.getByRole('alert')).toContainText('Title is required');
  });
});
