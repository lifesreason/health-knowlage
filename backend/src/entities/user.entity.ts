import { Entity, Column, Unique, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('sys_user')
@Unique(['openid'])
@Index(['mobileCipher'])
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 64, name: 'openid' })
  openid: string;

  @Column({ type: 'varchar', length: 64, nullable: true, name: 'unionid' })
  unionid: string;

  @Column({ type: 'varchar', length: 64, default: '用户' })
  nickname: string;

  @Column({ type: 'varchar', length: 255, default: '', name: 'avatar_url' })
  avatarUrl: string;

  @Column({ type: 'varchar', length: 128, nullable: true, name: 'mobile_cipher' })
  mobileCipher: string;

  @Column({ type: 'tinyint', default: 0 })
  role: number; // 0: 普通用户, 1: 认证医师, 9: 管理员

  @Column({ type: 'decimal', precision: 2, scale: 1, default: 1.0, name: 'font_scale' })
  fontScale: number;

  @Column({ type: 'tinyint', default: 0, name: 'is_verified' })
  isVerified: boolean;

  @Column({ type: 'tinyint', default: 1 })
  status: number; // 1: 正常, 0: 封禁
}