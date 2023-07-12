import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ForgotModule } from 'src/forgot/forgot.module';
import { MailModule } from 'src/mail/mail.module';
import { SessionModule } from 'src/session/session.module';
import { UsersModule } from 'src/users/users.module';
import { IsExist } from 'src/utils/validators/is-exists.validator';
import { IsNotExist } from 'src/utils/validators/is-not-exists.validator';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AnonymousStrategy } from './strategies/anonymous.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersGuard } from './users.guard';

@Module({
  imports: [
    UsersModule,
    ForgotModule,
    SessionModule,
    PassportModule,
    MailModule,
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    IsExist,
    IsNotExist,
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    AnonymousStrategy,
    UsersGuard,
  ],
  exports: [AuthService, UsersGuard],
})
export class AuthModule {}
