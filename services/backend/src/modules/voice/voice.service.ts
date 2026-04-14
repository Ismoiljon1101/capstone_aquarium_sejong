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

  constructor(
    private http: HttpService,
    private config: ConfigService,
    private sensors: SensorsService,
    @InjectRepository(VoiceSessionEntity)
    private sessionRepo: Repository<VoiceSessionEntity>,
  ) {
    this.ollamaUrl = this.config.get('OLLAMA_URL') ?? 'http://localhost:11434';
    this.model = this.config.get('OLLAMA_MODEL') ?? 'qwen2.5:3b';
  }

  async handleQuery(text: string, snapshotId?: number) {
    this.logger.log(`Processing voice query: "${text}"`);
    
    // 1. Get real-time sensor context
    const latestReadings = await this.sensors.getLatest();
    const sensorContext = latestReadings.map(r => `${r.type}: ${r.value}${r.unit}`).join(', ');

    // 2. Build prompt
    const prompt = this.buildPrompt(text, sensorContext);

    // Strip client-side context prefix (mobile injects it, backend re-fetches live)
    const cleanText = text.replace(/^\[Live tank data[^\]]*\]\s*User:\s*/i, '').trim();

    // 3. Call Ollama
    try {
      const t0 = Date.now();
      const res = await firstValueFrom(
        this.http.post<{ message: { content: string } }>(`${this.ollamaUrl}/api/chat`, {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `You are Veronica, a smart aquarium AI. Be concise and helpful. Current tank readings: ${sensorContext || 'unavailable'}. Answer in 1-3 sentences. English only.`,
            },
            { role: 'user', content: cleanText },
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

      return aiResponse;
    } catch (error) {
      this.logger.error(`Ollama error: ${error.message}`);

      // Smart fallback: answer from real sensor data without LLM
      return this.sensorFallback(cleanText, latestReadings);
    }
  }

  private sensorFallback(question: string, readings: any[]): string {
    const get = (type: string) => readings.find(r => r.type?.toLowerCase() === type.toLowerCase());
    const pH   = get('pH');
    const temp = get('TEMP') ?? get('temp_c');
    const do2  = get('DO2') ?? get('do_mg_l');
    const co2  = get('CO2');

    const hasData = readings.length > 0;

    if (!hasData) {
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
        : "Temperature sensor data not available yet.";
    }
    if (/oxygen|o2|do|dissolv/.test(q)) {
      return do2
        ? `Dissolved oxygen is ${do2.value} mg/L — ${do2.status === 'ok' ? 'good (safe range 6–9 mg/L).' : `⚠️ ${do2.status}.`}`
        : "Dissolved oxygen data not available yet.";
    }
    if (/status|ok|fine|good|health|safe|all/.test(q)) {
      const issues = [pH, temp, do2, co2].filter(s => s && s.status !== 'ok');
      if (issues.length === 0) {
        return `All sensors look good! pH ${pH?.value ?? '–'}, temp ${temp?.value ?? '–'}°C, O₂ ${do2?.value ?? '–'} mg/L. Your tank is healthy.`;
      }
      return `I see ${issues.length} issue(s): ${issues.map(s => `${s.type} is ${s.status}`).join(', ')}. I'd check those.`;
    }

    // Generic fallback with live data
    const summary = [
      pH   ? `pH ${pH.value}`   : null,
      temp ? `${temp.value}°C`  : null,
      do2  ? `O₂ ${do2.value} mg/L` : null,
    ].filter(Boolean).join(', ');

    return `I can see your live tank data (${summary}) but my AI brain (Ollama) is offline right now. Start Ollama and run: ollama pull qwen2.5:3b to get full answers.`;
  }

  private buildPrompt(text: string, sensors: string): string {
    return `User: "${text}"\nCurrent tank: ${sensors}\nAnswer briefly using the data if relevant.`;
  }

  async getSessions() {
    return await this.sessionRepo.find({
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }
}
