import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { nanoid } from 'nanoid';

export class AppInstallUpdateDto {
  @ApiProperty({
    type: String,
    required: true,
    example: '123456789',
  })
  @IsString()
  firebaseInstallationId: string;

  @ApiProperty({
    type: String,
    required: false,
    example: nanoid(),
  })
  @IsString()
  firebaseCloudMessagingToken?: string;
}
