import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtAuthService } from './jwt.service';
import { WechatService } from './wechat.service';
import { AuthCacheService } from './auth-cache.service';
import { SmsService } from './sms/sms.service';
import { SmsConfigValidator } from './sms/sms-config.validator';
import { AliyunSmsProvider } from './sms/providers/aliyun-sms.provider';
import { TencentSmsProvider } from './sms/providers/tencent-sms.provider';
import { MockSmsProvider } from './sms/providers/mock-sms.provider';
import { UserModule } from '../user/user.module';
import { User } from '../../entities/user.entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN'),
        },
      }),
    }),
    HttpModule,
    TypeOrmModule.forFeature([User]),
    UserModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthService,
    WechatService,
    AuthCacheService,
    SmsService,
    SmsConfigValidator,
    AliyunSmsProvider,
    TencentSmsProvider,
    MockSmsProvider,
    JwtStrategy,
    JwtAuthGuard,
  ],
  exports: [PassportModule, JwtModule, JwtAuthService, JwtAuthGuard, UserModule, WechatService],
})
export class AuthModule {}
