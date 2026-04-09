import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('alerts')
export class AlertEntity {
  @PrimaryGeneratedColumn()
  alertId: number;

  @Column()
  sensorId: number;

  @Column()
  tankId: number;

  @Column()
  type: string;

  @Column()
  severity: string; // INFO, WARNING, CRITICAL, EMERGENCY

  @Column('text')
  message: string;

  @Column({ default: false })
  acknowledged: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
