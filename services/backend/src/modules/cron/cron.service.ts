import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SensorsService } from '../sensors/sensors.service';
import { VisionService } from '../vision/vision.service';
import { ActuatorsService } from '../actuators/actuators.service';
import { FishService } from '../fish/fish.service';
import { AlertsService } from '../alerts/alerts.service';
import { ActuatorCommand } from '@fishlinic/types';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private sensors: SensorsService,
    private vision: VisionService,
    private actuators: ActuatorsService,
    private fish: FishService,
    private alerts: AlertsService,
  ) {}

  @Cron('*/1 * * * *')
  async checkSensorThresholds() {
    this.logger.log('Checking sensor thresholds...');
    await this.sensors.checkThresholds();
  }

  @Cron('*/5 * * * *')
  async runVisionAnalysis() {
    this.logger.log('Running automated vision analysis (count + behavior)...');
    try {
      await this.vision.runFullAnalysis('CRON');
    } catch (error) {
      this.logger.error(`Automated vision analysis failed: ${error.message}`);
      await this.alerts.createAlert({
        sensorId: 0,
        tankId: 1,
        type: 'SYSTEM',
        severity: 'WARNING',
        message: `Automated vision analysis failed: ${error.message}`,
      });
    }
  }

  @Cron('0 */8 * * *')
  async triggerAutoFeed() {
    this.logger.log('Triggering automated fish feeding...');
    const command: ActuatorCommand = {
      actuatorId: 1,
      type: 'FEEDER',
      relayChannel: 1,
      state: true,
      source: 'CRON',
    };
    await this.actuators.triggerActuator(command);
  }

  @Cron('0 6 * * *')
  async dailyHealthReport() {
    this.logger.log('Generating daily automated health report...');
    await this.fish.generateDailyReport();
  }

  @Cron('0 7 * * *')
  async fishGrowthMonitor() {
    this.logger.log('Running daily fish growth comparison...');
    try {
      const result = await this.vision.runFullAnalysis('CRON_GROWTH');
      if (result.count?.count > 0) {
        await this.fish.saveGrowthRecord(result.count.count * 2.1, result.count.count);
      }
    } catch (error) {
      this.logger.error(`Fish growth monitor failed: ${error.message}`);
    }
  }

  @Cron('0 0 * * 0')
  async weeklyExport() {
    this.logger.log('Generating weekly JSONL export...');
    try {
      const [sensorHistory, healthHistory, growthHistory] = await Promise.all([
        this.sensors.getHistory(0, '1w'),
        this.fish.getHealthHistory(),
        this.fish.getGrowthHistory(),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        sensors: sensorHistory,
        health: healthHistory,
        growth: growthHistory,
      };

      this.logger.log(`Weekly export generated: ${JSON.stringify(exportData).length} bytes`);
      return exportData;
    } catch (error) {
      this.logger.error(`Weekly export failed: ${error.message}`);
      await this.alerts.createAlert({
        sensorId: 0,
        tankId: 1,
        type: 'SYSTEM',
        severity: 'WARNING',
        message: `Weekly export failed: ${error.message}`,
      });
    }
  }

  @Cron('*/30 * * * *')
  async checkEmergencyConditions() {
    this.logger.log('Performing deep emergency conditions check...');
    await this.alerts.checkEmergencyConditions();
  }
}
