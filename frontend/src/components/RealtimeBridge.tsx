import { useEffect } from 'react';
import { useAuth } from '../auth/useAuth';
import { connectRealtime } from '../realtime';

export function RealtimeBridge() {
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return undefined;
    return connectRealtime(token, (event) => {
      window.dispatchEvent(new CustomEvent(`camtel:${event.type}`, { detail: event.payload }));
    });
  }, [token]);

  return null;
}
