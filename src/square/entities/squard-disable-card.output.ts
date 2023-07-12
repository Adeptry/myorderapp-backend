import { ApiProperty } from '@nestjs/swagger';
import { SquareCard } from './square-card.output';
import { SquareError } from './square-error.dto';

export class SquareDisableCardResponse {
  @ApiProperty({ nullable: true, type: SquareError, isArray: true })
  errors?: SquareError[];

  @ApiProperty({ nullable: true, type: SquareCard })
  card?: SquareCard;
}
