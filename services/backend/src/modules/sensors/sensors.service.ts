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

  async saveReading(reading: SensorReading): Promise<SensorReadingEntity> {
    const status = this.evaluateReading(reading);
    const entity = this.sensorRepository.create({
      ...reading,
      status,
      timestamp: new Date(reading.timestamp),
    });

    const saved = await this.sensorRepository.save(entity);

    // Emit real-time update
    this.gateway.emitSensorUpdate({
      ...reading,
      status: status as SensorReading['status'],
    });

    // Trigger alert + appropriate actuator response
    if (status !== 'ok') {
      const actuatorCommand = this.resolveActuatorForSensor(reading.type);
      if (actuatorCommand) {
        await this.actuators.triggerActuator(actuatorCommand);
      }
      await this.alertsService.createAlert({
        sensorId: reading.sensorId,
        tankId: 1,
        type: reading.type,
        severity: (status === 'critical' ? 'CRITICAL' : 'WARNING') as AlertSeverity,
        message: `${reading.type} level is ${status}: ${reading.value}${reading.unit}`,
      });
    }

    return saved;
  }

  async getLatest(): Promise<SensorReadingEntity[]> {
    // Must match the actual type strings stored by firmware: pH, temp_c, do_mg_l, CO2
    const types = ['pH', 'temp_c', 'do_mg_l', 'CO2'];
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

  async getHistory(
    sensorId: number,
    range: string,
    page: number = 1,
    limit: number = 200,
  ): Promise<SensorReadingEntity[]> {
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
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  /**
   * Public check for Cron integration.
   * Fetches latest readings and evaluates them.
   */
  async checkThresholds(): Promise<void> {
    const latest = await this.getLatest();
    latest.forEach(r => this.evaluateReading(r as unknown as SensorReading));
  }

  /**
   * Maps sensor type to the appropriate actuator response.
   * Returns null if no automated actuator action is needed.
   */
  private resolveActuatorForSensor(type: string): ActuatorCommand | null {
    const map: Record<string, ActuatorCommand> = {
      do_mg_l: { actuatorId: 2, type: 'AIR_PUMP', relayChannel: 2, state: true, source: 'CRON' },
      CO2: { actuatorId: 2, type: 'AIR_PUMP', relayChannel: 2, state: true, source: 'CRON' },
    };
    return map[type] ?? null;
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
