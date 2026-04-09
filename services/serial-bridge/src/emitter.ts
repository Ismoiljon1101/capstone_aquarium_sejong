import axios from 'axios';
import { SensorReading } from '../../shared/types/sensor.types';

/**
 * Emitter for forwarding data from serial-bridge to the NestJS backend.
 */
export class Emitter {
  private backendUrl: string;

  constructor(backendUrl: string) {
    this.backendUrl = backendUrl;
  }

  /**
   * Forwards a sensor reading to the main backend.
   */
  public async forwardReading(reading: Partial<SensorReading>): Promise<void> {
    try {
      await axios.post(`${this.backendUrl}/serial/reading`, reading);
    } catch (error) {
      console.error('[Emitter] Failed to forward reading:', error.message);
    }
  }

  /**
   * Forwards an actuator state change to the main backend.
   */
  public async forwardActuatorState(actuatorId: number, state: boolean): Promise<void> {
    try {
      await axios.post(`${this.backendUrl}/actuators/state`, {
        actuatorId,
        state,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[Emitter] Failed to forward actuator state:', error.message);
    }
  }
}
