import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CameraSnapshotEntity } from './camera-snapshot.entity';

@Entity('fish_counts')
export class FishCount {
  @PrimaryGeneratedColumn()
  countId: number;

  @Column()
  snapshotId: number;

  @ManyToOne(() => CameraSnapshotEntity)
  @JoinColumn({ name: 'snapshotId' })
  snapshot: CameraSnapshotEntity;

  @Column()
  count: number;

  @Column('float')
  confidence: number;

  @CreateDateColumn()
  timestamp: Date;
}
