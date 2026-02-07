import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get('google.clientId'),
      clientSecret: configService.get('google.clientSecret'),
      callbackURL: configService.get('google.callbackUrl'),
      scope: [
        'email',
        'profile',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/spreadsheets',
      ],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { emails, displayName, photos } = profile;
    
    const user = await this.authService.validateOAuthUser({
      email: emails[0].value,
      name: displayName,
      provider: 'google',
      providerId: profile.id,
      accessToken,
      refreshToken,
      avatar: photos?.[0]?.value,
    });
    
    done(null, user);
  }
}
