import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { AlertEntity } from '../database/entities/alert.entity';
import { ActuatorsModule } from '../actuators/actuators.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AlertEntity]),
    ActuatorsModule,
  ],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}
