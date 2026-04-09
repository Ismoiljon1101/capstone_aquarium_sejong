import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_commands')
export class UserCommandEntity {
  @PrimaryGeneratedColumn()
  commandId: number;

  @Column()
  actuatorId: number;

  @Column()
  commandType: string;

  @Column()
  source: string; // APP, CRON, AI

  @Column('simple-json', { nullable: true })
  payload: any;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  executedAt: Date;
}
