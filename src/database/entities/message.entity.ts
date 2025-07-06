import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';
import { User } from './user.entity';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
}

@Entity('messages')
@Index(['conversation_id', 'sent_at'])
@Index(['sender_id'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  conversation_id: string;

  @Column('uuid')
  sender_id: string;

  @Column('text')
  content: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: MessageType.TEXT,
  })
  message_type: MessageType;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  file_url: string;

  @Column({
    type: 'boolean',
    default: false,
  })
  is_read: boolean;

  @CreateDateColumn()
  sent_at: Date;

  // Relations
  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;
}
