import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util.js';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { plainToClass } from 'class-transformer';
import crypto from 'crypto';
import ms from 'ms';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { ForgotService } from '../forgot/forgot.service.js';
import { I18nTranslations } from '../i18n/i18n.generated.js';
import { MailService } from '../mail/mail.service.js';
import { SessionEntity } from '../session/entities/session.entity.js';
import { SessionService } from '../session/session.service.js';
import { SocialInterface } from '../social/interfaces/social.interface.js';
import { RoleEntity } from '../users/entities/role.entity.js';
import { StatusEntity } from '../users/entities/status.entity.js';
import { UserEntity } from '../users/entities/user.entity.js';
import { RoleEnum } from '../users/roles.enum.js';
import { StatusEnum } from '../users/statuses.enum.js';
import { UsersService } from '../users/users.service.js';
import { NullableType } from '../utils/nullable.type.js';
import { AuthenticationsProvidersEnum } from './authentication-providers.enum.js';
import { AuthenticationConfig } from './authentication.config.js';
import { AuthenticationEmailRegisterRequestBody } from './dto/authentication-email-register.dto.js';
import { AuthenticationUpdateRequestBody } from './dto/authentication-update.dto.js';
import { JwtPayloadType } from './strategies/types/jwt-payload.type.js';
import { JwtRefreshPayloadType } from './strategies/types/jwt-refresh-payload.type.js';
import { AuthenticationResponse } from './types/authentication-response.type.js';

@Injectable()
export class AuthenticationService {
  private readonly logger = new Logger(AuthenticationService.name);

  constructor(
    private readonly jwtService: JwtService,
    @Inject(AuthenticationConfig.KEY)
    private readonly config: ConfigType<typeof AuthenticationConfig>,
    private readonly i18n: I18nService<I18nTranslations>,
    private readonly usersService: UsersService,
    private readonly forgotService: ForgotService,
    private readonly sessionService: SessionService,
    private readonly mailService: MailService,
  ) {
    this.logger.verbose(this.constructor.name);
  }

  currentLanguageTranslations() {
    return this.i18n.t('auth', {
      lang: I18nContext.current()?.lang,
    });
  }

  validateApiKey(apiKey: string): boolean {
    this.logger.verbose(`${this.validateApiKey.name} ${apiKey}`);
    const noApiKeys = this.config.apiKeys.length === 0;
    const foundApiKey =
      this.config.apiKeys.find((key) => apiKey == key) !== undefined;
    this.logger.verbose(`noApiKeys ${noApiKeys}`);
    this.logger.verbose(`foundApiKey ${foundApiKey}`);
    return noApiKeys || foundApiKey;
  }

  async loginOrThrow(
    loginDto: AuthenticationEmailRegisterRequestBody,
    onlyAdmin: boolean,
  ): Promise<AuthenticationResponse> {
    this.logger.verbose(this.loginOrThrow.name);
    const translations = this.currentLanguageTranslations();

    const user = await this.usersService.findOne({
      where: {
        email: loginDto.email,
      },
    });

    if (
      !user ||
      (user?.role &&
        !(onlyAdmin
          ? user.role.id === RoleEnum.admin
          : [RoleEnum.user].includes(user.role.id as RoleEnum)))
    ) {
      throw new UnauthorizedException(translations.invalidEmailOrPassword);
    }

    if (user.provider !== AuthenticationsProvidersEnum.email) {
      throw new UnprocessableEntityException(
        this.i18n.t('auth.loginViaProvider', {
          args: { provider: user.provider },
        }),
      );
    }

    if (user.password === undefined) {
      throw new InternalServerErrorException({
        message: translations.loginFailed,
        fields: {
          password: translations.passwordRequired,
        },
      });
    }

    const isValidPassword = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException({
        message: translations.loginFailed,
        fields: {
          password: translations.passwordInvalid,
        },
      });
    }

    const session = await this.sessionService.save(
      this.sessionService.create({
        user,
      }),
    );

    const tokensData = {
      id: user.id,
      role: user.role,
      sessionId: session.id,
    };

    this.logger.debug(`tokensData: ${JSON.stringify(tokensData)}`);

    const { token, refreshToken, tokenExpires } =
      await this.getTokensData(tokensData);

    return {
      refreshToken,
      token,
      tokenExpires,
      user,
    };
  }

  async validateSocialLogin(
    authProvider: string,
    socialData: SocialInterface,
    roleEnum: RoleEnum,
  ): Promise<AuthenticationResponse> {
    this.logger.verbose(this.validateSocialLogin.name);
    const translations = this.currentLanguageTranslations();
    let user: NullableType<UserEntity>;
    const socialEmail = socialData.email?.toLowerCase();

    const userByEmail = await this.usersService.findOne({
      where: { email: socialEmail },
    });

    user = await this.usersService.findOne({
      where: {
        socialId: socialData.id,
        provider: authProvider,
      },
    });

    if (user && user.id) {
      if (socialEmail && !userByEmail) {
        user.email = socialEmail;
      }
      await this.usersService.patch({ where: { id: user.id } }, user);
    } else if (userByEmail) {
      user = userByEmail;
    } else {
      const role = plainToClass(RoleEntity, {
        id: roleEnum,
      });
      const status = plainToClass(StatusEntity, {
        id: StatusEnum.active,
      });

      user = await this.usersService.save(
        this.usersService.create({
          email: socialEmail ?? null,
          firstName: socialData.firstName ?? null,
          lastName: socialData.lastName ?? null,
          socialId: socialData.id,
          provider: authProvider,
          role,
          status,
        }),
      );

      user = await this.usersService.findOne({
        where: {
          id: user.id,
        },
      });
    }

    if (!user) {
      throw new UnprocessableEntityException(translations.userNotFound);
    }

    const session = await this.sessionService.save(
      this.sessionService.create({
        user,
      }),
    );

    const tokensData = {
      id: user.id,
      role: user.role,
      sessionId: session.id,
    };

    const {
      token: jwtToken,
      refreshToken,
      tokenExpires,
    } = await this.getTokensData(tokensData);

    return {
      refreshToken,
      token: jwtToken,
      tokenExpires,
      user,
    };
  }

  async registerOrThrow(
    dto: AuthenticationEmailRegisterRequestBody,
  ): Promise<AuthenticationResponse> {
    this.logger.verbose(this.registerOrThrow.name);
    const translations = this.currentLanguageTranslations();
    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    if (await this.usersService.exist({ where: { email: dto.email } })) {
      throw new UnprocessableEntityException({
        message: translations.registrationFailed,
        fields: {
          email: translations.emailAlreadyExists,
        },
      });
    }

    const user = await this.usersService.save(
      this.usersService.create({
        ...dto,
        email: dto.email,
        role: {
          id: RoleEnum.user,
        } as RoleEntity,
        status: {
          id: StatusEnum.inactive,
        } as StatusEntity,
        hash,
      }),
    );

    const session = await this.sessionService.save(
      this.sessionService.create({
        user,
      }),
    );

    const { token, refreshToken, tokenExpires } = await this.getTokensData({
      id: user.id,
      role: user.role,
      sessionId: session.id,
    });

    return {
      refreshToken,
      token,
      tokenExpires,
      user,
    };

    // await this.mailService.userSignUp({
    //   to: dto.email,
    //   data: {
    //     hash,
    //   },
    // });
  }

  async confirmEmail(hash: string): Promise<void> {
    this.logger.verbose(this.confirmEmail.name);
    const translations = this.currentLanguageTranslations();
    const user = await this.usersService.findOne({
      where: {
        hash,
      },
    });

    if (!user) {
      throw new NotFoundException(translations.userNotFound);
    }

    user.hash = null;
    user.status = plainToClass(StatusEntity, {
      id: StatusEnum.active,
    });
    await user.save();
  }

  async createForgotPasswordOrThrow(email: string): Promise<void> {
    this.logger.verbose(this.createForgotPasswordOrThrow.name);
    const translations = this.currentLanguageTranslations();
    const user = await this.usersService.findOne({
      where: {
        email,
      },
    });

    if (!user || !user.email || !user.firstName) {
      throw new UnprocessableEntityException(translations.emailNotFound);
    }

    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');
    await this.forgotService.save(
      this.forgotService.create({
        hash,
        user,
      }),
    );
    await this.mailService.sendForgotPasswordOrThrow({
      to: {
        name: user.fullName,
        address: user.email,
      },
      hash,
    });
  }

  async resetPassword(hash: string, password: string): Promise<void> {
    this.logger.verbose(this.resetPassword.name);
    const translations = this.currentLanguageTranslations();
    const forgot = await this.forgotService.findOne({
      where: {
        hash,
      },
    });

    if (!forgot) {
      throw new UnprocessableEntityException(translations.invalidResetToken);
    }

    const user = forgot.user;

    if (!user) {
      throw new NotFoundException(translations.userNotFound);
    }

    user.password = password;

    await this.sessionService.delete({
      userId: user.id,
    });
    await user.save();
    if (forgot.id) {
      await this.forgotService.delete(forgot.id);
    }
  }

  async me(userJwtPayload: JwtPayloadType): Promise<NullableType<UserEntity>> {
    this.logger.verbose(this.me.name);
    return this.usersService.findOne({
      where: {
        id: userJwtPayload.id,
      },
    });
  }

  async update(
    userJwtPayload: JwtPayloadType,
    userDto: AuthenticationUpdateRequestBody,
  ): Promise<NullableType<UserEntity>> {
    this.logger.verbose(this.update.name);
    const translations = this.currentLanguageTranslations();
    if (userDto.password) {
      if (userDto.oldPassword) {
        const currentUser = await this.usersService.findOne({
          where: {
            id: userJwtPayload.id,
          },
        });

        if (!currentUser || !currentUser.password) {
          throw new UnprocessableEntityException(translations.userNotFound);
        }

        const isValidOldPassword = await bcrypt.compare(
          userDto.oldPassword,
          currentUser.password,
        );

        if (!isValidOldPassword) {
          throw new UnprocessableEntityException({
            message: translations.invalidOldPassword,
            fields: {
              oldPassword: translations.passwordInvalid,
            },
          });
        } else {
          await this.sessionService.deleteExcluding({
            user: {
              id: currentUser.id,
            },
            excludeId: userJwtPayload.sessionId,
          });
        }
      } else {
        throw new UnprocessableEntityException(translations.invalidOldPassword);
      }
    }

    if (!userJwtPayload.id) {
      throw new NotFoundException(translations.invalidSession);
    }

    await this.usersService.patch(
      { where: { id: userJwtPayload.id } },
      userDto,
    );

    return this.usersService.findOne({
      where: {
        id: userJwtPayload.id,
      },
    });
  }

  async refreshToken(
    data: Pick<JwtRefreshPayloadType, 'sessionId'>,
  ): Promise<Omit<AuthenticationResponse, 'user'>> {
    this.logger.verbose(this.refreshToken.name);
    if (data.sessionId == undefined) {
      throw new UnauthorizedException();
    }

    const session = await this.sessionService.findOne({
      where: {
        id: data.sessionId,
      },
      relations: {
        user: true,
      },
    });

    if (!session) {
      throw new UnauthorizedException(
        `Unable to find session with ID ${data.sessionId}`,
      );
    }

    if (!session.user) {
      throw new UnauthorizedException(
        `Unable to find user for session with ID ${data.sessionId}`,
      );
    }

    const { token, refreshToken, tokenExpires } = await this.getTokensData({
      id: session.user.id,
      role: session.user.role,
      sessionId: session.id,
    });

    return {
      token,
      refreshToken,
      tokenExpires,
    };
  }

  async logout(data: Pick<JwtRefreshPayloadType, 'sessionId'>) {
    this.logger.verbose(this.logout.name);
    return this.sessionService.delete({
      id: data.sessionId,
    });
  }

  private async getTokensData(data: {
    id: UserEntity['id'];
    role: UserEntity['role'];
    sessionId: SessionEntity['id'];
  }) {
    this.logger.verbose(this.getTokensData.name);

    const tokenExpires = Date.now() + ms(this.config.expires);

    const [token, refreshToken] = await Promise.all([
      await this.jwtService.signAsync(
        {
          id: data.id,
          role: data.role,
          sessionId: data.sessionId,
        },
        {
          secret: this.config.secret,
          expiresIn: this.config.expires,
        },
      ),
      await this.jwtService.signAsync(
        {
          sessionId: data.sessionId,
        },
        {
          secret: this.config.refreshSecret,
          expiresIn: this.config.refreshExpires,
        },
      ),
    ]);

    return {
      token,
      refreshToken,
      tokenExpires,
    };
  }
}
