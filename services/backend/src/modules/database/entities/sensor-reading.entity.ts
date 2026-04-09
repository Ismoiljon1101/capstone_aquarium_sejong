import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('sensor_readings')
export class SensorReadingEntity {
  @PrimaryGeneratedColumn()
  readingId: number;

  @Column()
  sensorId: number;

  @Column()
  type: string; // pH, TEMP, DO2, CO2

  @Column('float')
  value: number;

  @Column()
  unit: string;

  @Column({ default: 'ok' })
  status: string; // ok, warn, critical

  @CreateDateColumn()
  timestamp: Date;
}
