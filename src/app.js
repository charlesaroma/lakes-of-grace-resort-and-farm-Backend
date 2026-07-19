import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import leadRoutes from './features/crm/leads/lead.routes.js';
import authRoutes from './features/auth/auth.routes.js';
import userRoutes from './features/users/user.routes.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// Zod handles NoSQL injection prevention via strict schema validation.
// Removed express-mongo-sanitize as it crashes Express 5 by trying to mutate read-only req.query.

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/crm/leads', leadRoutes);

app.get('/', (req, res) => res.json({ name: 'Lakes of Grace API', version: '1.0.0', health: '/health' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

export default app;
