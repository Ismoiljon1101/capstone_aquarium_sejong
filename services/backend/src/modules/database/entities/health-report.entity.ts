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

  @Column({ default: 'ok' })
  visualStatus: string;

  @Column({ default: 'ok' })
  behaviorStatus: string;

  @Column('float', { default: 1.0 })
  overallScore: number;

  @Column('text', { default: '' })
  summary: string;

  // ML model fields (populated by Maral's Python scripts via POST /fish/diagnosis)
  @Column({ nullable: true })
  diseaseClass: string;

  @Column('float', { nullable: true })
  mlConfidence: number;

  @Column({ nullable: true })
  severity: string;

  @Column({ nullable: true })
  fishId: number;

  @Column({ default: 'manual' })
  source: string; // 'manual' | 'ml_model'

  @CreateDateColumn()
  timestamp: Date;
}
