import {
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { nanoid } from 'nanoid';
import pRetry from 'p-retry';
import {
  ApiError,
  CalculateOrderRequest,
  CatalogObject,
  Client,
  CreateCardRequest,
  CreateCatalogImageResponse,
  CreateCustomerRequest,
  CreateOrderRequest,
  CreatePaymentRequest,
  Environment,
  FileWrapper,
  UpdateOrderRequest,
} from 'square';
import { RequestOptions } from 'square/dist/types/core.js';
import { Readable } from 'stream';
import { AppLogger } from '../logger/app.logger.js';
import { SquareCatalogObjectTypeEnum } from './square-catalog-object-type.enum.js';

@Injectable()
export class SquareService {
  private readonly squareEnvironment: Environment;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly defaultClient: Client;

  constructor(private configService: ConfigService, private logger: AppLogger) {
    logger.setContext(SquareService.name);
    this.squareEnvironment = this.configService.getOrThrow(
      'square.clientEnvironment',
      {
        infer: true,
      },
    ) as Environment;

    this.clientId = this.configService.getOrThrow('square.oauthClientId', {
      infer: true,
    });
    this.clientSecret = this.configService.getOrThrow(
      'square.oauthClientSecret',
      {
        infer: true,
      },
    );

    this.defaultClient = new Client({
      environment: this.squareEnvironment,
    });
  }

  oauthUrl(params: { scope: string[]; state?: string }) {
    return `${this.configService.getOrThrow('square.baseUrl', {
      infer: true,
    })}/oauth2/authorize?client_id=${this.configService.getOrThrow(
      'square.oauthClientId',
      {
        infer: true,
      },
    )}&scope=${params.scope.join('+')}&state=${params.state}`;
  }

  client(params: { accessToken: string }): Client {
    return new Client({
      accessToken: params.accessToken,
      environment: this.squareEnvironment,
    });
  }

  obtainTokenOrThrow(params: { oauthAccessCode: string }) {
    this.logger.verbose(this.obtainTokenOrThrow.name);
    return this.retryOrThrow(() =>
      this.defaultClient.oAuthApi.obtainToken({
        clientId: this.clientId,
        clientSecret: this.clientSecret,
        grantType: 'authorization_code',
        code: params.oauthAccessCode,
      }),
    );
  }

  async refreshTokenOrThrow(params: { oauthRefreshToken: string }) {
    this.logger.verbose(this.refreshTokenOrThrow.name);
    return this.retryOrThrow(() =>
      this.defaultClient.oAuthApi.obtainToken({
        clientId: this.clientId,
        clientSecret: this.clientSecret,
        grantType: 'refresh_token',
        refreshToken: params.oauthRefreshToken,
      }),
    );
  }

  async accumulateCatalogOrThrow(params: {
    accessToken: string;
    types: SquareCatalogObjectTypeEnum[];
  }): Promise<CatalogObject[]> {
    this.logger.verbose(this.accumulateCatalogOrThrow.name);
    const { accessToken, types } = params;
    const client = this.client({ accessToken });
    const catalogObjects: CatalogObject[] = [];
    const theTypes = types.join(',');

    let listCatalogResponse = await this.retryOrThrow(() =>
      client.catalogApi.listCatalog(undefined, theTypes),
    );
    this.logger.debug(
      `listCatalog undefined ${theTypes} result length ${
        listCatalogResponse?.result.objects?.length ?? 0
      }`,
    );
    catalogObjects.push(...(listCatalogResponse?.result.objects ?? []));

    let cursor = listCatalogResponse?.result.cursor;
    while (cursor !== undefined) {
      listCatalogResponse = await this.retryOrThrow(() =>
        client.catalogApi.listCatalog(cursor, theTypes),
      );
      this.logger.debug(
        `listCatalog ${cursor} ${theTypes} result length ${
          listCatalogResponse?.result.objects?.length ?? 0
        }`,
      );
      cursor = listCatalogResponse?.result.cursor;
      catalogObjects.push(...(listCatalogResponse?.result.objects ?? []));
    }

    return catalogObjects;
  }

  listLocationsOrThrow(params: { accessToken: string }) {
    this.logger.verbose(this.listLocationsOrThrow.name);
    const { accessToken } = params;
    return this.retryOrThrow(() =>
      this.client({
        accessToken: accessToken,
      }).locationsApi?.listLocations(),
    );
  }

  retrieveLocationOrThrow(params: {
    accessToken: string;
    locationSquareId: string;
  }) {
    this.logger.verbose(this.retrieveLocationOrThrow.name);
    const { accessToken, locationSquareId } = params;
    return this.retryOrThrow(() =>
      this.client({
        accessToken: accessToken,
      }).locationsApi.retrieveLocation(locationSquareId),
    );
  }

  createCustomerOrThrow(params: {
    accessToken: string;
    request: CreateCustomerRequest;
  }) {
    this.logger.verbose(this.createCustomerOrThrow.name);
    const { accessToken, request } = params;
    return this.retryOrThrow(() =>
      this.client({
        accessToken: accessToken,
      }).customersApi.createCustomer(request),
    );
  }

  retrieveCustomerOrThrow(params: { accessToken: string; squareId: string }) {
    this.logger.verbose(this.retrieveCustomerOrThrow.name);
    const { accessToken, squareId } = params;
    return this.retryOrThrow(() =>
      this.client({
        accessToken: accessToken,
      }).customersApi.retrieveCustomer(squareId),
    );
  }

  createOrderOrThrow(params: {
    accessToken: string;
    body: CreateOrderRequest;
    requestOptions?: RequestOptions;
  }) {
    this.logger.verbose(this.createOrderOrThrow.name);
    const { accessToken, body, requestOptions } = params;
    return this.retryOrThrow(() =>
      this.client({
        accessToken,
      }).ordersApi.createOrder(body, requestOptions),
    );
  }

  retrieveOrderOrThrow(params: {
    accessToken: string;
    orderId: string;
    requestOptions?: RequestOptions;
  }) {
    this.logger.verbose(this.retrieveOrderOrThrow.name);
    const { accessToken, orderId, requestOptions } = params;
    return this.retryOrThrow(() =>
      this.client({ accessToken }).ordersApi.retrieveOrder(
        orderId,
        requestOptions,
      ),
    );
  }

  updateOrderOrThrow(params: {
    accessToken: string;
    orderId: string;
    body: UpdateOrderRequest;
    requestOptions?: RequestOptions;
  }) {
    this.logger.verbose(this.updateOrderOrThrow.name);
    const { accessToken, orderId, requestOptions, body } = params;
    return this.retryOrThrow(() =>
      this.client({
        accessToken,
      }).ordersApi.updateOrder(orderId, body, requestOptions),
    );
  }

  calculateOrderOrThrow(params: {
    accessToken: string;
    body: CalculateOrderRequest;
    requestOptions?: RequestOptions;
  }) {
    this.logger.verbose(this.calculateOrderOrThrow.name);
    const { accessToken, body, requestOptions } = params;
    return this.retryOrThrow(() =>
      this.client({
        accessToken,
      }).ordersApi.calculateOrder(body, requestOptions),
    );
  }

  createPaymentOrThrow(params: {
    accessToken: string;
    body: CreatePaymentRequest;
    requestOptions?: RequestOptions;
  }) {
    this.logger.verbose(this.createPaymentOrThrow.name);
    const { accessToken, body, requestOptions } = params;
    return this.retryOrThrow(() =>
      this.client({
        accessToken: accessToken,
      }).paymentsApi.createPayment(body, requestOptions),
    );
  }

  listCards(params: {
    accessToken: string;
    cursor?: string;
    customerId?: string;
    includeDisabled?: boolean;
    referenceId?: string;
    sortOrder?: string;
  }) {
    this.logger.verbose(this.listCards.name);
    const {
      accessToken,
      cursor,
      customerId,
      includeDisabled,
      referenceId,
      sortOrder,
    } = params;
    return this.retryOrThrow(() =>
      this.client({ accessToken }).cardsApi.listCards(
        cursor,
        customerId,
        includeDisabled,
        referenceId,
        sortOrder,
      ),
    );
  }

  createCard(params: { accessToken: string; body: CreateCardRequest }) {
    this.logger.verbose(this.createCard.name);
    return this.retryOrThrow(() =>
      this.client({ accessToken: params.accessToken }).cardsApi.createCard(
        params.body,
      ),
    );
  }

  disableCard(params: { accessToken: string; cardId: string }) {
    this.logger.verbose(this.disableCard.name);
    return this.retryOrThrow(() =>
      this.client({
        accessToken: params.accessToken,
      }).cardsApi.disableCard(params.cardId),
    );
  }

  async uploadCatalogImage(params: {
    accessToken: string;
    idempotencyKey: string;
    objectId?: string;
    file: Express.Multer.File;
    caption?: string;
  }): Promise<CreateCatalogImageResponse> {
    this.logger.verbose(this.uploadCatalogImage.name);
    const { idempotencyKey, objectId, file, caption } = params;
    const bufferToStream = (buffer: Buffer) => {
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);
      return stream;
    };

    const fileStream = bufferToStream(file.buffer);
    const fileWrapper = new FileWrapper(fileStream, {
      contentType: file.mimetype,
    });
    const id = nanoid();
    const response = await this.retryOrThrow(() =>
      this.client({
        accessToken: params.accessToken,
      }).catalogApi.createCatalogImage(
        {
          idempotencyKey: idempotencyKey,
          objectId: objectId,
          image: {
            type: 'IMAGE',
            id: `#${id}`,
            imageData: {
              caption: caption,
            },
          },
        },
        fileWrapper,
      ),
    );

    return response.result;
  }

  async retryOrThrow<T>(fn: () => Promise<T>): Promise<T> {
    return pRetry(fn, {
      onFailedAttempt: (error) => {
        if (error instanceof ApiError) {
          const isRetryable =
            error.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR ||
            error.statusCode === HttpStatus.TOO_MANY_REQUESTS;

          if (!isRetryable || error.retriesLeft === 0) {
            this.logger.error(this.retryOrThrow.name, error);
            throw new InternalServerErrorException(error);
          }
        } else {
          throw error;
        }
      },
    });
  }
}
