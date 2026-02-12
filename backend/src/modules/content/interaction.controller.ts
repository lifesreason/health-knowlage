import { Controller, Post, Delete, Get, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InteractionService } from './interaction.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('interaction')
@Controller('interaction')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InteractionController {
  constructor(private interactionService: InteractionService) {}

  /**
   * 点赞
   */
  @Post('like')
  @ApiOperation({ summary: '点赞' })
  @ApiResponse({ status: 200, description: '点赞成功' })
  async like(@Request() req, @Body() body: {
    targetId: number;
    targetType: number;
  }) {
    return this.interactionService.like(req.user.id, body.targetId, body.targetType);
  }

  /**
   * 取消点赞
   */
  @Delete('like')
  @ApiOperation({ summary: '取消点赞' })
  @ApiResponse({ status: 200, description: '取消点赞成功' })
  async unlike(@Request() req, @Body() body: {
    targetId: number;
    targetType: number;
  }) {
    return this.interactionService.unlike(req.user.id, body.targetId, body.targetType);
  }

  /**
   * 收藏
   */
  @Post('collect')
  @ApiOperation({ summary: '收藏' })
  @ApiResponse({ status: 200, description: '收藏成功' })
  async collect(@Request() req, @Body() body: {
    targetId: number;
    targetType: number;
  }) {
    return this.interactionService.collect(req.user.id, body.targetId, body.targetType);
  }

  /**
   * 取消收藏
   */
  @Delete('collect')
  @ApiOperation({ summary: '取消收藏' })
  @ApiResponse({ status: 200, description: '取消收藏成功' })
  async uncollect(@Request() req, @Body() body: {
    targetId: number;
    targetType: number;
  }) {
    return this.interactionService.uncollect(req.user.id, body.targetId, body.targetType);
  }

  /**
   * 关注/取消关注用户
   */
  @Post('follow')
  @ApiOperation({ summary: '关注/取消关注用户' })
  @ApiResponse({ status: 200, description: '操作成功' })
  async follow(@Request() req, @Body() body: { userId: number }) {
    return this.interactionService.follow(req.user.id, body.userId);
  }

  /**
   * 获取关注列表
   */
  @Get('following')
  @ApiOperation({ summary: '获取关注列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量' })
  async getFollowing(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
  ) {
    return this.interactionService.getFollowing(req.user.id, { page, pageSize });
  }

  /**
   * 获取粉丝列表
   */
  @Get('followers')
  @ApiOperation({ summary: '获取粉丝列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量' })
  async getFollowers(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
  ) {
    return this.interactionService.getFollowers(req.user.id, { page, pageSize });
  }
}
