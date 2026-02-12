import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Post } from '../../entities/post.entity';
import { Comment } from '../../entities/comment.entity';
import { Circle } from '../../entities/circle.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { FeedCacheService } from './feed-cache.service';

@ApiTags('stats')
@Controller('stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(9)
@ApiBearerAuth()
export class StatsController {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(Circle)
    private circleRepository: Repository<Circle>,
    private readonly feedCacheService: FeedCacheService,
  ) {}

  /**
   * 获取数据概览
   */
  @Get('overview')
  @ApiOperation({ summary: '获取数据概览' })
  async getOverview() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 统计总数
    const userCount = await this.userRepository.count({ where: { isDeleted: false } });
    const postCount = await this.postRepository.count({ where: { isDeleted: false } });
    const commentCount = await this.commentRepository.count({ where: { isDeleted: false } });
    const circleCount = await this.circleRepository.count({ where: { isDeleted: false } });

    // 今日新增
    const todayNewUsers = await this.userRepository
      .createQueryBuilder('user')
      .where('user.isDeleted = false')
      .andWhere('user.createdAt >= :today', { today })
      .getCount();

    const todayNewPosts = await this.postRepository
      .createQueryBuilder('post')
      .where('post.isDeleted = false')
      .andWhere('post.createdAt >= :today', { today })
      .getCount();

    // 待审核内容
    const pendingAudit = await this.postRepository.count({
      where: { isDeleted: false, auditStatus: 0 },
    });

    // 简单估算活跃用户（今日有发帖或评论）
    const activeUsers = todayNewPosts + todayNewUsers;

    return {
      userCount,
      postCount,
      commentCount,
      circleCount,
      todayNewUsers,
      todayNewPosts,
      pendingAudit,
      activeUsers,
    };
  }

  /**
   * 获取趋势数据
   */
  @Get('trend')
  @ApiOperation({ summary: '获取趋势数据' })
  @ApiQuery({ name: 'days', required: false, description: '天数 (7/30)' })
  async getTrend(@Query('days') days: string = '7') {
    const numDays = +days || 7;
    const trends = [];

    for (let i = numDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const newUsers = await this.userRepository
        .createQueryBuilder('user')
        .where('user.createdAt >= :date', { date })
        .andWhere('user.createdAt < :nextDate', { nextDate })
        .getCount();

      const newPosts = await this.postRepository
        .createQueryBuilder('post')
        .where('post.createdAt >= :date', { date })
        .andWhere('post.createdAt < :nextDate', { nextDate })
        .getCount();

      trends.push({
        date: date.toISOString().split('T')[0],
        newUsers,
        newPosts,
      });
    }

    return trends;
  }

  /**
   * 获取推荐缓存命中统计
   */
  @Get('feed-cache')
  @ApiOperation({ summary: '获取推荐缓存命中统计' })
  @ApiQuery({ name: 'windowMinutes', required: false, description: '分钟窗口(1-180)，默认10' })
  async getFeedCacheStats(@Query('windowMinutes') windowMinutes?: string) {
    const parsedWindow = windowMinutes ? Number(windowMinutes) : 10;
    return {
      total: this.feedCacheService.getRecommendStats(),
      window: this.feedCacheService.getRecommendWindowStats(parsedWindow),
    };
  }
}
