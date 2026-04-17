import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeedScheduleEntity } from '../database/entities/feed-schedule.entity';
import { LightScheduleEntity } from '../database/entities/light-schedule.entity';
import { TankConfigEntity } from '../database/entities/tank-config.entity';

@Injectable()
export class ManagementService {
  private readonly logger = new Logger(ManagementService.name);

  constructor(
    @InjectRepository(FeedScheduleEntity)
    private readonly feedRepo: Repository<FeedScheduleEntity>,
    @InjectRepository(LightScheduleEntity)
    private readonly lightRepo: Repository<LightScheduleEntity>,
    @InjectRepository(TankConfigEntity)
    private readonly configRepo: Repository<TankConfigEntity>,
  ) {}

  // ── Feed schedules ────────────────────────────────────────────────────────
  async listFeedSchedules() {
    return this.feedRepo.find({ order: { time: 'ASC' } });
  }

  async createFeedSchedule(dto: Partial<FeedScheduleEntity>) {
    const entity = this.feedRepo.create({
      time: dto.time ?? '08:00',
      daysMask: dto.daysMask ?? 127,
      portionSec: dto.portionSec ?? 3,
      enabled: dto.enabled ?? true,
    });
    return this.feedRepo.save(entity);
  }

  async updateFeedSchedule(id: number, dto: Partial<FeedScheduleEntity>) {
    const existing = await this.feedRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException(`feed schedule ${id} not found`);
    Object.assign(existing, dto);
    return this.feedRepo.save(existing);
  }

  async deleteFeedSchedule(id: number) {
    const result = await this.feedRepo.delete(id);
    return { deleted: result.affected ?? 0 };
  }

  // ── Light schedule (singleton) ────────────────────────────────────────────
  async getLightSchedule() {
    let row = await this.lightRepo.findOne({ where: { id: 1 } });
    if (row) return row;
    try {
      row = await this.lightRepo.save(this.lightRepo.create({ id: 1 }));
    } catch {
      // Race with another caller that just inserted id=1 — re-fetch
      row = await this.lightRepo.findOne({ where: { id: 1 } });
    }
    return row!;
  }

  async updateLightSchedule(dto: Partial<LightScheduleEntity>) {
    const row = await this.getLightSchedule();
    Object.assign(row, dto);
    return this.lightRepo.save(row);
  }

  // ── Tank config (singleton) ───────────────────────────────────────────────
  async getTankConfig() {
    let row = await this.configRepo.findOne({ where: { id: 1 } });
    if (row) return row;
    try {
      row = await this.configRepo.save(this.configRepo.create({ id: 1 }));
    } catch {
      // Race with another caller — re-fetch
      row = await this.configRepo.findOne({ where: { id: 1 } });
    }
    return row!;
  }

  async updateTankConfig(dto: Partial<TankConfigEntity>) {
    const row = await this.getTankConfig();
    Object.assign(row, dto);
    return this.configRepo.save(row);
  }

  async markCleaned() {
    const row = await this.getTankConfig();
    row.lastCleanedAt = new Date();
    return this.configRepo.save(row);
  }

  /** Helper for SchedulerService */
  async markFeedFired(id: number) {
    await this.feedRepo.update(id, { lastFiredAt: new Date() });
  }
}
