import { Controller, Get, Post, Put, Delete, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  /**
   * 获取用户列表（管理后台）
   */
  @Get('list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(9)
  @ApiBearerAuth()
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(9)
  @ApiBearerAuth()
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
  async updateProfile(@Request() req, @Body() body: UpdateProfileDto) {
    const user = await this.userService.updateProfile(req.user.id, body);
    return {
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      role: user.role,
      fontScale: user.fontScale,
    };
  }

  /**
   * 获取我的统计数据
   */
  @Get('my-stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的统计数据' })
  async getMyStats(@Request() req) {
    return this.userService.getUserStats(req.user.id);
  }

  /**
   * 获取我的收藏列表
   */
  @Get('collections')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的收藏列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量' })
  async getCollections(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
  ) {
    return this.userService.getCollections(req.user.id, { page, pageSize });
  }

  /**
   * 记录浏览历史
   */
  @Post('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '记录浏览历史' })
  async recordHistory(@Request() req, @Body() body: { postId: number }) {
    return this.userService.recordHistory(req.user.id, body.postId);
  }

  /**
   * 获取浏览历史
   */
  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取浏览历史' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量' })
  async getHistory(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
  ) {
    return this.userService.getHistory(req.user.id, { page, pageSize });
  }

  /**
   * 删除用户（管理后台）
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(9)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除用户' })
  async deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(+id);
  }

  /**
   * 更新用户状态（管理后台）
   */
  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(9)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新用户状态' })
  async updateUserStatus(@Param('id') id: string, @Body() body: { status: number }) {
    return this.userService.updateUserStatus(+id, body.status);
  }
}
