import { ConfigService } from '@nestjs/config';
import { ObtainTokenResponse } from 'square';
import { AllConfigType } from 'src/config.type';

export class SquareConfigUtils {
  constructor(private configService: ConfigService<AllConfigType>) {}

  testTokenReponse(): ObtainTokenResponse {
    return {
      accessToken: this.configService.get('square.testAccessToken', {
        infer: true,
      }),
      expiresAt: this.configService.get('square.testExpireAt', {
        infer: true,
      }),
      merchantId: this.configService.get('square.testId', {
        infer: true,
      }),
      refreshToken: this.configService.get('square.testRefreshToken', {
        infer: true,
      }),
    };
  }
}
