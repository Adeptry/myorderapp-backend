import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Query,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from 'src/auth/auth.service';
import { Roles } from 'src/roles/roles.decorator';
import { RoleEnum } from 'src/roles/roles.enum';
import { RolesGuard } from 'src/roles/roles.guard';
import { MoaLocationPaginatedResponse } from './dto/locations-paginated.output';
import { MoaLocation } from './entities/location.entity';
import { LocationsService } from './locations.service';

@ApiTags('Locations')
@Controller('v2/locations')
export class LocationsController {
  constructor(
    private readonly locationsService: LocationsService,
    private readonly authService: AuthService,
  ) {}

  @ApiBearerAuth()
  @Get()
  @Roles(RoleEnum[RoleEnum.customer], RoleEnum[RoleEnum.merchant])
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MoaLocationPaginatedResponse })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'The page number.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'The limit of items per page.',
  })
  @ApiQuery({
    name: 'merchantId',
    required: false,
    type: String,
    description: 'The ID of the merchant.',
  })
  async getLocations(
    @Request() request,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('merchantId') merchantMoaId?: string,
  ): Promise<MoaLocationPaginatedResponse> {
    const user = await this.authService.me(request.user);

    if (!user) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    const paginationOptions = {
      page: page || page === 0 ? page : 0,
      limit: limit || limit === 0 ? limit : 50,
    };

    console.log('paginationOptions', page ?? 0);

    // If the user is a merchant, get locations for their merchant account.
    if (user.role?.id === RoleEnum.merchant) {
      return this.locationsService.getMerchantsLocations({
        userId: user.id,
        paginationOptions,
      });
    } else if (user.role?.id === RoleEnum.customer && merchantMoaId) {
      // If the user is a customer and a merchantId is provided, get locations for that merchant.
      return this.locationsService.getMerchantsLocations({
        merchantMoaId,
        paginationOptions,
      });
    }

    throw new BadRequestException(
      'Invalid request. A customer must provide a merchantId.',
    );
  }

  @ApiBearerAuth()
  @Get(':moaId')
  @Roles(RoleEnum.customer, RoleEnum.merchant)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MoaLocation })
  async getLocation(
    @Request() request,
    @Param('moaId') moaId: string,
  ): Promise<MoaLocation> {
    const user = await this.authService.me(request.user);

    if (!user) {
      throw new UnauthorizedException(
        'User object does not exist after successful authentication',
      );
    }

    const location = await this.locationsService.findOne({ where: { moaId } });

    if (!location) {
      throw new NotFoundException(`Location with moaId ${moaId} not found`);
    }

    return location;
  }
}
