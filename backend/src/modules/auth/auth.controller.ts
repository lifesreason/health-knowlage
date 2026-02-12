import { Controller, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  WechatLoginDto,
  BindMobileDto,
  LoginResponseDto,
  SendCodeDto,
  BindMobileManualDto,
  AdminLoginDto,
} from './dto/login.dto';
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
    const sessionKey = this.authService.getSessionKey(req.user.id);
    if (!sessionKey) {
      throw new BadRequestException('session_key 已失效，请重新登录');
    }
    return this.authService.bindMobile(req.user.id, dto, sessionKey);
  }

  /**
   * 发送短信验证码
   */
  @Public()
  @Post('send-code')
  @ApiOperation({ summary: '发送短信验证码' })
  async sendCode(@Body() dto: SendCodeDto) {
    return this.authService.sendCode(dto);
  }

  /**
   * 手动绑定手机号
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('bind/phone')
  @ApiOperation({ summary: '手动绑定手机号' })
  async bindPhoneManual(@Request() req, @Body() dto: BindMobileManualDto) {
    return this.authService.bindMobileManual(req.user.id, dto);
  }

  /**
   * 管理员登录
   */
  @Public()
  @Post('admin/login')
  @ApiOperation({ summary: '管理后台登录' })
  @ApiResponse({ status: 200, description: '登录成功', type: LoginResponseDto })
  async adminLogin(@Body() dto: AdminLoginDto) {
    return this.authService.adminLogin(dto);
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
