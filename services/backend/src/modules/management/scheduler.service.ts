import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ManagementService } from './management.service';
import { ActuatorsService } from '../actuators/actuators.service';
import { SensorsService } from '../sensors/sensors.service';
import { AlertsService } from '../alerts/alerts.service';

/**
 * Dynamic scheduler.
 * Wakes every 60s and:
 *   1. Fires any feed schedule whose HH:MM matches now (and that hasn't already
 *      fired this minute) on the correct weekday.
 *   2. Toggles LED based on the configured on/off times.
 *   3. Checks emergency thresholds against the latest sensor readings.
 *   4. Once per hour, checks the cleaning reminder interval.
 *
 * All triggers go through the existing ActuatorsService.triggerActuator(), so
 * when real hardware is plugged into the serial bridge nothing else changes.
 */
@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SchedulerService.name);
  private timer: NodeJS.Timeout | null = null;
  private lastLedState: boolean | null = null;
  private lastCleanCheckHour = -1;

  constructor(
    private readonly mgmt: ManagementService,
    private readonly actuators: ActuatorsService,
    private readonly sensors: SensorsService,
    private readonly alerts: AlertsService,
  ) {}

  onModuleInit() {
    this.logger.log('Dynamic scheduler started (60s tick)');
    this.tick().catch(e => this.logger.error(`tick failed: ${e.message}`));
    this.timer = setInterval(
      () => this.tick().catch(e => this.logger.error(`tick failed: ${e.message}`)),
      60000,
    );
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private hhmm(d: Date) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  private async tick() {
    const now = new Date();
    const currHHMM = this.hhmm(now);
    const dayBit = 1 << now.getDay(); // 0=Sun … 6=Sat

    await Promise.all([
      this.checkFeedSchedules(now, currHHMM, dayBit),
      this.checkLightSchedule(currHHMM),
      this.checkEmergency(),
      this.checkCleaningReminder(now),
    ]);
  }

  // ── Feed ──────────────────────────────────────────────────────────────────
  private async checkFeedSchedules(now: Date, currHHMM: string, dayBit: number) {
    const schedules = await this.mgmt.listFeedSchedules();
    for (const s of schedules) {
      if (!s.enabled) continue;
      if ((s.daysMask & dayBit) === 0) continue;
      if (s.time !== currHHMM) continue;
      // Don't double-fire within the same minute
      if (s.lastFiredAt && now.getTime() - new Date(s.lastFiredAt).getTime() < 55_000) continue;

      this.logger.log(`Firing scheduled feed #${s.id} at ${s.time} (${s.portionSec}s)`);
      await this.actuators.triggerActuator({
        actuatorId: 1, type: 'FEEDER', relayChannel: 1, state: true, source: 'CRON',
      });
      await this.mgmt.markFeedFired(s.id);
    }
  }

  // ── Light ─────────────────────────────────────────────────────────────────
  private async checkLightSchedule(currHHMM: string) {
    const cfg = await this.mgmt.getLightSchedule();
    if (!cfg.enabled) return;

    // Determine whether light should currently be ON based on on/off window.
    const shouldBeOn = this.inWindow(currHHMM, cfg.onTime, cfg.offTime);

    if (this.lastLedState === shouldBeOn) return; // no state change
    this.lastLedState = shouldBeOn;

    this.logger.log(`Light schedule → LED ${shouldBeOn ? 'ON' : 'OFF'} (brightness ${cfg.brightness}, ${cfg.color})`);
    await this.actuators.triggerActuator({
      actuatorId: 3, type: 'LED_STRIP', relayChannel: 3, state: shouldBeOn, source: 'CRON',
    });
  }

  /** Window check supporting overnight ranges (e.g. 22:00–06:00). */
  private inWindow(curr: string, start: string, end: string): boolean {
    if (start === end) return false;
    if (start < end) return curr >= start && curr < end;
    return curr >= start || curr < end; // overnight
  }

  // ── Emergency ─────────────────────────────────────────────────────────────
  private async checkEmergency() {
    const cfg = await this.mgmt.getTankConfig();
    const readings = await this.sensors.getLatest();

    const get = (t: string) => readings.find(r => r.type === t);
    const temp = get('temp_c');
    const ph   = get('pH');
    const do2  = get('do_mg_l');

    const issues: string[] = [];
    if (temp && (temp.value > cfg.emergencyTempMax || temp.value < cfg.emergencyTempMin))
      issues.push(`temp ${temp.value}°C outside [${cfg.emergencyTempMin}, ${cfg.emergencyTempMax}]`);
    if (ph && (ph.value > cfg.emergencyPhMax || ph.value < cfg.emergencyPhMin))
      issues.push(`pH ${ph.value} outside [${cfg.emergencyPhMin}, ${cfg.emergencyPhMax}]`);
    if (do2 && do2.value < cfg.emergencyDoMin)
      issues.push(`DO ${do2.value} mg/L below ${cfg.emergencyDoMin}`);

    if (!issues.length) return;

    await this.alerts.createAlert({
      sensorId: 0,
      tankId: 1,
      type: 'EMERGENCY',
      severity: 'CRITICAL',
      message: `Emergency: ${issues.join('; ')}`,
    });
  }

  // ── Cleaning reminder ─────────────────────────────────────────────────────
  private async checkCleaningReminder(now: Date) {
    if (now.getHours() === this.lastCleanCheckHour) return;
    this.lastCleanCheckHour = now.getHours();

    const cfg = await this.mgmt.getTankConfig();
    if (!cfg.lastCleanedAt) return; // never cleaned, don't spam — wait until user marks first time

    const ageMs = now.getTime() - new Date(cfg.lastCleanedAt).getTime();
    const dueMs = cfg.cleaningIntervalDays * 24 * 60 * 60 * 1000;
    if (ageMs < dueMs) return;

    const overdueDays = Math.floor((ageMs - dueMs) / (24 * 60 * 60 * 1000));
    await this.alerts.createAlert({
      sensorId: 0,
      tankId: 1,
      type: 'MAINTENANCE',
      severity: 'WARNING',
      message: `Cleaning reminder: tank cleaning is overdue by ${overdueDays} day(s).`,
    });
  }
}
