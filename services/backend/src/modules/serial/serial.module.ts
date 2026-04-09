import { Module } from '@nestjs/common';
import { SerialService } from './serial.service';
import { SerialController } from './serial.controller';
import { SensorsModule } from '../sensors/sensors.module';

import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [SensorsModule, HttpModule, ConfigModule],
  controllers: [SerialController],
  providers: [SerialService],
})
export class SerialModule {}
