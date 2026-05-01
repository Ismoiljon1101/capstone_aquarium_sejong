import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { SensorsService } from '../sensors/sensors.service';
import { ActuatorsService } from '../actuators/actuators.service';
import { ManagementService } from '../management/management.service';
import { FishService } from '../fish/fish.service';
import { AGENT_TOOLS, CONFIRMATION_TOOLS, executeTool } from './agent.tools';
import {
  AgentResult,
  OllamaMessage,
  OllamaChatResponse,
  PendingAction,
  ToolName,
} from './agent.types';

const MAX_ITERATIONS = 6;

const SYSTEM_PROMPT = `You are Veronica, an autonomous AI agent managing a smart aquarium at Sejong University.

You have tools to READ sensor data and CONTROL hardware actuators.

RULES:
1. Always call readSensors first before any answer or recommendation.
2. If the user asks about trends, call readHistory as well.
3. CONTROL RULES — read carefully:
   - If the USER explicitly asks you to turn something on/off or trigger feeding, call the tool IMMEDIATELY. Do not ask for reasons. Do not hesitate. Just do it.
   - If YOU decide to act autonomously (not user-requested), only act when sensor data justifies it.
   - The tool reason field: for user commands use "User requested." For autonomous actions describe the sensor reading.
4. Be concise: 1-2 sentences max in your final response. Never ask for confirmation — the system handles that.
5. Safe parameter ranges: pH 6.8–7.5 | Temp 24–28°C | DO 6–9 mg/L | CO₂ <40 ppm.
6. If all sensors are within safe range, say so. If any are outside, flag it and propose a corrective action.`;

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly ollamaUrl: string;
  private readonly model: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly sensors: SensorsService,
    private readonly actuators: ActuatorsService,
    private readonly management: ManagementService,
    private readonly fish: FishService,
  ) {
    this.ollamaUrl = this.config.get('OLLAMA_URL') ?? 'http://localhost:11434';
    this.model = this.config.get('OLLAMA_MODEL') ?? 'gemma4:e2b';
  }

  async run(userMessage: string): Promise<AgentResult> {
    const messages: OllamaMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ];

    const deps = this.buildDeps();
    let iterations = 0;

    try {
      while (iterations < MAX_ITERATIONS) {
        iterations++;

        const res = await this.callOllama(messages);
        const msg = res.message;

        // No tool calls — agent finished reasoning, return text response
        if (!msg.tool_calls || msg.tool_calls.length === 0) {
          return { response: msg.content || 'Done.', aiOffline: false };
        }

        // Append assistant message with tool calls to history
        messages.push({
          role: 'assistant',
          content: msg.content ?? '',
          tool_calls: msg.tool_calls,
        });

        // Process each tool call
        for (const tc of msg.tool_calls) {
          const name = tc.function.name as ToolName;
          const args = tc.function.arguments ?? {};

          // Write tool — auto-execute or intercept depending on agentMode
          if (CONFIRMATION_TOOLS.has(name)) {
            const reason = (args.reason as string) ?? `${name} requested by agent`;
            const config = await this.management.getTankConfig();
            const autoMode = config.agentMode === 'auto';

            this.logger.log(`Agent proposes: ${name} — ${reason} (mode: ${config.agentMode})`);

            if (autoMode) {
              const exec = await this.executeConfirmedAction(name, args);
              messages.push({ role: 'tool', content: exec.message });
              this.logger.log(`Auto-executed ${name}: ${exec.message}`);
              // Continue loop so agent can produce a follow-up response
              continue;
            }

            const pendingAction: PendingAction = { tool: name, args, reason };
            const summary = await this.summarizeProposal(pendingAction, messages, deps);
            return { response: summary, aiOffline: false, pendingAction };
          }

          // Read tool — execute and feed result back
          const result = await executeTool(name, args, deps);
          this.logger.debug(`Tool ${name} → ${result.slice(0, 120)}`);

          messages.push({ role: 'tool', content: result });
        }
      }

      return { response: 'I reached my reasoning limit. Please try a more specific question.', aiOffline: false };
    } catch (err) {
      this.logger.error(`Agent error: ${(err as Error).message}`);
      return { response: 'Veronica is offline right now. Please check that Ollama is running.', aiOffline: true };
    }
  }

  // Execute a confirmed write action directly
  async executeConfirmedAction(tool: ToolName, args: Record<string, unknown>): Promise<{ success: boolean; message: string }> {
    try {
      switch (tool) {
        case 'controlPump': {
          const state = Boolean(args.state);
          await this.actuators.triggerActuator({ actuatorId: 2, type: 'AIR_PUMP', relayChannel: 2, state, source: 'AGENT' as any });
          return { success: true, message: `Pump turned ${state ? 'ON' : 'OFF'}.` };
        }
        case 'controlLed': {
          const state = Boolean(args.state);
          await this.actuators.triggerActuator({ actuatorId: 3, type: 'LED_STRIP', relayChannel: 3, state, source: 'AGENT' as any });
          return { success: true, message: `LED turned ${state ? 'ON' : 'OFF'}.` };
        }
        case 'triggerFeed': {
          const cycles = Math.min(5, Math.max(1, Number(args.cycles) || 2));
          await this.actuators.triggerActuator({ actuatorId: 1, type: 'FEEDER', relayChannel: 1, state: true, source: 'AGENT' as any });
          return { success: true, message: `Feeder triggered for ${cycles} cycle(s).` };
        }
        default:
          return { success: false, message: `Unknown action: ${tool}` };
      }
    } catch (err) {
      return { success: false, message: (err as Error).message };
    }
  }

  // Ask Ollama to produce a plain-English summary of the proposed action
  private async summarizeProposal(
    proposal: PendingAction,
    priorMessages: OllamaMessage[],
    deps: ReturnType<typeof this.buildDeps>,
  ): Promise<string> {
    // Build a short summary without another Ollama round-trip if possible
    const actionLabel: Record<string, string> = {
      controlPump: `turn the air pump ${proposal.args.state ? 'ON' : 'OFF'}`,
      controlLed: `turn the LED strip ${proposal.args.state ? 'ON' : 'OFF'}`,
      triggerFeed: `feed the fish (${proposal.args.cycles ?? 2} cycle${Number(proposal.args.cycles) === 1 ? '' : 's'})`,
    };
    const label = actionLabel[proposal.tool] ?? proposal.tool;
    return `${proposal.reason} I recommend to ${label}. Confirm?`;
  }

  private async callOllama(messages: OllamaMessage[]): Promise<OllamaChatResponse> {
    const res = await firstValueFrom(
      this.http.post<OllamaChatResponse>(`${this.ollamaUrl}/api/chat`, {
        model: this.model,
        messages,
        tools: AGENT_TOOLS,
        stream: false,
      }),
    );
    return res.data;
  }

  private buildDeps() {
    return {
      getSensorReadings: async () => {
        const readings = await this.sensors.getLatest();
        return readings.map(r => ({
          type: r.type,
          value: Number(r.value),
          unit: r.unit,
          status: r.status ?? 'unknown',
        }));
      },
      getSensorHistory: async () => {
        const history = await this.sensors.getAllHistory('1h');
        return history.map(r => ({
          type: r.type,
          value: Number(r.value),
          unit: r.unit,
          timestamp: r.timestamp?.toISOString?.() ?? '',
        }));
      },
      getActuatorState: async () => {
        return await this.actuators.getState();
      },
      getThresholds: async () => ({
        pH: { min: 6.8, max: 7.5 },
        temp_c: { min: 24, max: 28 },
        do_mg_l: { min: 6, max: 9 },
        CO2_ppm: { max: 40 },
      }),
      getDiagnoses: async () => {
        return await this.fish.getLatestDiagnoses(5);
      },
    };
  }
}
