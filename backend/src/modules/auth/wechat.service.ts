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

    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;

    try {
      const response = await firstValueFrom(this.httpService.get(url));

      if (response.data.errcode) {
        throw new HttpException(
          response.data.errmsg || '微信登录失败',
          HttpStatus.BAD_REQUEST,
        );
      }

      return response.data;
    } catch (error) {
      throw new HttpException(
        '微信服务异常',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
}