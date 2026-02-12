import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from '../../entities/like.entity';
import { Collect } from '../../entities/collect.entity';
import { Post } from '../../entities/post.entity';

@Injectable()
export class InteractionService {
  constructor(
    @InjectRepository(Like)
    private likeRepository: Repository<Like>,
    @InjectRepository(Collect)
    private collectRepository: Repository<Collect>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  private normalizeTargetType(targetType: number | string): number {
    if (targetType === 'post') return 1;
    if (targetType === 'comment') return 2;
    return Number(targetType);
  }

  /**
   * 点赞
   */
  async like(userId: number, targetId: number, targetType: number | string) {
    const normalizedTargetType = this.normalizeTargetType(targetType);

    // 检查是否已点赞
    const existing = await this.likeRepository.findOne({
      where: { userId, targetId, targetType: normalizedTargetType },
    });

    if (existing) {
      throw new Error('已经点赞过了');
    }

    // 创建点赞记录
    await this.likeRepository.save({
      userId,
      targetId,
      targetType: normalizedTargetType,
    });

    // 更新帖子点赞数
    if (normalizedTargetType === 1) {
      await this.postRepository.increment({ id: targetId }, 'likeCount', 1);
    }

    return { message: '点赞成功' };
  }

  /**
   * 取消点赞
   */
  async unlike(userId: number, targetId: number, targetType: number | string) {
    const normalizedTargetType = this.normalizeTargetType(targetType);

    const like = await this.likeRepository.findOne({
      where: { userId, targetId, targetType: normalizedTargetType },
    });

    if (!like) {
      throw new Error('未点赞');
    }

    // 删除点赞记录
    await this.likeRepository.remove(like);

    // 更新帖子点赞数
    if (normalizedTargetType === 1) {
      await this.postRepository.decrement({ id: targetId }, 'likeCount', 1);
    }

    return { message: '取消点赞成功' };
  }

  /**
   * 收藏
   */
  async collect(userId: number, targetId: number, targetType: number | string) {
    const normalizedTargetType = this.normalizeTargetType(targetType);
    if (normalizedTargetType !== 1) {
      throw new Error('仅支持收藏帖子');
    }

    const post = await this.postRepository.findOne({
      where: { id: targetId, isDeleted: false, auditStatus: 1 },
    });
    if (!post) {
      throw new Error('帖子不存在');
    }

    const existing = await this.collectRepository.findOne({
      where: { userId, targetId, targetType: normalizedTargetType },
    });
    if (existing) {
      throw new Error('已经收藏过了');
    }

    await this.collectRepository.save({
      userId,
      targetId,
      targetType: normalizedTargetType,
    });
    await this.postRepository.increment({ id: targetId }, 'collectCount', 1);
    return { message: '收藏成功' };
  }

  /**
   * 取消收藏
   */
  async uncollect(userId: number, targetId: number, targetType: number | string) {
    const normalizedTargetType = this.normalizeTargetType(targetType);
    if (normalizedTargetType !== 1) {
      throw new Error('仅支持取消收藏帖子');
    }

    const collect = await this.collectRepository.findOne({
      where: { userId, targetId, targetType: normalizedTargetType },
    });
    if (!collect) {
      throw new Error('未收藏');
    }

    await this.collectRepository.remove(collect);
    await this.postRepository.decrement({ id: targetId }, 'collectCount', 1);
    return { message: '取消收藏成功' };
  }
}
