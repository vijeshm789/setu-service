import app from './app';
import { connectDatabase } from './config/database';
import { config } from './config/environment';
import { Logger } from './utils/logger';

const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Start server
    const server = app.listen(config.port, () => {
      Logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
      Logger.info(`API Base URL: http://localhost:${config.port}/api`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      Logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        Logger.info('HTTP server closed');

        try {
          const { disconnectDatabase } = require('./config/database');
          await disconnectDatabase();
          Logger.info('Database connection closed');
          process.exit(0);
        } catch (error) {
          Logger.error('Error during shutdown', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        Logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    Logger.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer();
