import { Controller, Get, Patch, Param, ParseIntPipe, Query } from '@nestjs/common';
import { AlertsService } from './alerts.service';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  async listAll(@Query('active') active: string) {
    const activeOnly = active === 'true';
    return await this.alertsService.listAlerts(activeOnly);
  }

  @Get('active')
  async listActive() {
    return await this.alertsService.listAlerts(true);
  }

  @Patch(':id/acknowledge')
  async acknowledge(@Param('id', ParseIntPipe) id: number) {
    await this.alertsService.acknowledgeAlert(id);
    return { status: 'acknowledged' };
  }
}
