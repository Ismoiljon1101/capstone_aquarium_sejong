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
      // sensorId: 1=pH, 2=temp, 3=DO, 4=CO2
      if (data.pH !== undefined) {
        readings.push({ sensorId: 1, type: 'pH', value: Number(data.pH), timestamp, unit: 'pH' });
      }
      if (data.temp_c !== undefined) {
        readings.push({ sensorId: 2, type: 'temp_c', value: Number(data.temp_c), timestamp, unit: '°C' });
      }
      if (data.do_mg_l !== undefined) {
        readings.push({ sensorId: 3, type: 'do_mg_l', value: Number(data.do_mg_l), timestamp, unit: 'mg/L' });
      }
      if (data.CO2 !== undefined) {
        readings.push({ sensorId: 4, type: 'CO2', value: Number(data.CO2), timestamp, unit: 'ppm' });
      }

      return readings;
    } catch (error) {
      console.error('[Parser] JSON parse error:', error.message);
      return [];
    }
  }
}
