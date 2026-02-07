import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-kakao';
import { AuthService } from '../auth.service';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get('kakao.clientId'),
      clientSecret: configService.get('kakao.clientSecret'),
      callbackURL: configService.get('kakao.callbackUrl'),
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ): Promise<any> {
    const { _json } = profile;
    
    const user = await this.authService.validateOAuthUser({
      email: _json.kakao_account.email,
      name: _json.properties.nickname,
      provider: 'kakao',
      providerId: profile.id,
      accessToken,
      refreshToken,
      avatar: _json.properties.profile_image,
    });
    
    done(null, user);
  }
}
