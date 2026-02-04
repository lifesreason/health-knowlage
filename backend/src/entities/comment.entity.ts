import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Post } from './post.entity';
import { User } from './user.entity';

@Entity('biz_comment')
@Index(['postId', 'rootId', 'createdAt'])
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', name: 'post_id' })
  postId: number;

  @Column({ type: 'bigint', name: 'user_id' })
  userId: number;

  @Column({ type: 'bigint', default: 0, name: 'root_id' })
  rootId: number; // 0 为一级评论

  @Column({ type: 'bigint', default: 0, name: 'reply_to_user_id' })
  replyToUserId: number;

  @Column({ type: 'varchar', length: 1024 })
  content: string;

  @Column({ type: 'int', default: 0, name: 'like_count' })
  likeCount: number;

  @Column({ type: 'tinyint', default: 1, name: 'audit_status' })
  auditStatus: number; // 1: 通过, 2: 屏蔽

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'tinyint', default: 0, name: 'is_deleted' })
  isDeleted: boolean;

  // 关联关系
  @ManyToOne(() => Post)
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reply_to_user_id' })
  replyToUser: User;
}