import { ToolDefinition, ToolName } from './agent.types';

// ── Tool definitions (sent to Ollama so it knows what it can call) ────────────

export const AGENT_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'readSensors',
      description: 'Read the current live sensor values from the tank (pH, temperature, dissolved oxygen, CO2). Call this first before any reasoning or recommendation.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'readHistory',
      description: 'Read sensor history for the last hour to detect trends (rising, dropping, stable).',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getActuatorState',
      description: 'Get the current on/off state of all actuators (pump, LED, feeder).',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'readDiagnoses',
      description: 'Read the latest fish disease diagnoses from the ML vision model. Use this when the user asks about fish health, disease, or appearance.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'readThresholds',
      description: 'Read the safe parameter ranges configured for this tank (pH, temperature, DO, CO2 min/max).',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'controlPump',
      description: 'Turn the air pump ON or OFF. Requires user confirmation — do not call unless you have a clear sensor-based reason.',
      parameters: {
        type: 'object',
        properties: {
          state: { type: 'boolean', description: 'true = ON, false = OFF' },
          reason: { type: 'string', description: 'One sentence explaining why this is needed based on sensor data.' },
        },
        required: ['state', 'reason'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'controlLed',
      description: 'Turn the LED strip ON or OFF. Requires user confirmation — do not call unless you have a clear reason.',
      parameters: {
        type: 'object',
        properties: {
          state: { type: 'boolean', description: 'true = ON, false = OFF' },
          reason: { type: 'string', description: 'One sentence explaining why.' },
        },
        required: ['state', 'reason'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'triggerFeed',
      description: 'Trigger the automatic feeder for 1-5 cycles. Requires user confirmation.',
      parameters: {
        type: 'object',
        properties: {
          cycles: { type: 'number', description: 'Number of feed cycles (1-5). Default 2.' },
          reason: { type: 'string', description: 'One sentence explaining why feeding is needed now.' },
        },
        required: ['cycles', 'reason'],
      },
    },
  },
];

// Tools that write to hardware — require user confirmation before executing
export const CONFIRMATION_TOOLS = new Set<string>(['controlPump', 'controlLed', 'triggerFeed']);

// ── Tool executor ─────────────────────────────────────────────────────────────
// Returns a string result to feed back into the Ollama message history

export type ToolExecutorDeps = {
  getSensorReadings: () => Promise<Array<{ type: string; value: number; unit: string; status: string }>>;
  getSensorHistory: () => Promise<Array<{ type: string; value: number; unit: string; timestamp: string }>>;
  getActuatorState: () => Promise<Record<string, unknown>>;
  getThresholds: () => Promise<Record<string, unknown>>;
  getDiagnoses: () => Promise<Array<{ diseaseClass: string; mlConfidence: number; severity: string; timestamp: Date }>>;
};

export async function executeTool(
  name: ToolName,
  args: Record<string, unknown>,
  deps: ToolExecutorDeps,
): Promise<string> {
  try {
    switch (name) {
      case 'readSensors': {
        const readings = await deps.getSensorReadings();
        if (!readings.length) return 'No sensor data available right now.';
        return readings
          .map(r => `${r.type}: ${r.value}${r.unit} [${r.status}]`)
          .join(', ');
      }

      case 'readHistory': {
        const history = await deps.getSensorHistory();
        if (!history.length) return 'No history data available for the last hour.';
        // Summarize: latest 5 readings per sensor type
        const byType = new Map<string, number[]>();
        for (const r of history) {
          if (!byType.has(r.type)) byType.set(r.type, []);
          byType.get(r.type)!.push(r.value);
        }
        const summary = [...byType.entries()].map(([type, vals]) => {
          const latest = vals.slice(-1)[0];
          const oldest = vals[0];
          const trend = latest > oldest + 0.1 ? '↑ rising' : latest < oldest - 0.1 ? '↓ dropping' : '→ stable';
          return `${type}: ${trend} (was ${oldest.toFixed(2)}, now ${latest.toFixed(2)}, ${vals.length} readings)`;
        });
        return summary.join(' | ');
      }

      case 'getActuatorState': {
        const state = await deps.getActuatorState();
        return JSON.stringify(state);
      }

      case 'readDiagnoses': {
        const diagnoses = await deps.getDiagnoses();
        if (!diagnoses.length) return 'No fish diagnoses on record yet.';
        return diagnoses
          .slice(0, 5)
          .map(d => `${d.diseaseClass} (${d.severity}, ${(d.mlConfidence * 100).toFixed(1)}% confidence) — ${new Date(d.timestamp).toLocaleString()}`)
          .join(' | ');
      }

      case 'readThresholds': {
        const thresholds = await deps.getThresholds();
        return JSON.stringify(thresholds);
      }

      // Write tools should never reach here — they are intercepted before execution
      case 'controlPump':
      case 'controlLed':
      case 'triggerFeed':
        return `[CONFIRMATION_REQUIRED] ${name} with args ${JSON.stringify(args)}`;

      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err) {
    return `Tool error: ${(err as Error).message}`;
  }
}
