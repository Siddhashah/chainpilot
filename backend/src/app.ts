import express, { type Express } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env, isTest } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import productsRoutes from './routes/products.routes.js';
import materialsRoutes from './routes/materials.routes.js';
import usageRoutes from './routes/usage.routes.js';
import predictionsRoutes from './routes/predictions.routes.js';
import calendarRoutes from './routes/calendar.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: env.corsAllowedOrigins, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  if (!isTest) app.use(morgan('dev'));

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/products', productsRoutes);
  app.use('/api/materials', materialsRoutes);
  app.use('/api/usage', usageRoutes);
  app.use('/api/predictions', predictionsRoutes);
  app.use('/api/calendar', calendarRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
