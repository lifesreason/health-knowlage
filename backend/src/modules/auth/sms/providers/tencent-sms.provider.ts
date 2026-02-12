import { BadGatewayException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { createHash, createHmac } from 'crypto';
import { SmsProvider } from '../sms-provider.interface';

@Injectable()
export class TencentSmsProvider implements SmsProvider {
  private readonly host = 'sms.tencentcloudapi.com';
  private readonly service = 'sms';
  private readonly version = '2021-01-11';
  private readonly action = 'SendSms';
  private readonly algorithm = 'TC3-HMAC-SHA256';

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async sendCode(phone: string, code: string): Promise<void> {
    const secretId = this.requireEnv('SMS_TENCENT_SECRET_ID');
    const secretKey = this.requireEnv('SMS_TENCENT_SECRET_KEY');
    const sdkAppId = this.requireEnv('SMS_TENCENT_SDK_APP_ID');
    const signName = this.requireEnv('SMS_SIGN_NAME');
    const templateId = this.requireEnv('SMS_TEMPLATE_CODE');
    const region = this.configService.get<string>('SMS_TENCENT_REGION') || 'ap-guangzhou';

    const payloadObj = {
      SmsSdkAppId: sdkAppId,
      SignName: signName,
      TemplateId: templateId,
      TemplateParamSet: [code],
      PhoneNumberSet: [`+86${phone}`],
    };
    const payload = JSON.stringify(payloadObj);
    const timestamp = Math.floor(Date.now() / 1000);
    const date = new Date(timestamp * 1000).toISOString().slice(0, 10);

    const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${this.host}\nx-tc-action:${this.action.toLowerCase()}\n`;
    const signedHeaders = 'content-type;host;x-tc-action';
    const hashedRequestPayload = this.sha256(payload);
    const canonicalRequest = `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${hashedRequestPayload}`;
    const credentialScope = `${date}/${this.service}/tc3_request`;
    const stringToSign = `${this.algorithm}\n${timestamp}\n${credentialScope}\n${this.sha256(canonicalRequest)}`;

    const secretDate = this.hmacSha256(date, `TC3${secretKey}`);
    const secretService = this.hmacSha256(this.service, secretDate);
    const secretSigning = this.hmacSha256('tc3_request', secretService);
    const signature = createHmac('sha256', secretSigning).update(stringToSign).digest('hex');
    const authorization =
      `${this.algorithm} Credential=${secretId}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const response = await firstValueFrom(
      this.httpService.post(`https://${this.host}`, payloadObj, {
        headers: {
          Authorization: authorization,
          'Content-Type': 'application/json; charset=utf-8',
          Host: this.host,
          'X-TC-Action': this.action,
          'X-TC-Timestamp': `${timestamp}`,
          'X-TC-Version': this.version,
          'X-TC-Region': region,
        },
      }),
    );

    const result = response?.data?.Response || {};
    if (result.Error) {
      throw new BadGatewayException(`腾讯云短信发送失败: ${result.Error.Message || result.Error.Code}`);
    }
  }

  private requireEnv(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new InternalServerErrorException(`${key} 未配置`);
    }
    return value;
  }

  private sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private hmacSha256(value: string, key: string | Buffer): Buffer {
    return createHmac('sha256', key).update(value).digest();
  }
}

