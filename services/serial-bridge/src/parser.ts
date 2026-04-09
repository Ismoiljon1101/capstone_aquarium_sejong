import { SensorReading } from '../../shared/types/sensor.types';

/**
 * Parser for Arduino serial data.
 * Expects JSON format from hardware.
 */
export class SerialParser {
  /**
   * Parses a single line of serial data.
   * Format: {"pH":7.12,"do_mg_l":7.8,"temp_c":26.4}
   */
  public parse(line: string): Partial<SensorReading>[] {
    try {
      if (!line.startsWith('{')) return [];
      
      const data = JSON.parse(line);
      const timestamp = new Date().toISOString();
      const readings: Partial<SensorReading>[] = [];

      // Map Arduino JSON fields to SensorReading interface
      if (data.pH !== undefined) {
        readings.push({ type: 'pH', value: data.pH, timestamp, unit: 'pH' });
      }
      if (data.temp_c !== undefined) {
        readings.push({ type: 'temp_c', value: data.temp_c, timestamp, unit: '°C' });
      }
      if (data.do_mg_l !== undefined) {
        readings.push({ type: 'do_mg_l', value: data.do_mg_l, timestamp, unit: 'mg/L' });
      }

      return readings;
    } catch (error) {
      console.error('[Parser] JSON parse error:', error.message);
      return [];
    }
  }
}
