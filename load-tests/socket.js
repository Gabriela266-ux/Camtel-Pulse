import ws from 'k6/ws';
import { check } from 'k6';

export const options = {
  scenarios: {
    sockets: {
      executor: 'constant-vus',
      vus: Number(__ENV.VUS || 5000),
      duration: __ENV.DURATION || '60s',
    },
  },
};

export default function () {
  const url = __ENV.WS_URL || 'ws://localhost:8080/socket.io/?EIO=4&transport=websocket';
  const response = ws.connect(url, {}, (socket) => {
    socket.on('open', () => socket.setTimeout(() => socket.close(), 55_000));
  });
  check(response, { 'websocket handshake accepted': (result) => result && result.status === 101 });
}