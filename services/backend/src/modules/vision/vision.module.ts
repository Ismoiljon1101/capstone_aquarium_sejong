import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { VisionController } from './vision.controller';
import { VisionService } from './vision.service';
import { CameraSnapshotEntity } from '../database/entities/camera-snapshot.entity';
import { FishModule } from '../fish/fish.module';
import { SensorsModule } from '../sensors/sensors.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    TypeOrmModule.forFeature([CameraSnapshotEntity]),
    FishModule,
    SensorsModule,
    GatewayModule,
  ],
  controllers: [VisionController],
  providers: [VisionService],
  exports: [VisionService],
})
export class VisionModule {}
