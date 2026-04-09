import { Controller, Get } from '@nestjs/common';
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
}
