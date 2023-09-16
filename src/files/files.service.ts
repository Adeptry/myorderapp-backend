import {
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import S3 from 'aws-sdk/clients/s3.js';
import { Repository } from 'typeorm';
import { AllConfigType } from '../config.type.js';
import { FileEntity } from './entities/file.entity.js';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly s3: S3;

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
  ) {
    this.s3 = new S3({
      accessKeyId: this.configService.get('file.accessKeyId', { infer: true }),
      secretAccessKey: this.configService.get('file.secretAccessKey', {
        infer: true,
      }),
      region: this.configService.get('file.awsS3Region', { infer: true }),
    });
  }

  async uploadFile(file: Express.Multer.File): Promise<FileEntity> {
    if (!file) {
      throw new UnprocessableEntityException('Must submit file');
    }

    const bucketName = this.configService.get('file.awsDefaultS3Bucket', {
      infer: true,
    })!;
    const key = `${Date.now()}-${file.originalname}`;

    const params: S3.PutObjectRequest = {
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
    };

    try {
      const uploadResult = await this.s3.upload(params).promise();

      return this.fileRepository.save(
        this.fileRepository.create({
          url: uploadResult.Location,
        }),
      );
    } catch (error) {
      this.logger.error(`Failed to upload to S3: ${error}`);
      throw new UnprocessableEntityException('Failed to upload to S3');
    }
  }
}
