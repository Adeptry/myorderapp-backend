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
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UsersGuard, UsersGuardedRequest } from 'src/guards/users.guard';
import { NestError } from 'src/utils/error';
import { UserUpdateDto } from './dto/user-update.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@SerializeOptions({
  groups: ['me'],
})
@ApiTags('Users')
@Controller({
  path: 'users',
  version: '2',
})
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @UseGuards(AuthGuard('jwt'), UsersGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOkResponse({ type: User })
  @ApiOperation({ summary: 'Get your User', operationId: 'getCurrentUser' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: NestError })
  getMe(@Req() request: UsersGuardedRequest) {
    return request.user;
  }

  @UseGuards(AuthGuard('jwt'), UsersGuard)
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
  async updateMe(
    @Req() request: UsersGuardedRequest,
    @Body() updateUserDto: UserUpdateDto,
  ) {
    return await this.service.patch(request.user.id, updateUserDto);
  }

  @UseGuards(AuthGuard('jwt'), UsersGuard)
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
    return this.service.softDelete(request.user.id);
  }
}
