import http from 'node:http';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';

const server = http.createServer(app);

const allowedOrigins = env.FRONTEND_URL.split(',').map(s => s.trim());
const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true },
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

const start = async () => {
  await connectDB();
  server.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
};

start();
