import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { nanoid } from 'nanoid';
import { CustomersService } from '../customers/customers.service.js';
import { ApiKeyAuthGuard } from '../guards/apikey-auth.guard.js';
import type { CustomersGuardedRequest } from '../guards/customers.guard.js';
import { CustomersGuard } from '../guards/customers.guard.js';
import { AppLogger } from '../logger/app.logger.js';
import {
  SquareCard,
  SquareDisableCardResponse,
  SquareListCardsResponse,
} from '../square/square.dto.js';
import { SquareService } from '../square/square.service.js';
import { ErrorResponse } from '../utils/error-response.js';
import { CreateCardDto } from './dto/card-create.dto.js';

@ApiTags('Cards')
@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('Api-Key')
@Controller({
  path: 'square/cards',
  version: '2',
})
export class CardsController {
  constructor(
    private readonly squareService: SquareService,
    private readonly logger: AppLogger,
    private readonly customersService: CustomersService,
  ) {
    this.logger.setContext(CardsController.name);
  }

  @ApiOkResponse({ type: SquareListCardsResponse })
  @ApiBearerAuth()
  @ApiOperation({
    operationId: 'getCardsMe',
    summary: 'List my Square Cards',
  })
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @ApiQuery({ name: 'merchantIdOrPath', required: true, type: String })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
  })
  @ApiInternalServerErrorResponse({
    description: 'There was an error listing the cards.',
    type: ErrorResponse,
  })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @Get('me')
  async getMe(
    @Req() request: any,
    @Query('cursor') cursor?: string,
  ): Promise<SquareListCardsResponse> {
    this.logger.verbose(this.getMe.name);
    const response = await this.squareService.listCards({
      accessToken: request.merchant.squareAccessToken,
      customerId: request.customer.squareId,
      cursor,
    });
    return response.result as SquareListCardsResponse;
  }

  @ApiCreatedResponse({ type: SquareCard })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @ApiQuery({ name: 'merchantIdOrPath', required: true, type: String })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
  })
  @ApiOperation({
    operationId: 'postCardsMe',
    summary: 'Create my Square Card',
  })
  @ApiBody({
    type: CreateCardDto,
    examples: {
      success: {
        value: {
          sourceId: 'cnon:card-nonce-ok',
        },
      },
    },
  })
  @Post('me')
  async postMe(
    @Body() body: CreateCardDto,
    @Req() request: CustomersGuardedRequest,
  ) {
    const { merchant, customer } = request;
    this.logger.verbose(this.postMe.name);

    if (
      customer.squareId == undefined ||
      merchant.squareAccessToken == undefined
    ) {
      throw new BadRequestException();
    }

    const response = await this.squareService.createCard({
      accessToken: merchant.squareAccessToken,
      body: {
        idempotencyKey: nanoid(),
        sourceId: body.sourceId,
        card: {
          customerId: customer.squareId,
          billingAddress: body.postalCode
            ? {
                postalCode: body.postalCode,
              }
            : undefined,
        },
      },
    });

    customer.preferredSquareCardId = response.result.card?.id;
    await this.customersService.save(customer);

    return response.result.card;
  }

  @ApiOkResponse({ type: SquareDisableCardResponse })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @ApiQuery({ name: 'merchantIdOrPath', required: true, type: String })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: ErrorResponse,
  })
  @ApiInternalServerErrorResponse({
    description: 'There was an error disabling the card.',
    type: ErrorResponse,
  })
  @ApiOperation({
    operationId: 'deleteCardsMe',
    summary: 'Disable my Square Card',
  })
  @ApiParam({ name: 'id', required: true, type: String })
  @Delete('me/:id')
  async deleteMe(
    @Req() request: CustomersGuardedRequest,
    @Param('id') cardId: string,
  ) {
    const { customer, merchant } = request;
    this.logger.verbose(this.deleteMe.name);

    if (!merchant.squareAccessToken) {
      throw new BadRequestException();
    }

    await this.squareService.disableCard({
      accessToken: merchant.squareAccessToken,
      cardId,
    });

    if (customer.preferredSquareCardId == cardId) {
      customer.preferredSquareCardId = null;
      await this.customersService.save(customer);
    }

    return;
  }
}
