import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Collect } from '../../entities/collect.entity';
import { Post } from '../../entities/post.entity';
import { Follow } from '../../entities/follow.entity';
import { History } from '../../entities/history.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Collect)
    private collectRepository: Repository<Collect>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Follow)
    private followRepository: Repository<Follow>,
    @InjectRepository(History)
    private historyRepository: Repository<History>,
  ) {}

  /**
   * 根据 OpenID 查找用户
   */
  async findByOpenid(openid: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { openid, isDeleted: false },
    });
  }

  /**
   * 根据 ID 查找用户
   */
  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id, isDeleted: false },
    });
  }

  /**
   * 创建用户
   */
  async createUser(data: Partial<User>): Promise<User> {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  /**
   * 更新用户信息
   */
  async updateUser(id: number, data: Partial<User>): Promise<User> {
    await this.userRepository.update(id, data);
    return this.findById(id);
  }

  /**
   * 更新用户资料（仅允许白名单字段）
   */
  async updateProfile(id: number, data: UpdateProfileDto): Promise<User> {
    const updateData: Partial<User> = {};

    if (data.nickname !== undefined) updateData.nickname = data.nickname;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
    if (data.fontScale !== undefined) updateData.fontScale = data.fontScale;

    await this.userRepository.update(id, updateData);
    return this.findById(id);
  }

  /**
   * 绑定手机号
   */
  async bindMobile(userId: number, mobileCipher: string): Promise<User> {
    return this.updateUser(userId, { mobileCipher });
  }

  /**
   * 获取用户统计信息
   */
  async getUserStats(userId: number) {
    const postStat = await this.postRepository
      .createQueryBuilder('post')
      .select('COALESCE(SUM(post.like_count), 0)', 'likes')
      .addSelect('COALESCE(SUM(post.collect_count), 0)', 'collects')
      .where('post.user_id = :userId', { userId })
      .andWhere('post.is_deleted = 0')
      .getRawOne<{ likes: string; collects: string }>();

    let joinedCircles = 0;
    try {
      const joinedCirclesResult = await this.userRepository.query(
        `SELECT COUNT(1) as cnt FROM rel_user_circle WHERE user_id = ?`,
        [userId],
      );
      joinedCircles = Number(joinedCirclesResult?.[0]?.cnt || 0);
    } catch (error) {
      if (this.isMissingTableError(error, 'rel_user_circle')) {
        this.logger.warn('Table rel_user_circle is missing, joinedCircles fallback to 0');
      } else {
        throw error;
      }
    }
    const followingCount = await this.followRepository.count({ where: { userId } });
    const followersCount = await this.followRepository.count({ where: { followUserId: userId } });

    const receivedLikes = Number(postStat?.likes || 0);
    const receivedCollects = Number(postStat?.collects || 0);

    return {
      receivedLikesAndCollects: receivedLikes + receivedCollects,
      likesReceived: receivedLikes,
      collectsReceived: receivedCollects,
      followingCount,
      following: followingCount,
      followers: followersCount,
      joinedCircles,
      circles: joinedCircles,
    };
  }

  private isMissingTableError(error: any, tableName: string) {
    const code = error?.code || error?.driverError?.code;
    const message = `${error?.message || ''}`.toLowerCase();
    return code === 'ER_NO_SUCH_TABLE' || message.includes(`${tableName}`.toLowerCase());
  }

  /**
   * 获取我的收藏列表
   */
  async getCollections(userId: number, params: { page: number; pageSize: number }) {
    const { page, pageSize } = params;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.collectRepository
      .createQueryBuilder('collect')
      .leftJoinAndSelect(Post, 'post', 'post.id = collect.targetId')
      .leftJoinAndSelect(User, 'author', 'author.id = post.userId')
      .where('collect.userId = :userId', { userId })
      .andWhere('collect.targetType = 1')
      .andWhere('post.isDeleted = 0')
      .andWhere('post.auditStatus = 1')
      .orderBy('collect.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize)
      .select([
        'collect.id as collectId',
        'collect.createdAt as collectedAt',
        'post.id as id',
        'post.title as title',
        'post.content as content',
        'post.type as type',
        'post.coverUrl as coverUrl',
        'post.mediaUrls as mediaUrls',
        'post.likeCount as likeCount',
        'post.commentCount as commentCount',
        'post.collectCount as collectCount',
        'post.createdAt as createdAt',
        'author.id as userId',
        'author.nickname as nickname',
        'author.avatarUrl as avatarUrl',
      ]);

    const [list, total] = await Promise.all([
      queryBuilder.getRawMany(),
      this.collectRepository.count({
        where: { userId, targetType: 1 },
      }),
    ]);

    return {
      list: list.map((item) => ({
        id: Number(item.id),
        title: item.title,
        content: item.content,
        type: Number(item.type),
        coverUrl: item.coverUrl,
        mediaUrls: item.mediaUrls,
        likeCount: Number(item.likeCount || 0),
        commentCount: Number(item.commentCount || 0),
        collectCount: Number(item.collectCount || 0),
        createdAt: item.createdAt,
        collectedAt: item.collectedAt,
        user: {
          id: Number(item.userId),
          nickname: item.nickname,
          avatarUrl: item.avatarUrl,
        },
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 记录浏览历史
   */
  async recordHistory(userId: number, postId: number) {
    const post = await this.postRepository.findOne({
      where: { id: postId, isDeleted: false, auditStatus: 1 },
    });
    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    const existing = await this.historyRepository.findOne({
      where: { userId, postId },
    });

    if (existing) {
      existing.lastViewedAt = new Date();
      await this.historyRepository.save(existing);
      return { success: true };
    }

    await this.historyRepository.save({
      userId,
      postId,
      lastViewedAt: new Date(),
    });
    return { success: true };
  }

  /**
   * 获取浏览历史
   */
  async getHistory(userId: number, params: { page: number; pageSize: number }) {
    const { page, pageSize } = params;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.historyRepository
      .createQueryBuilder('history')
      .leftJoinAndSelect(Post, 'post', 'post.id = history.post_id')
      .leftJoinAndSelect(User, 'author', 'author.id = post.user_id')
      .where('history.user_id = :userId', { userId })
      .andWhere('post.is_deleted = 0')
      .andWhere('post.audit_status = 1')
      .orderBy('history.last_viewed_at', 'DESC')
      .skip(skip)
      .take(pageSize)
      .select([
        'history.id as historyId',
        'history.last_viewed_at as lastViewedAt',
        'post.id as id',
        'post.title as title',
        'post.content as content',
        'post.type as type',
        'post.cover_url as coverUrl',
        'post.media_urls as mediaUrls',
        'post.like_count as likeCount',
        'post.comment_count as commentCount',
        'post.collect_count as collectCount',
        'post.created_at as createdAt',
        'author.id as userId',
        'author.nickname as nickname',
        'author.avatar_url as avatarUrl',
      ]);

    const [list, total] = await Promise.all([
      queryBuilder.getRawMany(),
      this.historyRepository.count({ where: { userId } }),
    ]);

    return {
      list: list.map((item) => ({
        id: Number(item.id),
        title: item.title,
        content: item.content,
        type: Number(item.type),
        coverUrl: item.coverUrl,
        mediaUrls: item.mediaUrls,
        likeCount: Number(item.likeCount || 0),
        commentCount: Number(item.commentCount || 0),
        collectCount: Number(item.collectCount || 0),
        createdAt: item.createdAt,
        lastViewedAt: item.lastViewedAt,
        user: {
          id: Number(item.userId),
          nickname: item.nickname,
          avatarUrl: item.avatarUrl,
        },
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 获取用户列表（管理后台）
   */
  async getUserList(params: {
    page: number;
    pageSize: number;
    keyword?: string;
  }) {
    const { page, pageSize, keyword } = params;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.isDeleted = false');

    if (keyword) {
      queryBuilder.andWhere(
        '(user.nickname LIKE :keyword OR user.openid LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize);

    const [list, total] = await queryBuilder.getManyAndCount();

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 获取用户统计（管理后台）
   */
  async getAdminStats() {
    const total = await this.userRepository.count({ where: { isDeleted: false } });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayNew = await this.userRepository
      .createQueryBuilder('user')
      .where('user.isDeleted = false')
      .andWhere('user.createdAt >= :today', { today })
      .getCount();

    return {
      total,
      todayNew,
    };
  }

  /**
   * 删除用户（软删除）
   */
  async deleteUser(id: number) {
    await this.userRepository.update(id, { isDeleted: true });
    return { success: true };
  }

  /**
   * 更新用户状态（管理后台）
   */
  async updateUserStatus(id: number, status: number) {
    const normalizedStatus = status === 0 ? 0 : 1;
    await this.userRepository.update(id, { status: normalizedStatus });
    return { success: true };
  }
}
