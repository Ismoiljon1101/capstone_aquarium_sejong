import { Controller, Post, Get, Body } from '@nestjs/common';
import { ActuatorsService } from './actuators.service';
import { ActuatorType } from '@fishlinic/types';

@Controller('actuators')
export class ActuatorsController {
  constructor(private readonly actuatorsService: ActuatorsService) {}

  @Post('feed')
  async triggerFeeder(@Body() body: { duration: number; userId?: string }) {
    return await this.actuatorsService.triggerActuator({
      actuatorId: 1,
      type: 'FEEDER',
      relayChannel: 1,
      state: true,
      source: 'APP',
    });
  }

  @Post('pump')
  async togglePump(@Body() body?: { state?: boolean }) {
    // If state is not provided, we should ideally fetch it and toggle, 
    // but for now we default to true to at least prevent a crash.
    const newState = body?.state ?? true;
    return await this.actuatorsService.triggerActuator({
      actuatorId: 2,
      type: 'AIR_PUMP',
      relayChannel: 2,
      state: newState,
      source: 'APP',
    });
  }

  @Post('led')
  async toggleLed(@Body() body?: { state?: boolean }) {
    const newState = body?.state ?? true;
    return await this.actuatorsService.triggerActuator({
      actuatorId: 3,
      type: 'LED_STRIP',
      relayChannel: 3,
      state: newState,
      source: 'APP',
    });
  }

  @Get('state')
  async getState() {
    return await this.actuatorsService.getState();
  }

  @Post('emergency-off')
  async emergencyOff() {
    await this.actuatorsService.emergencyOff();
    return { status: 'emergency_handled' };
  }
}
