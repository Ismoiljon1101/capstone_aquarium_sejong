import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FishCount } from '../database/entities/fish-count.entity';
import { HealthReport } from '../database/entities/health-report.entity';
import { FishGrowth } from '../database/entities/fish-growth.entity';

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

  async generateDailyReport() {
    this.logger.log('Generating daily fish health report...');
    return await this.saveHealthReport('good', 'normal', 'Daily automated report: Fish appear healthy and active.');
  }

  async getLatestCount() {
    return await this.fishCountRepo.findOne({
      order: { timestamp: 'DESC' },
    });
  }

  async getLatestReport() {
    return await this.healthReportRepo.findOne({
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
