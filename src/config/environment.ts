import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  mongodbUri: string;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  setu: {
    baseUrl: string;
    clientId: string;
    clientSecret: string;
    productInstanceId: string;
    redirectUrl: string;
    webhookSecret: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

export const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/setu-kyc-service',
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  setu: {
    baseUrl: process.env.SETU_BASE_URL || 'https://dg-sandbox.setu.co',
    clientId: process.env.SETU_CLIENT_ID || '',
    clientSecret: process.env.SETU_CLIENT_SECRET || '',
    productInstanceId: process.env.SETU_PRODUCT_INSTANCE_ID || '',
    redirectUrl: process.env.SETU_REDIRECT_URL || 'http://localhost:3000/api/kyc/callback',
    webhookSecret: process.env.SETU_WEBHOOK_SECRET || '',
  },
  rateLimit: {
    windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};
