import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserCommandEntity } from '../database/entities/user-command.entity';
import { ActuatorCommand, ActuatorType } from '@fishlinic/types';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ActuatorsService {
  private readonly logger = new Logger(ActuatorsService.name);
  private readonly bridgeUrl: string;

  constructor(
    @InjectRepository(UserCommandEntity)
    private readonly commandRepository: Repository<UserCommandEntity>,
    private readonly configService: ConfigService,
  ) {
    this.bridgeUrl = this.configService.get<string>('SERIAL_BRIDGE_URL') || 'http://localhost:3001';
  }

  async triggerActuator(command: ActuatorCommand): Promise<{ success: boolean; data?: unknown }> {
    this.logger.log(`Triggering actuator ${command.type} (ID: ${command.actuatorId}) to state: ${command.state}`);

    // Log the command to the database
    const entity = this.commandRepository.create({
      actuatorId: command.actuatorId,
      commandType: command.type,
      source: command.source,
      payload: { state: command.state, relayChannel: command.relayChannel },
      createdAt: new Date(),
    });
    const savedCommand = await this.commandRepository.save(entity);

    try {
      // Forward command to the serial-bridge
      const response = await axios.post(`${this.bridgeUrl}/actuate`, command);

      // Update execution timestamp
      savedCommand.executedAt = new Date();
      await this.commandRepository.save(savedCommand);

      return { success: true, data: response.data };
    } catch (error) {
      this.logger.error(`Failed to forward command to serial-bridge: ${error.message}`);
      return { success: false };
    }
  }

  async getState(): Promise<{ status: string; message?: string }> {
    try {
      const response = await axios.get(`${this.bridgeUrl}/status`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch state from serial-bridge: ${error.message}`);
      return { status: 'error', message: 'Bridge offline' };
    }
  }

  async emergencyOff(): Promise<void> {
    this.logger.warn('EMERGENCY OFF TRIGGERED');
    const actuators: Array<{ id: number; type: ActuatorType; channel: number }> = [
      { id: 1, type: 'FEEDER', channel: 1 },
      { id: 2, type: 'AIR_PUMP', channel: 2 },
      { id: 3, type: 'LED_STRIP', channel: 3 },
    ];

    await Promise.all(
      actuators.map(a =>
        this.triggerActuator({
          actuatorId: a.id,
          type: a.type,
          relayChannel: a.channel,
          state: false,
          source: 'EMERGENCY',
        }),
      ),
    );
  }
}
