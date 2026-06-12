import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { TankConfigEntity } from './entities/tank-config.entity';
import { LightScheduleEntity } from './entities/light-schedule.entity';

const logger = new Logger('DatabaseSeeder');

/**
 * Automatically seeds the database with default TankConfig and LightSchedule if they do not exist.
 * This ensures the application starts up with sane defaults and prevents null reference exceptions.
 */
export async function seedDatabase(dataSource: DataSource): Promise<void> {
  try {
    logger.log('Checking database seeding status...');

    // 1. Seed TankConfig (Singleton id=1)
    const tankConfigRepo = dataSource.getRepository(TankConfigEntity);
    const tankConfigCount = await tankConfigRepo.count();
    
    if (tankConfigCount === 0) {
      logger.log('No TankConfig found. Seeding default configuration (Singleton id=1)...');
      const defaultTankConfig = tankConfigRepo.create({
        id: 1,
        cleaningIntervalDays: 14,
        emergencyTempMax: 30.0,
        emergencyTempMin: 20.0,
        emergencyDoMin: 4.0,
        emergencyPhMin: 6.0,
        emergencyPhMax: 8.5,
        pushEnabled: true,
        agentMode: 'confirm',
        agentMonitorEnabled: true,
      });
      await tankConfigRepo.save(defaultTankConfig);
      logger.log('Default TankConfig successfully seeded.');
    } else {
      logger.log('TankConfig already populated.');
    }

    // 2. Seed LightSchedule
    const lightScheduleRepo = dataSource.getRepository(LightScheduleEntity);
    const lightScheduleCount = await lightScheduleRepo.count();

    if (lightScheduleCount === 0) {
      logger.log('No LightSchedule found. Seeding default 24h lighting schedule...');
      const defaultLightSchedule = lightScheduleRepo.create({
        id: 1,
        onTime: '07:00',
        offTime: '21:00',
        brightness: 80,
        color: '#ffffff',
        enabled: true,
      });
      await lightScheduleRepo.save(defaultLightSchedule);
      logger.log('Default LightSchedule successfully seeded.');
    } else {
      logger.log('LightSchedule already populated.');
    }

    // 3. Clean up ghost CO2 data if any exists
    try {
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      // Ensure the table exists before attempting to query
      const tableExists = await queryRunner.hasTable('sensor_readings');
      if (tableExists) {
        await queryRunner.query(`DELETE FROM "sensor_readings" WHERE UPPER("type") = 'CO2'`);
        logger.log('Cleaned up any legacy ghost CO2 sensor readings.');
      }
      await queryRunner.release();
    } catch (e) {
      logger.warn(`Could not run CO2 ghost data cleanup: ${e.message}`);
    }

    logger.log('Database seeding checks completed successfully.');
  } catch (error) {
    logger.error('Failed to check or seed database:', error.stack || error.message);
  }
}
