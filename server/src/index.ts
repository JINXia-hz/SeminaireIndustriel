import { createApp } from './app.ts';

const port = Number(process.env.PORT ?? 3001);
const app = createApp({ enableTestRoutes: process.env.E2E === '1' });

app.listen(port, () => {
  console.info(`API listening on http://localhost:${port}`);
});
