import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('camera_snapshots')
export class CameraSnapshotEntity {
  @PrimaryGeneratedColumn()
  snapshotId: number;

  @Column()
  imagePath: string;

  @Column()
  triggeredBy: string; // CRON, MANUAL, EVENT

  @CreateDateColumn()
  timestamp: Date;
}
