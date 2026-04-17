import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SensorsService } from './sensors.service';

/**
 * Demo sensor simulator.
 * Pushes realistic readings for all 4 sensor types every 8s so getLatest()
 * always returns a complete set (pH, temp_c, do_mg_l, CO2). Disabled when
 * SIMULATE_SENSORS=false. Real serial bridge readings still take precedence
 * because they're saved through the same path.
 */
@Injectable()
export class SensorsSimulator implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SensorsSimulator.name);
  private timer: NodeJS.Timeout | null = null;

  // Drifting baselines for natural variation
  private state = { pH: 6.95, temp_c: 26.4, do_mg_l: 7.4, CO2: 18 };

  constructor(
    private readonly sensors: SensorsService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    const enabled = (this.config.get('SIMULATE_SENSORS') ?? 'true') !== 'false';
    if (!enabled) return;
    this.logger.log('Sensor simulator enabled (every 8s) — set SIMULATE_SENSORS=false to disable');
    // Seed immediately so /sensors/latest is populated before first request.
    this.tick();
    this.timer = setInterval(() => this.tick(), 8000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private drift(curr: number, min: number, max: number, step: number) {
    const next = curr + (Math.random() - 0.5) * step;
    return Math.max(min, Math.min(max, next));
  }

  private async tick() {
    this.state.pH      = this.drift(this.state.pH,      6.7, 7.4, 0.06);
    this.state.temp_c  = this.drift(this.state.temp_c,  24.5, 27.8, 0.18);
    this.state.do_mg_l = this.drift(this.state.do_mg_l, 6.2, 8.4, 0.15);
    this.state.CO2     = this.drift(this.state.CO2,     12, 32, 1.2);

    const now = new Date();
    const readings = [
      { sensorId: 1, type: 'pH',      value: +this.state.pH.toFixed(2),      unit: 'pH'   },
      { sensorId: 2, type: 'temp_c',  value: +this.state.temp_c.toFixed(1),  unit: '°C'   },
      { sensorId: 3, type: 'do_mg_l', value: +this.state.do_mg_l.toFixed(2), unit: 'mg/L' },
      { sensorId: 4, type: 'CO2',     value: Math.round(this.state.CO2),     unit: 'ppm'  },
    ];

    for (const r of readings) {
      try {
        await this.sensors.saveReading({ ...r, timestamp: now } as any);
      } catch (e: any) {
        this.logger.warn(`simulator save failed for ${r.type}: ${e.message}`);
      }
    }
  }
}
