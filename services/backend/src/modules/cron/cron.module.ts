import { Module } from '@nestjs/common';
import { CronController } from './cron.controller';
import { CronService } from './cron.service';
import { SensorsModule } from '../sensors/sensors.module';
import { VisionModule } from '../vision/vision.module';
import { ActuatorsModule } from '../actuators/actuators.module';
import { FishModule } from '../fish/fish.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [
    SensorsModule,
    VisionModule,
    ActuatorsModule,
    FishModule,
    AlertsModule,
  ],
  controllers: [CronController],
  providers: [CronService],
})
export class CronModule {}
