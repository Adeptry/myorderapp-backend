import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiResponse,
  CatalogObject,
  Client,
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

  async listCatalog(params: { client: Client }): Promise<CatalogObject[]> {
    const catalogObjects: CatalogObject[] = [];
    let listCatalogResponse = await params.client.catalogApi.listCatalog(
      undefined,
      'ITEM,ITEM_VARIATION,MODIFIER,MODIFIER_LIST,CATEGORY',
    );
    catalogObjects.push(...(listCatalogResponse?.result.objects ?? []));

    let cursor = listCatalogResponse?.result.cursor;
    while (cursor !== undefined) {
      listCatalogResponse = await params.client.catalogApi.listCatalog(
        cursor,
        'ITEM,ITEM_VARIATION,MODIFIER,MODIFIER_LIST,CATEGORY',
      );
      cursor = listCatalogResponse?.result.cursor;
      catalogObjects.push(...(listCatalogResponse?.result.objects ?? []));
    }

    return catalogObjects;
  }

  async listLocations(params: {
    client: Client;
  }): Promise<ListLocationsResponse | null> {
    let response: ApiResponse<ListLocationsResponse> | null = null;
    try {
      response = (await params.client.locationsApi?.listLocations()) ?? null;
    } catch (error) {
      this.logger.error(error);
    }
    return response?.result ?? null;
  }

  async retrieveLocation(params: {
    client: Client;
    locationSquareId: string;
  }): Promise<Location | null> {
    let response: ApiResponse<RetrieveLocationResponse> | null = null;
    try {
      response =
        (await params.client.locationsApi.retrieveLocation(
          params.locationSquareId,
        )) ?? null;
    } catch (error) {
      console.log(error);
      this.logger.error(error);
    }
    return response?.result.location ?? null;
  }

  async createCustomer(params: {
    client: Client;
    request: CreateCustomerRequest;
  }): Promise<Customer | null> {
    try {
      const response = await params.client.customersApi.createCustomer(
        params.request,
      );
      return response?.result.customer ?? null;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  client(params: { accessToken: string }): Client {
    return new Client({
      accessToken: params.accessToken,
      environment: this.squareEnvironment,
    });
  }
}
