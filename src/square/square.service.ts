import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { nanoid } from 'nanoid';
import pRetry from 'p-retry';
import {
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

  obtainToken(params: { oauthAccessCode: string }) {
    this.logger.verbose(this.obtainToken.name);
    return pRetry(
      () =>
        this.defaultClient.oAuthApi.obtainToken({
          clientId: this.clientId,
          clientSecret: this.clientSecret,
          grantType: 'authorization_code',
          code: params.oauthAccessCode,
        }),
      {
        onFailedAttempt: (error) => {
          this.logger.error(error);
          if (error.retriesLeft === 0) {
            throw new InternalServerErrorException(error);
          }
        },
      },
    );
  }

  async refreshToken(params: { oauthRefreshToken: string }) {
    this.logger.verbose(this.refreshToken.name);
    return pRetry(
      () =>
        this.defaultClient.oAuthApi.obtainToken({
          clientId: this.clientId,
          clientSecret: this.clientSecret,
          grantType: 'refresh_token',
          refreshToken: params.oauthRefreshToken,
        }),
      {
        onFailedAttempt: (error) => {
          this.logger.error(error);
          if (error.retriesLeft === 0) {
            throw new InternalServerErrorException(error);
          }
        },
      },
    );
  }

  client(params: { accessToken: string }): Client {
    return new Client({
      accessToken: params.accessToken,
      environment: this.squareEnvironment,
    });
  }

  async accumulateCatalog(params: {
    accessToken: string;
    types: SquareCatalogObjectTypeEnum[];
  }): Promise<CatalogObject[]> {
    this.logger.verbose(this.accumulateCatalog.name);
    const { accessToken, types } = params;
    const client = this.client({ accessToken });
    const catalogObjects: CatalogObject[] = [];
    const theTypes = types.join(',');

    let listCatalogResponse = await pRetry(
      () => client.catalogApi.listCatalog(undefined, theTypes),
      {
        onFailedAttempt: (error) => {
          this.logger.error(error);
          if (error.retriesLeft === 0) {
            throw new InternalServerErrorException(error);
          }
        },
      },
    );
    this.logger.debug(
      `listCatalog undefined ${theTypes} result length ${
        listCatalogResponse?.result.objects?.length ?? 0
      }`,
    );
    catalogObjects.push(...(listCatalogResponse?.result.objects ?? []));

    let cursor = listCatalogResponse?.result.cursor;
    while (cursor !== undefined) {
      listCatalogResponse = await pRetry(
        () => client.catalogApi.listCatalog(cursor, theTypes),
        {
          onFailedAttempt: (error) => {
            this.logger.error(error);
            if (error.retriesLeft === 0) {
              throw new InternalServerErrorException(error);
            }
          },
        },
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

  listLocations(params: { accessToken: string }) {
    this.logger.verbose(this.listLocations.name);
    const { accessToken } = params;
    return pRetry(
      () =>
        this.client({
          accessToken: accessToken,
        }).locationsApi?.listLocations(),
      {
        onFailedAttempt: (error) => {
          this.logger.error(error);
          if (error.retriesLeft === 0) {
            throw new InternalServerErrorException(error);
          }
        },
      },
    );
  }

  retrieveLocation(params: { accessToken: string; locationSquareId: string }) {
    this.logger.verbose(this.retrieveLocation.name);
    const { accessToken, locationSquareId } = params;
    return pRetry(
      () =>
        this.client({
          accessToken: accessToken,
        }).locationsApi.retrieveLocation(locationSquareId),
      {
        onFailedAttempt: (error) => {
          this.logger.error(error);
          if (error.retriesLeft === 0) {
            throw new InternalServerErrorException(error);
          }
        },
      },
    );
  }

  createCustomer(params: {
    accessToken: string;
    request: CreateCustomerRequest;
  }) {
    this.logger.verbose(this.createCustomer.name);
    const { accessToken, request } = params;
    return pRetry(
      () =>
        this.client({
          accessToken: accessToken,
        }).customersApi.createCustomer(request),
      {
        onFailedAttempt: (error) => {
          this.logger.error(error);
          if (error.retriesLeft === 0) {
            throw new InternalServerErrorException(error);
          }
        },
      },
    );
  }

  retrieveCustomer(params: { accessToken: string; squareId: string }) {
    this.logger.verbose(this.retrieveCustomer.name);
    const { accessToken, squareId } = params;
    return pRetry(
      () =>
        this.client({
          accessToken: accessToken,
        }).customersApi.retrieveCustomer(squareId),
      {
        onFailedAttempt: (error) => {
          this.logger.error(error);
          if (error.retriesLeft === 0) {
            throw new InternalServerErrorException(error);
          }
        },
      },
    );
  }

  createOrder(params: {
    accessToken: string;
    body: CreateOrderRequest;
    requestOptions?: RequestOptions;
  }) {
    this.logger.verbose(this.createOrder.name);
    const { accessToken, body, requestOptions } = params;
    return pRetry(
      () =>
        this.client({
          accessToken,
        }).ordersApi.createOrder(body, requestOptions),
      {
        onFailedAttempt: (error) => {
          this.logger.error(error);
          if (error.retriesLeft === 0) {
            throw new InternalServerErrorException(error);
          }
        },
      },
    );
  }

  retrieveOrder(params: {
    accessToken: string;
    orderId: string;
    requestOptions?: RequestOptions;
  }) {
    this.logger.verbose(this.retrieveOrder.name);
    const { accessToken, orderId, requestOptions } = params;
    return pRetry(
      () =>
        this.client({ accessToken }).ordersApi.retrieveOrder(
          orderId,
          requestOptions,
        ),
      {
        onFailedAttempt: (error) => {
          this.logger.error(error);
          if (error.retriesLeft === 0) {
            throw new InternalServerErrorException(error);
          }
        },
      },
    );
  }

  updateOrder(params: {
    accessToken: string;
    orderId: string;
    body: UpdateOrderRequest;
    requestOptions?: RequestOptions;
  }) {
    this.logger.verbose(this.updateOrder.name);
    const { accessToken, orderId, requestOptions, body } = params;
    return pRetry(
      () =>
        this.client({
          accessToken,
        }).ordersApi.updateOrder(orderId, body, requestOptions),
      {
        onFailedAttempt: (error) => {
          this.logger.error(error);
          if (error.retriesLeft === 0) {
            throw new InternalServerErrorException(error);
          }
        },
      },
    );
  }

  calculateOrder(params: {
    accessToken: string;
    body: CalculateOrderRequest;
    requestOptions?: RequestOptions;
  }) {
    this.logger.verbose(this.calculateOrder.name);
    const { accessToken, body, requestOptions } = params;
    return pRetry(
      () =>
        this.client({
          accessToken,
        }).ordersApi.calculateOrder(body, requestOptions),
      {
        onFailedAttempt: (error) => {
          this.logger.error(error);
          if (error.retriesLeft === 0) {
            throw new InternalServerErrorException(error);
          }
        },
      },
    );
  }

  createPayment(params: {
    accessToken: string;
    body: CreatePaymentRequest;
    requestOptions?: RequestOptions;
  }) {
    this.logger.verbose(this.createPayment.name);
    const { accessToken, body, requestOptions } = params;
    return pRetry(
      () =>
        this.client({
          accessToken: accessToken,
        }).paymentsApi.createPayment(body, requestOptions),
      {
        onFailedAttempt: (error) => {
          this.logger.error(error);
          if (error.retriesLeft === 0) {
            throw new InternalServerErrorException(error);
          }
        },
      },
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
    return pRetry(
      () =>
        this.client({ accessToken }).cardsApi.listCards(
          cursor,
          customerId,
          includeDisabled,
          referenceId,
          sortOrder,
        ),
      {
        onFailedAttempt: (error) => {
          this.logger.error(error);
          if (error.retriesLeft === 0) {
            throw new InternalServerErrorException(error);
          }
        },
      },
    );
  }

  createCard(params: { accessToken: string; body: CreateCardRequest }) {
    this.logger.verbose(this.createCard.name);
    return pRetry(
      () =>
        this.client({ accessToken: params.accessToken }).cardsApi.createCard(
          params.body,
        ),
      {
        onFailedAttempt: (error) => {
          this.logger.error(error);
          if (error.retriesLeft === 0) {
            throw new InternalServerErrorException(error);
          }
        },
      },
    );
  }

  disableCard(params: { accessToken: string; cardId: string }) {
    this.logger.verbose(this.disableCard.name);
    return pRetry(
      () =>
        this.client({
          accessToken: params.accessToken,
        }).cardsApi.disableCard(params.cardId),
      {
        onFailedAttempt: (error) => {
          this.logger.error(error);
          if (error.retriesLeft === 0) {
            throw new InternalServerErrorException(error);
          }
        },
      },
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
    const response = await pRetry(
      () =>
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
      {
        onFailedAttempt: (error) => {
          this.logger.error(error);
          if (error.retriesLeft === 0) {
            throw new InternalServerErrorException(error);
          }
        },
      },
    );

    return response.result;
  }
}
