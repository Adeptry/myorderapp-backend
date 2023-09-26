import {
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import pRetry from 'p-retry';
import {
  ApiError,
  CatalogObject,
  Client,
  CreateCatalogImageResponse,
  Environment,
  FileWrapper,
} from 'square';
import { Readable } from 'stream';
import { SquareCatalogObjectTypeEnum } from './square-catalog-object-type.enum.js';
import { SquareConfig } from './square.config.js';

@Injectable()
export class SquareService {
  private readonly logger = new Logger(SquareService.name);
  private readonly client: Client;

  constructor(
    @Inject(SquareConfig.KEY)
    private config: ConfigType<typeof SquareConfig>,
  ) {
    this.logger.verbose(this.constructor.name);
    this.client = new Client({
      environment: this.config.clientEnvironment as Environment,
    });
  }

  private tokenClient(params: { accessToken: string }): Client {
    return new Client({
      accessToken: params.accessToken,
      environment: this.config.clientEnvironment as Environment,
    });
  }

  obtainTokenOrThrow(params: { code: string }) {
    const { code } = params;
    this.logger.verbose(this.obtainTokenOrThrow.name);
    return this.retryOrThrow(() =>
      this.client.oAuthApi.obtainToken({
        clientId: this.config.oauthClientId,
        clientSecret: this.config.oauthClientSecret,
        grantType: 'authorization_code',
        code,
      }),
    );
  }

  async refreshTokenOrThrow(params: { refreshToken: string }) {
    const { refreshToken } = params;
    this.logger.verbose(this.refreshTokenOrThrow.name);
    return this.retryOrThrow(() =>
      this.client.oAuthApi.obtainToken({
        clientId: this.config.oauthClientId,
        clientSecret: this.config.oauthClientSecret,
        grantType: 'refresh_token',
        refreshToken,
      }),
    );
  }

  apiResponseOrThrow<T>(
    accessToken: string,
    clientFn: (client: Client) => Promise<T>,
  ): Promise<T> {
    this.logger.verbose(this.apiResponseOrThrow.name);
    return this.retryOrThrow(() =>
      clientFn(this.tokenClient({ accessToken: accessToken })),
    );
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

  /*
   * Helpers/utils
   */

  async accumulateCatalogOrThrow(params: {
    accessToken: string;
    types: SquareCatalogObjectTypeEnum[];
  }): Promise<CatalogObject[]> {
    this.logger.verbose(this.accumulateCatalogOrThrow.name);
    const { accessToken, types } = params;
    const client = this.tokenClient({ accessToken });
    const catalogObjects: CatalogObject[] = [];
    const theTypes = types.join(',');

    let listCatalogResponse = await this.retryOrThrow(() =>
      client.catalogApi.listCatalog(undefined, theTypes),
    );
    catalogObjects.push(...(listCatalogResponse?.result.objects ?? []));

    let cursor = listCatalogResponse?.result.cursor;
    while (cursor !== undefined) {
      listCatalogResponse = await this.retryOrThrow(() =>
        client.catalogApi.listCatalog(cursor, theTypes),
      );
      cursor = listCatalogResponse?.result.cursor;
      catalogObjects.push(...(listCatalogResponse?.result.objects ?? []));
    }

    return catalogObjects;
  }

  async uploadCatalogImageOrThrow(params: {
    accessToken: string;
    idempotencyKey: string;
    id: string;
    objectId?: string;
    file: Express.Multer.File;
    caption?: string;
  }): Promise<CreateCatalogImageResponse> {
    this.logger.verbose(this.uploadCatalogImageOrThrow.name);
    const { idempotencyKey, objectId, file, caption, id } = params;
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
    const response = await this.retryOrThrow(() =>
      this.tokenClient({
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
}
