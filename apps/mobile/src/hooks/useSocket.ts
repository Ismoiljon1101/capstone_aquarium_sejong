import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const WS_URL = "http://localhost:3001";

/**
 * React Native Socket Hook (Mobile Parity)
 */
export function useSocket() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const socket = io(WS_URL);
    socket.on('telemetry', setData);
    return () => socket.disconnect();
  }, []);

  return { telemetry: data };
}
