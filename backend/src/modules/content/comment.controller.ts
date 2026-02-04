import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CommentService } from './comment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('comment')
@Controller('comment')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommentController {
  constructor(private commentService: CommentService) {}

  /**
   * 创建评论
   */
  @Post()
  @ApiOperation({ summary: '创建评论' })
  @ApiResponse({ status: 200, description: '创建成功' })
  async createComment(@Request() req, @Body() body: {
    postId: number;
    content: string;
    rootId?: number;
    replyToUserId?: number;
  }) {
    const comment = await this.commentService.createComment(req.user.id, body);
    return {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      message: '评论成功',
    };
  }

  /**
   * 获取评论列表
   */
  @Get()
  @ApiOperation({ summary: '获取评论列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiQuery({ name: 'postId', description: '帖子ID' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量' })
  @ApiQuery({ name: 'rootId', required: false, description: '根评论ID（获取二级评论时使用）' })
  async getCommentList(
    @Query('postId') postId: number,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Query('rootId') rootId?: number,
  ) {
    return this.commentService.getCommentList({ postId, page, pageSize, rootId });
  }

  /**
   * 删除评论
   */
  @Delete(':id')
  @ApiOperation({ summary: '删除评论' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteComment(@Param('id') id: string, @Request() req) {
    return this.commentService.deleteComment(+id, req.user.id);
  }

  /**
   * 点赞评论
   */
  @Post(':id/like')
  @ApiOperation({ summary: '点赞评论' })
  @ApiResponse({ status: 200, description: '点赞成功' })
  async likeComment(@Param('id') id: string, @Request() req) {
    return this.commentService.likeComment(+id, req.user.id);
  }

  /**
   * 取消点赞评论
   */
  @Delete(':id/like')
  @ApiOperation({ summary: '取消点赞评论' })
  @ApiResponse({ status: 200, description: '取消点赞成功' })
  async unlikeComment(@Param('id') id: string, @Request() req) {
    return this.commentService.unlikeComment(+id, req.user.id);
  }
}