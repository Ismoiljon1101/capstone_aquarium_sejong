import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import { execSync, spawn } from "child_process";
import path from "path";
import { existsSync } from "fs";
import { SerialParser } from "./parser";
import { Emitter } from "./emitter";
import EventEmitter from "events";

type BridgeCommand = {
  actuatorId: number;
  type: "FEEDER" | "AIR_PUMP" | "LED_STRIP" | "STATUS_LED";
  relayChannel: number;
  state: boolean;
  source: "APP" | "CRON" | "AI" | "EMERGENCY";
};

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);
const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
const predictorUrl = process.env.AI_PREDICTOR_URL || "http://localhost:8000";
const mainPortPath = process.env.SERIAL_PORT_MAIN || "/dev/ttyUSB0";
const cameraDevice = process.env.CAMERA_DEVICE
  ? Number(process.env.CAMERA_DEVICE)
  : undefined;
const localCaptureScript = path.join(__dirname, "capture.py");
const sourceCaptureScript = path.join(__dirname, "..", "src", "capture.py");
const captureScript = existsSync(localCaptureScript)
  ? localCaptureScript
  : sourceCaptureScript;
const mockModeEnabled = process.env.MOCK_MODE === "true";
const parser = new SerialParser();
const emitter = new Emitter(backendUrl);

let isMockMode = false;
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
  if (command.type === "FEEDER") actuatorState.feeder = command.state;
  if (command.type === "AIR_PUMP") actuatorState.pump = command.state;
  if (command.type === "LED_STRIP") actuatorState.led = command.state;
};

// Send offline state to backend so UI knows hardware is missing
const emitOfflineState = () => {
  void emitter.forwardReading({
    type: "SYSTEM",
    value: 0,
    unit: "status",
    status: "offline",
  });
  latestData["SYSTEM"] = { type: "SYSTEM", value: 0, status: "offline" };
};

async function startSerial() {
  if (mockModeEnabled) {
    isMockMode = true;
    console.log("[Bridge] Running in MOCK mode (no hardware required)");
    // Send a periodic heartbeat so backend knows we're alive
    setInterval(() => {
      handleData(
        JSON.stringify({
          pH: 7.0 + (Math.random() * 0.2 - 0.1),
          TEMP: 25 + (Math.random() * 2 - 1),
          DO_mg_L: 7 + (Math.random() * 1 - 0.5),
          status: "ok",
        }),
      );
    }, 5000);
    return;
  }

  try {
    const { SerialPort } = await import("serialport");
    const { ReadlineParser } = await import("@serialport/parser-readline");

    const ports = await SerialPort.list();
    const availablePaths = ports.map((p: any) => p.path);
    const isWindows = process.platform === 'win32';

    const actualMainPath = mainPortPath && availablePaths.includes(mainPortPath)
      ? mainPortPath
      : availablePaths.find((p: string) =>
        p.includes('usbserial') ||
        p.includes('usbmodem') ||
        (isWindows && p.toUpperCase().startsWith('COM'))
      );

    if (actualMainPath) {
      console.log(
        `[Bridge] Attempting to connect to Serial at ${actualMainPath}`,
      );
      serialMain = new SerialPort({ path: actualMainPath, baudRate: 9600 });
      const lineParser = serialMain.pipe(
        new ReadlineParser({ delimiter: "\r\n" }),
      );

      lineParser.on("data", handleData);

      serialMain.on("open", () => {
        isConnected = true;
        console.log(`[Bridge] Connected successfully to ${actualMainPath}`);
      });

      serialMain.on("close", () => {
        if (isConnected) console.log("[Bridge] Serial Port Closed.");
        isConnected = false;
        emitOfflineState();
        setTimeout(startSerial, 3000); // Auto-reconnect loop
      });

      serialMain.on("error", (error: Error) => {
        if (isConnected) console.error("[Bridge] Serial Error:", error.message);
        isConnected = false;
        emitOfflineState();
      });
    } else {
      if (isConnected)
        console.warn(
          "[Bridge] Hardware disconnected. No valid serial port found.",
        );
      isConnected = false;
      emitOfflineState();
      setTimeout(startSerial, 3000);
    }
  } catch (error) {
    console.error(`[Bridge] Serial connect error. Retrying...`);
    isConnected = false;
    emitOfflineState();
    setTimeout(startSerial, 3000);
  }
}

async function handleCommand(command: BridgeCommand) {
  if (mockModeEnabled) {
    applyCommandState(command);
    return {
      success: true,
      hardware: "mock",
      actuators: actuatorState,
      command,
    };
  }

  if (!isConnected || !serialMain || !serialMain.isOpen) {
    throw new Error("Hardware is disconnected. Cannot execute command.");
  }

  let payload = `${JSON.stringify(command)}\n`;
  let expectedAck = "";

  if (command.type === "FEEDER") {
    payload = `{"cmd":"feed","duration":1}\n`;
    expectedAck = "FEEDER";
  } else if (command.type === "AIR_PUMP") {
    payload = command.state ? "PUMP_ON\n" : "PUMP_OFF\n";
    expectedAck = command.state ? "PUMP_ON" : "PUMP_OFF";
  } else if (command.type === "LED_STRIP") {
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
      reject(
        new Error(
          `Command timed out: Arduino did not acknowledge '${expectedAck}' within 3 seconds.`,
        ),
      );
    }, 3000);

    ackEmitter.once(`ack_${expectedAck}`, () => {
      clearTimeout(timeout);
      applyCommandState(command);
      resolve();
    });
  });

  return {
    success: true,
    hardware: "serial",
    actuators: actuatorState,
    command,
  };
}

// Detect, at startup, whether real AVFoundation hardware uniqueIDs are
// available (pyobjc installed) and log which camera-persistence strategy is
// active. Failure to probe is non-fatal — capture still works via name-based ids.
function logCameraPersistenceStrategy() {
  try {
    const out = execSync(`python3 "${captureScript}" --capabilities`, {
      timeout: 10000,
      encoding: "utf-8",
    }).trim();
    const available = Boolean(JSON.parse(out)?.avfUniqueIds);
    console.log(
      available
        ? "[Camera] Using AVFoundation unique IDs for camera persistence"
        : "[Camera] AVFoundation unique IDs unavailable; using name-based fallback",
    );
  } catch {
    console.log(
      "[Camera] AVFoundation unique IDs unavailable; using name-based fallback",
    );
  }
}

// Start connection loop
startSerial();
logCameraPersistenceStrategy();

app.get("/", (_req, res) => {
  res.send("<h1>Fishlinic Serial Bridge</h1><p>Status: Running</p>");
});

app.get("/status", (_req, res) => {
  res.json({
    status: "online",
    hardware: isConnected ? "connected" : isMockMode ? "mock" : "offline",
    mockMode: isMockMode,
    backend: backendUrl,
    predictor: predictorUrl,
    lastReadingAt,
    actuators: actuatorState,
  });
});

app.get("/latest", (_req, res) => {
  res.json({
    telemetry: latestData,
    actuators: actuatorState,
    lastReadingAt,
  });
});

app.post("/command", async (req, res) => {
  try {
    const result = await handleCommand(req.body as BridgeCommand);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Command Error] ${message}`);
    res.status(500).json({ success: false, error: message });
  }
});

app.post("/actuate", async (req, res) => {
  try {
    const result = await handleCommand(req.body as BridgeCommand);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Actuate Error] ${message}`);
    res.status(500).json({ success: false, error: message });
  }
});

app.post("/camera/snapshot", (req, res) => {
  try {
    const requested = (req.body as { device?: unknown } | undefined)?.device;
    const device =
      typeof requested === "number" && Number.isInteger(requested)
        ? requested
        : cameraDevice;
    const deviceArg = device === undefined ? "" : ` --device ${device}`;
    const result = execSync(`python3 "${captureScript}"${deviceArg}`, {
      timeout: 10000,
      encoding: "utf-8",
    }).trim();

    if (!result || result.startsWith("ERROR")) {
      const detail = result.startsWith("ERROR:")
        ? result.slice("ERROR:".length).trim()
        : "Camera capture failed. Is iPhone connected via USB?";
      res.status(503).json({ error: detail });
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

function resolveCameraDevice(): { index: number } | { error: string } {
  if (cameraDevice !== undefined) {
    return { index: cameraDevice };
  }
  try {
    const result = execSync(`python3 "${captureScript}" --resolve`, {
      timeout: 10000,
      encoding: "utf-8",
    }).trim();
    const parsed = JSON.parse(result);
    if (typeof parsed.index === "number") {
      return { index: parsed.index };
    }
    return {
      error: parsed.error || "No iPhone camera detected via Continuity Camera",
    };
  } catch (error) {
    return { error: "No iPhone camera detected via Continuity Camera" };
  }
}

app.get("/camera/devices", (_req, res) => {
  try {
    const result = execSync(`python3 "${captureScript}" --list`, {
      timeout: 10000,
      encoding: "utf-8",
    }).trim();
    res.json(JSON.parse(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

app.get("/camera/stream", (_req, res) => {
  const override = _req.query.device;
  const resolved =
    override !== undefined && !Number.isNaN(Number(override))
      ? { index: Number(override) }
      : resolveCameraDevice();
  if ("error" in resolved) {
    res.status(503).json({ error: resolved.error });
    return;
  }

  res.writeHead(200, {
    "Content-Type": "multipart/x-mixed-replace; boundary=frame",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const child = spawn("python3", [
    "-c",
    `
import cv2, sys, time
cap = cv2.VideoCapture(${resolved.index}, cv2.CAP_AVFOUNDATION)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
while cap.isOpened():
    ret, frame = cap.read()
    if not ret: break
    _, buf = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
    data = buf.tobytes()
    sys.stdout.buffer.write(b'--frame\\r\\nContent-Type: image/jpeg\\r\\n\\r\\n')
    sys.stdout.buffer.write(data)
    sys.stdout.buffer.write(b'\\r\\n')
    sys.stdout.buffer.flush()
    time.sleep(0.033)
cap.release()
`,
  ]);

  child.stdout.pipe(res);
  child.stderr.on("data", (d: Buffer) => console.error(`[Camera Stream] ${d}`));

  _req.on("close", () => {
    child.kill();
  });
});

app.get("/ports", async (_req, res) => {
  const { SerialPort } = await import("serialport");
  const ports = await SerialPort.list();
  res.json(ports);
});

app.listen(port, () => {
  console.log(`[Bridge] Serial Bridge running on port ${port}`);
});
