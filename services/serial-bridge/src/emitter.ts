import axios from 'axios';
type BridgeSensorReading = {
  sensorId: number;
  type: 'pH' | 'temp_c' | 'do_mg_l' | 'CO2';
  value: number;
  unit: string;
  timestamp: string;
};

export class Emitter {
  private backendUrl: string;

  constructor(backendUrl: string) {
    this.backendUrl = backendUrl;
  }

  public async forwardReading(reading: BridgeSensorReading): Promise<void> {
    try {
      await axios.post(`${this.backendUrl}/serial/reading`, reading);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[Emitter] Failed to forward reading:', message);
    }
  }
}
