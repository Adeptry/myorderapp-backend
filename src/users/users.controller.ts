import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Patch,
  Req,
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
import type { AuthenticatedRequest } from '../authentication/authentication.guard.js';
import { SessionService } from '../session/session.service.js';
import { ErrorResponse } from '../utils/error-response.js';
import { UserUpdateDto } from './dto/user-update.dto.js';
import { User } from './entities/user.entity.js';
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
  ) {
    this.logger.verbose(this.constructor.name);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: User })
  @ApiOperation({ operationId: 'getUserMe' })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  getMe(@Req() request: AuthenticatedRequest) {
    this.logger.verbose(this.getMe.name);
    return this.service.findOne({ where: { id: request.user.id } });
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: User })
  @ApiOperation({ operationId: 'patchUserMe' })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiBody({ type: UserUpdateDto })
  async patchMe(
    @Req() request: AuthenticatedRequest,
    @Body() body: UserUpdateDto,
  ) {
    const { user } = request;
    const { id } = user;
    this.logger.verbose(this.patchMe.name);
    return await this.service.patchOne(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      { where: { id: id! } },
      { patch: body },
    );
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOkResponse({ type: User })
  @ApiOperation({ operationId: 'deleteUserMe' })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  async deleteMe(@Req() request: AuthenticatedRequest) {
    this.logger.verbose(this.deleteMe.name);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await this.service.delete(request.user.id!);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await this.sessionService.delete({ userId: request.user.id! });
    return;
  }
}
