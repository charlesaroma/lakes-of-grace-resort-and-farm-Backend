import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
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

app.use('/api/media', publicRoutes);

app.get('/', (req, res) => res.json({ name: 'Lakes of Grace API', version: '1.0.0', health: '/health' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

export default app;
