import { io, Socket } from 'socket.io-client';

/**
 * // SERVICE: SocketService
 * // Purpose: Decouples Socket.IO lifecycle from the UI layer to maintain < 300 line files.
 * // Rule: Must be a singleton. Emits state updates via standard listeners.
 */
class SocketService {
  private socket: Socket | null = null;
  private backendUrl: string = 'http://localhost:3000';

  /**
   * // // Initialize the connection
   * // // Note: In 2026, we prefer static init to ensure singleton behavior
   */
  public connect() {
    if (!this.socket) {
      console.log('// Initializing Socket Connection to:', this.backendUrl);
      this.socket = io(this.backendUrl);
    }
    return this.socket;
  }

  /**
   * // // Standard listener wrapper
   */
  public on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * // // Safe disconnect logic
   */
  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * // // Generic emitter for commands (Feed, Pump, etc.)
   */
  public emit(event: string, payload: any) {
    if (this.socket) {
      this.socket.emit(event, payload);
    }
  }
}

// // Exporting as a singleton instance
export const socketService = new SocketService();
