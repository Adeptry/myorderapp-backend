import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
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
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiSecurity,
} from '@nestjs/swagger';
import { AuthService } from 'src/auth/auth.service';
import { AuthEmailLoginDto } from 'src/auth/dto/auth-email-login.dto';
import { LoginResponseType } from 'src/auth/types/login-response.type';
import { FilesService } from 'src/files/files.service';
import { AdminsGuard } from 'src/guards/admins.guard';
import { ApiKeyAuthGuard } from 'src/guards/apikey-auth.guard';
import { MerchantsService } from 'src/merchants/merchants.service';

@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('Api-Key')
@Controller({
  path: 'admin',
  version: '2',
})
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    protected readonly authService: AuthService,
    protected readonly filesService: FilesService,
    protected readonly merchantsService: MerchantsService,
  ) {}

  @Post('email/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get admin access token',
    operationId: 'adminLogin',
  })
  @ApiOkResponse({ type: LoginResponseType })
  public adminLogin(
    @Body() loginDTO: AuthEmailLoginDto,
  ): Promise<LoginResponseType> {
    return this.authService.validateLogin(loginDTO, true);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), AdminsGuard)
  @Post('/upload/android')
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
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  @ApiOperation({
    summary: 'Upload Android file',
    operationId: 'uploadAndroidFile',
  })
  @ApiCreatedResponse({
    description: 'The record has been successfully created.',
  })
  async uploadAndroidFile(
    @Query('merchantId') merchantId: string,
    @UploadedFile() file: Express.Multer.File | Express.MulterS3.File,
  ) {
    const merchant = await this.merchantsService.findOneOrFail({
      where: { id: merchantId },
    });
    merchant.androidZipFile = await this.filesService.uploadFile(file);
    await merchant.save();
    return;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), AdminsGuard)
  @Post('/upload/ios')
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
  @ApiQuery({ name: 'merchantId', required: true, type: String })
  @ApiOperation({
    summary: 'Upload iOS file',
    operationId: 'uploadiOSFile',
  })
  @ApiCreatedResponse({
    description: 'The record has been successfully created.',
  })
  async uploadiOSFile(
    @Query('merchantId') merchantId: string,
    @UploadedFile() file: Express.Multer.File | Express.MulterS3.File,
  ) {
    const merchant = await this.merchantsService.findOneOrFail({
      where: { id: merchantId },
    });
    merchant.iosZipFile = await this.filesService.uploadFile(file);
    await merchant.save();
    return;
  }
}
