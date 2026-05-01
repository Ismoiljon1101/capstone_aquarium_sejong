import { Controller, Post, Get, Body } from '@nestjs/common';
import { VoiceService } from './voice.service';
import { AgentService } from './agent.service';
import type { ToolName } from './agent.types';

@Controller('voice')
export class VoiceController {
  constructor(
    private readonly voiceService: VoiceService,
    private readonly agentService: AgentService,
  ) {}

  @Post('query')
  async handleQuery(
    @Body('text') text: string,
    @Body('snapshotId') snapshotId?: number,
  ) {
    return await this.voiceService.handleQuery(text, snapshotId);
  }

  // Agent: reason + propose (no side effects until /agent/confirm)
  @Post('agent')
  async runAgent(@Body('text') text: string) {
    return await this.agentService.run(text);
  }

  // Agent: execute a confirmed write action
  @Post('agent/confirm')
  async confirmAction(
    @Body('tool') tool: ToolName,
    @Body('args') args: Record<string, unknown>,
  ) {
    return await this.agentService.executeConfirmedAction(tool, args);
  }

  @Get('sessions')
  async getSessions() {
    return await this.voiceService.getSessions();
  }
}
