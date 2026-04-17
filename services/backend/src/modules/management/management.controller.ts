import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ManagementService } from './management.service';
import { FeedScheduleEntity } from '../database/entities/feed-schedule.entity';
import { LightScheduleEntity } from '../database/entities/light-schedule.entity';
import { TankConfigEntity } from '../database/entities/tank-config.entity';

@Controller('management')
export class ManagementController {
  constructor(private readonly mgmt: ManagementService) {}

  // Feed schedules
  @Get('feed-schedules')
  listFeed() { return this.mgmt.listFeedSchedules(); }

  @Post('feed-schedules')
  createFeed(@Body() dto: Partial<FeedScheduleEntity>) { return this.mgmt.createFeedSchedule(dto); }

  @Patch('feed-schedules/:id')
  updateFeed(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<FeedScheduleEntity>) {
    return this.mgmt.updateFeedSchedule(id, dto);
  }

  @Delete('feed-schedules/:id')
  deleteFeed(@Param('id', ParseIntPipe) id: number) { return this.mgmt.deleteFeedSchedule(id); }

  // Light schedule
  @Get('light-schedule')
  getLight() { return this.mgmt.getLightSchedule(); }

  @Patch('light-schedule')
  updateLight(@Body() dto: Partial<LightScheduleEntity>) { return this.mgmt.updateLightSchedule(dto); }

  // Tank config
  @Get('tank-config')
  getConfig() { return this.mgmt.getTankConfig(); }

  @Patch('tank-config')
  updateConfig(@Body() dto: Partial<TankConfigEntity>) { return this.mgmt.updateTankConfig(dto); }

  @Post('tank-config/mark-cleaned')
  markCleaned() { return this.mgmt.markCleaned(); }
}
