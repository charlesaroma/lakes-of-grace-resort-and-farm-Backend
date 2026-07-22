import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later' },
});
import leadRoutes from './features/crm/leads/lead.routes.js';
import bookingRoutes from './features/crm/bookings/booking.routes.js';
import cottageRoutes from './features/crm/cottages/cottage.routes.js';
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

const app = express();

app.use(helmet());
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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/crm/leads', leadRoutes);
app.use('/api/crm/bookings', bookingRoutes);
app.use('/api/crm/cottages', cottageRoutes);
app.use('/api/crm/stock', stockRoutes);
app.use('/api/crm/menu', menuRoutes);
app.use('/api/crm/guests', guestRoutes);
app.use('/api/crm/inquiries', inquiryRoutes);
app.use('/api/crm/media', mediaRoutes);
app.use('/api/crm/audit-logs', auditLogRoutes);
app.use('/api/crm/dashboard', dashboardRoutes);

app.use('/api/media', publicRoutes);

app.get('/', (req, res) => res.json({ name: 'Lakes of Grace API', version: '1.0.0', health: '/health' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  next(err);
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error',
  });
});

export default app;
