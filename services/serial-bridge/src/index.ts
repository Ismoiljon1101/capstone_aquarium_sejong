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

app.use(express.json());

const parser = new SerialParser();
const emitter = new Emitter(backendUrl);
let latestData: any = {};
let isConnected = false;

const handleData = (line: string) => {
  const readings = parser.parse(line);
  readings.forEach(r => {
    latestData[r.type!] = r;
    emitter.forwardReading(r);
  });
};

// --- Serial Connection Logic ---
const mainPortPath = process.env.SERIAL_PORT_MAIN || '/dev/ttyUSB0';

async function startSerial() {
  const isMockAlways = process.env.MOCK_MODE === 'true';
  const mock = new MockHardware(handleData);

  if (isMockAlways) {
    console.log('[Bridge] Forced Mock Mode enabled via .env');
    mock.start();
    return;
  }

  try {
    const { SerialPort } = await import('serialport');
    const { ReadlineParser } = await import('@serialport/parser-readline');

    const serialMain = new SerialPort({ path: mainPortPath, baudRate: 9600 });
    const lineParser = serialMain.pipe(new ReadlineParser({ delimiter: '\r\n' }));
    
    lineParser.on('data', handleData);
    serialMain.on('open', () => {
      isConnected = true;
      console.log(`[Bridge] Connected to Main Serial at ${mainPortPath}`);
    });

    serialMain.on('error', (err) => {
      console.error('[Bridge] Serial Error:', err.message);
      console.warn('[Bridge] Falling back to Mock mode...');
      mock.start();
    });
  } catch (err) {
    console.warn('[Bridge] Serial bindings not found or port unavailable. Switching to Mock mode.');
    mock.start();
  }
}

startSerial();

// --- REST Routes (Legacy Dashboard Compatibility) ---

app.get('/', (req, res) => {
  res.send('<h1>Fishlinic Serial Bridge</h1><p>Status: Running</p><p>Use <a href="/status">/status</a> for health check.</p>');
});

app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    hardware: isConnected ? 'connected' : 'mock',
    backend: backendUrl
  });
});

app.get('/latest', (req, res) => {
  res.json(latestData);
});

// Forwarding routes to NestJS
app.get('/history', async (req, res) => {
  try {
    const response = await axios.get(`${backendUrl}/sensors/history`, { params: req.query });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Backend unreachable' });
  }
});

app.post('/feed', async (req, res) => {
  try {
    const response = await axios.post(`${backendUrl}/actuators/feed`, req.body);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Backend unreachable' });
  }
});

app.post('/schedule', async (req, res) => {
  try {
    const response = await axios.post(`${backendUrl}/cron/schedule`, req.body);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Backend unreachable' });
  }
});

// Additional internal routes
app.get('/ports', async (req, res) => {
  const ports = await SerialPort.list();
  res.json(ports);
});

// Import axios for forwarding


app.listen(port, () => {
  console.log(`[Bridge] Serial Bridge running on port ${port}`);
});
