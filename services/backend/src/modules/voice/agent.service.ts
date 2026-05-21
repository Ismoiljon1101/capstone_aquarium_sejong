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
import { ChatMessageEntity } from '../database/entities/chat-message.entity';
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

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly sensors: SensorsService,
    private readonly actuators: ActuatorsService,
    private readonly management: ManagementService,
    private readonly fish: FishService,
    @InjectRepository(ChatMessageEntity)
    private readonly chatRepo: Repository<ChatMessageEntity>,
  ) {}

  private get ollamaUrl() { return this.config.get('OLLAMA_URL') ?? 'http://localhost:11434'; }
  private get model() { return this.config.get('OLLAMA_MODEL') ?? 'gemma4:e2b'; }
  private get provider() { return this.config.get('LLM_PROVIDER') ?? 'openrouter'; }
  private get openRouterKey() { return this.config.get('OPENROUTER_API_KEY') ?? ''; }
  private get openRouterModel() { return this.config.get('OPENROUTER_MODEL') ?? 'google/gemini-2.0-flash-lite:free'; }

  async run(userMessage: string, sessionId?: string): Promise<AgentResult> {
    const history = sessionId ? await this.loadHistory(sessionId) : [];
    const messages: OllamaMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: userMessage },
    ];

    const deps = this.buildDeps();
    let iterations = 0;

    const finalize = async (response: string, extra: Partial<AgentResult> = {}): Promise<AgentResult> => {
      if (sessionId) {
        try { await this.saveMessages(sessionId, userMessage, response); }
        catch (e) { this.logger.warn(`saveMessages failed: ${(e as Error).message}`); }
      }
      return { response, aiOffline: false, ...extra };
    };

    try {
      while (iterations < MAX_ITERATIONS) {
        iterations++;
        const res = await this.callLLM(messages);
        const msg = res.message;

        if (!msg.tool_calls || msg.tool_calls.length === 0) {
          return await finalize(msg.content || 'Done.');
        }

        messages.push({ role: 'assistant', content: msg.content ?? '', tool_calls: msg.tool_calls });

        for (const tc of msg.tool_calls) {
          const name = tc.function.name as ToolName;
          const args = tc.function.arguments ?? {};

          if (CONFIRMATION_TOOLS.has(name)) {
            const reason = (args.reason as string) ?? `${name} requested by agent`;
            const config = await this.management.getTankConfig();
            if (config.agentMode === 'auto') {
              const exec = await this.executeConfirmedAction(name, args);
              messages.push({ role: 'tool', content: exec.message });
              this.logger.log(`Auto-executed ${name}: ${exec.message}`);
              continue;
            }
            const pendingAction: PendingAction = { tool: name, args, reason };
            return await finalize(this.summarizeProposal(pendingAction), { pendingAction });
          }

          const result = await executeTool(name, args, deps);
          this.logger.debug(`Tool ${name} → ${result.slice(0, 120)}`);
          messages.push({ role: 'tool', content: result });
        }
      }
      return await finalize('I reached my reasoning limit. Please try a more specific question.');
    } catch (err) {
      this.logger.error(`Agent error: ${(err as Error).message}`);
      const fallback = 'Veronica is offline right now. Please check LLM or connectivity.';
      if (sessionId) {
        try { await this.saveMessages(sessionId, userMessage, fallback); } catch {}
      }
      return { response: fallback, aiOffline: true };
    }
  }

  async executeConfirmedAction(
    tool: ToolName,
    args: Record<string, unknown>,
    sessionId?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const state = Boolean(args.state);
      if (tool === 'controlPump') {
        await this.actuators.triggerActuator({ actuatorId: 2, type: 'AIR_PUMP', relayChannel: 2, state, source: 'AGENT' as any });
        return this.finishAction(sessionId, { success: true, message: `Pump turned ${state ? 'ON' : 'OFF'}.` });
      }
      if (tool === 'controlLed') {
        await this.actuators.triggerActuator({ actuatorId: 3, type: 'LED_STRIP', relayChannel: 3, state, source: 'AGENT' as any });
        return this.finishAction(sessionId, { success: true, message: `LED turned ${state ? 'ON' : 'OFF'}.` });
      }
      if (tool === 'triggerFeed') {
        const cycles = Math.min(5, Math.max(1, Number(args.cycles) || 2));
        await this.actuators.triggerActuator({ actuatorId: 1, type: 'FEEDER', relayChannel: 1, state: true, source: 'AGENT' as any });
        return this.finishAction(sessionId, { success: true, message: `Feeder triggered for ${cycles} cycle(s).` });
      }
      return this.finishAction(sessionId, { success: false, message: `Unknown action: ${tool}` });
    } catch (err) {
      return this.finishAction(sessionId, { success: false, message: (err as Error).message });
    }
  }

  private async finishAction(sessionId: string | undefined, res: { success: boolean; message: string }) {
    if (sessionId) {
      await this.chatRepo.save(this.chatRepo.create({
        sessionId, role: 'assistant', content: res.success ? `✓ ${res.message}` : `✗ ${res.message}`
      })).catch(e => this.logger.warn(`Could not persist confirm result: ${e.message}`));
    }
    return res;
  }

  private summarizeProposal(p: PendingAction): string {
    const labels: Record<string, string> = {
      controlPump: `turn the air pump ${p.args.state ? 'ON' : 'OFF'}`,
      controlLed: `turn the LED strip ${p.args.state ? 'ON' : 'OFF'}`,
      triggerFeed: `feed the fish (${p.args.cycles ?? 2} cycle${Number(p.args.cycles) === 1 ? '' : 's'})`,
    };
    return `${p.reason} I recommend to ${labels[p.tool] ?? p.tool}. Confirm?`;
  }

  async getSessionMessages(id: string) {
    const rows = await this.chatRepo.find({ where: { sessionId: id }, order: { createdAt: 'ASC' } });
    return rows.map(r => ({
      ...r,
      content: r.role === 'user' ? r.content.replace(/^\[Live tank:[^\]]*\]\s*User:\s*/i, '').trim() : r.content,
    }));
  }

  async listChatSessions() {
    const all = await this.chatRepo.find({ order: { createdAt: 'ASC' } });
    const map = new Map<string, { createdAt: Date; count: number; preview: string }>();
    for (const m of all) {
      if (!map.has(m.sessionId)) map.set(m.sessionId, { createdAt: m.createdAt, count: 0, preview: '' });
      const entry = map.get(m.sessionId)!;
      entry.count++;
      if (m.role === 'user' && !entry.preview) {
        entry.preview = m.content.replace(/^\[Live tank:[^\]]*\]\s*User:\s*/i, '').trim().slice(0, 80);
      }
    }
    return Array.from(map.entries()).map(([sessionId, e]) => ({
      sessionId, preview: e.preview || 'Empty chat', createdAt: e.createdAt, messageCount: e.count
    })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  deleteSession(id: string) { return this.chatRepo.delete({ sessionId: id }); }

  private async loadHistory(id: string): Promise<OllamaMessage[]> {
    const rows = await this.chatRepo.find({ where: { sessionId: id }, order: { createdAt: 'ASC' }, take: 20 });
    return rows.map(r => ({ role: r.role as any, content: r.content }));
  }

  private async saveMessages(id: string, userText: string, assistantText: string) {
    const cleanUserText = userText.replace(/^\[Live tank:[^\]]*\]\s*User:\s*/i, '').trim();
    await this.chatRepo.save([
      this.chatRepo.create({ sessionId: id, role: 'user', content: cleanUserText }),
      this.chatRepo.create({ sessionId: id, role: 'assistant', content: assistantText }),
    ]);
  }

  private mapMessages(msgs: OllamaMessage[]): any[] {
    let assistantCount = 0;
    let lastCalls: string[] = [];
    return msgs.map(m => {
      if (m.role === 'assistant') {
        assistantCount++;
        lastCalls = (m.tool_calls ?? []).map((_, idx) => `call_${assistantCount}_${idx}`);
        return {
          role: 'assistant',
          content: m.content || null,
          tool_calls: (m.tool_calls ?? []).map((tc, idx) => ({
            id: lastCalls[idx],
            type: 'function',
            function: { name: tc.function.name, arguments: JSON.stringify(tc.function.arguments) }
          }))
        };
      }
      if (m.role === 'tool') {
        return { role: 'tool', tool_call_id: lastCalls.shift() ?? 'call_unknown', content: m.content };
      }
      return { role: m.role, content: m.content };
    });
  }

  private async callOpenRouter(messages: OllamaMessage[]): Promise<OllamaChatResponse> {
    try {
      const res = await firstValueFrom(
        this.http.post<any>(
          'https://openrouter.ai/api/v1/chat/completions',
          { model: this.openRouterModel, messages: this.mapMessages(messages), tools: AGENT_TOOLS },
          {
            headers: {
              Authorization: `Bearer ${this.openRouterKey}`,
              'HTTP-Referer': 'https://github.com/Ismoiljon1101/capstone_aquarium_sejong',
              'X-Title': 'Fishlinic Aquarium',
            },
          },
        ),
      );
      const msg = res.data?.choices?.[0]?.message;
      if (!msg) throw new Error('No response from OpenRouter.');
      const toolCalls = msg.tool_calls?.map((tc: any) => ({
        function: {
          name: tc.function.name,
          arguments: typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function.arguments,
        },
      })) ?? [];
      return {
        message: { role: 'assistant', content: msg.content ?? '', tool_calls: toolCalls.length > 0 ? toolCalls : undefined },
        done: true,
      };
    } catch (err: any) {
      if (err.response?.data) {
        this.logger.error(`OpenRouter Error Payload: ${JSON.stringify(err.response.data)}`);
      }
      throw err;
    }
  }

  private async callLLM(messages: OllamaMessage[]): Promise<OllamaChatResponse> {
    if (this.provider === 'openrouter' && this.openRouterKey) return this.callOpenRouter(messages);
    const res = await firstValueFrom(
      this.http.post<OllamaChatResponse>(`${this.ollamaUrl}/api/chat`, {
        model: this.model, messages, tools: AGENT_TOOLS, stream: false
      }),
    );
    return res.data;
  }

  private buildDeps() {
    return {
      getSensorReadings: async () => {
        const readings = await this.sensors.getLatest();
        return readings.map(r => ({ type: r.type, value: Number(r.value), unit: r.unit, status: r.status ?? 'unknown' }));
      },
      getSensorHistory: async () => {
        const history = await this.sensors.getAllHistory('1h');
        return history.map(r => ({ type: r.type, value: Number(r.value), unit: r.unit, timestamp: r.timestamp?.toISOString?.() ?? '' }));
      },
      getActuatorState: async () => this.actuators.getState(),
      getThresholds: async () => ({ pH: { min: 6.8, max: 7.5 }, temp_c: { min: 24, max: 28 }, do_mg_l: { min: 6, max: 9 }, CO2_ppm: { max: 40 } }),
      getDiagnoses: async () => this.fish.getLatestDiagnoses(5),
    };
  }
}
