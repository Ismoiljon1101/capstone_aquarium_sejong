import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SensorsService } from './sensors.service';
import { SensorsSimulator } from './sensors.simulator';
import { SensorsController } from './sensors.controller';
import { SensorReadingEntity } from '../database/entities/sensor-reading.entity';

import { AlertsModule } from '../alerts/alerts.module';
import { GatewayModule } from '../gateway/gateway.module';
import { ActuatorsModule } from '../actuators/actuators.module';

import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([SensorReadingEntity]),
    AlertsModule,
    GatewayModule,
    ActuatorsModule,
    HttpModule,
    ConfigModule,
  ],
  controllers: [SensorsController],
  providers: [SensorsService, SensorsSimulator],
  exports: [SensorsService],
})
export class SensorsModule {}
