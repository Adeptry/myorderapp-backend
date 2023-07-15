import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
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
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { nanoid } from 'nanoid';
import { CustomersController } from 'src/customers/customers.controller';
import { CustomersGuard } from 'src/guards/customers.guard';
import {
  SquareCard,
  SquareDisableCardResponse,
  SquareListCardsResponse,
} from 'src/square/square.dto';
import { SquareService } from 'src/square/square.service';
import { NestError } from 'src/utils/error';
import { CreateCardDto } from './dto/card-create.dto';

@ApiTags('Cards')
@Controller({
  path: 'cards',
  version: '2',
})
export class CardsController {
  private readonly logger = new Logger(CustomersController.name);

  constructor(private readonly squareService: SquareService) {}

  @ApiOkResponse({ type: SquareListCardsResponse })
  @ApiBearerAuth()
  @ApiOperation({
    operationId: 'listMySquareCards',
    summary: 'List my Square Cards',
  })
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiInternalServerErrorResponse({
    description: 'There was an error listing the cards.',
    type: NestError,
  })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @Get('me/square')
  async listMyCards(
    @Req() request: any,
    @Query('cursor') cursor?: string,
  ): Promise<SquareListCardsResponse> {
    try {
      const listCards = await this.squareService.listCards({
        accessToken: request.merchant.squareAccessToken,
        customerId: request.customer.squareId,
        cursor,
      });
      return listCards.result as SquareListCardsResponse;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error);
    }
  }

  @ApiCreatedResponse({ type: SquareCard })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiOperation({
    operationId: 'createMySquareCard',
    summary: 'Create my Square Card',
  })
  @ApiBody({
    type: CreateCardDto,
    examples: {
      success: {
        value: {
          idempotencyKey: nanoid(),
          sourceId: 'cnon:card-nonce-ok',
          postalCode: '94103',
        },
      },
    },
  })
  @Post('me/square')
  async createMyCard(
    @Body() createCardDto: CreateCardDto,
    @Req() request: any,
  ) {
    try {
      const response = await this.squareService.createCard({
        accessToken: request.merchant.squareAccessToken,
        body: {
          idempotencyKey: createCardDto.idempotencyKey,
          sourceId: createCardDto.sourceId,
          card: {
            customerId: request.customer.squareId,
            billingAddress: {
              postalCode: createCardDto.postalCode,
            },
          },
        },
      });
      return response.result.card;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error);
    }
  }

  @ApiOkResponse({ type: SquareDisableCardResponse })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), CustomersGuard)
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @ApiInternalServerErrorResponse({
    description: 'There was an error disabling the card.',
    type: NestError,
  })
  @ApiOperation({
    operationId: 'disableMySquareCard',
    summary: 'Disable my Square Card',
  })
  @ApiParam({ name: 'id', required: true, type: String })
  @Delete('me/square/:id')
  async disableMyCard(
    @Req() request: any,
    @Param('id') cardId: string,
  ): Promise<SquareDisableCardResponse> {
    try {
      const response = await this.squareService.disableCard({
        accessToken: request.merchant.squareAccessToken,
        cardId,
      });
      return response.result as SquareDisableCardResponse;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error);
    }
  }
}
