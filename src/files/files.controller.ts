import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiKeyAuthGuard } from '../guards/apikey-auth.guard.js';
import { NestError } from '../utils/error.js';
import { FilesService } from './files.service.js';

@ApiTags('Files')
@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('Api-Key')
@Controller({
  path: 'files',
  version: '2',
})
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiUnauthorizedResponse({
    description: 'You need to be authenticated to access this endpoint.',
    type: NestError,
  })
  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File | Express.MulterS3.File,
  ) {
    return this.filesService.uploadFile(file);
  }
}
