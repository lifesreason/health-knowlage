import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async generateTokens(userId: number) {
    const payload = { sub: userId };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_EXPIRES_IN') || '7d',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '30d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async verifyToken(token: string): Promise<any> {
    return this.jwtService.verify(token);
  }

  async verifyRefreshToken(token: string): Promise<any> {
    return this.jwtService.verify(token, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
    });
  }
}
