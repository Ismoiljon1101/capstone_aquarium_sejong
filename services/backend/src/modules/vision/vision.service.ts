import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { SensorsService } from '../sensors/sensors.service';
import { FishService } from '../fish/fish.service';
import { GatewayGateway } from '../gateway/gateway.gateway';
import { CameraSnapshotEntity } from '../database/entities/camera-snapshot.entity';

@Injectable()
export class VisionService {
  private readonly logger = new Logger(VisionService.name);
  private aiUrl: string;
  private bridgeUrl: string;

  constructor(
    private http: HttpService,
    private config: ConfigService,
    private sensors: SensorsService,
    private fish: FishService,
    private gateway: GatewayGateway,
    @InjectRepository(CameraSnapshotEntity)
    private snapshotRepo: Repository<CameraSnapshotEntity>,
  ) {
    this.aiUrl = this.config.get('AI_PREDICTOR_URL') ?? 'http://localhost:8000';
    this.bridgeUrl = this.config.get('SERIAL_BRIDGE_URL') ?? 'http://localhost:3001';
  }

  async requestSnapshot(triggeredBy: string = 'MANUAL'): Promise<CameraSnapshotEntity> {
    this.logger.log(`Requesting snapshot triggered by: ${triggeredBy}`);
    const { data } = await firstValueFrom(
      this.http.post(`${this.bridgeUrl}/camera/snapshot`),
    );
    
    const snapshot = this.snapshotRepo.create({
      imagePath: data.imagePath,
      triggeredBy,
    });
    return await this.snapshotRepo.save(snapshot);
  }

  async detectDisease(imagePath: string) {
    const { data } = await firstValueFrom(
      this.http.post(`${this.aiUrl}/predict/disease`, { imagePath }),
    );
    return data;
  }

  async countFish(imagePath: string) {
    const { data } = await firstValueFrom(
      this.http.post(`${this.aiUrl}/predict/count`, { imagePath }),
    );
    return data;
  }

  async detectBehavior(imagePath: string) {
    const { data } = await firstValueFrom(
      this.http.post(`${this.aiUrl}/predict/behavior`, { imagePath }),
    );
    return data;
  }

  async getWaterQualityScore(readings: any) {
    const { data } = await firstValueFrom(
      this.http.post(`${this.aiUrl}/predict/quality`, readings),
    );
    return data;
  }

  async runFullAnalysis(triggeredBy: string = 'MANUAL') {
    this.logger.log('Starting full vision analysis pipeline...');
    
    // 1. Snapshot
    const snapshot = await this.requestSnapshot(triggeredBy);
    
    // 2. Sensors context
    const latestSensors = await this.sensors.getLatest();
    const sensorMap = latestSensors.reduce((acc, s) => ({ ...acc, [s.type]: s.value }), {});

    // 3. AI Calls
    const [disease, count, behavior, quality] = await Promise.all([
      this.detectDisease(snapshot.imagePath),
      this.countFish(snapshot.imagePath),
      this.detectBehavior(snapshot.imagePath),
      this.getWaterQualityScore(sensorMap),
    ]);

    // 4. Persistence
    const savedCount = await this.fish.saveCount(count.count, count.confidence);
    const report = await this.fish.saveHealthReport(
      disease.disease,
      behavior.status,
      `AI Report: ${disease.disease} detected with ${Math.round(disease.confidence * 100)}% confidence. Behavior is ${behavior.status}.`,
    );

    // 5. Emit
    this.gateway.emitFishCount(savedCount as any);
    this.gateway.emitHealthReport(report as any);

    return { 
      snapshotId: snapshot.snapshotId,
      disease, 
      count, 
      behavior, 
      quality,
      reportId: (report as any).reportId 
    };
  }

  async getLatestReport() {
    return await this.fish.getLatestReport();
  }
}
