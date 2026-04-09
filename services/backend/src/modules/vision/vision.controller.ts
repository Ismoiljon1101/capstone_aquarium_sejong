import { Controller, Post, Get, Body } from '@nestjs/common';
import { VisionService } from './vision.service';

@Controller('vision')
export class VisionController {
  constructor(private readonly visionService: VisionService) {}

  @Post('analyze')
  async analyze(@Body('triggeredBy') triggeredBy?: string) {
    return await this.visionService.runFullAnalysis(triggeredBy || 'MANUAL');
  }

  @Get('latest-report')
  async getLatestReport() {
    return await this.visionService.getLatestReport();
  }
}
