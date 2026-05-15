import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { VoiceSessionEntity } from '../database/entities/voice-session.entity';
import { SensorsService } from '../sensors/sensors.service';

import { VisionService } from '../vision/vision.service';
import { FishService } from '../fish/fish.service';

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);
  private ollamaUrl: string;
  private ollamaModel: string;
  private predictorUrl: string;
  private provider: string;
  private openRouterKey: string;
  private openRouterModel: string;

  constructor(
    private http: HttpService,
    private config: ConfigService,
    private sensors: SensorsService,
    private vision: VisionService,
    private fish: FishService,
    @InjectRepository(VoiceSessionEntity)
    private sessionRepo: Repository<VoiceSessionEntity>,
  ) {
    this.ollamaUrl       = this.config.get('OLLAMA_URL')    ?? 'http://localhost:11434';
    this.ollamaModel     = this.config.get('OLLAMA_MODEL')  ?? 'batiai/gemma4-e4b:q4';
    this.predictorUrl    = this.config.get('AI_PREDICTOR_URL') ?? 'http://localhost:8000';
    this.provider        = this.config.get('LLM_PROVIDER') ?? 'ollama';
    this.openRouterKey   = this.config.get('OPENROUTER_API_KEY');
    this.openRouterModel = this.config.get('OPENROUTER_MODEL') ?? 'google/gemini-flash-1.5';
  }

  async handleQuery(
    text: string,
    snapshotId?: number,
  ): Promise<{ response: string; aiOffline: boolean }> {
    this.logger.log(`Processing voice query: "${text}"`);

    // 1. Trigger fresh vision analysis so the AI "sees" the fish right now
    let visionData = null;
    try {
      visionData = await this.vision.runFullAnalysis('VOICE_QUERY');
    } catch (e) {
      this.logger.warn(`Vision analysis failed for voice query: ${e.message}`);
    }

    // 2. Get real-time sensor readings
    const latestReadings = await this.sensors.getLatest();

    // 3. Strip mobile-injected context prefix
    const cleanText = text.replace(/^\[Live tank[^\]]*\]\s*User:\s*/i, '').trim();

    // 4. Build context strings
    const sensorContext = this.buildSensorContext(latestReadings);
    const visionContext = this.buildVisionContext(visionData);
    const qualityResult = await this.fetchQualityScore(latestReadings);

    // 5. Build system prompt with all real-time data
    const systemPrompt = this.buildSystemPrompt(sensorContext, visionContext, qualityResult);

    // 6. Call LLM (OpenRouter or Ollama)
    try {
      const t0 = Date.now();
      let aiResponse = '';

      if (this.provider === 'openrouter' && this.openRouterKey) {
        aiResponse = await this.callOpenRouter(systemPrompt, cleanText);
      } else {
        aiResponse = await this.callOllama(systemPrompt, cleanText);
      }

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
      this.logger.error(`LLM error (${this.provider}): ${error.message}`);
      return {
        response: this.sensorFallback(cleanText, latestReadings, visionContext, qualityResult),
        aiOffline: true,
      };
    }
  }

  private async callOpenRouter(system: string, user: string): Promise<string> {
    const res = await firstValueFrom(
      this.http.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: this.openRouterModel,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${this.openRouterKey}`,
            'HTTP-Referer': 'https://github.com/Ismoiljon1101/capstone_aquarium_sejong',
            'X-Title': 'Fishlinic Aquarium',
          },
        },
      ),
    );
    return res.data?.choices?.[0]?.message?.content ?? 'No response from OpenRouter.';
  }

  private async callOllama(system: string, user: string): Promise<string> {
    const res = await firstValueFrom(
      this.http.post<{ message: { content: string } }>(`${this.ollamaUrl}/api/chat`, {
        model: this.ollamaModel,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        stream: false,
      }),
    );
    return res.data?.message?.content ?? 'No response from Ollama.';
  }

  // ── Fetch quality score from trained RF model ──────────────────────────────
  private async fetchQualityScore(readings: any[]): Promise<{ score: number; status: string } | null> {
    try {
      const get = (type: string) => readings.find(r => r.type?.toLowerCase() === type.toLowerCase());
      const pH   = get('pH');
      const temp = get('TEMP') ?? get('temp_c');
      const do2  = get('DO2')  ?? get('do_mg_l');

      if (!pH || !temp || !do2) return null;

      const res = await firstValueFrom(
        this.http.post<{ score: number; status: string }>(`${this.predictorUrl}/predict/quality`, {
          pH:      parseFloat(pH.value),
          temp_c:  parseFloat(temp.value),
          do_mg_l: parseFloat(do2.value),
        }),
      );
      return res.data;
    } catch {
      return null; // predictor offline — not fatal
    }
  }

  // ── Build rich context string from all sensor readings ─────────────────────
  private buildSensorContext(readings: any[]): string {
    if (!readings.length) return 'No sensor data available.';
    return readings
      .map(r => `${r.type}: ${r.value}${r.unit} (${r.status ?? 'unknown'})`)
      .join(', ');
  }

  // ── Build vision context from latest YOLO results ──────────────────────────
  private buildVisionContext(visionData: any): string {
    if (!visionData) return 'Vision system is currently offline or failing to capture.';
    
    const disease = visionData.disease?.disease || 'none';
    const count = visionData.count?.count ?? 0;
    const behavior = visionData.behavior?.description || 'normal';
    
    return [
      `Fish Count: ${count} fish detected.`,
      `Health Status: ${disease === 'none' || disease.toLowerCase().includes('healthy') ? 'Healthy' : `Potential disease detected: ${disease}`}.`,
      `Behavior: ${behavior}.`,
    ].join(' ');
  }

  // ── Build Ollama system prompt ─────────────────────────────────────────────
  private buildSystemPrompt(sensorContext: string, visionContext: string, quality: { score: number; status: string } | null): string {
    const qualityLine = quality
      ? `ML Quality Score: ${quality.score}/100 — status: ${quality.status} (Random Forest model trained on real aquaculture data).`
      : 'ML Quality Model: offline.';

    return [
      '=== WHO YOU ARE ===',
      'You are Veronica, the AI assistant for Fishlinic — a smart aquaculture system at Sejong University.',
      'You help users monitor fish health and water quality using real-time sensors and AI vision.',
      '',
      '=== LIVE DATA (right now) ===',
      `Visual Observation: ${visionContext}`,
      `Sensor readings: ${sensorContext}`,
      qualityLine,
      '',
      '=== YOUR RULES ===',
      '1. ALWAYS use the live data provided above. If the vision data says there is 1 fish, do not say there are more.',
      '2. If you see "Healthy Fish" or "Healthy", reassure the user.',
      '3. Be concise: 1-2 sentences max. English only.',
      '4. Mention the vision results if the user asks about the fish or "how they look".',
    ].join('\n');
  }

  // ── Smart fallback when Ollama is offline ──────────────────────────────────
  private sensorFallback(question: string, readings: any[], vision: string, quality: { score: number; status: string } | null): string {
    const get  = (type: string) => readings.find(r => r.type?.toLowerCase() === type.toLowerCase());
    const pH   = get('pH');
    const temp = get('TEMP') ?? get('temp_c');
    const do2  = get('DO2')  ?? get('do_mg_l');
    const co2  = get('CO2');

    if (!readings.length) {
      return "I can't reach the sensors right now. Please check that the serial bridge is running and connected to the backend.";
    }

    const q = question.toLowerCase();

    if (/ph|acid|alkaline/.test(q)) {
      return pH
        ? `Current pH is ${pH.value} — ${pH.status === 'ok' ? 'within the safe range (6.8–7.5).' : `⚠️ status is ${pH.status}, which needs attention.`}`
        : "I can read the sensors but pH data isn't available yet.";
    }
    if (/temp|hot|cold|warm/.test(q)) {
      return temp
        ? `Water temperature is ${temp.value}°C — ${temp.status === 'ok' ? 'safe (24–28°C).' : `⚠️ ${temp.status}.`}`
        : 'Temperature sensor data not available yet.';
    }
    if (/oxygen|o2|do|dissolv/.test(q)) {
      return do2
        ? `Dissolved oxygen is ${do2.value} mg/L — ${do2.status === 'ok' ? 'good (safe range 6–9 mg/L).' : `⚠️ ${do2.status}.`}`
        : 'Dissolved oxygen data not available yet.';
    }
    if (/qualit|score|health|safe|status|ok|fine|good|all/.test(q)) {
      if (quality) {
        return `Your trained water quality model scores the tank at ${quality.score}/100 (${quality.status}). pH ${pH?.value ?? '–'}, temp ${temp?.value ?? '–'}°C, O₂ ${do2?.value ?? '–'} mg/L.`;
      }
      const issues = [pH, temp, do2, co2].filter(s => s && s.status !== 'ok');
      if (issues.length === 0) {
        return `All sensors look good! pH ${pH?.value ?? '–'}, temp ${temp?.value ?? '–'}°C, O₂ ${do2?.value ?? '–'} mg/L. Your tank is healthy.`;
      }
      return `I see ${issues.length} issue(s): ${issues.map(s => `${s.type} is ${s.status}`).join(', ')}. I'd check those.`;
    }

    if (/fish|see|look|view|count|disease/.test(q)) {
      return `Vision status: ${vision}`;
    }

    // Generic fallback with live data + quality score
    const summary = [
      pH   ? `pH ${pH.value}`        : null,
      temp ? `${temp.value}°C`       : null,
      do2  ? `O₂ ${do2.value} mg/L`  : null,
      quality ? `quality ${quality.score}/100` : null,
    ].filter(Boolean).join(', ');

    return `Live tank data (${summary}) — my AI brain (Ollama) is offline. Please wait for the model pull to finish: ollama pull batiai/gemma4-e4b:q4.`;
  }

  async getSessions() {
    return await this.sessionRepo.find({
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }
}
