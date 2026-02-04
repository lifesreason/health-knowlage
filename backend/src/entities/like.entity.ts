import { Entity, Column, PrimaryGeneratedColumn, UniqueIndex } from 'typeorm';

@Entity('biz_like')
@UniqueIndex(['userId', 'targetId', 'targetType'], 'uk_user_target')
export class Like {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', name: 'user_id' })
  userId: number;

  @Column({ type: 'bigint', name: 'target_id' })
  targetId: number;

  @Column({ type: 'tinyint', name: 'target_type' })
  targetType: number; // 1: 帖子, 2: 评论

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;
}