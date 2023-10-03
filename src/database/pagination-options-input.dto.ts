import { ApiProperty } from '@nestjs/swagger';

export class PaginationOptionsInput {
  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;
}
