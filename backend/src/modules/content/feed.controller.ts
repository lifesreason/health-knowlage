import { Controller, Get, Query, UseGuards, Public } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { PostService } from './post.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('feed')
@Controller('feed')
export class FeedController {
  constructor(private postService: PostService) {}

  /**
   * 获取首页推荐流
   */
  @Public()
  @Get('list')
  @ApiOperation({ summary: '获取首页推荐流' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiQuery({ name: 'type', enum: ['recommend', 'nearby', 'follow'], description: '类型' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量' })
  async getFeedList(
    @Query('type') type: 'recommend' | 'nearby' | 'follow' = 'recommend',
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
  ) {
    return this.postService.getFeedList({ type, page, pageSize });
  }
}