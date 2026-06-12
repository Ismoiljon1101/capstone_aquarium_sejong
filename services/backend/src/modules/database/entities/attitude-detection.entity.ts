import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CameraSnapshotEntity } from './camera-snapshot.entity';

/**
 * Stores fish body tilt/attitude anomaly detections from the AI predictor.
 * Populated by POST /predict/attitude (Maral's FastAPI route).
 */
@Entity('attitude_detections')
export class AttitudeDetectionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  snapshotId: number;

  @ManyToOne(() => CameraSnapshotEntity)
  @JoinColumn({ name: 'snapshotId' })
  snapshot: CameraSnapshotEntity;

  @Column()
  frameIndex: number;

  @Column({ nullable: true })
  region: string;

  @Column('float', { nullable: true })
  swimAngle: number;

  @Column('float', { nullable: true })
  aspectRatio: number;

  @Column({ nullable: true })
  tiltSeverity: string;

  @Column('float', { nullable: true })
  anomalyScore: number;

  @Column({ nullable: true })
  bboxX: number;

  @Column({ nullable: true })
  bboxY: number;

  @Column({ nullable: true })
  bboxW: number;

  @Column({ nullable: true })
  bboxH: number;

  @CreateDateColumn()
  createdAt: Date;
}
