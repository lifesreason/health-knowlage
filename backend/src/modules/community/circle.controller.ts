import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CircleService } from './circle.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('circle')
@Controller('circle')
export class CircleController {
  constructor(private circleService: CircleService) {}

  // ========== 管理后台接口 ==========

  /**
   * 获取圈子列表（管理后台）
   */
  @Get('admin/list')
  @ApiOperation({ summary: '获取圈子列表（管理后台）' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量' })
  @ApiQuery({ name: 'keyword', required: false, description: '搜索关键词' })
  async getAdminCircleList(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Query('keyword') keyword?: string,
  ) {
    return this.circleService.getAdminCircleList({
      page: +page,
      pageSize: +pageSize,
      keyword,
    });
  }

  /**
   * 创建圈子（管理后台）
   */
  @Post('admin/create')
  @ApiOperation({ summary: '创建圈子' })
  async createCircle(@Body() body: {
    name: string;
    description?: string;
    coverUrl?: string;
    sortOrder?: number;
    isRecommend?: boolean;
  }) {
    return this.circleService.createCircle(body);
  }

  /**
   * 更新圈子（管理后台）
   */
  @Put('admin/:id')
  @ApiOperation({ summary: '更新圈子' })
  async updateCircle(@Param('id') id: string, @Body() body: {
    name?: string;
    description?: string;
    coverUrl?: string;
    sortOrder?: number;
    isRecommend?: boolean;
  }) {
    return this.circleService.updateCircle(+id, body);
  }

  /**
   * 删除圈子（管理后台）
   */
  @Delete('admin/:id')
  @ApiOperation({ summary: '删除圈子' })
  async deleteCircle(@Param('id') id: string) {
    return this.circleService.deleteCircle(+id);
  }

  // ========== 小程序接口 ==========

  /**
   * 获取圈子列表
   */
  @Get('list')
  @ApiOperation({ summary: '获取圈子列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getCircleList() {
    return this.circleService.getCircleList();
  }

  /**
   * 获取圈子详情
   */
  @Get(':id')
  @ApiOperation({ summary: '获取圈子详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getCircleDetail(@Param('id') id: string) {
    return this.circleService.getCircleDetail(+id);
  }

  /**
   * 获取圈子帖子列表
   */
  @Get(':id/posts')
  @ApiOperation({ summary: '获取圈子帖子列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量' })
  async getCirclePosts(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
  ) {
    return this.circleService.getCirclePosts({ circleId: +id, page, pageSize });
  }

  /**
   * 加入圈子
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('join')
  @ApiOperation({ summary: '加入圈子' })
  @ApiResponse({ status: 200, description: '加入成功' })
  async joinCircle(@Request() req, @Body() body: { circleId: number }) {
    return this.circleService.joinCircle(req.user.id, body.circleId);
  }

  /**
   * 退出圈子
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('leave')
  @ApiOperation({ summary: '退出圈子' })
  @ApiResponse({ status: 200, description: '退出成功' })
  async leaveCircle(@Request() req, @Body() body: { circleId: number }) {
    return this.circleService.leaveCircle(req.user.id, body.circleId);
  }

  /**
   * 获取用户加入的圈子列表
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('user/joined')
  @ApiOperation({ summary: '获取用户加入的圈子列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUserCircles(@Request() req) {
    return this.circleService.getUserCircles(req.user.id);
  }

  /**
   * 检查是否已加入圈子
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id/check-joined')
  @ApiOperation({ summary: '检查是否已加入圈子' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async checkJoined(@Request() req, @Param('id') id: string) {
    const joined = await this.circleService.isJoined(req.user.id, +id);
    return { joined };
  }
}