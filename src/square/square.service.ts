import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CalculateOrderRequest,
  CatalogObject,
  Client,
  CreateCardRequest,
  CreateCustomerRequest,
  CreateOrderRequest,
  CreatePaymentRequest,
  Environment,
  UpdateOrderRequest,
} from 'square';
import { RequestOptions } from 'square/dist/types/core';

@Injectable()
export class SquareService {
  private readonly logger = new Logger(SquareService.name);
  private readonly squareEnvironment: Environment;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly defaultClient: Client;

  constructor(private configService: ConfigService) {
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
    return this.defaultClient.oAuthApi.obtainToken({
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      grantType: 'authorization_code',
      code: params.oauthAccessCode,
    });
  }

  async refreshToken(params: { oauthRefreshToken: string }) {
    return this.defaultClient.oAuthApi.obtainToken({
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      grantType: 'refresh_token',
      refreshToken: params.oauthRefreshToken,
    });
  }

  client(params: { accessToken: string }): Client {
    return new Client({
      accessToken: params.accessToken,
      environment: this.squareEnvironment,
    });
  }

  async listCatalog(params: { accessToken: string }): Promise<CatalogObject[]> {
    const client = this.client({ accessToken: params.accessToken });
    const catalogObjects: CatalogObject[] = [];
    const types = 'ITEM,ITEM_VARIATION,MODIFIER,MODIFIER_LIST,CATEGORY,IMAGE';
    let listCatalogResponse = await client.catalogApi.listCatalog(
      undefined,
      types,
    );
    catalogObjects.push(...(listCatalogResponse?.result.objects ?? []));

    let cursor = listCatalogResponse?.result.cursor;
    while (cursor !== undefined) {
      listCatalogResponse = await client.catalogApi.listCatalog(cursor, types);
      cursor = listCatalogResponse?.result.cursor;
      catalogObjects.push(...(listCatalogResponse?.result.objects ?? []));
    }

    return catalogObjects;
  }

  listLocations(params: { accessToken: string }) {
    const { accessToken } = params;
    return this.client({
      accessToken: accessToken,
    }).locationsApi?.listLocations();
  }

  retrieveLocation(params: { accessToken: string; locationSquareId: string }) {
    const { accessToken, locationSquareId } = params;
    return this.client({
      accessToken: accessToken,
    }).locationsApi.retrieveLocation(locationSquareId);
  }

  createCustomer(params: {
    accessToken: string;
    request: CreateCustomerRequest;
  }) {
    const { accessToken, request } = params;
    return this.client({
      accessToken: accessToken,
    }).customersApi.createCustomer(request);
  }

  retrieveCustomer(params: { accessToken: string; squareId: string }) {
    const { accessToken, squareId } = params;
    return this.client({
      accessToken: accessToken,
    }).customersApi.retrieveCustomer(squareId);
  }

  createOrder(params: {
    accessToken: string;
    body: CreateOrderRequest;
    requestOptions?: RequestOptions;
  }) {
    const { accessToken, body, requestOptions } = params;
    return this.client({
      accessToken,
    }).ordersApi.createOrder(body, requestOptions);
  }

  retrieveOrder(params: {
    accessToken: string;
    orderId: string;
    requestOptions?: RequestOptions;
  }) {
    const { accessToken, orderId, requestOptions } = params;
    return this.client({ accessToken }).ordersApi.retrieveOrder(
      orderId,
      requestOptions,
    );
  }

  updateOrder(params: {
    accessToken: string;
    orderId: string;
    body: UpdateOrderRequest;
    requestOptions?: RequestOptions;
  }) {
    const { accessToken, orderId, requestOptions, body } = params;
    return this.client({
      accessToken,
    }).ordersApi.updateOrder(orderId, body, requestOptions);
  }

  calculateOrder(params: {
    accessToken: string;
    body: CalculateOrderRequest;
    requestOptions?: RequestOptions;
  }) {
    const { accessToken, body, requestOptions } = params;
    return this.client({
      accessToken,
    }).ordersApi.calculateOrder(body, requestOptions);
  }

  createPayment(params: {
    accessToken: string;
    body: CreatePaymentRequest;
    requestOptions?: RequestOptions;
  }) {
    const { accessToken, body, requestOptions } = params;
    return this.client({
      accessToken: accessToken,
    }).paymentsApi.createPayment(body, requestOptions);
  }

  listCards(params: {
    accessToken: string;
    cursor?: string;
    customerId?: string;
    includeDisabled?: boolean;
    referenceId?: string;
    sortOrder?: string;
  }) {
    const {
      accessToken,
      cursor,
      customerId,
      includeDisabled,
      referenceId,
      sortOrder,
    } = params;
    return this.client({ accessToken }).cardsApi.listCards(
      cursor,
      customerId,
      includeDisabled,
      referenceId,
      sortOrder,
    );
  }

  createCard(params: { accessToken: string; body: CreateCardRequest }) {
    return this.client({ accessToken: params.accessToken }).cardsApi.createCard(
      params.body,
    );
  }

  disableCard(params: { accessToken: string; cardId: string }) {
    return this.client({
      accessToken: params.accessToken,
    }).cardsApi.disableCard(params.cardId);
  }
}
