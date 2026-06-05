import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import { SerialParser } from './parser';
import { Emitter } from './emitter';
import { MockHardware } from './mock';

type BridgeCommand = {
  actuatorId: number;
  type: 'FEEDER' | 'AIR_PUMP' | 'LED_STRIP' | 'STATUS_LED';
  relayChannel: number;
  state: boolean;
  source: 'APP' | 'CRON' | 'AI' | 'EMERGENCY';
};

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);
const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
const predictorUrl = process.env.AI_PREDICTOR_URL || 'http://localhost:8001';
const mainPortPath = process.env.SERIAL_PORT_MAIN || '/dev/ttyUSB0';
const mockModeEnabled = process.env.MOCK_MODE === 'true';
const parser = new SerialParser();
const emitter = new Emitter(backendUrl);
const actuatorState = {
  feeder: false,
  pump: false,
  led: false,
};

let latestData: Record<string, unknown> = {};
let isConnected = false;
let isMockMode = false;
let lastReadingAt: string | null = null;
let serialMain: any = null;

app.use(express.json());

const handleData = (line: string) => {
  const readings = parser.parse(line);
  lastReadingAt = new Date().toISOString();
  readings.forEach((reading) => {
    latestData[reading.type] = reading;
    void emitter.forwardReading(reading);
  });
};

const applyCommandState = (command: BridgeCommand) => {
  if (command.type === 'FEEDER') actuatorState.feeder = command.state;
  if (command.type === 'AIR_PUMP') actuatorState.pump = command.state;
  if (command.type === 'LED_STRIP') actuatorState.led = command.state;
};

async function startSerial() {
  const mock = new MockHardware(handleData);

  if (mockModeEnabled) {
    isMockMode = true;
    mock.start();
    return;
  }

  try {
    const { SerialPort } = await import('serialport');
    const { ReadlineParser } = await import('@serialport/parser-readline');

    const ports = await SerialPort.list();
    const availablePaths = ports.map((p: any) => p.path);

    const actualMainPath = mainPortPath && availablePaths.includes(mainPortPath)
      ? mainPortPath
      : availablePaths.find((p: string) => p.includes('usbserial') || p.includes('usbmodem'));

    if (!actualMainPath) {
      console.warn('[Bridge] No serial port detected. Bridge stays live without fake sensor data.');
      return;
    }

    serialMain = new SerialPort({ path: actualMainPath, baudRate: 9600 });
    const lineParser = serialMain.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    lineParser.on('data', handleData);
    serialMain.on('open', () => {
      isConnected = true;
      isMockMode = false;
      console.log(`[Bridge] Connected to Serial at ${actualMainPath}`);
    });

    serialMain.on('close', () => {
      isConnected = false;
    });

    serialMain.on('error', (error: Error) => {
      isConnected = false;
      console.error('[Bridge] Serial Error:', error.message);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[Bridge] Serial unavailable. Bridge stays live without fake sensor data. ${message}`);
  }
}

async function handleCommand(command: BridgeCommand) {
  applyCommandState(command);

  let payload = `${JSON.stringify(command)}\n`;
  if (command.type === 'FEEDER') {
    payload = '{"cmd":"feed","duration":1}\n';
  } else if (command.type === 'AIR_PUMP') {
    payload = command.state ? 'PUMP_ON\n' : 'PUMP_OFF\n';
  }

  if (serialMain && serialMain.isOpen) {
    await new Promise<void>((resolve, reject) => {
      serialMain?.write(payload, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  return {
    success: true,
    hardware: serialMain?.isOpen ? 'serial' : isMockMode ? 'mock' : 'offline',
    actuators: actuatorState,
    command,
  };
}

startSerial();

app.get('/', (_req, res) => {
  res.send('<h1>Fishlinic Serial Bridge</h1><p>Status: Running</p><p>Use <a href="/status">/status</a> for health check.</p>');
});

app.get('/status', (_req, res) => {
  res.json({
    status: 'online',
    hardware: isConnected ? 'connected' : isMockMode ? 'mock' : 'offline',
    mockMode: isMockMode,
    backend: backendUrl,
    predictor: predictorUrl,
    lastReadingAt,
    actuators: actuatorState,
  });
});

app.get('/latest', (_req, res) => {
  res.json({
    telemetry: latestData,
    actuators: actuatorState,
    lastReadingAt,
  });
});

app.get('/history', async (req, res) => {
  const sensorId = Number(req.query.sensorId ?? req.query.id ?? 1);
  const range = String(req.query.range ?? '24h');

  try {
    const response = await axios.get(`${backendUrl}/sensors/${sensorId}/readings`, {
      params: { range },
    });
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

app.get('/schedule', async (_req, res) => {
  try {
    const response = await axios.get(`${backendUrl}/cron/jobs`);
    res.json(response.data);
  } catch {
    res.status(500).json({ error: 'Backend unreachable' });
  }
});

app.post('/schedule', async (req, res) => {
  try {
    const response = await axios.patch(
      `${backendUrl}/cron/jobs/${req.body.jobKey}`,
      req.body,
    );
    res.json(response.data);
  } catch {
    res.status(500).json({ error: 'Backend unreachable' });
  }
});

app.post('/command', async (req, res) => {
  try {
    const result = await handleCommand(req.body as BridgeCommand);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

app.post('/actuate', async (req, res) => {
  try {
    const result = await handleCommand(req.body as BridgeCommand);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: message });
  }
});

app.post('/camera/snapshot', async (req, res) => {
  try {
    const response = await axios.post(`${predictorUrl}/camera/capture`, req.body ?? {});
    res.json(response.data);
  } catch (error: any) {
    const status = Number(error?.response?.status) || 500;
    res.status(status).json(error?.response?.data ?? { error: error?.message ?? 'Camera capture failed' });
  }
});

app.get('/ports', async (_req, res) => {
  const { SerialPort } = await import('serialport');
  const ports = await SerialPort.list();
  res.json(ports);
});

app.listen(port, () => {
  console.log(`[Bridge] Serial Bridge running on port ${port}`);
});
