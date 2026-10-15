import app, { server } from './src/index';

// Export for Vercel serverless / Express handler
module.exports = app;
module.exports.default = app;
module.exports.app = app;
module.exports.server = server;

export { server };
export default app;
