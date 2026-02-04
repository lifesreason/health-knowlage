import { Controller, Get, Post, Put, Delete, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PostService } from './post.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('post')
@Controller('post')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PostController {
  constructor(private postService: PostService) {}

  /**
   * 发布内容
   */
  @Post('publish')
  @ApiOperation({ summary: '发布内容' })
  @ApiResponse({ status: 200, description: '发布成功' })
  async publish(@Request() req, @Body() body: {
    circleId: number;
    type: number;
    title?: string;
    content: string;
    mediaUrls: string[];
    videoMeta?: any;
  }) {
    const post = await this.postService.createPost(req.user.id, body);
    return {
      id: post.id,
      auditStatus: post.auditStatus,
      message: '发布成功，审核通过后展示',
    };
  }

  /**
   * 获取帖子详情
   */
  @Get(':id')
  @ApiOperation({ summary: '获取帖子详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getDetail(@Param('id') id: string) {
    return this.postService.getPostDetail(+id);
  }

  /**
   * 获取我的发布列表
   */
  @Get('my-posts')
  @ApiOperation({ summary: '获取我的发布列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiQuery({ name: 'status', enum: ['published', 'audit'], description: '状态' })
  async getMyPosts(
    @Request() req,
    @Query('status') status: 'published' | 'audit',
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
  ) {
    return this.postService.getMyPosts(req.user.id, { status, page, pageSize });
  }

  /**
   * 删除帖子
   */
  @Delete(':id')
  @ApiOperation({ summary: '删除帖子' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async delete(@Param('id') id: string, @Request() req) {
    await this.postService.deletePost(+id, req.user.id);
    return { message: '删除成功' };
  }
}