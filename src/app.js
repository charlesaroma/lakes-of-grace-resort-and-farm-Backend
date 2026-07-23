import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';

// ─── Constants ───

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const statusHtml = readFileSync(join(__dirname, 'views', 'status.html'), 'utf-8')
  .replace('__ENVIRONMENT__', env.NODE_ENV || 'development');

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later' },
});
// ─── Route Imports ───
import leadRoutes from './features/crm/leads/lead.routes.js';
import bookingRoutes from './features/crm/bookings/booking.routes.js';
import cottageRoutes from './features/crm/cottages/cottage.routes.js';
import roomRoutes from './features/crm/rooms/room.routes.js';
import reviewRoutes from './features/crm/reviews/review.routes.js';
import evaluationRoutes from './features/crm/evaluations/evaluation.routes.js';
import checkInRoutes from './features/crm/checkins/checkin.routes.js';
import guidelineRoutes from './features/crm/guidelines/guideline.routes.js';
import conferenceHallRoutes from './features/crm/conferenceHalls/conferenceHall.routes.js';
import notificationRoutes from './features/crm/notifications/notification.routes.js';
import stockRoutes from './features/crm/stock/stock.routes.js';
import menuRoutes from './features/crm/menu/menu.routes.js';
import guestRoutes from './features/crm/guests/guest.routes.js';
import inquiryRoutes from './features/crm/inquiries/inquiry.routes.js';
import mediaRoutes from './features/crm/media/media.routes.js';
import publicRoutes from './features/public/public.routes.js';
import auditLogRoutes from './core/audit/auditLog.routes.js';
import authRoutes from './features/auth/auth.routes.js';
import userRoutes from './features/users/user.routes.js';
import dashboardRoutes from './features/dashboard/dashboard.routes.js';

// ─── App Initialization ───
const app = express();

// ─── Middleware ───
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'img-src':    ["'self'", 'data:', 'https://ik.imagekit.io'],
      'font-src':   ["'self'", 'https://fonts.gstatic.com'],
      'style-src':  ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    },
  },
}));

const allowedOrigins = env.FRONTEND_URL.split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(cookieParser());

app.use(globalLimiter);

// Webhook route needs raw body for HMAC signature verification — must come before express.json()
app.use('/api/crm/media/webhook', (req, res, next) => {
  if (req.method === 'POST') {
    express.raw({ type: 'application/json' })(req, res, next);
  } else {
    next();
  }
});

app.use(express.json());

// Zod handles NoSQL injection prevention via strict schema validation.
// Removed express-mongo-sanitize as it crashes Express 5 by trying to mutate read-only req.query.

// ─── Routes ───
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/crm/leads', leadRoutes);
app.use('/api/crm/bookings', bookingRoutes);
app.use('/api/crm/cottages', cottageRoutes);
app.use('/api/crm/rooms', roomRoutes);
app.use('/api/crm/reviews', reviewRoutes);
app.use('/api/crm/evaluations', evaluationRoutes);
app.use('/api/crm/checkins', checkInRoutes);
app.use('/api/crm/guidelines', guidelineRoutes);
app.use('/api/crm/conference-halls', conferenceHallRoutes);
app.use('/api/crm/notifications', notificationRoutes);
app.use('/api/crm/stock', stockRoutes);
app.use('/api/crm/menu', menuRoutes);
app.use('/api/crm/guests', guestRoutes);
app.use('/api/crm/inquiries', inquiryRoutes);
app.use('/api/crm/media', mediaRoutes);
app.use('/api/crm/audit-logs', auditLogRoutes);
app.use('/api/crm/dashboard', dashboardRoutes);

app.use('/api/media', publicRoutes);

app.get('/', (req, res) => {
  res.type('html').send(statusHtml);
});
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ─── Error Handling ───
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  next(err);
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

// ─── Exports ───
export default app;
