import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import { SerialParser } from './parser';
import { Emitter } from './emitter';
import { MockHardware } from './mock';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
const mockMode = process.env.MOCK_MODE === 'true';

app.use(express.json());

const parser = new SerialParser();
const emitter = new Emitter(backendUrl);
let latestData: Record<string, unknown> = {};
let isConnected = false;

const handleData = (line: string) => {
  const readings = parser.parse(line);
  readings.forEach(r => {
    latestData[r.type!] = r;
    emitter.forwardReading(r);
  });
};

const mock = new MockHardware(handleData);

if (mockMode) {
  console.log('[Bridge] MOCK_MODE=true — using simulated hardware data');
  mock.start();
  isConnected = false;
} else {
  // Only import native serial port when not in mock mode
  import('serialport').then(({ SerialPort }) => {
    import('@serialport/parser-readline').then(({ ReadlineParser }) => {
      const mainPortPath = process.env.SERIAL_PORT_MAIN || '/dev/ttyUSB0';
      try {
        const serialMain = new SerialPort({ path: mainPortPath, baudRate: 9600 });
        const lineParser = serialMain.pipe(new ReadlineParser({ delimiter: '\r\n' }));
        lineParser.on('data', handleData);
        serialMain.on('open', () => {
          isConnected = true;
          console.log(`[Bridge] Connected to Main Serial at ${mainPortPath}`);
        });
        serialMain.on('error', (err: Error) => {
          console.error('[Bridge] Serial Error:', err.message);
          mock.start();
        });
      } catch (err) {
        console.warn('[Bridge] Main Serial Port not found. Switching to Mock mode.');
        mock.start();
      }
    });
  }).catch(() => {
    console.warn('[Bridge] SerialPort native module unavailable. Switching to Mock mode.');
    mock.start();
  });
}

// --- REST Routes ---

app.get('/status', (_req, res) => {
  res.json({
    status: 'online',
    hardware: isConnected ? 'connected' : 'mock',
    backend: backendUrl
  });
});

app.get('/latest', (_req, res) => {
  res.json(latestData);
});

app.get('/history', async (req, res) => {
  try {
    const response = await axios.get(`${backendUrl}/sensors/history`, { params: req.query });
    res.json(response.data);
  } catch {
    res.status(500).json({ error: 'Backend unreachable' });
  }
});

app.post('/feed', async (req, res) => {
  try {
    const response = await axios.post(`${backendUrl}/actuators/feed`, req.body);
    res.json(response.data);
  } catch {
    res.status(500).json({ error: 'Backend unreachable' });
  }
});

app.post('/actuate', async (req, res) => {
  console.log(`[Bridge] Actuate command: ${req.body?.type} → ${req.body?.state}`);
  res.json({ success: true, command: req.body });
});

app.post('/schedule', async (req, res) => {
  try {
    const response = await axios.post(`${backendUrl}/cron/schedule`, req.body);
    res.json(response.data);
  } catch {
    res.status(500).json({ error: 'Backend unreachable' });
  }
});

app.get('/ports', async (_req, res) => {
  if (mockMode) return res.json([]);
  try {
    const { SerialPort } = await import('serialport');
    const ports = await SerialPort.list();
    res.json(ports);
  } catch {
    res.json([]);
  }
});

app.listen(port, () => {
  console.log(`[Bridge] Serial Bridge running on port ${port} (mode: ${mockMode ? 'MOCK' : 'HARDWARE'})`);
});
