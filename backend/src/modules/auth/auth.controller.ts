import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { WechatLoginDto, BindMobileDto, LoginResponseDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * 微信登录
   */
  @Public()
  @Post('login')
  @ApiOperation({ summary: '微信小程序登录' })
  @ApiResponse({ status: 200, description: '登录成功', type: LoginResponseDto })
  async wechatLogin(@Body() dto: WechatLoginDto) {
    return this.authService.wechatLogin(dto);
  }

  /**
   * 绑定手机号
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('bind')
  @ApiOperation({ summary: '绑定手机号' })
  @ApiResponse({ status: 200, description: '绑定成功', type: LoginResponseDto })
  async bindMobile(@Request() req, @Body() dto: BindMobileDto) {
    // TODO: 从 Redis 获取 session_key
    const sessionKey = req.user.sessionKey || '';
    return this.authService.bindMobile(req.user.id, dto, sessionKey);
  }

  /**
   * 退出登录
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  @ApiOperation({ summary: '退出登录' })
  @ApiResponse({ status: 200, description: '退出成功' })
  async logout() {
    return { message: '退出成功' };
  }
}