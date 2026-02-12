import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('biz_collect')
@Index('uk_user_target_collect', ['userId', 'targetId', 'targetType'], { unique: true })
export class Collect {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', name: 'user_id' })
  userId: number;

  @Column({ type: 'bigint', name: 'target_id' })
  targetId: number;

  @Column({ type: 'tinyint', name: 'target_type' })
  targetType: number; // 1: 帖子

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;
}
