import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  steam: {
    username: process.env.STEAM_USERNAME || '',
    password: process.env.STEAM_PASSWORD || '',
    apiKey: process.env.STEAM_API_KEY || '',
    enabled: !!(process.env.STEAM_USERNAME && process.env.STEAM_PASSWORD),
    rateLimitDelay: parseInt(process.env.STEAM_RATE_LIMIT_DELAY || '1500', 10),
    maxQueueSize: parseInt(process.env.STEAM_MAX_QUEUE_SIZE || '100', 10),
    requestTimeout: parseInt(process.env.STEAM_REQUEST_TIMEOUT || '10000', 10),
    queueTimeout: parseInt(process.env.STEAM_QUEUE_TIMEOUT || '30000', 10),
    enableLogging: process.env.LOG_API_REQUESTS === 'true',
  },
  api: {
    keys: (process.env.API_KEYS || '').split(',').filter(Boolean),
  },
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',').filter(Boolean),
  },
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    window: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    apiRequests: process.env.LOG_API_REQUESTS === 'true',
  },
} as const;
