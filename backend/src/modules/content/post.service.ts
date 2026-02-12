import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../../entities/post.entity';
import { Circle } from '../../entities/circle.entity';
import { User } from '../../entities/user.entity';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Circle)
    private circleRepository: Repository<Circle>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * 创建帖子
   */
  async createPost(userId: number, data: {
    circleId: number;
    type: number;
    title?: string;
    content: string;
    mediaUrls: string[];
    videoMeta?: any;
  }): Promise<Post> {
    // 验证圈子是否存在
    const circle = await this.circleRepository.findOne({
      where: { id: data.circleId, isDeleted: false },
    });

    if (!circle) {
      throw new Error('圈子不存在');
    }

    const post = this.postRepository.create({
      userId,
      ...data,
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      collectCount: 0,
      auditStatus: 0, // 审核中
    });

    return this.postRepository.save(post);
  }

  /**
   * 获取帖子详情
   */
  async getPostDetail(postId: number): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id: postId, isDeleted: false },
      relations: ['user', 'circle'],
    });

    if (!post) {
      throw new Error('帖子不存在');
    }

    // 增加浏览量
    await this.postRepository.increment({ id: postId }, 'viewCount', 1);

    return post;
  }

  /**
   * 获取首页推荐流
   */
  async getFeedList(params: {
    type: 'recommend' | 'nearby' | 'follow';
    page: number;
    pageSize: number;
    userId?: number;
  }) {
    const { type, page, pageSize, userId } = params;
    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.circle', 'circle')
      .where('post.isDeleted = false')
      .andWhere('post.auditStatus = 1') // 只显示已发布的
      .orderBy('post.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize);

    // TODO: 根据 type 添加不同的查询逻辑
    // recommend: 推荐算法
    // nearby: 附近
    // follow: 关注

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
   * 获取视频流（type=2 的帖子）
   */
  async getVideoFeed(params: { page: number; pageSize: number }) {
    const { page, pageSize } = params;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.circle', 'circle')
      .where('post.isDeleted = false')
      .andWhere('post.auditStatus = 1')
      .andWhere('post.type = :type', { type: 2 })
      .orderBy('post.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize);

    const [list, total] = await queryBuilder.getManyAndCount();

    // Map mediaUrls[0] to videoUrl for frontend compatibility
    const mappedList = list.map(post => ({
      ...post,
      videoUrl: post.mediaUrls?.[0] || null,
      coverUrl: post.coverUrl || post.videoMeta?.coverUrl || null,
    }));

    return {
      list: mappedList,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 获取我的发布列表
   */
  async getMyPosts(userId: number, params: {
    status: 'published' | 'audit';
    page: number;
    pageSize: number;
  }) {
    const { status, page, pageSize } = params;
    const skip = (page - 1) * pageSize;

    const auditStatus = status === 'published' ? 1 : 0;

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .where('post.userId = :userId', { userId })
      .andWhere('post.isDeleted = false')
      .andWhere('post.auditStatus = :auditStatus', { auditStatus })
      .orderBy('post.createdAt', 'DESC')
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
   * 搜索帖子
   */
  async searchPosts(params: { keyword: string; page: number; pageSize: number }) {
    const { keyword, page, pageSize } = params;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.circle', 'circle')
      .where('post.isDeleted = false')
      .andWhere('post.auditStatus = 1')
      .andWhere('(post.title LIKE :keyword OR post.content LIKE :keyword)', {
        keyword: `%${keyword}%`,
      })
      .orderBy('post.createdAt', 'DESC')
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
   * 更新帖子状态（审核通过/驳回）
   */
  async updateAuditStatus(postId: number, auditStatus: number, rejectReason?: string) {
    await this.postRepository.update(postId, {
      auditStatus,
      rejectReason,
    });
  }

  /**
   * 删除帖子（软删除）
   */
  async deletePost(postId: number, userId: number) {
    const post = await this.postRepository.findOne({
      where: { id: postId, userId, isDeleted: false },
    });

    if (!post) {
      throw new Error('帖子不存在或无权删除');
    }

    await this.postRepository.update(postId, { isDeleted: true });
  }

  /**
   * 获取帖子列表（管理后台）
   */
  async getAdminPostList(params: {
    page: number;
    pageSize: number;
    keyword?: string;
    status?: number;
    circleId?: number;
  }) {
    const { page, pageSize, keyword, status, circleId } = params;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.circle', 'circle')
      .where('post.isDeleted = false');

    if (keyword) {
      queryBuilder.andWhere(
        '(post.title LIKE :keyword OR post.content LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    if (status !== undefined) {
      queryBuilder.andWhere('post.auditStatus = :status', { status });
    }

    if (circleId) {
      queryBuilder.andWhere('post.circleId = :circleId', { circleId });
    }

    queryBuilder
      .orderBy('post.createdAt', 'DESC')
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
   * 删除帖子（管理后台，不验证用户）
   */
  async adminDeletePost(postId: number) {
    await this.postRepository.update(postId, { isDeleted: true });
    return { success: true };
  }

  /**
   * 创建帖子（管理后台，以系统身份发布）
   */
  async adminCreatePost(data: {
    circleId: number;
    type: number;
    title?: string;
    content: string;
    coverUrl?: string;
    mediaUrls?: string[];
  }) {
    // 验证圈子是否存在
    const circle = await this.circleRepository.findOne({
      where: { id: data.circleId, isDeleted: false },
    });

    if (!circle) {
      throw new Error('圈子不存在');
    }

    // 获取或创建系统管理员用户
    let adminUser = await this.userRepository.findOne({
      where: { openid: 'SYSTEM_ADMIN' },
    });

    if (!adminUser) {
      // 创建系统管理员用户
      adminUser = this.userRepository.create({
        openid: 'SYSTEM_ADMIN',
        nickname: '系统管理员',
        avatarUrl: '',
        role: 9, // 管理员角色
        status: 1,
      });
      adminUser = await this.userRepository.save(adminUser);
    }

    const post = this.postRepository.create({
      userId: adminUser.id,
      circleId: data.circleId,
      type: data.type,
      title: data.title,
      content: data.content,
      coverUrl: data.coverUrl || null,
      mediaUrls: data.mediaUrls || [],
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      collectCount: 0,
      auditStatus: 1, // 管理员发布直接通过
    });

    const saved = await this.postRepository.save(post);

    // 更新圈子帖子数
    await this.circleRepository.increment({ id: data.circleId }, 'postCount', 1);

    return saved;
  }
}
