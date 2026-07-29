import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env, isProd } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/error.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || env.clientOrigin.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  if (!isProd) app.use(morgan('dev'));

  app.use(
    '/api',
    rateLimit({
      windowMs: 60 * 1000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );
  app.use('/api', routes);

  // Serve the built SPA when running as a single deployment.
  if (isProd) {
    const clientDist = path.resolve(__dirname, '../../client/dist');
    app.use(express.static(clientDist, { maxAge: '1y', index: false }));
    app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
