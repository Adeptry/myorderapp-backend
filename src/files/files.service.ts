import {
  Injectable,
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import S3 from 'aws-sdk/clients/s3.js';
import pRetry from 'p-retry';
import { Repository } from 'typeorm';
import { AllConfigType } from '../config.type.js';
import { AppLogger } from '../logger/app.logger.js';
import { FileEntity } from './entities/file.entity.js';

@Injectable()
export class FilesService {
  private readonly s3: S3;

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    protected readonly logger: AppLogger,
  ) {
    logger.setContext(FilesService.name);
    this.s3 = new S3({
      accessKeyId: this.configService.get('file.accessKeyId', { infer: true }),
      secretAccessKey: this.configService.get('file.secretAccessKey', {
        infer: true,
      }),
      region: this.configService.get('file.awsS3Region', { infer: true }),
    });
  }

  async upload(file: Express.Multer.File): Promise<FileEntity> {
    this.logger.verbose(this.upload.name);
    if (!file) {
      throw new UnprocessableEntityException('Must submit file');
    }

    const bucketName = this.configService.getOrThrow(
      'file.awsDefaultS3Bucket',
      {
        infer: true,
      },
    );
    const key = `${Date.now()}-${file.originalname}`;

    const params: S3.PutObjectRequest = {
      Bucket: bucketName,
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

    return this.fileRepository.save(
      this.fileRepository.create({
        url: uploadResult.Location,
      }),
    );
  }
}
