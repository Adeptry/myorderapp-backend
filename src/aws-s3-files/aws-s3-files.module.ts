import { S3Client } from '@aws-sdk/client-s3';
import { Module, UnprocessableEntityException } from '@nestjs/common';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import multerS3 from 'multer-s3';
import { AllConfigType } from '../config.type.js';
import { AwsS3FilesConfig } from './aws-s3-files.config.js';
import { AwsS3FilesService } from './aws-s3-files.service.js';

@Module({
  imports: [
    ConfigModule.forFeature(AwsS3FilesConfig),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AllConfigType>) => {
        return {
          fileFilter: (_request, file, callback) => {
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
              return callback(
                new UnprocessableEntityException(`Can't process file`),
                false,
              );
            }

            callback(null, true);
          },
          storage: () => {
            const s3 = new S3Client({
              region: configService.get('awsS3.region', { infer: true }),
              credentials: {
                accessKeyId: configService.getOrThrow('awsS3.accessKeyId', {
                  infer: true,
                }),
                secretAccessKey: configService.getOrThrow(
                  'awsS3.secretAccessKey',
                  { infer: true },
                ),
              },
            });

            return multerS3({
              s3: s3,
              bucket: configService.getOrThrow('awsS3.defaultBucket', {
                infer: true,
              }),
              acl: 'public-read',
              contentType: multerS3.AUTO_CONTENT_TYPE,
              key: (_request, file, callback) => {
                callback(
                  null,
                  `${randomStringGenerator()}.${file.originalname
                    .split('.')
                    .pop()
                    ?.toLowerCase()}`,
                );
              },
            });
          },
          limits: {
            fileSize: configService.get('awsS3.maxFileSize', { infer: true }),
          },
        };
      },
    }),
  ],
  controllers: [],
  providers: [ConfigModule, ConfigService, AwsS3FilesService],
  exports: [AwsS3FilesService],
})
export class AwsS3FilesModule {}
