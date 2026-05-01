import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('chat_messages')
@Index(['sessionId', 'createdAt'])
export class ChatMessageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sessionId: string;

  @Column()
  role: string; // 'user' | 'assistant' | 'system'

  @Column('text')
  content: string;

  @CreateDateColumn()
  createdAt: Date;
}
