import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { WechatService } from './wechat.service';
import { JwtAuthService } from './jwt.service';
import { User } from '../../entities/user.entity';
import { WechatLoginDto, BindMobileDto, LoginResponseDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private wechatService: WechatService,
    private jwtAuthService: JwtAuthService,
  ) {}

  /**
   * 微信登录
   */
  async wechatLogin(dto: WechatLoginDto): Promise<LoginResponseDto> {
    // 1. 通过 code 换取 openid 和 session_key
    const wechatInfo = await this.wechatService.code2Session(dto.code);

    // 2. 查找用户是否存在
    let user = await this.userService.findByOpenid(wechatInfo.openid);

    // 3. 如果用户不存在，创建新用户
    if (!user) {
      user = await this.userService.createUser({
        openid: wechatInfo.openid,
        unionid: wechatInfo.unionid,
        nickname: '用户',
        avatarUrl: '',
        role: 0,
        fontScale: 1.0,
        isVerified: false,
        status: 1,
      });
    }

    // 4. 生成 Token
    const tokens = await this.jwtAuthService.generateTokens(user.id);

    // 5. 判断是否需要绑定手机号
    const needBind = !user.mobileCipher;

    return {
      ...tokens,
      needBind,
      userInfo: needBind ? undefined : {
        id: user.id,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        role: user.role,
        fontScale: user.fontScale,
      },
    };
  }

  /**
   * 绑定手机号
   */
  async bindMobile(userId: number, dto: BindMobileDto, sessionKey: string): Promise<LoginResponseDto> {
    // 1. 解密手机号
    const phoneInfo = this.wechatService.decryptPhone(
      dto.encryptedData,
      dto.iv,
      sessionKey,
    );

    // 2. 加密手机号（AES-256-CBC）
    const mobileCipher = this.encryptMobile(phoneInfo.phoneNumber);

    // 3. 绑定手机号
    const user = await this.userService.bindMobile(userId, mobileCipher);

    // 4. 生成新 Token
    const tokens = await this.jwtAuthService.generateTokens(user.id);

    return {
      ...tokens,
      needBind: false,
      userInfo: {
        id: user.id,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        role: user.role,
        fontScale: user.fontScale,
      },
    };
  }

  /**
   * 加密手机号 (AES-256-CBC)
   */
  private encryptMobile(mobile: string): string {
    const crypto = require('crypto-js');
    const secretKey = process.env.AES_SECRET_KEY;

    const encrypted = crypto.AES.encrypt(mobile, crypto.enc.Utf8.parse(secretKey), {
      iv: crypto.enc.Utf8.parse(secretKey.substring(0, 16)),
      mode: crypto.mode.CBC,
      padding: crypto.pad.Pkcs7,
    });

    return encrypted.toString();
  }

  /**
   * 解密手机号 (AES-256-CBC)
   */
  decryptMobile(mobileCipher: string): string {
    const crypto = require('crypto-js');
    const secretKey = process.env.AES_SECRET_KEY;

    const decrypted = crypto.AES.decrypt(mobileCipher, crypto.enc.Utf8.parse(secretKey), {
      iv: crypto.enc.Utf8.parse(secretKey.substring(0, 16)),
      mode: crypto.mode.CBC,
      padding: crypto.pad.Pkcs7,
    });

    return decrypted.toString(crypto.enc.Utf8);
  }
}