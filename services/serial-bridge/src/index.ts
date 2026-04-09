import express from 'express';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import dotenv from 'dotenv';
import { SerialParser } from './parser.ts';
import { Emitter } from './emitter.ts';
import { MockHardware } from './mock.ts';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

app.use(express.json());

const parser = new SerialParser();
const emitter = new Emitter(backendUrl);
let latestData: any = {};
let isConnected = false;

// --- Serial Connection Logic ---
const mainPortPath = process.env.SERIAL_PORT_MAIN || '/dev/ttyUSB0';
const secondaryPortPath = process.env.SERIAL_PORT_SECONDARY || '/dev/ttyUSB1';

const handleData = (line: string) => {
  const readings = parser.parse(line);
  readings.forEach(r => {
    latestData[r.type!] = r;
    emitter.forwardReading(r);
  });
};

const mock = new MockHardware(handleData);

try {
  const serialMain = new SerialPort({ path: mainPortPath, baudRate: 9600 });
  const lineParser = serialMain.pipe(new ReadlineParser({ delimiter: '\r\n' }));
  lineParser.on('data', handleData);
  serialMain.on('open', () => {
    isConnected = true;
    console.log(`[Bridge] Connected to Main Serial at ${mainPortPath}`);
  });
  serialMain.on('error', (err) => {
    console.error('[Bridge] Serial Error:', err.message);
    if (process.env.MOCK_MODE === 'true') mock.start();
  });
} catch (err) {
  console.warn('[Bridge] Main Serial Port not found. Switching to Mock mode.');
  if (process.env.MOCK_MODE === 'true') mock.start();
}

// --- REST Routes (Legacy Dashboard Compatibility) ---

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
import axios from 'axios';

app.listen(port, () => {
  console.log(`[Bridge] Serial Bridge running on port ${port}`);
});
