import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import { execSync, spawn } from 'child_process';
import path from 'path';
import { SerialParser } from './parser';
import { Emitter } from './emitter';
import EventEmitter from 'events';

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
const mainPortPath = process.env.SERIAL_PORT_MAIN || '/dev/ttyUSB0';
const cameraDevice = Number(process.env.CAMERA_DEVICE || 1); // 0=built-in, 1+=iPhone
const captureScript = path.join(__dirname, 'capture.py');
const parser = new SerialParser();
const emitter = new Emitter(backendUrl);

const actuatorState = {
  feeder: false,
  pump: false,
  led: false,
};

let latestData: Record<string, unknown> = {};
let isConnected = false;
let lastReadingAt: string | null = null;
let serialMain: any = null;

// Use this to wait for acks
const ackEmitter = new EventEmitter();

app.use(express.json());

const handleData = (line: string) => {
  // Check for command acknowledgment
  if (line.includes('"ack"')) {
    try {
      const parsed = JSON.parse(line);
      if (parsed.ack) {
        ackEmitter.emit(`ack_${parsed.ack}`);
        return;
      }
    } catch (e) {
      // Not JSON or invalid format
    }
  }

  // Parse sensor data
  const readings = parser.parse(line);
  if (readings.length > 0) {
    lastReadingAt = new Date().toISOString();
  }
  
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

// Send offline state to backend so UI knows hardware is missing
const emitOfflineState = () => {
  void emitter.forwardReading({
    type: 'SYSTEM',
    value: 0,
    unit: 'status',
    status: 'offline'
  });
  latestData['SYSTEM'] = { type: 'SYSTEM', value: 0, status: 'offline' };
};

async function startSerial() {
  try {
    const { SerialPort } = await import('serialport');
    const { ReadlineParser } = await import('@serialport/parser-readline');
    
    const ports = await SerialPort.list();
    const availablePaths = ports.map((p: any) => p.path);
    
    const actualMainPath = mainPortPath && availablePaths.includes(mainPortPath) 
      ? mainPortPath 
      : availablePaths.find((p: string) => p.includes('usbserial') || p.includes('usbmodem'));

    if (actualMainPath) {
      console.log(`[Bridge] Attempting to connect to Serial at ${actualMainPath}`);
      serialMain = new SerialPort({ path: actualMainPath, baudRate: 9600 });
      const lineParser = serialMain.pipe(new ReadlineParser({ delimiter: '\r\n' }));

      lineParser.on('data', handleData);
      
      serialMain.on('open', () => {
        isConnected = true;
        console.log(`[Bridge] Connected successfully to ${actualMainPath}`);
      });

      serialMain.on('close', () => {
        if (isConnected) console.log('[Bridge] Serial Port Closed.');
        isConnected = false;
        emitOfflineState();
        setTimeout(startSerial, 3000); // Auto-reconnect loop
      });

      serialMain.on('error', (error: Error) => {
        if (isConnected) console.error('[Bridge] Serial Error:', error.message);
        isConnected = false;
        emitOfflineState();
        // The close event will usually follow and handle the reconnect
      });
    } else {
      if (isConnected) console.warn('[Bridge] Hardware disconnected. No valid serial port found.');
      isConnected = false;
      emitOfflineState();
      setTimeout(startSerial, 3000); // Keep looking every 3 seconds
    }
  } catch (error) {
    console.error(`[Bridge] Serial connect error. Retrying...`);
    isConnected = false;
    emitOfflineState();
    setTimeout(startSerial, 3000);
  }
}

async function handleCommand(command: BridgeCommand) {
  if (!isConnected || !serialMain || !serialMain.isOpen) {
    throw new Error('Hardware is disconnected. Cannot execute command.');
  }

  let payload = `${JSON.stringify(command)}\n`;
  let expectedAck = '';

  if (command.type === 'FEEDER') {
    payload = `{"cmd":"feed","duration":1}\n`;
    expectedAck = 'FEEDER';
  } else if (command.type === 'AIR_PUMP') {
    payload = command.state ? "PUMP_ON\n" : "PUMP_OFF\n";
    expectedAck = command.state ? "PUMP_ON" : "PUMP_OFF";
  } else if (command.type === 'LED_STRIP') {
    expectedAck = command.state ? "LED_ON" : "LED_OFF";
  }

  // 1. Send the command
  await new Promise<void>((resolve, reject) => {
    serialMain?.write(payload, (error: Error | null) => {
      if (error) reject(error);
      else resolve();
    });
  });

  // 2. Wait up to 3 seconds for the ACK from Arduino
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      ackEmitter.removeAllListeners(`ack_${expectedAck}`);
      reject(new Error(`Command timed out: Arduino did not acknowledge '${expectedAck}' within 3 seconds.`));
    }, 3000);

    ackEmitter.once(`ack_${expectedAck}`, () => {
      clearTimeout(timeout);
      applyCommandState(command); // Apply state only if hardware acknowledges
      resolve();
    });
  });

  return {
    success: true,
    hardware: 'serial',
    actuators: actuatorState,
    command,
  };
}

// Start connection loop
startSerial();

app.get('/', (_req, res) => {
  res.send('<h1>Fishlinic Serial Bridge</h1><p>Status: Running</p>');
});

app.get('/status', (_req, res) => {
  res.json({
    status: 'online',
    hardware: isConnected ? 'connected' : 'offline',
    backend: backendUrl,
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

app.post('/command', async (req, res) => {
  try {
    const result = await handleCommand(req.body as BridgeCommand);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Command Error] ${message}`);
    res.status(500).json({ success: false, error: message });
  }
});

app.post('/actuate', async (req, res) => {
  try {
    const result = await handleCommand(req.body as BridgeCommand);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Actuate Error] ${message}`);
    res.status(500).json({ success: false, error: message });
  }
});

app.get('/ports', async (_req, res) => {
  const { SerialPort } = await import('serialport');
  const ports = await SerialPort.list();
  res.json(ports);
});

// ---------------------------------------------------------------------------
// Camera endpoints — iPhone via QuickTime/AVFoundation
// ---------------------------------------------------------------------------

app.post('/camera/snapshot', (_req, res) => {
  try {
    const result = execSync(
      `python3 "${captureScript}" --device ${cameraDevice}`,
      { timeout: 10000, encoding: 'utf-8' }
    ).trim();

    if (!result || result.startsWith('ERROR')) {
      res.status(503).json({ error: 'Camera capture failed. Is iPhone connected via USB?' });
      return;
    }

    console.log(`[Camera] Snapshot saved: ${result}`);
    res.json({ imagePath: result, timestamp: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Camera] Snapshot error: ${message}`);
    res.status(503).json({ error: `Camera capture failed: ${message}` });
  }
});

app.get('/camera/devices', (_req, res) => {
  try {
    const result = execSync(
      `python3 "${captureScript}" --list`,
      { timeout: 10000, encoding: 'utf-8' }
    ).trim();
    res.json(JSON.parse(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

app.get('/camera/stream', (_req, res) => {
  res.writeHead(200, {
    'Content-Type': 'multipart/x-mixed-replace; boundary=frame',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const child = spawn('python3', [
    '-c',
    `
import cv2, sys, time
cap = cv2.VideoCapture(${cameraDevice}, cv2.CAP_AVFOUNDATION)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
while cap.isOpened():
    ret, frame = cap.read()
    if not ret: break
    _, buf = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
    data = buf.tobytes()
    sys.stdout.buffer.write(b'--frame\r\nContent-Type: image/jpeg\r\n\r\n')
    sys.stdout.buffer.write(data)
    sys.stdout.buffer.write(b'\r\n')
    sys.stdout.buffer.flush()
    time.sleep(0.033)
cap.release()
`
  ]);

  child.stdout.pipe(res);
  child.stderr.on('data', (d: Buffer) => console.error(`[Camera Stream] ${d}`));

  _req.on('close', () => {
    child.kill();
  });
});

app.listen(port, () => {
  console.log(`[Bridge] Serial Bridge running on port ${port}`);
});

