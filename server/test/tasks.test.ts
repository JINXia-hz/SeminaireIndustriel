import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.ts';
import { TaskStore } from '../src/store.ts';

function setup() {
  const store = new TaskStore([{ title: 'Existing task', status: 'doing' }]);
  return { app: createApp({ store }), store };
}

describe('GET /api/tasks', () => {
  it('returns all tasks ordered by creation date', async () => {
    const { app } = setup();
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ title: 'Existing task', status: 'doing' });
  });
});

describe('POST /api/tasks', () => {
  it('creates a task in the "todo" column', async () => {
    const { app, store } = setup();
    const res = await request(app).post('/api/tasks').send({ title: '  Write tests  ' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: 'Write tests', status: 'todo' });
    expect(store.list()).toHaveLength(2);
  });

  it.each([
    ['missing title', {}],
    ['blank title', { title: '   ' }],
    ['title too long', { title: 'x'.repeat(121) }],
  ])('rejects %s with 400', async (_label, body) => {
    const { app } = setup();
    const res = await request(app).post('/api/tasks').send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('ValidationError');
  });
});

describe('test routes', () => {
  it('are disabled by default', async () => {
    const { app } = setup();
    const res = await request(app).post('/api/test/reset');
    expect(res.status).toBe(404);
  });
});
