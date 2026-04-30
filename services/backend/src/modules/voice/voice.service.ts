import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { VoiceSessionEntity } from '../database/entities/voice-session.entity';
import { SensorsService } from '../sensors/sensors.service';

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);
  private ollamaUrl: string;
  private model: string;
  private predictorUrl: string;

  constructor(
    private http: HttpService,
    private config: ConfigService,
    private sensors: SensorsService,
    @InjectRepository(VoiceSessionEntity)
    private sessionRepo: Repository<VoiceSessionEntity>,
  ) {
    this.ollamaUrl    = this.config.get('OLLAMA_URL')    ?? 'http://localhost:11434';
    this.model        = this.config.get('OLLAMA_MODEL')  ?? 'gemma3:4b';
    this.predictorUrl = this.config.get('PREDICTOR_URL') ?? 'http://localhost:8001';
  }

  async handleQuery(
    text: string,
    snapshotId?: number,
  ): Promise<{ response: string; aiOffline: boolean }> {
    this.logger.log(`Processing voice query: "${text}"`);

    // 1. Get real-time sensor readings
    const latestReadings = await this.sensors.getLatest();

    // 2. Strip mobile-injected context prefix (backend re-fetches live)
    const cleanText = text.replace(/^\[Live tank[^\]]*\]\s*User:\s*/i, '').trim();

    // 3. Build rich sensor context (all readings)
    const sensorContext = this.buildSensorContext(latestReadings);

    // 4. Query trained RF quality model with live sensor data
    const qualityResult = await this.fetchQualityScore(latestReadings);

    // 5. Build system prompt with sensors + ML quality score
    const systemPrompt = this.buildSystemPrompt(sensorContext, qualityResult);

    // 6. Call Ollama
    try {
      const t0 = Date.now();
      const res = await firstValueFrom(
        this.http.post<{ message: { content: string } }>(`${this.ollamaUrl}/api/chat`, {
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: cleanText },
          ],
          stream: false,
        }),
      );

      const aiResponse = res.data?.message?.content ?? 'Sorry, I could not process that right now.';
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
      // Ollama unreachable — return sensor-only fallback so the app stays useful,
      // but flag aiOffline=true so the client can surface the offline banner.
      this.logger.error(`Ollama error: ${error.message}`);
      return {
        response: this.sensorFallback(cleanText, latestReadings, qualityResult),
        aiOffline: true,
      };
    }
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

  // ── Build Ollama system prompt ─────────────────────────────────────────────
  private buildSystemPrompt(sensorContext: string, quality: { score: number; status: string } | null): string {
    const qualityLine = quality
      ? `ML Quality Score: ${quality.score}/100 — status: ${quality.status} (Random Forest model trained on real aquaculture data; inputs: pH, temp, dissolved O₂).`
      : 'ML Quality Model: offline (FastAPI predictor unreachable).';

    return [
      '=== WHO YOU ARE ===',
      'You are Veronica, the AI assistant embedded in Fishlinic — a smart aquaculture monitoring system built as a capstone project at Sejong University.',
      'You run on a Raspberry Pi connected to real aquarium sensors (pH, temperature, dissolved oxygen, CO₂) via an Arduino serial bridge.',
      '',
      '=== WHAT YOU KNOW ===',
      'The system has these trained ML models:',
      '  • Random Forest (rf_quality.pkl) — predicts water quality score 0-100 from pH, temp, DO₂',
      '  • YOLO v11 (yolo_disease.pt) — detects fish diseases from camera frames',
      '  • YOLO v11 (yolo_count.pt) — counts fish from camera frames',
      '  • ConvLSTM-VAE (convlstm_vae.pth) — detects abnormal fish behavior from video sequences',
      '',
      'Safe ranges for this tank:',
      '  • pH: 6.8–7.5 | Temperature: 24–28°C | Dissolved O₂: 6–9 mg/L | CO₂: <40 ppm',
      '',
      '=== LIVE DATA (right now) ===',
      `Sensor readings: ${sensorContext}`,
      qualityLine,
      '',
      '=== YOUR RULES ===',
      'ALWAYS ground your answer in the live data above. Never make up values.',
      'If a sensor reads outside safe range, flag it clearly.',
      'Be concise: 1-3 sentences max. English only.',
      'If a sensor is missing, say so rather than guessing.',
    ].join('\n');
  }

  // ── Smart fallback when Ollama is offline ──────────────────────────────────
  private sensorFallback(question: string, readings: any[], quality: { score: number; status: string } | null): string {
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

    // Generic fallback with live data + quality score
    const summary = [
      pH   ? `pH ${pH.value}`        : null,
      temp ? `${temp.value}°C`       : null,
      do2  ? `O₂ ${do2.value} mg/L`  : null,
      quality ? `quality ${quality.score}/100` : null,
    ].filter(Boolean).join(', ');

    return `Live tank data (${summary}) — my AI brain (Ollama) is offline. Start Ollama and run: ollama pull gemma3:4b to get full answers.`;
  }

  async getSessions() {
    return await this.sessionRepo.find({
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }
}
