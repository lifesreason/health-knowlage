import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('biz_user_history')
@Index('uk_user_post_history', ['userId', 'postId'], { unique: true })
@Index('idx_user_viewed', ['userId', 'lastViewedAt'])
export class History {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', name: 'user_id' })
  userId: number;

  @Column({ type: 'bigint', name: 'post_id' })
  postId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', name: 'last_viewed_at' })
  lastViewedAt: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;
}
