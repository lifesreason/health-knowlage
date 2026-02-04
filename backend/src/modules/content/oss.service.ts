import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface OssPolicyResponse {
  accessKeyId: string;
  signature: string;
  policy: string;
  host: string;
  expire: number;
  dir: string;
  fileName: string;
}

@Injectable()
export class OssService {
  constructor(private configService: ConfigService) {}

  /**
   * 获取 OSS 上传签名
   */
  async getUploadPolicy(fileType: 'image' | 'video'): Promise<OssPolicyResponse> {
    const region = this.configService.get('OSS_REGION');
    const accessKeyId = this.configService.get('OSS_ACCESS_KEY_ID');
    const accessKeySecret = this.configService.get('OSS_ACCESS_KEY_SECRET');
    const bucket = this.configService.get('OSS_BUCKET');

    if (!accessKeyId || !accessKeySecret || !bucket) {
      throw new HttpException(
        'OSS 配置未完成',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // 生成文件名
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const dir = fileType === 'image' ? 'images/' : 'videos/';
    const fileName = `${dir}${timestamp}${random}`;

    // 生成过期时间（1小时）
    const expire = new Date();
    expire.setHours(expire.getHours() + 1);
    const expireTime = Math.floor(expire.getTime() / 1000);

    // 生成 Policy
    const policy = JSON.stringify({
      expiration: new Date(expire).toISOString(),
      conditions: [
        ['content-length-range', 0, fileType === 'image' ? 10 * 1024 * 1024 : 200 * 1024 * 1024], // 图片10MB, 视频200MB
        ['starts-with', '$key', dir],
      ],
    });

    const base64Policy = Buffer.from(policy).toString('base64');

    // 生成签名
    const crypto = require('crypto');
    const signature = crypto
      .createHmac('sha1', accessKeySecret)
      .update(base64Policy)
      .digest('base64');

    // OSS endpoint
    const host = `https://${bucket}.${region}.aliyuncs.com`;

    return {
      accessKeyId,
      signature,
      policy: base64Policy,
      host,
      expire: expireTime,
      dir,
      fileName,
    };
  }
}