import {
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
import { ApiKeyAuthGuard } from '../guards/apikey-auth.guard.js';
import { CustomersGuard } from '../guards/customers.guard.js';
import { AppLogger } from '../logger/app.logger.js';
import {
  SquareCard,
  SquareDisableCardResponse,
  SquareListCardsResponse,
} from '../square/square.dto.js';
import { SquareService } from '../square/square.service.js';
import { NestError } from '../utils/error.js';
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
  ) {
    this.logger.setContext(CardsController.name);
  }

  @ApiOkResponse({ type: SquareListCardsResponse })
  @ApiBearerAuth()
  @ApiOperation({
    operationId: 'getMeCards',
    summary: 'List my Square Cards',
  })
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @ApiQuery({ name: 'merchantIdOrPath', required: true, type: String })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiInternalServerErrorResponse({
    description: 'There was an error listing the cards.',
    type: NestError,
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
    type: NestError,
  })
  @ApiOperation({
    operationId: 'postMeCards',
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
  async postMe(@Body() createCardDto: CreateCardDto, @Req() request: any) {
    this.logger.verbose(this.postMe.name);
    const response = await this.squareService.createCard({
      accessToken: request.merchant.squareAccessToken,
      body: {
        idempotencyKey: nanoid(),
        sourceId: createCardDto.sourceId,
        card: {
          customerId: request.customer.squareId,
          billingAddress: createCardDto.postalCode
            ? {
                postalCode: createCardDto.postalCode,
              }
            : undefined,
        },
      },
    });
    return response.result.card;
  }

  @ApiOkResponse({ type: SquareDisableCardResponse })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @ApiQuery({ name: 'merchantIdOrPath', required: true, type: String })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiInternalServerErrorResponse({
    description: 'There was an error disabling the card.',
    type: NestError,
  })
  @ApiOperation({
    operationId: 'deleteMeCards',
    summary: 'Disable my Square Card',
  })
  @ApiParam({ name: 'id', required: true, type: String })
  @Delete('me/:id')
  async deleteMe(@Req() request: any, @Param('id') cardId: string) {
    this.logger.verbose(this.deleteMe.name);
    await this.squareService.disableCard({
      accessToken: request.merchant.squareAccessToken,
      cardId,
    });
    return;
  }
}
