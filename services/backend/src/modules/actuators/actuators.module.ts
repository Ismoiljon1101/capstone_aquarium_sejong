import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ActuatorsService } from './actuators.service';
import { ActuatorsController } from './actuators.controller';
import { UserCommandEntity } from '../database/entities/user-command.entity';
import { ActuatorEventEntity } from '../database/entities/actuator-event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserCommandEntity, ActuatorEventEntity]),
    ConfigModule,
  ],
  controllers: [ActuatorsController],
  providers: [ActuatorsService],
  exports: [ActuatorsService],
})
export class ActuatorsModule {}
