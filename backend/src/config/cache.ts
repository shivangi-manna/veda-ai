import Redis, { RedisOptions } from 'ioredis';
import logger from './logger';

const cacheUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const isSecure = cacheUrl.startsWith('rediss://') || cacheUrl.includes('upstash.io');

const connectionOptions: RedisOptions = {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: true,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    logger.warn(`Cache server connection lost. Retrying in ${delay}ms...`);
    return delay;
  },
};

if (isSecure) {
  connectionOptions.tls = {};
}

// Configure cache client with auto-reconnection and retry logic
export const cacheConnection = new Redis(cacheUrl, connectionOptions);

cacheConnection.on('connect', () => {
  logger.info('Cache client connected');
});

cacheConnection.on('error', (err) => {
  logger.error(`Cache client connection error: ${err}`);
});

export default cacheConnection;
