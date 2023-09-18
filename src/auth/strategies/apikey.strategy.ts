import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { HeaderAPIKeyStrategy } from 'passport-headerapikey';
import { AuthService } from '../auth.service.js';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(
  HeaderAPIKeyStrategy,
  'api-key',
) {
  constructor(
    private authService: AuthService,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    private configService: ConfigService,
  ) {
    const headerKeyApiKey =
      configService.get<string>('HEADER_KEY_API_KEY', { infer: true }) || '';

    super(
      { header: headerKeyApiKey, prefix: '' },
      true,
      (
        apiKey: string,
        done: (err: Error | null, user?: any, info?: any) => void,
      ) => {
        if (this.authService.validateApiKey(apiKey)) {
          done(null, true);
        }
        done(new UnauthorizedException(), null);
      },
    );
  }
}
