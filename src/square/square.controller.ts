import {
  BadRequestException,
  Controller,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';
import { nanoid } from 'nanoid';
import {
  MerchantsGuard,
  MerchantsGuardedRequest,
} from 'src/guards/merchants.guard';
import { SquareService } from './square.service';

@ApiTags('Square')
@Controller({
  path: 'square',
  version: '2',
})
export class SquareController {
  constructor(private readonly service: SquareService) {}

  @UseGuards(AuthGuard('jwt'), MerchantsGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiQuery({
    name: 'idempotencyKey',
    required: true,
    type: String,
    example: nanoid(),
  })
  @ApiQuery({ name: 'objectId', required: false, type: String })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload a catalog image',
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
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() request: MerchantsGuardedRequest,
    @Query('idempotencyKey') idempotencyKey: string,
    @Query('objectId') objectId?: string,
  ) {
    const { merchant } = request;

    if (!merchant.squareAccessToken) {
      throw new BadRequestException(
        'Merchant does not have Square access token',
      );
    }

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.service.uploadCatalogImage({
      accessToken: merchant.squareAccessToken,
      idempotencyKey,
      objectId,
      file,
    });
  }
}
