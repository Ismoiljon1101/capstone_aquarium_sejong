import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('actuator_events')
export class ActuatorEventEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: string; // 'FEEDER' | 'AIR_PUMP' | 'LED_STRIP'

  @Column()
  state: boolean;

  @Column()
  source: string; // 'APP' | 'AGENT' | 'CRON' | 'SERIAL'

  @Column({ nullable: true })
  reason: string;

  @CreateDateColumn()
  timestamp: Date;
}
