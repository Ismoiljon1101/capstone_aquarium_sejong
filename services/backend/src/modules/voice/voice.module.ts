import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { VoiceController } from './voice.controller';
import { VoiceService } from './voice.service';
import { AgentService } from './agent.service';
import { AgentMonitorService } from './agent.monitor';
import { VoiceSessionEntity } from '../database/entities/voice-session.entity';
import { SensorsModule } from '../sensors/sensors.module';
import { VisionModule } from '../vision/vision.module';
import { ActuatorsModule } from '../actuators/actuators.module';
import { ManagementModule } from '../management/management.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    TypeOrmModule.forFeature([VoiceSessionEntity]),
    SensorsModule,
    VisionModule,
    ActuatorsModule,
    ManagementModule,
  ],
  controllers: [VoiceController],
  providers: [VoiceService, AgentService, AgentMonitorService],
  exports: [VoiceService, AgentService],
})
export class VoiceModule {}
