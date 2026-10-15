import { createApp } from './app';
import { CONFIG } from './config';
import { prisma } from './utils/prisma';

const app = createApp();

let server: any;

// Only start a listening socket in non-serverless environments (local dev or standard servers)
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  server = app.listen(CONFIG.PORT, () => {
    console.log(`=========================================`);
    console.log(` Campus Keke Backend API`);
    console.log(` Environment: ${CONFIG.NODE_ENV}`);
    console.log(` Server running on http://localhost:${CONFIG.PORT}`);
    console.log(` Health check: http://localhost:${CONFIG.PORT}/api/v1/health`);
    console.log(`=========================================`);
  });
}

// Graceful Shutdown
const shutdown = async () => {
  console.log('Shutting down server gracefully...');
  if (server && server.close) {
    server.close(async () => {
      await prisma.$disconnect();
      console.log('Database connection closed.');
      process.exit(0);
    });
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Support both ES module and CommonJS default exports for Vercel Express bridge
module.exports = app;
module.exports.default = app;
module.exports.app = app;
module.exports.server = server;

export { app, server };
export default app;
