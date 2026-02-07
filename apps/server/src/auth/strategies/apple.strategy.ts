import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-apple';
import { AuthService } from '../auth.service';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get('apple.clientId'),
      teamID: configService.get('apple.teamId'),
      keyID: configService.get('apple.keyId'),
      privateKeyString: configService.get('apple.privateKey'),
      callbackURL: configService.get('apple.callbackUrl'),
      scope: ['name', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<any> {
    const user = await this.authService.validateOAuthUser({
      email: profile.email,
      name: profile.name ? `${profile.name.firstName} ${profile.name.lastName}` : profile.email,
      provider: 'apple',
      providerId: profile.id,
      accessToken,
      refreshToken,
    });
    
    return user;
  }
}
