const mongoose = require('mongoose');
const app = require('./src/app');
const { connectDB } = require('./src/config/db');
const env = require('./src/config/env');

const startServer = async () => {
  const conn = await connectDB();
  const server = app.listen(env.PORT, () => {
    console.log(`API server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });

  const shutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await conn.connection.close();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  return server;
};

startServer().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
