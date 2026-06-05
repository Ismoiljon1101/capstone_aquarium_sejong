import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { SensorsService } from '../sensors/sensors.service';
import { ActuatorsService } from '../actuators/actuators.service';
import { ManagementService } from '../management/management.service';
import { FishService } from '../fish/fish.service';
import { VisionService } from '../vision/vision.service';
import { ChatMessageEntity } from '../database/entities/chat-message.entity';
import { AGENT_TOOLS, CONFIRMATION_TOOLS, executeTool } from './agent.tools';
import {
  AgentChatResponse,
  AgentMessage,
  AgentResult,
  PendingAction,
  ToolName,
} from './agent.types';

const MAX_ITERATIONS = 6;

const SYSTEM_PROMPT = `You are Veronica, an autonomous AI agent managing a smart aquarium at Sejong University.

You have tools to READ sensor data, RUN fresh camera analysis, and CONTROL hardware actuators.

RULES:
1. Always call readSensors first before any answer or recommendation.
2. If the user asks about trends, call readHistory as well.
3. If the user asks about fish behavior, movement, activity, stress, feeding response, fish count, or visual fish health, call readBehaviorAnalysis after readSensors.
4. CONTROL RULES:
   - If the USER explicitly asks you to turn something on/off or trigger feeding, call the tool immediately.
   - If YOU decide to act autonomously, only act when sensor or fresh vision data justifies it.
   - For user commands use reason="User requested."
5. Be concise: 1-2 sentences max in the final response. Never ask for confirmation because the system handles that.
6. Safe parameter ranges: pH 6.8-7.5 | Temp 24-28C | DO 6-9 mg/L.
7. If all sensors are within safe range, say so. If any are outside, flag it and propose a corrective action.`;

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly ollamaUrl: string;
  private readonly openRouterUrl: string;
  private readonly openRouterKey: string;
  private readonly model: string;
  private readonly llmProvider: 'openrouter' | 'ollama';

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly sensors: SensorsService,
    private readonly actuators: ActuatorsService,
    private readonly management: ManagementService,
    private readonly fish: FishService,
    private readonly vision: VisionService,
    @InjectRepository(ChatMessageEntity)
    private readonly chatRepo: Repository<ChatMessageEntity>,
  ) {
    this.ollamaUrl = this.config.get('OLLAMA_URL') ?? 'http://localhost:11434';
    this.openRouterUrl = this.config.get('OPENROUTER_BASE_URL') ?? 'https://openrouter.ai/api/v1';
    this.openRouterKey = this.config.get('OPENROUTER_API_KEY') ?? '';
    this.model =
      this.config.get('OPENROUTER_MODEL') ??
      this.config.get('OLLAMA_MODEL') ??
      'deepseek/deepseek-chat-v3.1';
    // Agent and plain Veronica chat must hit the same upstream provider.
    this.llmProvider = this.openRouterKey ? 'openrouter' : 'ollama';
  }

  async run(userMessage: string, sessionId?: string): Promise<AgentResult> {
    const history = sessionId ? await this.loadHistory(sessionId) : [];
    const messages: AgentMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: userMessage },
    ];

    const deps = this.buildDeps();
    let iterations = 0;

    const finalize = async (response: string, extra: Partial<AgentResult> = {}): Promise<AgentResult> => {
      if (sessionId) {
        try {
          await this.saveMessages(sessionId, userMessage, response);
        } catch (e) {
          this.logger.warn(`saveMessages failed: ${(e as Error).message}`);
        }
      }
      return { response, aiOffline: false, ...extra };
    };

    try {
      while (iterations < MAX_ITERATIONS) {
        iterations++;

        const res = await this.callModel(messages);
        const msg = res.message;

        if (!msg.tool_calls || msg.tool_calls.length === 0) {
          return await finalize(msg.content || 'Done.');
        }

        messages.push({
          role: 'assistant',
          content: msg.content ?? '',
          tool_calls: msg.tool_calls,
        });

        for (const tc of msg.tool_calls) {
          const name = tc.function.name as ToolName;
          const args = tc.function.arguments ?? {};

          if (CONFIRMATION_TOOLS.has(name)) {
            const reason = (args.reason as string) ?? `${name} requested by agent`;
            const config = await this.management.getTankConfig();
            const autoMode = config.agentMode === 'auto';

            this.logger.log(`Agent proposes: ${name} - ${reason} (mode: ${config.agentMode})`);

            if (autoMode) {
              const exec = await this.executeConfirmedAction(name, args);
              messages.push({ role: 'tool', content: exec.message, tool_call_id: tc.id });
              this.logger.log(`Auto-executed ${name}: ${exec.message}`);
              continue;
            }

            const pendingAction: PendingAction = { tool: name, args, reason };
            const summary = this.summarizeProposal(pendingAction);
            return await finalize(summary, { pendingAction });
          }

          const result = await executeTool(name, args, deps);
          this.logger.debug(`Tool ${name} -> ${result.slice(0, 120)}`);
          messages.push({ role: 'tool', content: result, tool_call_id: tc.id });
        }
      }

      return await finalize('I reached my reasoning limit. Please try a more specific question.');
    } catch (err) {
      this.logger.error(`Agent error: ${(err as Error).message}`);
      const fallback = 'Veronica is offline right now. Please check the configured AI provider.';
      if (sessionId) {
        try {
          await this.saveMessages(sessionId, userMessage, fallback);
        } catch {}
      }
      return { response: fallback, aiOffline: true };
    }
  }

  async executeConfirmedAction(
    tool: ToolName,
    args: Record<string, unknown>,
    sessionId?: string,
  ): Promise<{ success: boolean; message: string }> {
    let result: { success: boolean; message: string };
    try {
      switch (tool) {
        case 'controlPump': {
          const state = Boolean(args.state);
          await this.actuators.triggerActuator({ actuatorId: 2, type: 'AIR_PUMP', relayChannel: 2, state, source: 'AGENT' as any });
          result = { success: true, message: `Pump turned ${state ? 'ON' : 'OFF'}.` };
          break;
        }
        case 'controlLed': {
          const state = Boolean(args.state);
          await this.actuators.triggerActuator({ actuatorId: 3, type: 'LED_STRIP', relayChannel: 3, state, source: 'AGENT' as any });
          result = { success: true, message: `LED turned ${state ? 'ON' : 'OFF'}.` };
          break;
        }
        case 'triggerFeed': {
          const cycles = Math.min(5, Math.max(1, Number(args.cycles) || 2));
          await this.actuators.triggerActuator({ actuatorId: 1, type: 'FEEDER', relayChannel: 1, state: true, source: 'AGENT' as any });
          result = { success: true, message: `Feeder triggered for ${cycles} cycle(s).` };
          break;
        }
        default:
          result = { success: false, message: `Unknown action: ${tool}` };
      }
    } catch (err) {
      result = { success: false, message: (err as Error).message };
    }

    if (sessionId) {
      try {
        await this.chatRepo.save(this.chatRepo.create({
          sessionId,
          role: 'assistant',
          content: result.success ? `OK ${result.message}` : `FAILED ${result.message}`,
        }));
      } catch (e) {
        this.logger.warn(`Could not persist confirm result: ${(e as Error).message}`);
      }
    }

    return result;
  }

  private summarizeProposal(proposal: PendingAction): string {
    const actionLabel: Record<string, string> = {
      controlPump: `turn the air pump ${proposal.args.state ? 'ON' : 'OFF'}`,
      controlLed: `turn the LED strip ${proposal.args.state ? 'ON' : 'OFF'}`,
      triggerFeed: `feed the fish (${proposal.args.cycles ?? 2} cycle${Number(proposal.args.cycles) === 1 ? '' : 's'})`,
    };
    const label = actionLabel[proposal.tool] ?? proposal.tool;
    return `${proposal.reason} I recommend to ${label}. Confirm?`;
  }

  async getSessionMessages(sessionId: string) {
    return this.chatRepo.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
    });
  }

  async listChatSessions(): Promise<{ sessionId: string; preview: string; createdAt: Date; messageCount: number }[]> {
    const all = await this.chatRepo.find({ order: { createdAt: 'ASC' } });

    const map = new Map<string, { createdAt: Date; count: number; preview: string }>();
    for (const msg of all) {
      if (!map.has(msg.sessionId)) {
        map.set(msg.sessionId, { createdAt: msg.createdAt, count: 0, preview: '' });
      }
      const entry = map.get(msg.sessionId)!;
      entry.count++;
      if (msg.role === 'user' && !entry.preview) {
        entry.preview = msg.content.slice(0, 80);
      }
    }

    return Array.from(map.entries())
      .map(([sessionId, { createdAt, count, preview }]) => ({
        sessionId,
        preview: preview || 'Empty chat',
        createdAt,
        messageCount: count,
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteSession(sessionId: string) {
    await this.chatRepo.delete({ sessionId });
  }

  private async loadHistory(sessionId: string): Promise<AgentMessage[]> {
    const rows = await this.chatRepo.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
      take: 20,
    });
    return rows.map(r => ({ role: r.role as AgentMessage['role'], content: r.content }));
  }

  private async saveMessages(sessionId: string, userText: string, assistantText: string) {
    await this.chatRepo.save([
      this.chatRepo.create({ sessionId, role: 'user', content: userText }),
      this.chatRepo.create({ sessionId, role: 'assistant', content: assistantText }),
    ]);
  }

  private async callModel(messages: AgentMessage[]): Promise<AgentChatResponse> {
    if (this.llmProvider === 'openrouter') {
      const res = await firstValueFrom(
        this.http.post<{
          choices?: Array<{
            message?: {
              role?: string;
              content?: string;
              tool_calls?: Array<{
                id?: string;
                function?: { name?: string; arguments?: string };
              }>;
            };
          }>;
        }>(
          `${this.openRouterUrl}/chat/completions`,
          {
            model: this.model,
            messages,
            tools: AGENT_TOOLS,
          },
          {
            headers: this.buildOpenRouterHeaders(),
          },
        ),
      );

      const message = res.data?.choices?.[0]?.message;
      return {
        message: {
          role: message?.role ?? 'assistant',
          content: message?.content ?? '',
          tool_calls: (message?.tool_calls ?? []).map((call) => ({
            id: call.id,
            function: {
              name: call.function?.name ?? '',
              // OpenRouter returns function arguments as a JSON string.
              arguments: this.parseToolArguments(call.function?.arguments),
            },
          })),
        },
      };
    }

    const res = await firstValueFrom(
      this.http.post<{ message?: AgentChatResponse['message'] }>(`${this.ollamaUrl}/api/chat`, {
        model: this.model,
        messages,
        tools: AGENT_TOOLS,
        stream: false,
      }),
    );

    return {
      message: {
        role: res.data?.message?.role ?? 'assistant',
        content: res.data?.message?.content ?? '',
        tool_calls: res.data?.message?.tool_calls ?? [],
      },
    };
  }

  private parseToolArguments(raw?: string): Record<string, unknown> {
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed ? parsed : {};
    } catch {
      return {};
    }
  }

  private buildOpenRouterHeaders() {
    return {
      Authorization: `Bearer ${this.openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://fishlinic.local',
      'X-Title': 'Fishlinic',
    };
  }

  private buildDeps() {
    return {
      getSensorReadings: async () => {
        const readings = await this.sensors.getLatest();
        return readings
          .filter(r => r.type?.toLowerCase() !== 'co2')
          .map(r => ({
            type: r.type,
            value: Number(r.value),
            unit: r.unit,
            status: r.status ?? 'unknown',
          }));
      },
      getSensorHistory: async () => {
        const history = await this.sensors.getAllHistory('1h');
        return history
          .filter(r => r.type?.toLowerCase() !== 'co2')
          .map(r => ({
            type: r.type,
            value: Number(r.value),
            unit: r.unit,
            timestamp: r.timestamp?.toISOString?.() ?? '',
          }));
      },
      runBehaviorAnalysis: async () => {
        const result = await this.vision.runFullAnalysis('AGENT_FRESH');
        return {
          behavior: result.behavior ?? {},
          count: result.count ?? {},
          disease: result.disease ?? {},
          quality: result.quality ?? {},
          reportId: result.reportId,
        };
      },
      getActuatorState: async () => {
        return await this.actuators.getState();
      },
      getThresholds: async () => ({
        pH: { min: 6.8, max: 7.5 },
        temp_c: { min: 24, max: 28 },
        do_mg_l: { min: 6, max: 9 },
      }),
      getDiagnoses: async () => {
        return await this.fish.getLatestDiagnoses(5);
      },
    };
  }
}
