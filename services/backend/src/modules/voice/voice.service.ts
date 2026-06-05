import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { VoiceSessionEntity } from '../database/entities/voice-session.entity';
import { SensorsService } from '../sensors/sensors.service';
import { ActuatorsService } from '../actuators/actuators.service';

type ChatTurn = {
  role: 'system' | 'user';
  content: string;
};

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);
  private readonly predictorUrl: string;
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
    @InjectRepository(VoiceSessionEntity)
    private readonly sessionRepo: Repository<VoiceSessionEntity>,
  ) {
    this.predictorUrl = this.config.get('AI_PREDICTOR_URL') ?? this.config.get('PREDICTOR_URL') ?? 'http://localhost:8001';
    this.ollamaUrl = this.config.get('OLLAMA_URL') ?? 'http://localhost:11434';
    this.openRouterUrl = this.config.get('OPENROUTER_BASE_URL') ?? 'https://openrouter.ai/api/v1';
    this.openRouterKey = this.config.get('OPENROUTER_API_KEY') ?? '';
    this.model =
      this.config.get('OPENROUTER_MODEL') ??
      this.config.get('OLLAMA_MODEL') ??
      'deepseek/deepseek-chat-v3.1';
    // OpenRouter is the primary provider now; Ollama stays as a local fallback.
    this.llmProvider = this.openRouterKey ? 'openrouter' : 'ollama';
  }

  async handleQuery(
    text: string,
    snapshotId?: number,
  ): Promise<{ response: string; aiOffline: boolean }> {
    this.logger.log(`Processing voice query: "${text}"`);

    const latestReadings = await this.sensors.getLatest();
    const actuatorResponse = await this.actuators.getState() as { actuators?: { pump: boolean; led: boolean; feeder: boolean } };
    const actuatorState = actuatorResponse?.actuators || { pump: false, led: false, feeder: false };

    const cleanText = text.replace(/^\[Live tank[^\]]*\]\s*User:\s*/i, '').trim();
    const sensorContext = this.buildSensorContext(latestReadings);
    const qualityResult = await this.fetchQualityScore(latestReadings);
    const systemPrompt = this.buildSystemPrompt(sensorContext, qualityResult, actuatorState);

    try {
      const t0 = Date.now();
      const aiResponse = await this.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: cleanText },
      ]);
      const durationMs = Date.now() - t0;

      const session = this.sessionRepo.create({
        transcribedText: cleanText,
        aiResponse,
        snapshotId,
        wakeWordAt: new Date(),
        durationMs,
      });
      await this.sessionRepo.save(session);

      return { response: aiResponse, aiOffline: false };
    } catch (error) {
      // Keep the app useful even when the upstream model is down.
      this.logger.error(`${this.llmProvider} error: ${(error as Error).message}`);
      return {
        response: this.sensorFallback(cleanText, latestReadings, qualityResult),
        aiOffline: true,
      };
    }
  }

  private async fetchQualityScore(readings: any[]): Promise<{ score: number; status: string } | null> {
    try {
      const get = (type: string) => readings.find(r => r.type?.toLowerCase() === type.toLowerCase());
      const pH = get('pH');
      const temp = get('TEMP') ?? get('temp_c');
      const do2 = get('DO2') ?? get('do_mg_l');

      if (!pH || !temp || !do2) return null;

      const res = await firstValueFrom(
        this.http.post<{ score: number; status: string }>(`${this.predictorUrl}/predict/quality`, {
          pH: parseFloat(pH.value),
          temp_c: parseFloat(temp.value),
          do_mg_l: parseFloat(do2.value),
        }),
      );
      return res.data;
    } catch {
      return null;
    }
  }

  private buildSensorContext(readings: any[]): string {
    if (!readings.length) return 'No sensor data available.';
    return readings
      .filter(r => r.type?.toLowerCase() !== 'co2')
      .map(r => `${r.type}: ${r.value}${r.unit} (${r.status ?? 'unknown'})`)
      .join(', ');
  }

  private buildSystemPrompt(
    sensorContext: string,
    quality: { score: number; status: string } | null,
    actuatorState: { pump: boolean; led: boolean; feeder: boolean },
  ): string {
    const qualityLine = quality
      ? `ML Quality Score: ${quality.score}/100, status ${quality.status}.`
      : 'ML Quality Model: offline.';

    return [
      'You are Veronica, the AI assistant for Fishlinic.',
      'Ground every answer in the live tank data below.',
      'Be concise: 1-3 sentences, English only.',
      'If a value is missing, say it is missing instead of guessing.',
      'Safe ranges: pH 6.8-7.5, Temperature 24-28C, Dissolved O2 6-9 mg/L.',
      `Sensor readings: ${sensorContext}`,
      `Actuators: pump ${actuatorState.pump ? 'ON' : 'OFF'}, LED ${actuatorState.led ? 'ON' : 'OFF'}.`,
      qualityLine,
    ].join('\n');
  }

  private sensorFallback(question: string, readings: any[], quality: { score: number; status: string } | null): string {
    const get = (type: string) => readings.find(r => r.type?.toLowerCase() === type.toLowerCase());
    const pH = get('pH');
    const temp = get('TEMP') ?? get('temp_c');
    const do2 = get('DO2') ?? get('do_mg_l');
    const co2 = get('CO2');

    if (!readings.length) {
      return "I can't reach the sensors right now. Please check that the serial bridge is running and connected to the backend.";
    }

    const q = question.toLowerCase();

    if (/ph|acid|alkaline/.test(q)) {
      return pH
        ? `Current pH is ${pH.value}. ${pH.status === 'ok' ? 'It is within the safe range.' : `Status is ${pH.status}.`}`
        : "I can read the sensors but pH data isn't available yet.";
    }
    if (/temp|hot|cold|warm/.test(q)) {
      return temp
        ? `Water temperature is ${temp.value}C. ${temp.status === 'ok' ? 'It is in the safe range.' : `Status is ${temp.status}.`}`
        : 'Temperature sensor data is not available yet.';
    }
    if (/oxygen|o2|do|dissolv/.test(q)) {
      return do2
        ? `Dissolved oxygen is ${do2.value} mg/L. ${do2.status === 'ok' ? 'That is a safe level.' : `Status is ${do2.status}.`}`
        : 'Dissolved oxygen data is not available yet.';
    }
    if (/qualit|score|health|safe|status|ok|fine|good|all/.test(q)) {
      if (quality) {
        return `The water quality model scores the tank at ${quality.score}/100 (${quality.status}). pH ${pH?.value ?? '-'}, temp ${temp?.value ?? '-'}C, O2 ${do2?.value ?? '-'} mg/L.`;
      }
      const issues = [pH, temp, do2, co2].filter(s => s && s.status !== 'ok');
      if (issues.length === 0) {
        return `All live sensors look good. pH ${pH?.value ?? '-'}, temp ${temp?.value ?? '-'}C, O2 ${do2?.value ?? '-'} mg/L.`;
      }
      return `I see ${issues.length} issue(s): ${issues.map(s => `${s.type} is ${s.status}`).join(', ')}.`;
    }

    const summary = [
      pH ? `pH ${pH.value}` : null,
      temp ? `${temp.value}C` : null,
      do2 ? `O2 ${do2.value} mg/L` : null,
      quality ? `quality ${quality.score}/100` : null,
    ].filter(Boolean).join(', ');

    return `Live tank data (${summary}). Veronica AI is offline right now, but the sensors are still reporting live values.`;
  }

  private async chat(messages: ChatTurn[]): Promise<string> {
    if (this.llmProvider === 'openrouter') {
      const res = await firstValueFrom(
        this.http.post<{
          choices?: Array<{ message?: { content?: string } }>;
        }>(
          `${this.openRouterUrl}/chat/completions`,
          {
            model: this.model,
            messages,
          },
          {
            headers: this.buildOpenRouterHeaders(),
          },
        ),
      );
      return res.data?.choices?.[0]?.message?.content?.trim() || 'Sorry, I could not process that right now.';
    }

    const res = await firstValueFrom(
      this.http.post<{ message?: { content?: string } }>(`${this.ollamaUrl}/api/chat`, {
        model: this.model,
        messages,
        stream: false,
      }),
    );

    return res.data?.message?.content?.trim() || 'Sorry, I could not process that right now.';
  }

  private buildOpenRouterHeaders() {
    return {
      Authorization: `Bearer ${this.openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://fishlinic.local',
      'X-Title': 'Fishlinic',
    };
  }

  async getSessions() {
    return await this.sessionRepo.find({
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }
}
