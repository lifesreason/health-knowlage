import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { WechatService } from '../auth/wechat.service';

@ApiTags('share')
@Controller('share')
export class ShareController {
  constructor(private readonly wechatService: WechatService) {}

  @Public()
  @Get('wxacode')
  @ApiOperation({ summary: '获取小程序码' })
  @ApiQuery({ name: 'scene', required: true, description: '场景参数，建议 URL 编码后传入' })
  @ApiQuery({ name: 'page', required: false, description: '页面路径，默认 pages/index/index' })
  @ApiQuery({ name: 'width', required: false, description: '码宽度，默认 280' })
  async getWxaCode(
    @Query('scene') scene: string,
    @Query('page') page: string = 'pages/index/index',
    @Query('width') width: string = '280',
    @Res({ passthrough: true }) res: Response,
  ) {
    const buffer = await this.wechatService.getWxaCodeUnlimit(scene, page, Number(width || 280));
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=300');
    return buffer;
  }
}

