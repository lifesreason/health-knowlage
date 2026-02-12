import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
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

  /**
   * 获取视频流
   */
  @Get('videos')
  @ApiOperation({ summary: '获取视频流' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量' })
  async getVideoList(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
  ) {
    return this.postService.getVideoFeed({ page, pageSize });
  }

  /**
   * 获取附近内容
   */
  @Get('nearby')
  @ApiOperation({ summary: '获取附近内容' })
  @ApiQuery({ name: 'lat', required: false, description: '纬度' })
  @ApiQuery({ name: 'lng', required: false, description: '经度' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量' })
  async getNearbyList(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
  ) {
    const parsedLat = lat !== undefined ? Number(lat) : undefined;
    const parsedLng = lng !== undefined ? Number(lng) : undefined;
    return this.postService.getFeedList({
      type: 'nearby',
      page: Number(page),
      pageSize: Number(pageSize),
      lat: Number.isNaN(parsedLat as number) ? undefined : parsedLat,
      lng: Number.isNaN(parsedLng as number) ? undefined : parsedLng,
    });
  }

  /**
   * 获取关注用户内容
   */
  @Get('following')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取关注用户内容' })
  @ApiResponse({ status: 401, description: '未登录' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量' })
  async getFollowingList(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
  ) {
    return this.postService.getFeedList({ type: 'follow', page, pageSize, userId: req.user.id });
  }
}
