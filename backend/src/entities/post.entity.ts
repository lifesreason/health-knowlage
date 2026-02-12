import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Circle } from './circle.entity';

@Entity('biz_post')
@Index('idx_user_created', ['userId', 'createdAt'])
@Index('idx_feed_query', ['circleId', 'auditStatus', 'createdAt'])
export class Post extends BaseEntity {
  @Column({ type: 'bigint', name: 'user_id' })
  userId: number;

  @Column({ type: 'bigint', name: 'circle_id' })
  circleId: number;

  @Column({ type: 'tinyint' })
  type: number; // 1: 图文, 2: 视频

  @Column({ type: 'varchar', length: 128, nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'json', nullable: true, name: 'media_urls' })
  mediaUrls: string[];

  @Column({ type: 'varchar', length: 512, nullable: true, name: 'cover_url' })
  coverUrl: string;

  @Column({ type: 'json', nullable: true, name: 'video_meta' })
  videoMeta: {
    duration: number;
    coverUrl: string;
    size: number;
  };

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true, name: 'lat' })
  lat: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true, name: 'lng' })
  lng: number;

  @Column({ type: 'int', default: 0, name: 'view_count' })
  viewCount: number;

  @Column({ type: 'int', default: 0, name: 'like_count' })
  likeCount: number;

  @Column({ type: 'int', default: 0, name: 'comment_count' })
  commentCount: number;

  @Column({ type: 'int', default: 0, name: 'collect_count' })
  collectCount: number;

  @Column({ type: 'tinyint', default: 0, name: 'audit_status' })
  auditStatus: number; // 0: 审核中, 1: 已发布, 2: 驳回

  @Column({ type: 'varchar', length: 64, nullable: true, name: 'reject_reason' })
  rejectReason: string;

  // 关联关系
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Circle)
  @JoinColumn({ name: 'circle_id' })
  circle: Circle;
}
