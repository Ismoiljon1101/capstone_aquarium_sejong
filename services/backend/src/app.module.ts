import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SerialModule } from './modules/serial/serial.module';
import { SensorsModule } from './modules/sensors/sensors.module';
import { ActuatorsModule } from './modules/actuators/actuators.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { VisionModule } from './modules/vision/vision.module';
import { VoiceModule } from './modules/voice/voice.module';
import { FishModule } from './modules/fish/fish.module';
import { CronModule } from './modules/cron/cron.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { DatabaseModule } from './modules/database/database.module';
import { LegacyController } from './modules/database/legacy.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    SensorsModule,
    ActuatorsModule,
    AlertsModule,
    VisionModule,
    VoiceModule,
    FishModule,
    CronModule,
    GatewayModule,
  ],
  controllers: [AppController, LegacyController],
  providers: [AppService],
})
export class AppModule {}
