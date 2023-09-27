import {
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
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
import { NestSquareCatalogObjectTypeEnum } from './nest-square-catalog-object-type.enum.js';
import type { NestSquareConfigType } from './nest-square.config.js';

@Injectable()
export class NestSquareService {
  private readonly logger = new Logger(NestSquareService.name);

  constructor(
    @Inject('NEST_SQUARE_CONFIG')
    private config: NestSquareConfigType,
  ) {
    this.logger.verbose(this.constructor.name);
  }

  /*
   * Client
   */

  private client(params?: { accessToken?: string }): Client {
    this.logger.verbose(this.client.name);
    return new Client({
      accessToken: params?.accessToken,
      environment: this.config.clientEnvironment as Environment,
    });
  }

  /*
   * Retry
   */

  retryOrThrow<T>(
    accessToken: string,
    clientFn: (client: Client) => Promise<T>,
  ): Promise<T> {
    this.logger.verbose(this.retryOrThrow.name);
    return this.pRetryOrThrow(() =>
      clientFn(this.client({ accessToken: accessToken })),
    );
  }

  retryObtainTokenOrThrow(params: { code: string }) {
    const { code } = params;
    this.logger.verbose(this.retryObtainTokenOrThrow.name);
    return this.pRetryOrThrow(() =>
      this.client().oAuthApi.obtainToken({
        clientId: this.config.oauthClientId,
        clientSecret: this.config.oauthClientSecret,
        grantType: 'authorization_code',
        code,
      }),
    );
  }

  async retryRefreshTokenOrThrow(params: { refreshToken: string }) {
    const { refreshToken } = params;
    this.logger.verbose(this.retryRefreshTokenOrThrow.name);
    return this.pRetryOrThrow(() =>
      this.client().oAuthApi.obtainToken({
        clientId: this.config.oauthClientId,
        clientSecret: this.config.oauthClientSecret,
        grantType: 'refresh_token',
        refreshToken,
      }),
    );
  }

  private async pRetryOrThrow<T>(fn: () => Promise<T>): Promise<T> {
    this.logger.verbose(this.pRetryOrThrow.name);
    return pRetry(fn, {
      onFailedAttempt: (error) => {
        if (error instanceof ApiError) {
          const isRetryable =
            error.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR ||
            error.statusCode === HttpStatus.TOO_MANY_REQUESTS;

          if (!isRetryable || error.retriesLeft === 0) {
            this.logger.error(this.pRetryOrThrow.name, error);
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
    types: NestSquareCatalogObjectTypeEnum[];
  }): Promise<CatalogObject[]> {
    this.logger.verbose(this.accumulateCatalogOrThrow.name);
    const { accessToken, types } = params;
    const client = this.client({ accessToken });
    const catalogObjects: CatalogObject[] = [];
    const theTypes = types.join(',');

    let listCatalogResponse = await this.pRetryOrThrow(() =>
      client.catalogApi.listCatalog(undefined, theTypes),
    );
    catalogObjects.push(...(listCatalogResponse?.result.objects ?? []));

    let cursor = listCatalogResponse?.result.cursor;
    while (cursor !== undefined) {
      listCatalogResponse = await this.pRetryOrThrow(() =>
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
    const response = await this.pRetryOrThrow(() =>
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
}
