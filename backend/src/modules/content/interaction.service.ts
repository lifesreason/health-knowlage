import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Like } from '../../entities/like.entity';
import { Collect } from '../../entities/collect.entity';
import { Follow } from '../../entities/follow.entity';
import { Post } from '../../entities/post.entity';
import { User } from '../../entities/user.entity';

@Injectable()
export class InteractionService {
  constructor(
    @InjectRepository(Like)
    private likeRepository: Repository<Like>,
    @InjectRepository(Collect)
    private collectRepository: Repository<Collect>,
    @InjectRepository(Follow)
    private followRepository: Repository<Follow>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
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
      throw new BadRequestException('已经点赞过了');
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
      throw new BadRequestException('未点赞');
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
      throw new BadRequestException('仅支持收藏帖子');
    }

    const post = await this.postRepository.findOne({
      where: { id: targetId, isDeleted: false, auditStatus: 1 },
    });
    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    const existing = await this.collectRepository.findOne({
      where: { userId, targetId, targetType: normalizedTargetType },
    });
    if (existing) {
      throw new BadRequestException('已经收藏过了');
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
      throw new BadRequestException('仅支持取消收藏帖子');
    }

    const collect = await this.collectRepository.findOne({
      where: { userId, targetId, targetType: normalizedTargetType },
    });
    if (!collect) {
      throw new BadRequestException('未收藏');
    }

    await this.collectRepository.remove(collect);
    await this.postRepository.decrement({ id: targetId }, 'collectCount', 1);
    return { message: '取消收藏成功' };
  }

  /**
   * 关注/取消关注（切换）
   */
  async follow(userId: number, followUserId: number) {
    if (userId === followUserId) {
      throw new BadRequestException('不能关注自己');
    }

    const targetUser = await this.userRepository.findOne({
      where: { id: followUserId, isDeleted: false, status: 1 },
    });
    if (!targetUser) {
      throw new NotFoundException('用户不存在');
    }

    const existing = await this.followRepository.findOne({
      where: { userId, followUserId },
    });

    if (existing) {
      await this.followRepository.remove(existing);
      return { followed: false, message: '取消关注成功' };
    }

    await this.followRepository.save({ userId, followUserId });
    return { followed: true, message: '关注成功' };
  }

  /**
   * 获取我的关注列表
   */
  async getFollowing(userId: number, params: { page: number; pageSize: number }) {
    const { page, pageSize } = params;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.followRepository
      .createQueryBuilder('follow')
      .leftJoinAndSelect(User, 'user', 'user.id = follow.follow_user_id')
      .where('follow.user_id = :userId', { userId })
      .andWhere('user.is_deleted = 0')
      .orderBy('follow.created_at', 'DESC')
      .skip(skip)
      .take(pageSize)
      .select([
        'follow.id as id',
        'follow.created_at as followedAt',
        'user.id as userId',
        'user.nickname as nickname',
        'user.avatar_url as avatarUrl',
        'user.role as role',
      ]);

    const [list, total] = await Promise.all([
      queryBuilder.getRawMany(),
      this.followRepository.count({ where: { userId } }),
    ]);

    return {
      list: list.map((item) => ({
        id: Number(item.id),
        followedAt: item.followedAt,
        user: {
          id: Number(item.userId),
          nickname: item.nickname,
          avatarUrl: item.avatarUrl,
          role: Number(item.role),
        },
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 获取我的粉丝列表
   */
  async getFollowers(userId: number, params: { page: number; pageSize: number }) {
    const { page, pageSize } = params;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.followRepository
      .createQueryBuilder('follow')
      .leftJoinAndSelect(User, 'user', 'user.id = follow.user_id')
      .where('follow.follow_user_id = :userId', { userId })
      .andWhere('user.is_deleted = 0')
      .orderBy('follow.created_at', 'DESC')
      .skip(skip)
      .take(pageSize)
      .select([
        'follow.id as id',
        'follow.created_at as followedAt',
        'user.id as userId',
        'user.nickname as nickname',
        'user.avatar_url as avatarUrl',
        'user.role as role',
      ]);

    const [list, total] = await Promise.all([
      queryBuilder.getRawMany(),
      this.followRepository.count({ where: { followUserId: userId } }),
    ]);

    return {
      list: list.map((item) => ({
        id: Number(item.id),
        followedAt: item.followedAt,
        user: {
          id: Number(item.userId),
          nickname: item.nickname,
          avatarUrl: item.avatarUrl,
          role: Number(item.role),
        },
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 获取单个帖子互动状态
   */
  async getPostStatus(userId: number, postId: number) {
    const post = await this.postRepository.findOne({
      where: { id: postId, isDeleted: false, auditStatus: 1 },
      select: ['id', 'userId'],
    });

    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    const [liked, collected, followed] = await Promise.all([
      this.likeRepository.findOne({
        where: { userId, targetId: postId, targetType: 1 },
        select: ['id'],
      }),
      this.collectRepository.findOne({
        where: { userId, targetId: postId, targetType: 1 },
        select: ['id'],
      }),
      this.followRepository.findOne({
        where: { userId, followUserId: post.userId },
        select: ['id'],
      }),
    ]);

    return {
      postId,
      isLiked: !!liked,
      isCollected: !!collected,
      isFollowedAuthor: !!followed,
    };
  }

  /**
   * 批量获取帖子互动状态
   */
  async getPostBatchStatus(userId: number, postIds: number[]) {
    const uniquePostIds = [...new Set(postIds)].filter((id) => Number.isFinite(id) && id > 0);
    if (!uniquePostIds.length) {
      return { list: [] };
    }

    const posts = await this.postRepository.find({
      where: {
        id: In(uniquePostIds),
        isDeleted: false,
        auditStatus: 1,
      },
      select: ['id', 'userId'],
    });
    if (!posts.length) {
      return { list: [] };
    }

    const validPostIds = posts.map((item) => item.id);
    const authorIds = [...new Set(posts.map((item) => item.userId))];

    const [likes, collects, follows] = await Promise.all([
      this.likeRepository.find({
        where: {
          userId,
          targetType: 1,
          targetId: In(validPostIds),
        },
        select: ['targetId'],
      }),
      this.collectRepository.find({
        where: {
          userId,
          targetType: 1,
          targetId: In(validPostIds),
        },
        select: ['targetId'],
      }),
      this.followRepository.find({
        where: {
          userId,
          followUserId: In(authorIds),
        },
        select: ['followUserId'],
      }),
    ]);

    const likedSet = new Set(likes.map((item) => item.targetId));
    const collectedSet = new Set(collects.map((item) => item.targetId));
    const followedSet = new Set(follows.map((item) => item.followUserId));

    return {
      list: posts.map((post) => ({
        postId: post.id,
        isLiked: likedSet.has(post.id),
        isCollected: collectedSet.has(post.id),
        isFollowedAuthor: followedSet.has(post.userId),
      })),
    };
  }
}
