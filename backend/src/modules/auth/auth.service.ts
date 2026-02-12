import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { WechatService } from './wechat.service';
import { JwtAuthService } from './jwt.service';
import {
  WechatLoginDto,
  BindMobileDto,
  LoginResponseDto,
  SendCodeDto,
  BindMobileManualDto,
  AdminLoginDto,
} from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly sessionKeyStore = new Map<number, { sessionKey: string; expiresAt: number }>();
  private readonly smsCodeStore = new Map<string, { code: string; expiresAt: number }>();

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

    // 临时保存微信 session_key，用于后续绑定手机号
    this.sessionKeyStore.set(user.id, {
      sessionKey: wechatInfo.session_key,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

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
   * 获取临时 sessionKey
   */
  getSessionKey(userId: number): string | null {
    const item = this.sessionKeyStore.get(userId);
    if (!item) return null;
    if (item.expiresAt < Date.now()) {
      this.sessionKeyStore.delete(userId);
      return null;
    }
    return item.sessionKey;
  }

  /**
   * 发送短信验证码（开发环境模拟）
   */
  async sendCode(dto: SendCodeDto) {
    const code = '123456';
    this.smsCodeStore.set(dto.phone, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    return {
      success: true,
      expiresIn: 300,
    };
  }

  /**
   * 手动绑定手机号
   */
  async bindMobileManual(userId: number, dto: BindMobileManualDto): Promise<LoginResponseDto> {
    const cached = this.smsCodeStore.get(dto.phone);
    if (!cached || cached.expiresAt < Date.now() || cached.code !== dto.code) {
      throw new BadRequestException('验证码错误或已过期');
    }

    const mobileCipher = this.encryptMobile(dto.phone);
    const user = await this.userService.bindMobile(userId, mobileCipher);
    this.smsCodeStore.delete(dto.phone);

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
   * 管理员登录
   */
  async adminLogin(dto: AdminLoginDto): Promise<LoginResponseDto> {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (dto.username !== adminUsername || dto.password !== adminPassword) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    let admin = await this.userService.findByOpenid('SYSTEM_ADMIN');
    if (!admin) {
      admin = await this.userService.createUser({
        openid: 'SYSTEM_ADMIN',
        nickname: '系统管理员',
        avatarUrl: '',
        role: 9,
        status: 1,
        fontScale: 1.0,
      });
    }

    const tokens = await this.jwtAuthService.generateTokens(admin.id);

    return {
      ...tokens,
      needBind: false,
      userInfo: {
        id: admin.id,
        nickname: admin.nickname,
        avatarUrl: admin.avatarUrl,
        role: admin.role,
        fontScale: admin.fontScale,
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
