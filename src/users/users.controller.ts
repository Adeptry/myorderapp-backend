import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { ApiKeyAuthGuard } from '../guards/apikey-auth.guard.js';
import type { UsersGuardedRequest } from '../guards/users.guard.js';
import { AppLogger } from '../logger/app.logger.js';
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
  constructor(
    private readonly service: UsersService,
    private readonly sessionService: SessionService,
    protected readonly logger: AppLogger,
  ) {
    logger.setContext(UsersController.name);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: User })
  @ApiOperation({ operationId: 'getUserMe' })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  getMe(@Req() request: UsersGuardedRequest) {
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
    @Req() request: UsersGuardedRequest,
    @Body() updateUserDto: UserUpdateDto,
  ) {
    this.logger.verbose(this.patchMe.name);
    return await this.service.patchOne(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      { where: { id: request.user.id! } },
      updateUserDto,
    );
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOkResponse({ type: User })
  @ApiOperation({ operationId: 'deleteUserMe' })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  async deleteMe(@Req() request: UsersGuardedRequest) {
    this.logger.verbose(this.deleteMe.name);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await this.service.delete(request.user.id!);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await this.sessionService.delete({ userId: request.user.id! });
    return;
  }
}
