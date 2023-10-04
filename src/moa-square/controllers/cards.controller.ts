import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
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
import { NestSquareService } from 'nest-square';
import { ApiKeyAuthGuard } from '../../authentication/apikey-auth.guard.js';
import { ErrorResponse } from '../../utils/error-response.js';
import { CardsPostBody } from '../dto/cards-post-body.dto.js';
import {
  SquareCard,
  SquareDisableCardResponse,
  SquareListCardsResponse,
} from '../dto/square/square.dto.js';
import type { CustomersGuardedRequest } from '../guards/customers.guard.js';
import { CustomersGuard } from '../guards/customers.guard.js';
import { CustomersService } from '../services/customers.service.js';

@ApiTags('Cards')
@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('Api-Key')
@Controller({
  path: 'square/cards',
  version: '2',
})
export class CardsController {
  private readonly logger = new Logger(CardsController.name);

  constructor(
    private readonly squareService: NestSquareService,
    private readonly customersService: CustomersService,
  ) {
    this.logger.verbose(this.constructor.name);
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
    const response = await this.squareService.retryOrThrow(
      request.merchant.squareAccessToken,
      (client) => client.cardsApi.listCards(cursor, request.customer.squareId),
    );

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
    type: CardsPostBody,
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
    @Body() body: CardsPostBody,
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

    const response = await this.squareService.retryOrThrow(
      merchant.squareAccessToken,
      (client) =>
        client.cardsApi.createCard({
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
        }),
    );

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

    await this.squareService.retryOrThrow(
      merchant.squareAccessToken,
      (client) => client.cardsApi.disableCard(cardId),
    );

    if (customer.preferredSquareCardId == cardId) {
      customer.preferredSquareCardId = null;
      await this.customersService.save(customer);
    }

    return;
  }
}
