import { BadGatewayException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { createHmac, randomUUID } from 'crypto';
import { SmsProvider } from '../sms-provider.interface';

@Injectable()
export class AliyunSmsProvider implements SmsProvider {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async sendCode(phone: string, code: string): Promise<void> {
    const accessKeyId = this.requireEnv('SMS_ACCESS_KEY_ID');
    const accessKeySecret = this.requireEnv('SMS_ACCESS_KEY_SECRET');
    const signName = this.requireEnv('SMS_SIGN_NAME');
    const templateCode = this.requireEnv('SMS_TEMPLATE_CODE');
    const endpoint = this.configService.get<string>('SMS_ALIYUN_ENDPOINT') || 'https://dysmsapi.aliyuncs.com/';

    const params: Record<string, string> = {
      Action: 'SendSms',
      Version: '2017-05-25',
      Format: 'JSON',
      AccessKeyId: accessKeyId,
      SignatureMethod: 'HMAC-SHA1',
      Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
      SignatureVersion: '1.0',
      SignatureNonce: randomUUID(),
      RegionId: this.configService.get<string>('SMS_ALIYUN_REGION') || 'cn-hangzhou',
      PhoneNumbers: phone,
      SignName: signName,
      TemplateCode: templateCode,
      TemplateParam: JSON.stringify({ code }),
    };

    const canonicalized = Object.keys(params)
      .sort()
      .map((key) => `${this.percentEncode(key)}=${this.percentEncode(params[key])}`)
      .join('&');
    const stringToSign = `GET&${this.percentEncode('/')}&${this.percentEncode(canonicalized)}`;
    const signature = createHmac('sha1', `${accessKeySecret}&`)
      .update(stringToSign)
      .digest('base64');

    const queryString = `${canonicalized}&Signature=${this.percentEncode(signature)}`;
    const url = `${endpoint}${endpoint.includes('?') ? '&' : '?'}${queryString}`;
    const response = await firstValueFrom(this.httpService.get(url));
    const data = response?.data || {};

    if (data.Code && data.Code !== 'OK') {
      throw new BadGatewayException(`阿里云短信发送失败: ${data.Message || data.Code}`);
    }
  }

  private requireEnv(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new InternalServerErrorException(`${key} 未配置`);
    }
    return value;
  }

  private percentEncode(value: string): string {
    return encodeURIComponent(value)
      .replace(/\+/g, '%20')
      .replace(/\*/g, '%2A')
      .replace(/%7E/g, '~');
  }
}

