import { ToolDefinition, ToolName } from './agent.types';

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
      name: 'readBehaviorAnalysis',
      description: 'Capture a fresh live video clip from the tank camera and run fish behavior analysis immediately. Use this for fish behavior, movement, activity level, stress, feeding response, counting fish, or visual fish health questions.',
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
      description: 'Turn the air pump ON or OFF. Requires user confirmation, do not call unless you have a clear sensor-based reason.',
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
      description: 'Turn the LED strip ON or OFF. Requires user confirmation, do not call unless you have a clear reason.',
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

export const CONFIRMATION_TOOLS = new Set<string>(['controlPump', 'controlLed', 'triggerFeed']);

export type ToolExecutorDeps = {
  getSensorReadings: () => Promise<Array<{ type: string; value: number; unit: string; status: string }>>;
  getSensorHistory: () => Promise<Array<{ type: string; value: number; unit: string; timestamp: string }>>;
  runBehaviorAnalysis: () => Promise<{
    behavior: Record<string, unknown>;
    count: Record<string, unknown>;
    disease: Record<string, unknown>;
    quality: Record<string, unknown>;
    reportId?: number;
  }>;
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
        const byType = new Map<string, number[]>();
        for (const r of history) {
          if (!byType.has(r.type)) byType.set(r.type, []);
          byType.get(r.type)!.push(r.value);
        }
        const summary = [...byType.entries()].map(([type, vals]) => {
          const latest = vals.slice(-1)[0];
          const oldest = vals[0];
          const trend = latest > oldest + 0.1 ? 'rising' : latest < oldest - 0.1 ? 'dropping' : 'stable';
          return `${type}: ${trend} (was ${oldest.toFixed(2)}, now ${latest.toFixed(2)}, ${vals.length} readings)`;
        });
        return summary.join(' | ');
      }

      case 'readBehaviorAnalysis': {
        const result = await deps.runBehaviorAnalysis();
        const behavior = result.behavior ?? {};
        const disease = result.disease ?? {};
        const count = result.count ?? {};
        const quality = result.quality ?? {};
        return [
          `behavior=${behavior['label'] ?? behavior['status'] ?? 'unknown'} (${behavior['confidence'] ?? 'n/a'})`,
          `behavior_status=${behavior['status'] ?? 'unknown'}`,
          `disease=${disease['disease'] ?? 'unknown'} (${disease['confidence'] ?? 'n/a'})`,
          `fish_count=${count['count'] ?? 'unknown'}`,
          `water_quality=${quality['label'] ?? quality['status'] ?? 'unknown'}`,
          result.reportId ? `report_id=${result.reportId}` : '',
        ].filter(Boolean).join(' | ');
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
          .map(d => `${d.diseaseClass} (${d.severity}, ${(d.mlConfidence * 100).toFixed(1)}% confidence) - ${new Date(d.timestamp).toLocaleString()}`)
          .join(' | ');
      }

      case 'readThresholds': {
        const thresholds = await deps.getThresholds();
        return JSON.stringify(thresholds);
      }

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
