import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { seedDatabase } from './seed';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private dataSource: DataSource) {}

  /**
   * Automatically run database seeding when database module starts up.
   */
  async onModuleInit() {
    this.logger.log('DatabaseModule initialized. Triggering startup database seeding checks...');
    await seedDatabase(this.dataSource);
  }

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
