import { Controller, Post, Body, Logger } from '@nestjs/common';
import { SerialService } from './serial.service';
import type { ActuatorCommand, SensorReading } from '@fishlinic/types';

@Controller('serial')
export class SerialController {
  private readonly logger = new Logger(SerialController.name);

  constructor(private readonly serialService: SerialService) {}

  /**
   * Receives sensor readings forwarded by the serial bridge
   */
  @Post('reading')
  async handleReading(@Body() reading: SensorReading) {
    this.logger.debug(`Received reading: ${reading.type}=${reading.value}`);
    await this.serialService.processReading(reading);
    return { success: true };
  }

  /**
   * Endpoint for manual/legacy actuator commands
   */
  @Post('command')
  async handleCommand(@Body() command: ActuatorCommand) {
    this.logger.log(`Received actuator command: ${command.type} -> ${command.state}`);
    return await this.serialService.sendCommand(command);
  }
}
