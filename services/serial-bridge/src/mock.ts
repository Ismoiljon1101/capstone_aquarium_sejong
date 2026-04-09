/**
 * Mock data generator for development/testing without hardware.
 */
export class MockHardware {
  private interval: NodeJS.Timeout | null = null;
  private onData: (line: string) => void;

  constructor(onData: (line: string) => void) {
    this.onData = onData;
  }

  public start() {
    console.log('[Mock] Starting mock hardware simulation...');
    this.interval = setInterval(() => {
      const data = {
        pH: (7.0 + (Math.random() * 0.4 - 0.2)).toFixed(2),
        temp_c: (26.0 + (Math.random() * 2 - 1)).toFixed(1),
        do_mg_l: (7.5 + (Math.random() * 1.5 - 0.75)).toFixed(2),
        timestamp: new Date().toISOString()
      };
      this.onData(JSON.stringify(data));
    }, 2000); // Send data every 2 seconds
  }

  public stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
