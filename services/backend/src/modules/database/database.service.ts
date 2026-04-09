import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private dataSource: DataSource) {}

  /**
   * Performs a database health check and returns connection stats.
   */
  async getHealth() {
    try {
      const isConnected = this.dataSource.isInitialized;
      const entities = this.dataSource.entityMetadatas.length;
      
      this.logger.log(`Database health check: ${isConnected ? 'OK' : 'FAIL'}`);
      
      return {
        status: isConnected ? 'up' : 'down',
        entitiesCount: entities,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Database health check failed:', error.message);
      return { status: 'down', error: error.message };
    }
  }

  /**
   * Utility to clear temporary logs (Maintenance).
   */
  async runMaintenance() {
    this.logger.log('Running database maintenance tasks...');
    // Implementation for vacuum/cleanup could go here
    return { success: true, task: 'cleanup' };
  }
}
