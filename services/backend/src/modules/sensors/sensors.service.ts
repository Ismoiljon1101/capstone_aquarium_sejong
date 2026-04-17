import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { SensorReadingEntity } from '../database/entities/sensor-reading.entity';
import { SensorReading, AlertSeverity, ActuatorCommand } from '@fishlinic/types';
import { AlertsService } from '../alerts/alerts.service';
import { GatewayGateway } from '../gateway/gateway.gateway';
import { ActuatorsService } from '../actuators/actuators.service';

@Injectable()
export class SensorsService {
  private readonly logger = new Logger(SensorsService.name);

  constructor(
    @InjectRepository(SensorReadingEntity)
    private readonly sensorRepository: Repository<SensorReadingEntity>,
    private readonly alertsService: AlertsService,
    private readonly gateway: GatewayGateway,
    private readonly actuators: ActuatorsService,
  ) {}

  async saveReading(reading: Partial<SensorReading>): Promise<SensorReadingEntity> {
    const status = this.evaluateReading(reading as any);
    const entity = this.sensorRepository.create({
      sensorId: reading.sensorId ?? 1,
      type: reading.type ?? 'UNKNOWN',
      value: reading.value ?? 0,
      unit: reading.unit ?? 'N/A',
      status,
      timestamp: reading.timestamp ? new Date(reading.timestamp) : new Date(),
    });

    const saved = await this.sensorRepository.save(entity);
    const sensorId = reading.sensorId ?? 1;
    const type = reading.type ?? 'UNKNOWN';

    this.gateway.emitSensorUpdate({
      ...reading,
      sensorId,
      type,
      value: reading.value ?? 0,
      unit: reading.unit ?? 'N/A',
      status: status as any,
    } as any);

    if (status !== 'ok') {
      await this.alertsService.createAlert({
        sensorId,
        tankId: 1,
        type: String(type),
        severity: (status === 'critical' ? 'CRITICAL' : 'WARNING') as AlertSeverity,
        message: `${type} level is ${status}: ${reading.value}${reading.unit}`,
      });
    }

    return saved;
  }

  async getLatest(): Promise<SensorReadingEntity[]> {
    const types = ['pH', 'TEMP', 'DO2', 'CO2'];
    const results = await Promise.all(
      types.map(type =>
        this.sensorRepository.findOne({
          where: { type },
          order: { timestamp: 'DESC' },
        }),
      ),
    );
    return results.filter(r => r !== null) as SensorReadingEntity[];
  }

  async getHistory(sensorId: number, range: string): Promise<SensorReadingEntity[]> {
    const now = new Date();
    let from = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    if (range === '1w') from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (range === '1m') from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return await this.sensorRepository.find({
      where: {
        sensorId,
        timestamp: Between(from, now),
      },
      order: { timestamp: 'ASC' },
      take: 5000,
    });
  }

  async checkThresholds(): Promise<void> {
    const latest = await this.getLatest();
    latest.forEach(r => this.evaluateReading(r as any));
  }

  private evaluateReading(reading: SensorReading): string {
    const { type, value } = reading;
    if (type === 'pH') {
      if (value < 6.5 || value > 8.0) return 'critical';
      if (value < 6.8 || value > 7.5) return 'warn';
    }
    if (type === 'temp_c') {
      if (value < 22 || value > 30) return 'critical';
      if (value < 24 || value > 28) return 'warn';
    }
    if (type === 'do_mg_l') {
      if (value < 4) return 'critical';
      if (value < 6) return 'warn';
    }
    return 'ok';
  }
}
