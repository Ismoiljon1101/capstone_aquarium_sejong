import { Module } from '@nestjs/common';
import { SerialService } from './serial.service';
import { SerialController } from './serial.controller';
import { SensorsModule } from '../sensors/sensors.module';

@Module({
  imports: [SensorsModule],
  controllers: [SerialController],
  providers: [SerialService],
})
export class SerialModule {}
