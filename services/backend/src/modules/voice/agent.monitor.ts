import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { SensorsService } from '../sensors/sensors.service';
import { ManagementService } from '../management/management.service';
import { PushService } from '../push/push.service';
import { AgentService } from './agent.service';

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const SAFE_RANGES = {
  pH:     { min: 6.8, max: 7.5 },
  TEMP:   { min: 24,  max: 28  },
  DO2:    { min: 6,   max: 9   },
  CO2:    { min: 0,   max: 40  },
};

@Injectable()
export class AgentMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AgentMonitorService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly sensors: SensorsService,
    private readonly management: ManagementService,
    private readonly agent: AgentService,
    private readonly push: PushService,
  ) {}

  onModuleInit() {
    // Stagger first check by 30s so backend fully starts before agent fires
    setTimeout(() => this.check(), 30_000);
    this.timer = setInterval(() => this.check(), CHECK_INTERVAL_MS);
    this.logger.log('Agent monitor started — checking every 5 minutes');
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async check() {
    try {
      const config = await this.management.getTankConfig();
      if (!config.agentMonitorEnabled) return;

      const readings = await this.sensors.getLatest();
      if (!readings.length) return;

      const issues = this.detectIssues(readings);
      if (!issues.length) {
        this.logger.debug('Monitor check: all sensors OK');
        return;
      }

      this.logger.log(`Monitor detected issues: ${issues.join(', ')}`);

      const prompt = `You are monitoring the tank in the background. Detected: ${issues.join('; ')}. Analyze and recommend the best corrective action.`;
      const result = await this.agent.run(prompt);

      if (!result.pendingAction) {
        this.logger.log(`Agent assessment: ${result.response}`);
        return;
      }

      const { pendingAction } = result;
      this.logger.log(`Agent proposes: ${pendingAction.tool} — ${pendingAction.reason}`);

      if (config.agentMode === 'auto') {
        const exec = await this.agent.executeConfirmedAction(pendingAction.tool, pendingAction.args);
        this.logger.log(`Auto-executed ${pendingAction.tool}: ${exec.message}`);
        if (config.pushEnabled) {
          await this.push.send(config.pushToken, '🤖 Veronica acted', exec.message);
        }
      } else {
        this.logger.log(`Confirm mode — proposing: "${result.response}"`);
        if (config.pushEnabled) {
          await this.push.send(config.pushToken, '🐟 Veronica suggests', result.response);
        }
      }
    } catch (err) {
      this.logger.error(`Monitor check failed: ${(err as Error).message}`);
    }
  }

  private detectIssues(readings: Array<{ type: string; value: number; status?: string }>): string[] {
    const issues: string[] = [];
    for (const r of readings) {
      const range = SAFE_RANGES[r.type as keyof typeof SAFE_RANGES];
      if (!range) continue;
      const v = Number(r.value);
      if (v < range.min) issues.push(`${r.type} low (${v.toFixed(2)}, min ${range.min})`);
      else if (v > range.max) issues.push(`${r.type} high (${v.toFixed(2)}, max ${range.max})`);
    }
    return issues;
  }
}
