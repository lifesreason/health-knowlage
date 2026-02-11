import { Controller, Get, Put, Delete, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  /**
   * 获取用户列表（管理后台）
   */
  @Get('list')
  @ApiOperation({ summary: '获取用户列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量' })
  @ApiQuery({ name: 'keyword', required: false, description: '搜索关键词' })
  async getUserList(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Query('keyword') keyword?: string,
  ) {
    return this.userService.getUserList({
      page: +page,
      pageSize: +pageSize,
      keyword,
    });
  }

  /**
   * 获取用户统计（管理后台）
   */
  @Get('stats')
  @ApiOperation({ summary: '获取用户统计' })
  async getAdminStats() {
    return this.userService.getAdminStats();
  }

  /**
   * 获取用户信息
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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

  /**
   * 删除用户（管理后台）
   */
  @Delete(':id')
  @ApiOperation({ summary: '删除用户' })
  async deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(+id);
  }
}