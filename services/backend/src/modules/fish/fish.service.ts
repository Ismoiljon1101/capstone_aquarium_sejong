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

  async saveCount(count: number, confidence: number) {
    const record = this.fishCountRepo.create({
      count,
      confidence,
      timestamp: new Date().toISOString(),
    });
    return await this.fishCountRepo.save(record);
  }

  async saveHealthReport(visualStatus: string, behaviorStatus: string, summary: string) {
    const report = this.healthReportRepo.create({
      phStatus: 'ok',
      tempStatus: 'ok',
      doStatus: 'ok',
      visualStatus,
      behaviorStatus,
      overallScore: 0.9,
      summary,
      timestamp: new Date().toISOString(),
    });
    return await this.healthReportRepo.save(report);
  }

  async saveGrowthRecord(avgSize: number, count: number) {
    // 1. Get previous record to calculate delta
    const lastRecord = await this.fishGrowthRepo.findOne({
      where: {},
      order: { createdAt: 'DESC' },
    });

    const delta = lastRecord ? avgSize - lastRecord.avgSizeEstimate : 0;

    // 2. Create new record
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
      visualStatus: isHealthy ? 'ok' : 'abnormal',
      behaviorStatus: 'ok',
      overallScore: data.confidence,
      summary: data.summary ?? `ML detected: ${data.diseaseClass} (${(data.confidence * 100).toFixed(1)}% confidence)`,
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
        severity: data.severity === 'High' ? 'critical' : 'warning' as any,
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
      severity: data.severity === 'High' ? 'critical' : 'warning' as any,
      message: data.message ?? `Water quality anomaly: ${data.anomalyType} (${data.severity})`,
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
    return await this.saveHealthReport('good', 'normal', 'Daily automated report: Fish appear healthy and active.');
  }

  async getLatestCount() {
    return await this.fishCountRepo.findOne({
      where: {},
      order: { timestamp: 'DESC' },
    });
  }

  async getLatestReport() {
    return await this.healthReportRepo.findOne({
      where: {},
      order: { timestamp: 'DESC' },
    });
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
