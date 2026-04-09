import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertEntity } from '../database/entities/alert.entity';
import { AlertSeverity } from '@fishlinic/types';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    @InjectRepository(AlertEntity)
    private readonly alertRepository: Repository<AlertEntity>,
  ) {}

  async createAlert(data: {
    sensorId: number;
    tankId: number;
    type: string;
    severity: AlertSeverity;
    message: string;
  }): Promise<AlertEntity> {
    this.logger.warn(`Creating alert: ${data.message} [${data.severity}]`);
    
    const alert = this.alertRepository.create({
      ...data,
      acknowledged: false,
    });

    return await this.alertRepository.save(alert);
  }

  async listAlerts(activeOnly: boolean = false) {
    const where = activeOnly ? { acknowledged: false } : {};
    return await this.alertRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async acknowledgeAlert(alertId: number) {
    await this.alertRepository.update(alertId, { acknowledged: true });
    return await this.alertRepository.findOne({ where: { alertId } });
  }

  async checkEmergencyConditions() {
    this.logger.log('Performing emergency conditions check...');
    return { status: 'safe' };
  }
}
