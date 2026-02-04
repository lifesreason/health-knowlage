import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OssService } from './oss.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('oss')
@Controller('oss')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OssController {
  constructor(private ossService: OssService) {}

  /**
   * 获取 OSS 上传签名
   */
  @Get('policy')
  @ApiOperation({ summary: '获取 OSS 上传签名' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiQuery({ name: 'fileType', enum: ['image', 'video'], description: '文件类型' })
  async getPolicy(@Query('fileType') fileType: 'image' | 'video') {
    return this.ossService.getUploadPolicy(fileType);
  }
}