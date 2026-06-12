import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FishCount } from '../database/entities/fish-count.entity';
import { HealthReport } from '../database/entities/health-report.entity';
import { FishGrowth } from '../database/entities/fish-growth.entity';
import { GatewayGateway } from '../gateway/gateway.gateway';
import { AlertsService } from '../alerts/alerts.service';

@Injectable()
export class FishService {
  private readonly logger = new Logger(FishService.name);

  constructor(
    @InjectRepository(FishCount)
    private fishCountRepo: Repository<FishCount>,
    @InjectRepository(HealthReport)
    private healthReportRepo: Repository<HealthReport>,
    @InjectRepository(FishGrowth)
    private fishGrowthRepo: Repository<FishGrowth>,
    private readonly gateway: GatewayGateway,
    private readonly alerts: AlertsService,
  ) {}

  async saveCount(count: number, confidence: number, snapshotId: number) {
    const record = this.fishCountRepo.create({
      snapshotId,
      count,
      confidence,
      timestamp: new Date(),
    });
    return await this.fishCountRepo.save(record);
  }

  async saveHealthReport(data: {
    snapshotId?: number;
    phStatus: string;
    tempStatus: string;
    doStatus: string;
    visualStatus: string;
    behaviorStatus: string;
    behaviorLabel?: string;
    behaviorConfidence?: number;
    overallScore: number;
    summary: string;
    diseaseClass?: string;
    mlConfidence?: number;
    severity?: string;
    source?: string;
  }) {
    const report = this.healthReportRepo.create({
      snapshotId: data.snapshotId,
      phStatus: data.phStatus,
      tempStatus: data.tempStatus,
      doStatus: data.doStatus,
      visualStatus: data.visualStatus,
      behaviorStatus: data.behaviorStatus,
      behaviorLabel: data.behaviorLabel,
      behaviorConfidence: data.behaviorConfidence,
      overallScore: data.overallScore,
      summary: data.summary,
      diseaseClass: data.diseaseClass,
      mlConfidence: data.mlConfidence,
      severity: data.severity,
      source: data.source ?? 'vision_pipeline',
      timestamp: new Date(),
    });
    return await this.healthReportRepo.save(report);
  }

  async saveGrowthRecord(avgSize: number, count: number) {
    const lastRecord = await this.fishGrowthRepo.findOne({
      where: {},
      order: { createdAt: 'DESC' },
    });

    const delta = lastRecord ? avgSize - lastRecord.avgSizeEstimate : 0;

    const growth = this.fishGrowthRepo.create({
      date: new Date().toISOString().split('T')[0],
      avgSizeEstimate: avgSize,
      count,
      deltaFromPrev: delta,
    });

    return await this.fishGrowthRepo.save(growth);
  }

  async saveDiagnosis(data: {
    diseaseClass: string;
    confidence: number;
    severity: string;
    fishId?: number;
    summary?: string;
  }): Promise<HealthReport> {
    const isHealthy = data.diseaseClass.toLowerCase() === 'healthy';
    const report = this.healthReportRepo.create({
      visualStatus: isHealthy ? 'ok' : 'warn',
      behaviorStatus: 'ok',
      overallScore: data.confidence,
      summary:
        data.summary ??
        `ML detected: ${data.diseaseClass} (${(data.confidence * 100).toFixed(1)}% confidence)`,
      diseaseClass: data.diseaseClass,
      mlConfidence: data.confidence,
      severity: data.severity,
      fishId: data.fishId,
      source: 'ml_model',
    });
    const saved = await this.healthReportRepo.save(report);
    this.gateway.emitHealthReport(saved as any);

    if (!isHealthy && data.severity !== 'Low') {
      await this.alerts.createAlert({
        sensorId: 0,
        tankId: 1,
        type: 'FISH_DISEASE',
        severity: data.severity === 'High' ? 'critical' : ('warning' as any),
        message: `Fish disease detected: ${data.diseaseClass} (${data.severity} severity, ${(data.confidence * 100).toFixed(1)}% confidence)`,
      });
    }
    return saved;
  }

  async saveAnomaly(data: {
    anomalyType: string;
    severity: string;
    readingId?: number;
    message?: string;
  }): Promise<void> {
    await this.alerts.createAlert({
      sensorId: data.readingId ?? 0,
      tankId: 1,
      type: 'WATER_ANOMALY',
      severity: data.severity === 'High' ? 'critical' : ('warning' as any),
      message:
        data.message ??
        `Water quality anomaly: ${data.anomalyType} (${data.severity})`,
    });
  }

  async getLatestDiagnoses(limit = 10): Promise<HealthReport[]> {
    return this.healthReportRepo.find({
      where: { source: 'ml_model' },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  async generateDailyReport() {
    this.logger.log('Generating daily fish health report...');
    return await this.saveHealthReport({
      phStatus: 'ok',
      tempStatus: 'ok',
      doStatus: 'ok',
      visualStatus: 'ok',
      behaviorStatus: 'ok',
      overallScore: 1,
      summary: 'Daily automated report placeholder.',
      source: 'manual',
    });
  }

  async getLatestCount() {
    const rows = await this.fishCountRepo.find({
      order: { timestamp: 'DESC' },
      take: 1,
    });
    return rows[0] ?? null;
  }

  async getLatestReport() {
    const rows = await this.healthReportRepo.find({
      order: { timestamp: 'DESC' },
      take: 1,
    });
    return rows[0] ?? null;
  }

  async getHealthHistory() {
    return await this.healthReportRepo.find({
      order: { timestamp: 'DESC' },
      take: 20,
    });
  }

  async getGrowthHistory() {
    return await this.fishGrowthRepo.find({
      order: { createdAt: 'DESC' },
      take: 30,
    });
  }
}
