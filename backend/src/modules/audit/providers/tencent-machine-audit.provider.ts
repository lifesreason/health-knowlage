import { BadGatewayException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { createHash, createHmac } from 'crypto';
import { firstValueFrom } from 'rxjs';
import {
  MachineAuditPayload,
  MachineAuditProvider,
  MachineAuditResult,
} from './machine-audit-provider.interface';

@Injectable()
export class TencentMachineAuditProvider implements MachineAuditProvider {
  private readonly host = 'tms.tencentcloudapi.com';
  private readonly service = 'tms';
  private readonly version = '2020-12-29';
  private readonly action = 'TextModeration';
  private readonly algorithm = 'TC3-HMAC-SHA256';

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async review(payload: MachineAuditPayload): Promise<MachineAuditResult> {
    const secretId = this.requireEnv('AUDIT_TENCENT_SECRET_ID');
    const secretKey = this.requireEnv('AUDIT_TENCENT_SECRET_KEY');
    const region = this.configService.get<string>('AUDIT_TENCENT_REGION') || 'ap-guangzhou';
    const bizType = this.configService.get<string>('AUDIT_TENCENT_BIZ_TYPE') || undefined;

    const rawText = `${payload.title || ''}\n${payload.content || ''}`.trim();
    const contentBase64 = Buffer.from(rawText || ' ').toString('base64');

    const payloadObj: Record<string, any> = {
      Content: contentBase64,
    };
    if (bizType) {
      payloadObj.BizType = bizType;
    }

    const payloadStr = JSON.stringify(payloadObj);
    const timestamp = Math.floor(Date.now() / 1000);
    const date = new Date(timestamp * 1000).toISOString().slice(0, 10);
    const canonicalHeaders =
      `content-type:application/json; charset=utf-8\n` +
      `host:${this.host}\n` +
      `x-tc-action:${this.action.toLowerCase()}\n`;
    const signedHeaders = 'content-type;host;x-tc-action';
    const hashedRequestPayload = this.sha256(payloadStr);
    const canonicalRequest =
      `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${hashedRequestPayload}`;
    const credentialScope = `${date}/${this.service}/tc3_request`;
    const stringToSign =
      `${this.algorithm}\n${timestamp}\n${credentialScope}\n${this.sha256(canonicalRequest)}`;

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
      throw new BadGatewayException(`腾讯机审调用失败: ${result.Error.Message || result.Error.Code}`);
    }

    const suggestion = String(result.Suggestion || 'Review').toLowerCase();
    let decision: 'pass' | 'review' | 'reject' = 'review';
    if (suggestion === 'pass') decision = 'pass';
    if (suggestion === 'block') decision = 'reject';

    const labels = Array.isArray(result.Labels) ? result.Labels : [];
    const topLabel = labels[0] || {};

    return {
      provider: 'tencent',
      decision,
      riskLabel: topLabel.Label || null,
      reason: topLabel.Name || `suggestion=${suggestion}`,
      confidence: Number(topLabel.Score || 0) / 100,
      details: {
        suggestion,
        labels,
        requestId: result.RequestId,
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

  private sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private hmacSha256(value: string, key: string | Buffer): Buffer {
    return createHmac('sha256', key).update(value).digest();
  }
}
