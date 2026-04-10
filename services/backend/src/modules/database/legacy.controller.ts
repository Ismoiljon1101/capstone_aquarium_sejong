import { Controller, Get, Post, Query, Body, Logger } from '@nestjs/common';
import { IsOptional, IsBoolean } from 'class-validator';
import { SensorsService } from '../sensors/sensors.service';
import { ActuatorsService } from '../actuators/actuators.service';

class FeedDto {
  @IsOptional()
  @IsBoolean()
  state?: boolean;
}

class ScheduleDto {
  @IsOptional()
  cronExpression?: string;

  @IsOptional()
  label?: string;
}

/**
 * Controller to handle legacy dashboard routes directly.
 * Ensures backward compatibility with Hamidullo's frontend.
 */
@Controller()
export class LegacyController {
  private readonly logger = new Logger(LegacyController.name);

  constructor(
    private readonly sensorsService: SensorsService,
    private readonly actuatorsService: ActuatorsService,
  ) {}

  @Get('history')
  async getHistory(@Query('range') range: string) {
    return await this.sensorsService.getHistory(1, range || '24h');
  }

  @Get('latest')
  async getLatest() {
    return await this.sensorsService.getLatest();
  }

  @Get('status')
  async getStatus() {
    return { status: 'online', service: 'backend', version: '2.0.0-monorepo' };
  }

  @Post('feed')
  async triggerFeed(@Body() _body: FeedDto) {
    return await this.actuatorsService.triggerActuator({
      actuatorId: 1,
      type: 'FEEDER',
      relayChannel: 1,
      state: true,
      source: 'APP',
    });
  }

  @Post('schedule')
  async setSchedule(@Body() body: ScheduleDto) {
    this.logger.log('Legacy schedule request received');
    return { status: 'scheduled', ...body };
  }
}
