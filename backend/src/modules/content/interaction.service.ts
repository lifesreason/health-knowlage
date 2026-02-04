import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from '../../entities/like.entity';
import { Post } from '../../entities/post.entity';

@Injectable()
export class InteractionService {
  constructor(
    @InjectRepository(Like)
    private likeRepository: Repository<Like>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  /**
   * 点赞
   */
  async like(userId: number, targetId: number, targetType: number) {
    // 检查是否已点赞
    const existing = await this.likeRepository.findOne({
      where: { userId, targetId, targetType },
    });

    if (existing) {
      throw new Error('已经点赞过了');
    }

    // 创建点赞记录
    await this.likeRepository.save({
      userId,
      targetId,
      targetType,
    });

    // 更新帖子点赞数
    if (targetType === 1) {
      await this.postRepository.increment({ id: targetId }, 'likeCount', 1);
    }

    return { message: '点赞成功' };
  }

  /**
   * 取消点赞
   */
  async unlike(userId: number, targetId: number, targetType: number) {
    const like = await this.likeRepository.findOne({
      where: { userId, targetId, targetType },
    });

    if (!like) {
      throw new Error('未点赞');
    }

    // 删除点赞记录
    await this.likeRepository.remove(like);

    // 更新帖子点赞数
    if (targetType === 1) {
      await this.postRepository.decrement({ id: targetId }, 'likeCount', 1);
    }

    return { message: '取消点赞成功' };
  }

  /**
   * 收藏（暂时复用点赞逻辑，后续可扩展）
   */
  async collect(userId: number, targetId: number, targetType: number) {
    // TODO: 实现收藏功能
    return { message: '收藏成功' };
  }

  /**
   * 取消收藏
   */
  async uncollect(userId: number, targetId: number, targetType: number) {
    // TODO: 实现取消收藏功能
    return { message: '取消收藏成功' };
  }
}