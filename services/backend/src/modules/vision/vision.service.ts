import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom, timeout } from 'rxjs';
import { SensorsService } from '../sensors/sensors.service';
import { FishService } from '../fish/fish.service';
import { GatewayGateway } from '../gateway/gateway.gateway';
import { CameraSnapshotEntity } from '../database/entities/camera-snapshot.entity';

const AI_TIMEOUT_MS = 15000;

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
    this.aiUrl = this.config.get('AI_PREDICTOR_URL') ?? 'http://localhost:8001';
    this.bridgeUrl = this.config.get('SERIAL_BRIDGE_URL') ?? 'http://localhost:3001';
  }

  async requestSnapshot(triggeredBy: string = 'MANUAL'): Promise<CameraSnapshotEntity> {
    this.logger.log(`Requesting snapshot triggered by: ${triggeredBy}`);
    const { data } = await firstValueFrom(
      this.http.post(`${this.bridgeUrl}/camera/snapshot`).pipe(timeout(AI_TIMEOUT_MS)),
    );
    const snapshot = this.snapshotRepo.create({
      imagePath: data.imagePath,
      triggeredBy,
    });
    return await this.snapshotRepo.save(snapshot);
  }

  async detectDisease(imagePath: string) {
    const { data } = await firstValueFrom(
      this.http.post(`${this.aiUrl}/predict/disease`, { imagePath }).pipe(timeout(AI_TIMEOUT_MS)),
    );
    return data;
  }

  async countFish(imagePath: string) {
    const { data } = await firstValueFrom(
      this.http.post(`${this.aiUrl}/predict/count`, { imagePath }).pipe(timeout(AI_TIMEOUT_MS)),
    );
    return data;
  }

  async detectBehavior(imagePath: string) {
    try {
      const { data } = await firstValueFrom(
        this.http.post(`${this.aiUrl}/predict/behavior`, { imagePath }).pipe(timeout(AI_TIMEOUT_MS)),
      );
      return data;
    } catch (err) {
      // /predict/behavior may not be implemented in ai-predictor yet
      this.logger.warn(`detectBehavior failed — endpoint may not exist: ${err.message}`);
      return { status: 'unavailable', reason: 'behavior endpoint not implemented' };
    }
  }

  async getWaterQualityScore(readings: Record<string, number>) {
    const { data } = await firstValueFrom(
      this.http.post(`${this.aiUrl}/predict/quality`, readings).pipe(timeout(AI_TIMEOUT_MS)),
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

      if (!latestSensors || latestSensors.length === 0) {
        this.logger.warn('No sensor readings available — water quality score will be skipped');
      }

      const sensorMap = (latestSensors ?? []).reduce<Record<string, number>>(
        (acc, s) => ({ ...acc, [s.type]: s.value }),
        {},
      );

      const hasSensorData = Object.keys(sensorMap).length > 0;

      // 3. AI calls in parallel with individual error tolerance and timeout
      const [disease, count, behavior, quality] = await Promise.all([
        this.detectDisease(snapshot.imagePath).catch((err) => {
          this.logger.error(`detectDisease failed: ${err.message}`);
          return { disease: 'unknown', confidence: 0 };
        }),
        this.countFish(snapshot.imagePath).catch((err) => {
          this.logger.error(`countFish failed: ${err.message}`);
          return { count: 0, confidence: 0 };
        }),
        this.detectBehavior(snapshot.imagePath).catch((err) => {
          this.logger.error(`detectBehavior failed: ${err.message}`);
          return { status: 'unknown' };
        }),
        hasSensorData
          ? this.getWaterQualityScore(sensorMap).catch((err) => {
            this.logger.error(`getWaterQualityScore failed: ${err.message}`);
            return { score: 0, label: 'unknown' };
          })
          : Promise.resolve({ score: 0, label: 'no_sensor_data' }),
      ]);

      // 4. Persistence
      const savedCount = await this.fish.saveCount(count.count, count.confidence);

      const diseaseLabel = disease.disease ?? 'unknown';
      const behaviorStatus = behavior.status ?? 'unknown';
      const confidencePct = Math.round((disease.confidence ?? 0) * 100);

      const report = await this.fish.saveHealthReport(
        diseaseLabel,
        behaviorStatus,
        `AI Report: ${diseaseLabel} detected with ${confidencePct}% confidence. Behavior: ${behaviorStatus}.`,
      );

      // 5. Emit to connected clients
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
        hasSensorData,
        reportId: report.reportId,
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