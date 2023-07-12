import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { nanoid } from 'nanoid';
import { SquareCard } from './square-card.output';

export class SquareCreateCustomerCardInput {
  @ApiProperty({ example: nanoid() })
  @IsNotEmpty()
  idempotencyKey: string;

  @ApiProperty({ example: 'cnon:card-nonce-ok' })
  @IsNotEmpty()
  sourceId: string;

  @ApiProperty({ nullable: true, default: null })
  @IsOptional()
  verificationToken?: string;

  @ApiProperty({ type: () => SquareCard })
  @IsNotEmpty()
  card: SquareCard;
}
