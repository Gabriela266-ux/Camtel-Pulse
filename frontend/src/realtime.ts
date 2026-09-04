import { io, type Socket } from 'socket.io-client';

export type RealtimeEvent = {
  type: 'dashboard_updated' | 'sale_created' | 'stock_updated' | string;
  payload?: unknown;
};

let socket: Socket | null = null;

export function connectRealtime(token: string, onEvent: (event: RealtimeEvent) => void): () => void {
  socket = io(import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : window.location.origin, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });
  socket.onAny((type, payload) => onEvent({ type, payload }));
  return () => {
    socket?.disconnect();
    socket = null;
  };
}
