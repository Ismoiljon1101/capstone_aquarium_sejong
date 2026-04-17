import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/**
 * LED lighting schedule. Single-row pattern (id=1) is fine for a single tank,
 * but kept as a table so multiple tanks/profiles work later.
 * Times are HH:MM local. Brightness is 0–100. Color is a #RRGGBB hex string.
 */
@Entity('light_schedules')
export class LightScheduleEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '07:00' })
  onTime: string;

  @Column({ default: '21:00' })
  offTime: string;

  @Column({ default: 80 })
  brightness: number;

  @Column({ default: '#ffffff' })
  color: string;

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
