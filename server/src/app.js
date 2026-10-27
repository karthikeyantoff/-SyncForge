import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import boardRoutes from './routes/boards.js';
import listRoutes from './routes/lists.js';
import cardRoutes from './routes/cards.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimit.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, '../../client/dist');

export function createApp() {
  const app = express();

  if (env.nodeEnv === 'production') {
    app.set('trust proxy', 1);
  }

  // Security headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // Dynamic CORS configuration (accepts localhost and any *.vercel.app domain)
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          env.nodeEnv === 'development' ||
          origin === env.clientOrigin ||
          origin.includes('localhost') ||
          origin.includes('127.0.0.1') ||
          origin.endsWith('.vercel.app')
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Pre-flight OPTIONS handling
  app.options('*', cors());

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Serverless Database Connection Gateway (ensures cold-start connections on Vercel)
  app.use(async (_req, _res, next) => {
    try {
      if (env.nodeEnv !== 'test') {
        await connectDB();
      }
      next();
    } catch (err) {
      next(err);
    }
  });

  // Health check endpoint
  app.get(['/health', '/api/health'], (_req, res) => {
    res.json({
      status: 'ok',
      service: 'SyncForge Real-Time API',
      timestamp: new Date().toISOString(),
      platform: process.env.VERCEL ? 'Vercel Serverless' : 'Node.js Standalone',
    });
  });

  // Root welcome route for standalone backend deployments
  app.get('/', (req, res, next) => {
    if (fs.existsSync(path.join(clientDist, 'index.html')) && env.nodeEnv === 'production') {
      return res.sendFile(path.join(clientDist, 'index.html'));
    }
    res.json({
      name: 'SyncForge API Server',
      status: 'online',
      version: '1.0.0',
      health: '/health',
      author: 'Karthikeyan T',
    });
  });

  // Apply general API rate limiter
  app.use('/api', apiLimiter);

  // Mount API modules under both /api/... and root /... for maximum client compatibility
  app.use('/api/auth', authRoutes);
  app.use('/auth', authRoutes);

  app.use('/api/boards', boardRoutes);
  app.use('/boards', boardRoutes);

  app.use('/api/lists', listRoutes);
  app.use('/lists', listRoutes);

  app.use('/api/cards', cardRoutes);
  app.use('/cards', cardRoutes);

  // Serve static client bundle if client/dist exists (unified deployment)
  if (env.nodeEnv === 'production' && fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path === '/health') return next();
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  // 404 & Centralized Error Handler
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
