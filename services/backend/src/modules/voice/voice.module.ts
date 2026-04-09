import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { VoiceController } from './voice.controller';
import { VoiceService } from './voice.service';
import { VoiceSessionEntity } from '../database/entities/voice-session.entity';
import { SensorsModule } from '../sensors/sensors.module';
import { VisionModule } from '../vision/vision.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    TypeOrmModule.forFeature([VoiceSessionEntity]),
    SensorsModule,
    VisionModule,
  ],
  controllers: [VoiceController],
  providers: [VoiceService],
  exports: [VoiceService],
})
export class VoiceModule {}
