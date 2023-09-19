import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Req,
  SerializeOptions,
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
import { NestError } from '../utils/error.js';
import { UserUpdateDto } from './dto/user-update.dto.js';
import { User } from './entities/user.entity.js';
import { UsersService } from './users.service.js';

@ApiBearerAuth()
@ApiSecurity('Api-Key')
@UseGuards(ApiKeyAuthGuard, AuthGuard('jwt'))
@SerializeOptions({
  groups: ['me', 'admin'],
})
@ApiTags('Users')
@Controller({
  path: 'users',
  version: '2',
})
export class UsersController {
  constructor(
    private readonly service: UsersService,
    protected readonly logger: AppLogger,
  ) {
    logger.setContext(UsersController.name);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOkResponse({ type: User })
  @ApiOperation({ summary: 'Get your User', operationId: 'getCurrentUser' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: NestError })
  getMe(@Req() request: UsersGuardedRequest) {
    this.logger.verbose(this.getMe.name);
    return this.service.findOne({ where: { id: request.user.id } });
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOkResponse({ type: User })
  @ApiOperation({
    summary: 'Update your User',
    operationId: 'patchCurrentUser',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: NestError })
  @ApiBody({ type: UserUpdateDto })
  async patchMe(
    @Req() request: UsersGuardedRequest,
    @Body() updateUserDto: UserUpdateDto,
  ) {
    this.logger.verbose(this.patchMe.name);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return await this.service.patch(request.user.id!, updateUserDto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOkResponse({ type: User })
  @ApiOperation({
    summary: 'Delete your User',
    operationId: 'deleteCurrentUser',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: NestError })
  async deleteMe(@Req() request: UsersGuardedRequest) {
    this.logger.verbose(this.deleteMe.name);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.service.softDelete(request.user.id!);
  }
}
