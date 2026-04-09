import { Controller, Post, Body, Logger } from '@nestjs/common';
import { SerialService } from './serial.service';
import type { ActuatorCommand } from '@fishlinic/types';

@Controller('actuators')
export class SerialController {
  private readonly logger = new Logger(SerialController.name);

  constructor(private readonly serialService: SerialService) {}

  /**
   * Endpoint for manual/legacy commands
   */
  @Post('command')
  async handleCommand(@Body() command: ActuatorCommand) {
    this.logger.log(`Received actuator command: ${command.type} -> ${command.state}`);
    return await this.serialService.sendCommand(command);
  }
}
