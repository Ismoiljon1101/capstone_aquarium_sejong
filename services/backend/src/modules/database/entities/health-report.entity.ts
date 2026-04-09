import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('health_reports')
export class HealthReport {
  @PrimaryGeneratedColumn()
  reportId: number;

  @Column({ nullable: true })
  snapshotId: number;

  @Column({ default: 'ok' })
  phStatus: string;

  @Column({ default: 'ok' })
  tempStatus: string;

  @Column({ default: 'ok' })
  doStatus: string;

  @Column()
  visualStatus: string;

  @Column()
  behaviorStatus: string;

  @Column('float', { default: 1.0 })
  overallScore: number;

  @Column('text')
  summary: string;

  @CreateDateColumn()
  timestamp: Date;
}
