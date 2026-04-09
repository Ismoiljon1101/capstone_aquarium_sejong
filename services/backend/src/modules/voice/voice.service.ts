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

    // 3. Call Ollama
    try {
      const { data } = await firstValueFrom(
        this.http.post(`${this.ollamaUrl}/api/chat`, {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are Veronica, an AI assistant for a smart aquarium. Provide short, helpful answers based on current status. Only English.',
            },
            { role: 'user', content: prompt },
          ],
          stream: false,
        }),
      );

      const aiResponse = data.message?.content ?? 'I am sorry, but I cannot process that right now.';

      // 4. Persist session
      const session = this.sessionRepo.create({
        transcribedText: text,
        aiResponse,
        snapshotId,
        wakeWordAt: new Date(),
      });
      await this.sessionRepo.save(session);

      return aiResponse;
    } catch (error) {
      this.logger.error(`Ollama connection error: ${error.message}`);
      return 'I am having trouble connecting to my brain. Please check if Ollama is running.';
    }
  }

  private buildPrompt(text: string, sensors: string): string {
    return `User: "${text}"
Current Status: ${sensors}
Instructions: Answer the user's question briefly using the provided data if relevant.`;
  }

  async getSessions() {
    return await this.sessionRepo.find({
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }
}
