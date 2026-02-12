import { Injectable, Logger } from '@nestjs/common';
import { SmsProvider } from '../sms-provider.interface';

@Injectable()
export class MockSmsProvider implements SmsProvider {
  private readonly logger = new Logger(MockSmsProvider.name);

  async sendCode(phone: string, code: string): Promise<void> {
    this.logger.log(`[MOCK_SMS] phone=${phone}, code=${code}`);
  }
}

