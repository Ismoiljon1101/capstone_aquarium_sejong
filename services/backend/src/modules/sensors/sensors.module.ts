import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SensorsService } from './sensors.service';
import { SensorsController } from './sensors.controller';
import { SensorReadingEntity } from '../database/entities/sensor-reading.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SensorReadingEntity])],
  controllers: [SensorsController],
  providers: [SensorsService],
  exports: [SensorsService],
})
export class SensorsModule {}
