import { Injectable, InternalServerErrorException, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MachineAuditConfigValidator implements OnModuleInit {
  private readonly logger = new Logger(MachineAuditConfigValidator.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const provider = (this.configService.get<string>('AUDIT_MACHINE_PROVIDER') || 'mock').toLowerCase();
    const enabled = this.readBoolean(['AUDIT_MACHINE_REVIEW_ENABLED', 'AUDIT_MACHINE_ENABLED'], false);

    if (!['mock', 'aliyun', 'tencent'].includes(provider)) {
      throw new InternalServerErrorException(`AUDIT_MACHINE_PROVIDER 配置非法: ${provider}`);
    }

    if (!enabled) {
      return;
    }

    if (provider === 'mock') {
      if (this.configService.get<string>('NODE_ENV') === 'production') {
        this.logger.warn('机审提供商为 mock，生产环境建议切换为 aliyun 或 tencent');
      }
      return;
    }

    if (provider === 'aliyun') {
      this.requireKeys([
        'AUDIT_ALIYUN_ACCESS_KEY_ID',
        'AUDIT_ALIYUN_ACCESS_KEY_SECRET',
        'AUDIT_ALIYUN_APP_KEY',
      ]);
      return;
    }

    if (provider === 'tencent') {
      this.requireKeys([
        'AUDIT_TENCENT_SECRET_ID',
        'AUDIT_TENCENT_SECRET_KEY',
      ]);
    }
  }

  private readBoolean(keys: string[], defaultValue: boolean): boolean {
    for (const key of keys) {
      const raw = this.configService.get<string>(key);
      if (raw === undefined || raw === null || raw === '') continue;
      return String(raw).toLowerCase() === 'true';
    }
    return defaultValue;
  }

  private requireKeys(keys: string[]) {
    const missing = keys.filter((key) => !this.configService.get<string>(key));
    if (missing.length > 0) {
      throw new InternalServerErrorException(`机审配置缺失: ${missing.join(', ')}`);
    }
  }
}
