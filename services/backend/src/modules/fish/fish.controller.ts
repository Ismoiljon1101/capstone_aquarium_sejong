import { Controller, Get, Post, Body } from '@nestjs/common';
import { FishService } from './fish.service';

@Controller('fish')
export class FishController {
  constructor(private readonly fishService: FishService) {}

  @Get('count')
  async getLatestCount() {
    return await this.fishService.getLatestCount();
  }

  @Get('growth')
  async getGrowthHistory() {
    return await this.fishService.getGrowthHistory();
  }

  @Get('health')
  async getLatestReport() {
    return await this.fishService.getLatestReport();
  }

  @Get('health/history')
  async getHealthHistory() {
    return await this.fishService.getHealthHistory();
  }

  @Get('diagnoses')
  async getLatestDiagnoses() {
    return await this.fishService.getLatestDiagnoses();
  }

  // Called by Maral's Python disease detection script
  @Post('diagnosis')
  async postDiagnosis(@Body() body: {
    diseaseClass: string;
    confidence: number;
    severity: string;
    fishId?: number;
    summary?: string;
  }) {
    return await this.fishService.saveDiagnosis(body);
  }

  // Called by Maral's Python water anomaly detection script
  @Post('anomaly')
  async postAnomaly(@Body() body: {
    anomalyType: string;
    severity: string;
    readingId?: number;
    message?: string;
  }) {
    await this.fishService.saveAnomaly(body);
    return { success: true };
  }
}
