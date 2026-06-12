import { Controller, Post, Get, Delete, Body, Param } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { VoiceService } from './voice.service';
import { AgentService } from './agent.service';
import type { ToolName } from './agent.types';

@Controller('voice')
export class VoiceController {
  constructor(
    private readonly voiceService: VoiceService,
    private readonly agentService: AgentService,
    private readonly config: ConfigService,
  ) {}

  @Get('status')
  getLlmStatus() {
    const provider = this.config.get('LLM_PROVIDER') ?? 'openrouter';
    const model = provider === 'openrouter'
      ? (this.config.get('OPENROUTER_MODEL') ?? 'google/gemini-2.0-flash-lite:free')
      : (this.config.get('OLLAMA_MODEL') ?? 'batiai/gemma4-e4b:q4');
    return {
      provider,
      model,
      hasKey: !!this.config.get('OPENROUTER_API_KEY'),
    };
  }

  @Post('query')
  async handleQuery(
    @Body('text') text: string,
    @Body('snapshotId') snapshotId?: number,
  ) {
    return await this.voiceService.handleQuery(text, snapshotId);
  }

  // Agent: reason + propose (no side effects until /agent/confirm)
  @Post('agent')
  async runAgent(@Body('text') text: string, @Body('sessionId') sessionId?: string) {
    return await this.agentService.run(text, sessionId);
  }

  // Session management
  @Post('sessions/new')
  newSession() {
    return { sessionId: randomUUID() };
  }

  @Get('sessions/:id/messages')
  async getSessionMessages(@Param('id') id: string) {
    return await this.agentService.getSessionMessages(id);
  }

  @Delete('sessions/:id')
  async deleteSession(@Param('id') id: string) {
    await this.agentService.deleteSession(id);
    return { success: true };
  }

  // Agent: execute a confirmed write action
  @Post('agent/confirm')
  async confirmAction(
    @Body('tool') tool: ToolName,
    @Body('args') args: Record<string, unknown>,
    @Body('sessionId') sessionId?: string,
  ) {
    return await this.agentService.executeConfirmedAction(tool, args, sessionId);
  }

  @Get('sessions')
  async getSessions() {
    return await this.voiceService.getSessions();
  }

  @Get('chat-sessions')
  async listChatSessions() {
    return await this.agentService.listChatSessions();
  }
}
