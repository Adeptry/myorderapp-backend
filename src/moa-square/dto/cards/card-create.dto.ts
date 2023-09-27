import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CardsPostBody {
  @ApiProperty({ example: 'cnon:card-nonce-ok' })
  @IsNotEmpty()
  sourceId!: string;

  @ApiProperty({ nullable: true, required: false })
  @IsOptional()
  verificationToken?: string;

  @ApiProperty({ nullable: true, example: '94103', required: false })
  postalCode?: string;
}
