import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { nanoid } from 'nanoid';

export class CreateCardDto {
  @ApiProperty({ example: nanoid() })
  @IsNotEmpty()
  idempotencyKey: string;

  @ApiProperty({ example: 'cnon:card-nonce-ok' })
  @IsNotEmpty()
  sourceId: string;

  @ApiProperty({ nullable: true, default: null })
  @IsOptional()
  verificationToken?: string;

  @ApiProperty({ nullable: true, example: '94103' })
  @IsNotEmpty()
  postalCode: string;
}
