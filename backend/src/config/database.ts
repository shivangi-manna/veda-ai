import mongoose from 'mongoose';
import logger from './logger';

export const initDatabase = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/assessify';

  try {
    mongoose.set('bufferCommands', false);

    mongoose.connection.on('connected', () => {
      logger.info('Database connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`Database connection error: ${err}`);
      process.exit(1);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Database disconnected');
    });

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
  } catch (error) {
    logger.error(`Failed to connect to Database: ${error}`);
    process.exit(1);
  }
};
