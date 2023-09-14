import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { nanoid } from 'nanoid';
import { CustomersController } from 'src/customers/customers.controller';
import { ApiKeyAuthGuard } from 'src/guards/apikey-auth.guard';
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
@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('Api-Key')
@Controller({
  path: 'square/cards',
  version: '2',
})
export class CardsController {
  private readonly logger = new Logger(CustomersController.name);

  constructor(private readonly squareService: SquareService) {}

  @ApiOkResponse({ type: SquareListCardsResponse })
  @ApiBearerAuth()
  @ApiOperation({
    operationId: 'getSquareCards',
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
  @Get('me')
  async listMyCards(
    @Req() request: any,
    @Query('cursor') cursor?: string,
  ): Promise<SquareListCardsResponse> {
    try {
      const response = await this.squareService.listCards({
        accessToken: request.merchant.squareAccessToken,
        customerId: request.customer.squareId,
        cursor,
      });
      return response.result as SquareListCardsResponse;
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
    operationId: 'createSquareCard',
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
  async createMyCard(
    @Body() createCardDto: CreateCardDto,
    @Req() request: any,
  ) {
    try {
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
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error);
    }
  }

  @ApiOkResponse({ type: SquareDisableCardResponse })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
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
    operationId: 'deleteSquareCard',
    summary: 'Disable my Square Card',
  })
  @ApiParam({ name: 'id', required: true, type: String })
  @Delete('me/:id')
  async disableMyCard(@Req() request: any, @Param('id') cardId: string) {
    try {
      await this.squareService.disableCard({
        accessToken: request.merchant.squareAccessToken,
        cardId,
      });
      return;
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error);
    }
  }
}
