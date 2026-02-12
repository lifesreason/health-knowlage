import { Injectable, InternalServerErrorException, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsConfigValidator implements OnModuleInit {
  private readonly logger = new Logger(SmsConfigValidator.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const provider = (this.configService.get<string>('SMS_PROVIDER') || 'mock').toLowerCase();
    const commonRequired = ['SMS_SIGN_NAME', 'SMS_TEMPLATE_CODE'];

    if (!['mock', 'aliyun', 'tencent'].includes(provider)) {
      throw new InternalServerErrorException(`SMS_PROVIDER 配置非法: ${provider}`);
    }

    if (provider === 'mock') {
      if (this.configService.get<string>('NODE_ENV') === 'production') {
        this.logger.warn('当前短信提供商为 mock，生产环境建议切换为 aliyun 或 tencent');
      }
      return;
    }

    if (provider === 'aliyun') {
      this.requireKeys(['SMS_ACCESS_KEY_ID', 'SMS_ACCESS_KEY_SECRET', ...commonRequired]);
      return;
    }

    if (provider === 'tencent') {
      this.requireKeys([
        'SMS_TENCENT_SECRET_ID',
        'SMS_TENCENT_SECRET_KEY',
        'SMS_TENCENT_SDK_APP_ID',
        ...commonRequired,
      ]);
    }
  }

  private requireKeys(keys: string[]) {
    const missing = keys.filter((key) => !this.configService.get<string>(key));
    if (missing.length > 0) {
      throw new InternalServerErrorException(`短信配置缺失: ${missing.join(', ')}`);
    }
  }
}

