import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiResponse,
  CatalogObject,
  Client,
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

  async obtainToken(oauthAccessCode: string): Promise<ObtainTokenResponse> {
    try {
      const response = await this.defaultClient.oAuthApi.obtainToken({
        clientId: this.clientId,
        clientSecret: this.clientSecret,
        grantType: 'authorization_code',
        code: oauthAccessCode,
      });
      return response.result;
    } catch (error) {
      this.logger.error(`Failed to obtain token: ${error}`);
      throw error;
    }
  }

  async refreshToken(oauthRefreshToken: string): Promise<ObtainTokenResponse> {
    try {
      const response = await this.defaultClient.oAuthApi.obtainToken({
        clientId: this.clientId,
        clientSecret: this.clientSecret,
        grantType: 'refresh_token',
        refreshToken: oauthRefreshToken,
      });
      return response.result;
    } catch (error) {
      this.logger.error(`Failed to refresh token: ${error}`);
      throw error;
    }
  }

  async listCatalog(client: Client): Promise<CatalogObject[]> {
    const catalogObjects: CatalogObject[] = [];
    let listCatalogResponse = await client?.catalogApi.listCatalog(
      undefined,
      'ITEM,ITEM_VARIATION,MODIFIER,MODIFIER_LIST,CATEGORY',
    );
    catalogObjects.push(...(listCatalogResponse?.result.objects ?? []));

    let cursor = listCatalogResponse?.result.cursor;
    while (cursor !== undefined) {
      listCatalogResponse = await client?.catalogApi.listCatalog(
        cursor,
        'ITEM,ITEM_VARIATION,MODIFIER,MODIFIER_LIST,CATEGORY',
      );
      cursor = listCatalogResponse?.result.cursor;
      catalogObjects.push(...(listCatalogResponse?.result.objects ?? []));
    }

    return catalogObjects;
  }

  async listLocations(client: Client): Promise<ListLocationsResponse | null> {
    let response: ApiResponse<ListLocationsResponse> | null = null;
    try {
      response = (await client?.locationsApi?.listLocations()) ?? null;
    } catch (error) {
      this.logger.error(error);
    }
    return response?.result ?? null;
  }

  async retrieveLocation(
    client: Client,
    locationSquareId: string,
  ): Promise<Location | null> {
    let response: ApiResponse<RetrieveLocationResponse> | null = null;
    try {
      response =
        (await client.locationsApi.retrieveLocation(locationSquareId)) ?? null;
    } catch (error) {
      console.log(error);
      this.logger.error(error);
    }
    return response?.result.location ?? null;
  }

  client(accessToken: string): Client {
    return new Client({
      accessToken,
      environment: this.squareEnvironment,
    });
  }
}
