import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiResponse,
  CatalogObject,
  Client,
  CreateCardRequest,
  CreateCustomerRequest,
  Customer,
  Environment,
  ListLocationsResponse,
  Location,
  ObtainTokenResponse,
  RetrieveLocationResponse,
} from 'square';

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
    const urlString = `${this.configService.getOrThrow('square.baseUrl', {
      infer: true,
    })}/oauth2/authorize?client_id=${this.configService.getOrThrow(
      'square.oauthClientId',
      {
        infer: true,
      },
    )}&scope=${params.scope.join('+')}&state=${params.state}`;
    return urlString;
  }

  async obtainToken(params: {
    oauthAccessCode: string;
  }): Promise<ObtainTokenResponse> {
    try {
      const response = await this.defaultClient.oAuthApi.obtainToken({
        clientId: this.clientId,
        clientSecret: this.clientSecret,
        grantType: 'authorization_code',
        code: params.oauthAccessCode,
      });
      return response.result;
    } catch (error) {
      this.logger.error(`Failed to obtain token: ${error}`);
      throw error;
    }
  }

  async refreshToken(params: {
    oauthRefreshToken: string;
  }): Promise<ObtainTokenResponse> {
    try {
      const response = await this.defaultClient.oAuthApi.obtainToken({
        clientId: this.clientId,
        clientSecret: this.clientSecret,
        grantType: 'refresh_token',
        refreshToken: params.oauthRefreshToken,
      });
      return response.result;
    } catch (error) {
      this.logger.error(`Failed to refresh token: ${error}`);
      throw error;
    }
  }

  async listCatalog(params: { accessToken: string }): Promise<CatalogObject[]> {
    const client = this.client({ accessToken: params.accessToken });
    const catalogObjects: CatalogObject[] = [];
    let listCatalogResponse = await client.catalogApi.listCatalog(
      undefined,
      'ITEM,ITEM_VARIATION,MODIFIER,MODIFIER_LIST,CATEGORY',
    );
    catalogObjects.push(...(listCatalogResponse?.result.objects ?? []));

    let cursor = listCatalogResponse?.result.cursor;
    while (cursor !== undefined) {
      listCatalogResponse = await client.catalogApi.listCatalog(
        cursor,
        'ITEM,ITEM_VARIATION,MODIFIER,MODIFIER_LIST,CATEGORY',
      );
      cursor = listCatalogResponse?.result.cursor;
      catalogObjects.push(...(listCatalogResponse?.result.objects ?? []));
    }

    return catalogObjects;
  }

  async listLocations(params: {
    accessToken: string;
  }): Promise<ListLocationsResponse | null> {
    let response: ApiResponse<ListLocationsResponse> | null = null;
    const client = this.client({ accessToken: params.accessToken });
    try {
      response = (await client.locationsApi?.listLocations()) ?? null;
    } catch (error) {
      this.logger.error(error);
    }
    return response?.result ?? null;
  }

  async retrieveLocation(params: {
    accessToken: string;
    locationSquareId: string;
  }): Promise<Location | null> {
    const client = this.client({ accessToken: params.accessToken });
    let response: ApiResponse<RetrieveLocationResponse> | null = null;
    try {
      response =
        (await client.locationsApi.retrieveLocation(params.locationSquareId)) ??
        null;
    } catch (error) {
      console.log(error);
      this.logger.error(error);
    }
    return response?.result.location ?? null;
  }

  async createCustomer(params: {
    accessToken: string;
    request: CreateCustomerRequest;
  }): Promise<Customer | null> {
    const client = this.client({ accessToken: params.accessToken });
    try {
      const response = await client.customersApi.createCustomer(params.request);
      return response?.result.customer ?? null;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async retrieveCustomer(params: { accessToken: string; squareId: string }) {
    const client = this.client({ accessToken: params.accessToken });
    const response = await client.customersApi.retrieveCustomer(
      params.squareId,
    );

    return response?.result.customer ?? null;
  }

  listCards(params: {
    accessToken: string;
    cursor?: string;
    customerId?: string;
    includeDisabled?: boolean;
    referenceId?: string;
    sortOrder?: string;
  }) {
    const client = this.client({ accessToken: params.accessToken });
    return client.cardsApi.listCards(
      params.cursor,
      params.customerId,
      params.includeDisabled,
      params.referenceId,
      params.sortOrder,
    );
  }

  createCard(params: { accessToken: string; body: CreateCardRequest }) {
    const client = this.client({ accessToken: params.accessToken });
    return client.cardsApi.createCard(params.body);
  }

  disableCard(params: { accessToken: string; cardId: string }) {
    const client = this.client({ accessToken: params.accessToken });
    return client.cardsApi.disableCard(params.cardId);
  }

  client(params: { accessToken: string }): Client {
    return new Client({
      accessToken: params.accessToken,
      environment: this.squareEnvironment,
    });
  }
}
