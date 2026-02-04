import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('user')
@Controller('user')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private userService: UserService) {}

  /**
   * 获取用户信息
   */
  @Get('profile')
  @ApiOperation({ summary: '获取用户信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getProfile(@Request() req) {
    const user = await this.userService.findById(req.user.id);
    const stats = await this.userService.getUserStats(req.user.id);

    return {
      id: user.id,
      openid: user.openid,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      role: user.role,
      fontScale: user.fontScale,
      isVerified: user.isVerified,
      ...stats,
    };
  }

  /**
   * 更新用户信息
   */
  @Put('profile')
  @ApiOperation({ summary: '更新用户信息' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateProfile(@Request() req, @Body() body: {
    nickname?: string;
    avatarUrl?: string;
    fontScale?: number;
  }) {
    const user = await this.userService.updateUser(req.user.id, body);
    return {
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      role: user.role,
      fontScale: user.fontScale,
    };
  }
}