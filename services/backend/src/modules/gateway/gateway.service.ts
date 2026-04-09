import { Injectable, Logger } from '@nestjs/common';
import { GatewayGateway } from './gateway.gateway';

@Injectable()
export class GatewayService {
  private readonly logger = new Logger(GatewayService.name);

  constructor(private readonly gateway: GatewayGateway) {}

  /**
   * Broadcasts a global system notification to all connected clients.
   */
  broadcastSystemNotification(message: string, type: 'info' | 'warning' | 'alert' = 'info') {
    this.logger.log(`Broadcasting system notification: ${message}`);
    this.gateway.server.emit('system:notification', {
      message,
      type,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Returns current active connection count.
   */
  async getConnectionStats() {
    const sockets = await this.gateway.server.fetchSockets();
    return {
      activeConnections: sockets.length,
      timestamp: new Date().toISOString()
    };
  }
}
