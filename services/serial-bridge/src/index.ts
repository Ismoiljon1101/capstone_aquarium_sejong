import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
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
let globalSerialMain: SerialPort | null = null;
let globalSerialSecondary: SerialPort | null = null;

const handleData = (line: string) => {
  const readings = parser.parse(line);
  readings.forEach(r => {
    latestData[r.type!] = r;
    emitter.forwardReading(r);
  });
};

// --- Serial Connection Logic ---
const mainPortPath = process.env.SERIAL_PORT_MAIN || '';
const secondaryPortPath = process.env.SERIAL_PORT_SECONDARY || '';

async function startSerial() {
  const isMockAlways = process.env.MOCK_MODE === 'true';
  const mock = new MockHardware(handleData);

  if (isMockAlways) {
    console.log('[Bridge] Forced Mock Mode enabled via .env');
    mock.start();
    return;
  }

  try {
    const ports = await SerialPort.list();
    const availablePaths = ports.map(p => p.path);

    const actualMainPath = mainPortPath && availablePaths.includes(mainPortPath) 
      ? mainPortPath 
      : availablePaths.find(p => p.includes('usbserial') || p.includes('usbmodem'));

    if (actualMainPath) {
      const serialMain = new SerialPort({ path: actualMainPath, baudRate: 9600 });
      globalSerialMain = serialMain;
      const lineParser = serialMain.pipe(new ReadlineParser({ delimiter: '\r\n' }));
      
      lineParser.on('data', handleData);
      serialMain.on('open', () => {
        isConnected = true;
        console.log(`[Bridge] Connected to Main Serial at ${actualMainPath}`);
      });
      serialMain.on('error', (err) => {
        console.error(`[Bridge] Main Serial Error on ${actualMainPath}:`, err.message);
      });
      serialMain.on('close', () => {
        console.warn(`[Bridge] Main Serial closed ${actualMainPath}`);
      });
    } else {
      console.warn('[Bridge] No port found for Main Serial.');
    }

    const actualSecondaryPath = secondaryPortPath && availablePaths.includes(secondaryPortPath)
      ? secondaryPortPath
      : availablePaths.find(p => p !== actualMainPath && (p.includes('usbserial') || p.includes('usbmodem')));

    if (actualSecondaryPath) {
      const serialSecondary = new SerialPort({ path: actualSecondaryPath, baudRate: 9600 });
      globalSerialSecondary = serialSecondary;
      const lineParser2 = serialSecondary.pipe(new ReadlineParser({ delimiter: '\r\n' }));
      
      lineParser2.on('data', handleData);
      serialSecondary.on('open', () => {
        isConnected = true;
        console.log(`[Bridge] Connected to Secondary Serial at ${actualSecondaryPath}`);
      });
      serialSecondary.on('error', (err) => {
        console.error(`[Bridge] Secondary Serial Error on ${actualSecondaryPath}:`, err.message);
      });
      serialSecondary.on('close', () => {
        console.warn(`[Bridge] Secondary Serial closed ${actualSecondaryPath}`);
      });
    } else {
      console.warn('[Bridge] No port found for Secondary Serial.');
    }

    if (!actualMainPath && !actualSecondaryPath) {
      console.warn('[Bridge] No serial ports found. Switching to Mock mode.');
      mock.start();
    }
  } catch (err: any) {
    console.warn('[Bridge] Serial init error. Switching to Mock mode.', err.message);
    const mock = new MockHardware(handleData);
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

app.post('/actuate', (req, res) => {
  const { actuatorId, type, state, relayChannel, source } = req.body;
  
  if (type === 'FEEDER') {
    const cmd = `{"cmd":"feed","duration":1}\n`;
    const targetPort = globalSerialSecondary || globalSerialMain;
    
    if (targetPort) {
      targetPort.write(cmd, (err) => {
        if (err) {
          console.error('[Bridge] Failed to write to Arduino:', err.message);
          return res.status(500).json({ success: false, error: 'Command write failed' });
        }
        res.json({ success: true, message: 'Feeder command sent to Arduino' });
      });
    } else {
      res.status(500).json({ success: false, error: 'No Arduino connected physically' });
    }
  } else {
    // Handle generic relay channel
    res.json({ success: true, message: 'Relay command not fully implemented yet' });
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
