import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

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