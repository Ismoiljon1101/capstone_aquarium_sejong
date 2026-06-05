import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AppService {
  constructor(private readonly config: ConfigService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getServiceHealth() {
    const predictorUrl = this.config.get('AI_PREDICTOR_URL') ?? 'http://localhost:8001';
    const openRouterKey = this.config.get('OPENROUTER_API_KEY') ?? '';
    const openRouterUrl = this.config.get('OPENROUTER_BASE_URL') ?? 'https://openrouter.ai/api/v1';
    const ollamaUrl = this.config.get('OLLAMA_URL') ?? 'http://localhost:11434';
    const model =
      this.config.get('OPENROUTER_MODEL') ??
      this.config.get('OLLAMA_MODEL') ??
      'deepseek/deepseek-chat-v3.1';
    const provider = openRouterKey ? 'openrouter' : 'ollama';

    const [predictor, llm] = await Promise.all([
      axios.get(`${predictorUrl}/health`, { timeout: 3000 })
        .then(() => ({ status: 'online' as const }))
        .catch(() => ({ status: 'offline' as const })),
      this.getLlmHealth({ provider, openRouterKey, openRouterUrl, ollamaUrl, model }),
    ]);

    return {
      backend: { status: 'online' as const },
      predictor,
      llm,
    };
  }

  // Mobile checks one backend endpoint, so backend owns the provider-specific health logic here.
  private async getLlmHealth(options: {
    provider: 'openrouter' | 'ollama';
    openRouterKey: string;
    openRouterUrl: string;
    ollamaUrl: string;
    model: string;
  }) {
    const { provider, openRouterKey, openRouterUrl, ollamaUrl, model } = options;

    if (provider === 'openrouter') {
      return await axios.get(`${openRouterUrl}/models`, {
        timeout: 5000,
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          'HTTP-Referer': 'https://fishlinic.local',
          'X-Title': 'Fishlinic',
        },
      })
        .then(() => ({ status: 'online' as const, provider, model }))
        .catch(() => ({ status: 'offline' as const, provider, model }));
    }

    return await axios.get(`${ollamaUrl}/api/tags`, { timeout: 3000 })
      .then(() => ({ status: 'online' as const, provider, model }))
      .catch(() => ({ status: 'offline' as const, provider, model }));
  }
}
