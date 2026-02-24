import { BadGatewayException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { createHash, createHmac, randomUUID } from 'crypto';
import { firstValueFrom } from 'rxjs';
import {
  MachineAuditPayload,
  MachineAuditProvider,
  MachineAuditResult,
} from './machine-audit-provider.interface';

@Injectable()
export class AliyunMachineAuditProvider implements MachineAuditProvider {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async review(payload: MachineAuditPayload): Promise<MachineAuditResult> {
    const accessKeyId = this.requireEnv('AUDIT_ALIYUN_ACCESS_KEY_ID');
    const accessKeySecret = this.requireEnv('AUDIT_ALIYUN_ACCESS_KEY_SECRET');
    const appKey = this.requireEnv('AUDIT_ALIYUN_APP_KEY');
    const endpoint = this.configService.get<string>('AUDIT_ALIYUN_ENDPOINT')
      || 'https://green-cip.cn-shanghai.aliyuncs.com/green/text/scan';
    const bizType = this.configService.get<string>('AUDIT_ALIYUN_BIZ_TYPE') || undefined;

    const bodyObj: Record<string, any> = {
      scenes: ['antispam'],
      tasks: [
        {
          dataId: `${payload.postId}-${Date.now()}`,
          content: `${payload.title || ''}\n${payload.content || ''}`.trim() || ' ',
        },
      ],
    };
    if (bizType) {
      bodyObj.bizType = bizType;
    }

    const body = JSON.stringify(bodyObj);
    const accept = 'application/json';
    const contentType = 'application/json';
    const date = new Date().toUTCString();
    const nonce = randomUUID();
    const md5 = createHash('md5').update(body).digest('base64');

    const headersToSign = {
      'x-acs-accesskey-id': accessKeyId,
      'x-acs-signature-method': 'HMAC-SHA1',
      'x-acs-signature-nonce': nonce,
      'x-acs-signature-version': '1.0',
      'x-acs-version': '2018-05-09',
      'x-acs-content-md5': md5,
      'x-acs-app-key': appKey,
    };

    const canonicalizedHeaders = Object.keys(headersToSign)
      .sort()
      .map((key) => `${key}:${headersToSign[key]}`)
      .join('\n');

    const url = new URL(endpoint);
    const canonicalizedResource = `${url.pathname}`;
    const stringToSign = [
      'POST',
      accept,
      md5,
      contentType,
      date,
      `${canonicalizedHeaders}\n${canonicalizedResource}`,
    ].join('\n');

    const signature = createHmac('sha1', accessKeySecret).update(stringToSign).digest('base64');

    const response = await firstValueFrom(
      this.httpService.post(endpoint, bodyObj, {
        headers: {
          Accept: accept,
          'Content-Type': contentType,
          Date: date,
          'Content-MD5': md5,
          Authorization: `acs ${accessKeyId}:${signature}`,
          'x-acs-accesskey-id': accessKeyId,
          'x-acs-signature-method': 'HMAC-SHA1',
          'x-acs-signature-nonce': nonce,
          'x-acs-signature-version': '1.0',
          'x-acs-version': '2018-05-09',
          'x-acs-content-md5': md5,
          'x-acs-app-key': appKey,
        },
      }),
    );

    const data = response?.data || {};
    if (Number(data.code || 0) !== 200) {
      throw new BadGatewayException(`阿里云机审调用失败: ${data.msg || data.message || data.code || 'unknown'}`);
    }

    const firstTask = Array.isArray(data.data) ? data.data[0] : null;
    const firstResult = Array.isArray(firstTask?.results) ? firstTask.results[0] : null;
    const suggestion = String(firstResult?.suggestion || 'review').toLowerCase();

    let decision: 'pass' | 'review' | 'reject' = 'review';
    if (suggestion === 'pass') decision = 'pass';
    if (suggestion === 'block') decision = 'reject';

    return {
      provider: 'aliyun',
      decision,
      riskLabel: firstResult?.label || null,
      reason: firstResult?.description || `suggestion=${suggestion}`,
      confidence: Number(firstResult?.rate || 0),
      details: {
        suggestion,
        data,
      },
    };
  }

  private requireEnv(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new InternalServerErrorException(`${key} 未配置`);
    }
    return value;
  }
}
