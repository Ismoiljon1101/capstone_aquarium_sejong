import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

/**
 * Singleton tank configuration (id=1). Holds thresholds, reminder intervals,
 * and emergency safety bounds that the user can edit from the mobile app.
 */
@Entity('tank_config')
export class TankConfigEntity {
  @PrimaryColumn({ default: 1 })
  id: number;

  // Cleaning reminder
  @Column({ default: 14 })
  cleaningIntervalDays: number;

  @Column({ nullable: true })
  lastCleanedAt: Date;

  // Emergency safety thresholds (override evaluator defaults if set)
  @Column('float', { default: 30.0 })
  emergencyTempMax: number;

  @Column('float', { default: 20.0 })
  emergencyTempMin: number;

  @Column('float', { default: 4.0 })
  emergencyDoMin: number;

  @Column('float', { default: 6.0 })
  emergencyPhMin: number;

  @Column('float', { default: 8.5 })
  emergencyPhMax: number;

  // Push notification token (Expo)
  @Column({ nullable: true })
  pushToken: string;

  @Column({ default: true })
  pushEnabled: boolean;

  @UpdateDateColumn()
  updatedAt: Date;
}
