import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Circle } from '../../entities/circle.entity';
import { Post } from '../../entities/post.entity';

@Injectable()
export class CircleService {
  constructor(
    @InjectRepository(Circle)
    private circleRepository: Repository<Circle>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  /**
   * 获取圈子列表
   */
  async getCircleList() {
    return this.circleRepository.find({
      where: { isDeleted: false },
      order: { sortOrder: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * 获取圈子详情
   */
  async getCircleDetail(id: number) {
    const circle = await this.circleRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!circle) {
      throw new Error('圈子不存在');
    }

    return circle;
  }

  /**
   * 获取圈子帖子列表
   */
  async getCirclePosts(params: {
    circleId: number;
    page: number;
    pageSize: number;
  }) {
    const { circleId, page, pageSize } = params;
    const skip = (page - 1) * pageSize;

    // 验证圈子是否存在
    const circle = await this.circleRepository.findOne({
      where: { id: circleId, isDeleted: false },
    });

    if (!circle) {
      throw new Error('圈子不存在');
    }

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .where('post.circleId = :circleId', { circleId })
      .andWhere('post.isDeleted = false')
      .andWhere('post.auditStatus = 1') // 只显示已发布的
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
   * 加入圈子
   */
  async joinCircle(userId: number, circleId: number) {
    // 验证圈子是否存在
    const circle = await this.circleRepository.findOne({
      where: { id: circleId, isDeleted: false },
    });

    if (!circle) {
      throw new Error('圈子不存在');
    }

    // 检查是否已加入
    const existing = await this.circleRepository.query(
      `SELECT id FROM rel_user_circle WHERE user_id = ? AND circle_id = ?`,
      [userId, circleId],
    );

    if (existing && existing.length > 0) {
      throw new Error('已加入该圈子');
    }

    // 加入圈子
    await this.circleRepository.query(
      `INSERT INTO rel_user_circle (user_id, circle_id, role, joined_at) VALUES (?, ?, 0, NOW())`,
      [userId, circleId],
    );

    // 更新圈子成员数
    await this.circleRepository.increment({ id: circleId }, 'memberCount', 1);

    return { message: '加入成功' };
  }

  /**
   * 退出圈子
   */
  async leaveCircle(userId: number, circleId: number) {
    // 验证圈子是否存在
    const circle = await this.circleRepository.findOne({
      where: { id: circleId, isDeleted: false },
    });

    if (!circle) {
      throw new Error('圈子不存在');
    }

    // 检查是否已加入
    const existing = await this.circleRepository.query(
      `SELECT id FROM rel_user_circle WHERE user_id = ? AND circle_id = ?`,
      [userId, circleId],
    );

    if (!existing || existing.length === 0) {
      throw new Error('未加入该圈子');
    }

    // 退出圈子
    await this.circleRepository.query(
      `DELETE FROM rel_user_circle WHERE user_id = ? AND circle_id = ?`,
      [userId, circleId],
    );

    // 更新圈子成员数
    await this.circleRepository.decrement({ id: circleId }, 'memberCount', 1);

    return { message: '退出成功' };
  }

  /**
   * 检查用户是否已加入圈子
   */
  async isJoined(userId: number, circleId: number): Promise<boolean> {
    const result = await this.circleRepository.query(
      `SELECT id FROM rel_user_circle WHERE user_id = ? AND circle_id = ?`,
      [userId, circleId],
    );

    return result && result.length > 0;
  }

  /**
   * 获取用户加入的圈子列表
   */
  async getUserCircles(userId: number) {
    const circles = await this.circleRepository.query(
      `SELECT c.* FROM biz_circle c
       INNER JOIN rel_user_circle r ON c.id = r.circle_id
       WHERE r.user_id = ? AND c.is_deleted = 0
       ORDER BY r.joined_at DESC`,
      [userId],
    );

    return circles;
  }
}