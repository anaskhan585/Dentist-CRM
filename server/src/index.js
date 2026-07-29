import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { env } from './config/env.js';

async function bootstrap() {
  await connectDatabase();

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`[api] ${env.nodeEnv} server listening on http://localhost:${env.port}`);
  });

  const shutdown = async (signal) => {
    console.log(`\n[api] ${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => {
    console.error('[api] unhandled rejection:', reason);
  });
}

bootstrap().catch((error) => {
  console.error('[api] failed to start:', error.message);
  process.exit(1);
});
