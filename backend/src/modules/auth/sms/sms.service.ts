import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AliyunSmsProvider } from './providers/aliyun-sms.provider';
import { TencentSmsProvider } from './providers/tencent-sms.provider';
import { MockSmsProvider } from './providers/mock-sms.provider';
import { SmsProvider } from './sms-provider.interface';

@Injectable()
export class SmsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly aliyunSmsProvider: AliyunSmsProvider,
    private readonly tencentSmsProvider: TencentSmsProvider,
    private readonly mockSmsProvider: MockSmsProvider,
  ) {}

  async sendCode(phone: string, code: string): Promise<void> {
    const provider = this.getProvider();
    await provider.sendCode(phone, code);
  }

  private getProvider(): SmsProvider {
    const provider = (this.configService.get<string>('SMS_PROVIDER') || 'mock').toLowerCase();
    if (provider === 'aliyun') return this.aliyunSmsProvider;
    if (provider === 'tencent') return this.tencentSmsProvider;
    return this.mockSmsProvider;
  }
}

