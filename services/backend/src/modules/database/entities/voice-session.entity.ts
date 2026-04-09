import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('voice_sessions')
export class VoiceSessionEntity {
  @PrimaryGeneratedColumn()
  sessionId: number;

  @Column({ nullable: true })
  snapshotId: number;

  @Column()
  wakeWordAt: Date;

  @Column('text')
  transcribedText: string;

  @Column('text')
  aiResponse: string;

  @Column({ nullable: true })
  audioOutputPath: string;

  @Column()
  durationMs: number;

  @CreateDateColumn()
  createdAt: Date;
}
