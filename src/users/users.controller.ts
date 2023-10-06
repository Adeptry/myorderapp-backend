import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Patch,
  Post,
  Req,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiKeyAuthGuard } from '../authentication/apikey-auth.guard.js';
import type { JwtGuardedRequest } from '../authentication/strategies/jwt.strategy.js';
import { MailService } from '../mail/mail.service.js';
import { SessionService } from '../session/session.service.js';
import { ErrorResponse } from '../utils/error-response.js';
import { ContactPostBody } from './dto/contact-post-body.dto.js';
import { SupportRequestPostBody } from './dto/support-request-post-body.dto.js';
import { UserPatchBody } from './dto/user-update.dto.js';
import { UserEntity } from './entities/user.entity.js';
import { UsersService } from './users.service.js';

@ApiBearerAuth()
@ApiSecurity('Api-Key')
@UseGuards(ApiKeyAuthGuard, AuthGuard('jwt'))
@ApiTags('Users')
@Controller({
  path: 'users',
  version: '2',
})
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly service: UsersService,
    private readonly sessionService: SessionService,
    private readonly mailService: MailService,
  ) {
    this.logger.verbose(this.constructor.name);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: UserEntity })
  @ApiOperation({ operationId: 'getUserMe' })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  getMe(@Req() request: JwtGuardedRequest) {
    this.logger.verbose(this.getMe.name);
    return this.service.findOne({ where: { id: request.user.id } });
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: UserEntity })
  @ApiOperation({ operationId: 'patchUserMe' })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiBody({ type: UserPatchBody })
  async patchMe(
    @Req() request: JwtGuardedRequest,
    @Body() body: UserPatchBody,
  ) {
    const { user } = request;
    const { id } = user;
    this.logger.verbose(this.patchMe.name);
    return await this.service.patch(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      { where: { id: id! } },
      body,
    );
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOkResponse({ type: UserEntity })
  @ApiOperation({ operationId: 'deleteUserMe' })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  async deleteMe(@Req() request: JwtGuardedRequest) {
    this.logger.verbose(this.deleteMe.name);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await this.service.delete(request.user.id!);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await this.sessionService.delete({ userId: request.user.id! });
    return;
  }

  @Post('support')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Send support request',
    operationId: 'postSupportRequest',
  })
  @ApiBody({ type: SupportRequestPostBody })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
  })
  @ApiOkResponse({})
  async postSupportRequest(
    @Req() request: JwtGuardedRequest,
    @Body() body: SupportRequestPostBody,
  ): Promise<void> {
    this.logger.verbose(this.postSupportRequest.name);

    const { user: jwtUser } = request;
    const { id: userId } = jwtUser;
    const { subject, text } = body;

    if (!userId) {
      throw new UnprocessableEntityException();
    }

    const user = await this.service.findOneOrFail({ where: { id: userId } });

    if (!user.email) {
      throw new UnprocessableEntityException();
    }

    if (!subject || !text) {
      throw new BadRequestException();
    }

    const admins = await this.service.findAdmins();

    await this.mailService.sendSupportRequestOrThrow({
      to: {
        address: user.email,
        name: user.fullName,
      },
      bcc: admins.map((admin) => admin.email!),
      subject,
      text,
    });

    return;
  }

  @Post('contact')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Send contact',
    operationId: 'postContact',
  })
  @ApiBody({ type: ContactPostBody })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
  })
  @ApiOkResponse({})
  async postContact(
    @Req() request: JwtGuardedRequest,
    @Body() body: ContactPostBody,
  ): Promise<void> {
    this.logger.verbose(this.postContact.name);

    const { user: jwtUser } = request;
    const { id: userId } = jwtUser;
    const { subject, text } = body;

    if (!userId) {
      throw new UnprocessableEntityException();
    }

    const user = await this.service.findOneOrFail({ where: { id: userId } });

    if (!user.email) {
      throw new UnprocessableEntityException();
    }

    if (!subject || !text) {
      throw new BadRequestException();
    }

    const admins = await this.service.findAdmins();

    await this.mailService.sendContactOrThrow({
      to: {
        address: user.email,
        name: user.fullName,
      },
      bcc: admins.map((admin) => admin.email!),
      subject,
      text,
    });

    return;
  }
}
