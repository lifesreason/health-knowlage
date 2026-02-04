import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
}