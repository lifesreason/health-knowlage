import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from '../../entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
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
   * 绑定手机号
   */
  async bindMobile(userId: number, mobileCipher: string): Promise<User> {
    return this.updateUser(userId, { mobileCipher });
  }

  /**
   * 获取用户统计信息
   */
  async getUserStats(userId: number) {
    // TODO: 实现统计数据
    return {
      receivedLikesAndCollects: 0,
      followingCount: 0,
      joinedCircles: 0,
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
}