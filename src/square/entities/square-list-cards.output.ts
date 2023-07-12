import { ApiProperty } from '@nestjs/swagger';
import { SquareCard } from './square-card.output';
import { SquareError } from './square-error.dto';

export class SquareListCardsResponse {
  @ApiProperty({ type: SquareError, isArray: true, nullable: true })
  errors?: SquareError[];

  @ApiProperty({ nullable: true, type: SquareCard, isArray: true })
  cards?: SquareCard[];

  @ApiProperty({ nullable: true })
  cursor?: string;
}
