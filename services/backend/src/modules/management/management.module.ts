import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManagementService } from './management.service';
import { ManagementController } from './management.controller';
import { SchedulerService } from './scheduler.service';
import { FeedScheduleEntity } from '../database/entities/feed-schedule.entity';
import { LightScheduleEntity } from '../database/entities/light-schedule.entity';
import { TankConfigEntity } from '../database/entities/tank-config.entity';
import { ActuatorsModule } from '../actuators/actuators.module';
import { SensorsModule } from '../sensors/sensors.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FeedScheduleEntity, LightScheduleEntity, TankConfigEntity]),
    ActuatorsModule,
    SensorsModule,
    AlertsModule,
  ],
  controllers: [ManagementController],
  providers: [ManagementService, SchedulerService],
  exports: [ManagementService],
})
export class ManagementModule {}
