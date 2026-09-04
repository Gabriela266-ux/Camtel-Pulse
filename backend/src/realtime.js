'use strict';

const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const redis = require('./config/redis');

async function createRealtimeServer(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true },
    transports: ['websocket', 'polling'],
    pingInterval: 25_000,
    pingTimeout: 20_000,
  });

  let subscriber;
  if (redis.status().enabled) {
    const publisher = redis.duplicateClient();
    subscriber = redis.duplicateClient();
    await Promise.all([publisher.connect(), subscriber.connect()]);
    io.adapter(createAdapter(publisher, subscriber));
    await subscriber.subscribe('camtel:events');
    subscriber.on('message', (_channel, raw) => {
      try {
        const event = JSON.parse(raw);
        io.emit(event.type || 'dashboard_updated', event.payload || {});
      } catch (error) {
        console.error(JSON.stringify({ level: 'error', event: 'realtime_message_invalid', message: error.message }));
      }
    });
  }

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.replace(/^Bearer\s+/u, '');
      if (!token) return next(new Error('Token manquant'));
      socket.user = jwt.verify(token, process.env.JWT_SECRET || 'camtel-secret');
      if (!(await redis.isSessionActive(socket.user.jti))) return next(new Error('Session expirée ou révoquée'));
      return next();
    } catch {
      return next(new Error('Token invalide'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.user.sub}`);
    if (socket.user.centerId) socket.join(`centre:${socket.user.centerId}`);
  });

  return { io, subscriber };
}

module.exports = { createRealtimeServer };