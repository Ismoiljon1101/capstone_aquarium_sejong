import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { SensorsService } from './sensors.service';

@Controller('sensors')
export class SensorsController {
  constructor(private readonly sensorsService: SensorsService) {}

  @Get('latest')
  async getLatest() {
    return await this.sensorsService.getLatest();
  }

  @Get('history')
  async getAllHistory(@Query('range') range: string) {
    return await this.sensorsService.getAllHistory(range || '24h');
  }

  @Get(':id/readings')
  async getHistory(
    @Param('id', ParseIntPipe) id: number,
    @Query('range') range: string,
  ) {
    return await this.sensorsService.getHistory(id, range || '24h');
  }

  @Get()
  async listAll() {
    // For now returning the latest snapshot as the sensor list
    return await this.sensorsService.getLatest();
  }
}
