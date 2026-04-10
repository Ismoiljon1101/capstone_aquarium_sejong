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

  async getWaterQualityScore(readings: Record<string, number>) {
    const { data } = await firstValueFrom(
      this.http.post(`${this.aiUrl}/predict/quality`, readings),
    );
    return data;
  }

  async runFullAnalysis(triggeredBy: string = 'MANUAL') {
    this.logger.log('Starting full vision analysis pipeline...');

    try {
      // 1. Snapshot
      const snapshot = await this.requestSnapshot(triggeredBy);

      // 2. Sensors context
      const latestSensors = await this.sensors.getLatest();
      const sensorMap = latestSensors.reduce<Record<string, number>>(
        (acc, s) => ({ ...acc, [s.type]: s.value }),
        {},
      );

      // 3. AI Calls (parallel, with individual error tolerance)
      const [disease, count, behavior, quality] = await Promise.all([
        this.detectDisease(snapshot.imagePath).catch(() => ({ disease: 'unknown', confidence: 0 })),
        this.countFish(snapshot.imagePath).catch(() => ({ count: 0, confidence: 0 })),
        this.detectBehavior(snapshot.imagePath).catch(() => ({ status: 'unknown' })),
        this.getWaterQualityScore(sensorMap).catch(() => ({ score: 0 })),
      ]);

      // 4. Persistence
      const savedCount = await this.fish.saveCount(count.count, count.confidence);
      const report = await this.fish.saveHealthReport(
        disease.disease,
        behavior.status,
        `AI Report: ${disease.disease} detected with ${Math.round(disease.confidence * 100)}% confidence. Behavior is ${behavior.status}.`,
      );

      // 5. Emit — map entity fields to shared interface shape
      this.gateway.emitFishCount({
        count: savedCount.count,
        timestamp: savedCount.timestamp.toISOString(),
        snapshotId: savedCount.snapshotId,
      });
      this.gateway.emitHealthReport({
        reportId: report.reportId,
        phStatus: report.phStatus as 'ok' | 'warn' | 'critical',
        tempStatus: report.tempStatus as 'ok' | 'warn' | 'critical',
        doStatus: report.doStatus as 'ok' | 'warn' | 'critical',
        visualStatus: report.visualStatus as 'ok' | 'warn' | 'critical',
        behaviorStatus: report.behaviorStatus as 'ok' | 'warn' | 'critical',
        createdAt: report.timestamp.toISOString(),
      });

      return {
        snapshotId: snapshot.snapshotId,
        disease,
        count,
        behavior,
        quality,
        reportId: (report as { reportId: number }).reportId,
      };
    } catch (error) {
      this.logger.error(`Vision analysis pipeline failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getLatestReport() {
    return await this.fish.getLatestReport();
  }
}
