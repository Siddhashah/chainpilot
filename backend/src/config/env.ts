import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '8001', 10),
  jwtSecret: required('JWT_SECRET', 'dev-only-insecure-secret-change-me'),
  mongoUri: required('MONGO_URI', 'mongodb://localhost:27017/chainpilot'),
  mlServiceUrl: process.env.ML_SERVICE_URL ?? 'http://localhost:8000',
  corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:5173').split(','),
};

export const isTest = env.nodeEnv === 'test';
