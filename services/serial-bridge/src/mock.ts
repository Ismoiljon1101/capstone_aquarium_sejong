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
        pH: parseFloat((7.0 + (Math.random() * 0.4 - 0.2)).toFixed(2)),
        temp_c: parseFloat((26.0 + (Math.random() * 2 - 1)).toFixed(1)),
        do_mg_l: parseFloat((7.5 + (Math.random() * 1.5 - 0.75)).toFixed(2)),
        timestamp: new Date().toISOString()
      };
      this.onData(JSON.stringify(data));
    }, 3000); // Send data every 3 seconds
  }

  public stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
