import dotenv from 'dotenv';
// Load environment variables before importing other local files
dotenv.config();

import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { connectDB } from './config/db';
import assignmentRouter from './routes/assignmentRoutes';
import { initWorker } from './workers/generationWorker';

const app = express();
const PORT = process.env.PORT || 5001;

// CORS setup
app.use(
  cors({
    origin: true,
    credentials: true
  })
);

app.use(express.json());

// Routes
app.use('/api/assignments', assignmentRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'vedaai-backend' });
});

// Create HTTP Server
const server = http.createServer(app);

// Bind Socket.io
const io = new SocketIOServer(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket room management
io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);

  // Client subscribes to updates for a specific generation job
  socket.on('subscribe:job', (jobId: string) => {
    console.log(`Socket ${socket.id} subscribed to job: ${jobId}`);
    socket.join(jobId);
  });

  // Client unsubscribes
  socket.on('unsubscribe:job', (jobId: string) => {
    console.log(`Socket ${socket.id} unsubscribed from job: ${jobId}`);
    socket.leave(jobId);
  });

  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

// Helper function to send progress/completion updates to clients subscribed to a jobId room
export const sendSocketUpdate = (jobId: string, event: string, data: any) => {
  if (io) {
    console.log(`Broadcasting socket update to room "${jobId}" - event: "${event}"`);
    io.to(jobId).emit(event, data);
  } else {
    console.warn('Socket.io server not initialized; skipped sending update.');
  }
};

// Start Databases and Workers
const startServer = async () => {
  // Connect MongoDB
  await connectDB();

  // Initialize background worker
  initWorker();
  console.log('BullMQ Background generation worker initialized');

  server.listen(PORT, () => {
    console.log(`VedaAI Backend Server running on port ${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start VedaAI Backend:', err);
  process.exit(1);
});
