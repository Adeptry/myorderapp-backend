import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import S3 from 'aws-sdk/clients/s3.js';
import pRetry from 'p-retry';
import { AwsS3FilesConfig } from './aws-s3-files.config.js';

@Injectable()
export class AwsS3FilesService {
  private readonly logger = new Logger(AwsS3FilesService.name);
  private readonly s3: S3;

  constructor(
    @Inject(AwsS3FilesConfig.KEY)
    private config: ConfigType<typeof AwsS3FilesConfig>,
  ) {
    this.logger.verbose(this.constructor.name);
    this.s3 = new S3({
      accessKeyId: this.config.accessKeyId,
      secretAccessKey: this.config.secretAccessKey,
      region: this.config.region,
    });
  }

  async upload(file: Express.Multer.File): Promise<S3.ManagedUpload.SendData> {
    this.logger.verbose(this.upload.name);
    if (!file) {
      throw new UnprocessableEntityException('Must submit file');
    }

    const key = `${Date.now()}-${file.originalname}`;

    const params: S3.PutObjectRequest = {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      Bucket: this.config.defaultBucket!,
      Key: key,
      Body: file.buffer,
    };

    const uploadResult = await pRetry(() => this.s3.upload(params).promise(), {
      onFailedAttempt: (error) => {
        this.logger.error(error);
        if (error.retriesLeft === 0) {
          throw new InternalServerErrorException(error);
        }
      },
    });

    return uploadResult;
  }
}
