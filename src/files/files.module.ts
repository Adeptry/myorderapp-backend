import { S3Client } from '@aws-sdk/client-s3';
import { Module, UnprocessableEntityException } from '@nestjs/common';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import multerS3 from 'multer-s3';
import { AllConfigType } from '../config.type.js';
import { LoggerModule } from '../logger/logger.module.js';
import { FileEntity } from './entities/file.entity.js';
import { FilesService } from './files.service.js';

@Module({
  imports: [
    LoggerModule,
    TypeOrmModule.forFeature([FileEntity]),
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
              region: configService.get('file.awsS3Region', { infer: true }),
              credentials: {
                accessKeyId: configService.getOrThrow('file.accessKeyId', {
                  infer: true,
                }),
                secretAccessKey: configService.getOrThrow(
                  'file.secretAccessKey',
                  { infer: true },
                ),
              },
            });

            return multerS3({
              s3: s3,
              bucket: configService.getOrThrow('file.awsDefaultS3Bucket', {
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
            fileSize: configService.get('file.maxFileSize', { infer: true }),
          },
        };
      },
    }),
  ],
  controllers: [],
  providers: [ConfigModule, ConfigService, FilesService],
  exports: [FilesService],
})
export class FilesModule {}
