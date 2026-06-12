import { Controller, Post, Get, Body, Res } from '@nestjs/common';
import type { Response } from 'express';
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

  @Get('latest')
  async getLatest() {
    return this.visionService.getLatestSummary();
  }

  @Get('cameras')
  async getCameras() {
    return await this.visionService.getCameras();
  }

  @Post('cameras/refresh')
  async refreshCameras() {
    return await this.visionService.refreshCameras();
  }

  @Post('camera')
  async setCamera(@Body('uid') uid?: string) {
    return await this.visionService.selectCamera(uid);
  }

  @Get('stream/status')
  async getStreamStatus() {
    return await this.visionService.getStreamStatus();
  }

  @Get('stream')
  async getStream(@Res() res: Response) {
    await this.visionService.proxyStream(res);
  }
}
