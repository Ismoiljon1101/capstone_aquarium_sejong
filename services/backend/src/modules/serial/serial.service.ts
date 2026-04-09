import { Injectable, Logger } from '@nestjs/common';
import { SensorReading, ActuatorCommand } from '@fishlinic/types';
import { SensorsService } from '../sensors/sensors.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SerialService {
  private readonly logger = new Logger(SerialService.name);
  private readonly bridgeUrl: string;

  constructor(
    private readonly sensorsService: SensorsService,
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.bridgeUrl = this.config.get('SERIAL_BRIDGE_URL') ?? 'http://localhost:3001';
  }

  async processReading(reading: SensorReading): Promise<void> {
    await this.sensorsService.saveReading(reading);
  }

  async sendCommand(command: ActuatorCommand): Promise<any> {
    this.logger.log(`Forwarding command to serial bridge: ${command.type}`);
    const { data } = await firstValueFrom(
      this.http.post(`${this.bridgeUrl}/command`, command),
    );
    return data;
  }
}
