import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('api/status')
  getStatus() {
    return {
      project: 'Aquaman',
      status: 'Online',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}
