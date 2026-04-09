import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('fish_growth')
export class FishGrowth {
  @PrimaryGeneratedColumn()
  growthId: number;

  @Column()
  date: string;

  @Column('float')
  avgSizeEstimate: number;

  @Column()
  count: number;

  @Column('float', { default: 0 })
  deltaFromPrev: number;

  @CreateDateColumn()
  createdAt: Date;
}
