import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class WechatLoginDto {
  @ApiProperty({ description: '微信小程序 code' })
  @IsNotEmpty()
  @IsString()
  code: string;
}

export class BindMobileDto {
  @ApiProperty({ description: '加密数据' })
  @IsNotEmpty()
  @IsString()
  encryptedData: string;

  @ApiProperty({ description: '加密算法初始向量' })
  @IsNotEmpty()
  @IsString()
  iv: string;
}

export class SendCodeDto {
  @ApiProperty({ description: '手机号' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^1\d{10}$/, { message: '手机号格式不正确' })
  phone: string;
}

export class BindMobileManualDto {
  @ApiProperty({ description: '手机号' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^1\d{10}$/, { message: '手机号格式不正确' })
  phone: string;

  @ApiProperty({ description: '验证码' })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: '验证码必须为 6 位' })
  code: string;
}

export class AdminLoginDto {
  @ApiProperty({ description: '管理员用户名' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ description: '管理员密码' })
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: '刷新令牌' })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}

export class LoginResponseDto {
  @ApiProperty({ description: '访问令牌' })
  accessToken: string;

  @ApiProperty({ description: '刷新令牌' })
  refreshToken: string;

  @ApiProperty({ description: '是否需要绑定手机号' })
  needBind: boolean;

  @ApiProperty({ description: '用户信息', required: false })
  userInfo?: {
    id: number;
    nickname: string;
    avatarUrl: string;
    role: number;
    fontScale: number;
  };
}
