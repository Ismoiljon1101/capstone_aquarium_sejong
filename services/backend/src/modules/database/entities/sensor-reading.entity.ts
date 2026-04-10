import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('sensor_readings')
export class SensorReadingEntity {
  @PrimaryGeneratedColumn()
  readingId: number;

  @Column()
  @Index()
  sensorId: number;

  @Column()
  @Index()
  type: string; // pH, temp_c, do_mg_l, CO2

  @Column('float')
  value: number;

  @Column()
  unit: string;

  @Column({ default: 'ok' })
  status: string; // ok, warn, critical

  @CreateDateColumn()
  @Index()
  timestamp: Date;
}
