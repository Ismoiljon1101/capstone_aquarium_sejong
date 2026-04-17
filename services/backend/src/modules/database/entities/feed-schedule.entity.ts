import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/**
 * User-defined feeding schedule.
 * `time` is HH:MM in 24-hour local time.
 * `daysMask` is a bitmask of weekdays: bit 0 = Sunday … bit 6 = Saturday. 127 = every day.
 * `portionSec` is how long the feeder motor stays on per trigger.
 */
@Entity('feed_schedules')
export class FeedScheduleEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  time: string; // "08:00"

  @Column({ default: 127 })
  daysMask: number;

  @Column({ default: 3 })
  portionSec: number;

  @Column({ default: true })
  enabled: boolean;

  @Column({ nullable: true })
  lastFiredAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
