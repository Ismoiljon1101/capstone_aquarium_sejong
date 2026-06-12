import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CameraSnapshotEntity } from './camera-snapshot.entity';

/**
 * Stores fish movement pattern anomaly detections from the AI predictor.
 * Populated by POST /predict/movement (Maral's FastAPI route).
 */
@Entity('movement_detections')
export class MovementDetectionEntity {
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
  centroidX: number;

  @Column('float', { nullable: true })
  centroidY: number;

  @Column('float', { nullable: true })
  speedPx: number;

  @Column('float', { nullable: true })
  directionDegrees: number;

  @Column('float', { nullable: true })
  driftRatio: number;

  @Column({ nullable: true })
  movementType: string;

  @Column('float', { nullable: true })
  anomalyScore: number;

  @CreateDateColumn()
  createdAt: Date;
}
