import {
  Controller,
  Get,
  Param,
  Post,
  Response,
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
import { ApiKeyAuthGuard } from 'src/guards/apikey-auth.guard';
import { NestError } from 'src/utils/error';
import { FilesService } from './files.service';

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

  @Get(':path')
  download(@Param('path') path, @Response() response) {
    return response.sendFile(path, { root: './files' });
  }
}
