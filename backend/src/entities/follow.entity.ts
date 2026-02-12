import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('rel_user_follow')
@Index('uk_user_follow', ['userId', 'followUserId'], { unique: true })
@Index('idx_follow_user', ['followUserId', 'createdAt'])
export class Follow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', name: 'user_id' })
  userId: number;

  @Column({ type: 'bigint', name: 'follow_user_id' })
  followUserId: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;
}
