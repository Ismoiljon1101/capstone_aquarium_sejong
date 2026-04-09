import { Controller, Post, Get, Body } from '@nestjs/common';
import { VoiceService } from './voice.service';

@Controller('voice')
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @Post('query')
  async handleQuery(
    @Body('text') text: string,
    @Body('snapshotId') snapshotId?: number,
  ) {
    const response = await this.voiceService.handleQuery(text, snapshotId);
    return { response };
  }

  @Get('sessions')
  async getSessions() {
    return await this.voiceService.getSessions();
  }
}
