import http from 'http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { registerSockets } from './sockets/index.js';

async function bootstrap() {
  await connectDB();

  const app = createApp();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: [env.clientOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    },
  });

  app.set('io', io);
  registerSockets(io);

  server.listen(env.port, () => {
    console.log(`[SyncForge Server] Listening on port ${env.port} (${env.nodeEnv})`);
    console.log(`[SyncForge Health] http://localhost:${env.port}/health`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n[SyncForge Server] Received ${signal}, closing gracefully...`);
    server.close(async () => {
      await disconnectDB();
      console.log('[SyncForge Server] Closed HTTP server and MongoDB connection.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('[SyncForge Fatal Error during bootstrap]', err);
  process.exit(1);
});
