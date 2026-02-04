import { Controller, Post, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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
}