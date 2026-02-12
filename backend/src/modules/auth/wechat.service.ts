import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface WechatLoginResponse {
  openid: string;
  session_key: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

export interface WechatPhoneInfo {
  phoneNumber: string;
  purePhoneNumber: string;
  countryCode: string;
}

@Injectable()
export class WechatService {
  private accessTokenCache: { token: string; expiresAt: number } | null = null;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  /**
   * 微信小程序登录
   */
  async code2Session(code: string): Promise<WechatLoginResponse> {
    const appId = this.configService.get('WX_APP_ID');
    const appSecret = this.configService.get('WX_APP_SECRET');
    const mockEnabled =
      this.configService.get<string>('NODE_ENV') !== 'production' &&
      this.configService.get<string>('WX_LOGIN_MOCK_ENABLED') === 'true';

    if (mockEnabled) {
      return {
        openid: `mock_openid_${code || 'default'}`,
        session_key: 'mock_session_key_for_dev',
        unionid: `mock_unionid_${code || 'default'}`,
      };
    }

    this.assertWechatConfig(appId, appSecret);

    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;

    try {
      const response = await firstValueFrom(this.httpService.get(url));

      if (response.data.errcode) {
        throw new HttpException(
          `${response.data.errmsg || '微信登录失败'} (errcode=${response.data.errcode})`,
          HttpStatus.BAD_REQUEST,
        );
      }

      return response.data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const wechatErrmsg = (error as any)?.response?.data?.errmsg;
      const wechatErrcode = (error as any)?.response?.data?.errcode;
      if (wechatErrmsg || wechatErrcode) {
        throw new HttpException(
          `${wechatErrmsg || '微信登录失败'}${wechatErrcode ? ` (errcode=${wechatErrcode})` : ''}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const rawMsg = (error as any)?.message || '微信服务异常';
      throw new HttpException(`微信服务异常: ${rawMsg}`, HttpStatus.BAD_GATEWAY);
    }
  }

  /**
   * 解密微信手机号
   */
  decryptPhone(
    encryptedData: string,
    iv: string,
    sessionKey: string,
  ): WechatPhoneInfo {
    const crypto = require('crypto-js');

    const key = crypto.enc.Base64.parse(sessionKey);
    const iv2 = crypto.enc.Base64.parse(iv);
    const decrypted = crypto.AES.decrypt(encryptedData, key, {
      iv: iv2,
      mode: crypto.mode.CBC,
      padding: crypto.pad.Pkcs7,
    });

    const decryptedStr = crypto.enc.Utf8.stringify(decrypted);
    return JSON.parse(decryptedStr);
  }

  /**
   * 获取小程序全局 access_token
   */
  async getAccessToken(): Promise<string> {
    if (this.accessTokenCache && this.accessTokenCache.expiresAt > Date.now()) {
      return this.accessTokenCache.token;
    }

    const appId = this.configService.get('WX_APP_ID');
    const appSecret = this.configService.get('WX_APP_SECRET');
    this.assertWechatConfig(appId, appSecret);
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;

    const response = await firstValueFrom(this.httpService.get(url));
    const data = response.data || {};
    if (!data.access_token) {
      throw new HttpException(data.errmsg || '获取微信 access_token 失败', HttpStatus.BAD_REQUEST);
    }

    const expiresIn = Number(data.expires_in || 7200);
    this.accessTokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + Math.max(60, expiresIn - 60) * 1000,
    };

    return data.access_token;
  }

  /**
   * 生成小程序码（不限量）
   */
  async getWxaCodeUnlimit(scene: string, page: string, width = 280): Promise<Buffer> {
    const accessToken = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`;

    const response = await firstValueFrom(this.httpService.post(url, {
      scene,
      page,
      check_path: false,
      width,
    }, {
      responseType: 'arraybuffer',
    }));

    const contentType = response.headers?.['content-type'] || '';
    const buffer = Buffer.from(response.data);
    if (String(contentType).includes('application/json')) {
      const json = JSON.parse(buffer.toString('utf8'));
      throw new HttpException(json.errmsg || '生成小程序码失败', HttpStatus.BAD_REQUEST);
    }

    return buffer;
  }

  private assertWechatConfig(appId?: string, appSecret?: string) {
    if (!appId || !appSecret || appId.includes('your_') || appSecret.includes('your_')) {
      throw new HttpException(
        '微信配置缺失，请检查 WX_APP_ID / WX_APP_SECRET',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
