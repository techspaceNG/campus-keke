import { createApp } from './app';
import { CONFIG } from './config';
import { prisma } from './utils/prisma';

const app = createApp();

const server = app.listen(CONFIG.PORT, () => {
  console.log(`=========================================`);
  console.log(` Campus Keke Backend API`);
  console.log(` Environment: ${CONFIG.NODE_ENV}`);
  console.log(` Server running on http://localhost:${CONFIG.PORT}`);
  console.log(` Health check: http://localhost:${CONFIG.PORT}/api/v1/health`);
  console.log(`=========================================`);
});

// Graceful Shutdown
const shutdown = async () => {
  console.log('Shutting down server gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Database connection closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export { app, server };
export default app;
