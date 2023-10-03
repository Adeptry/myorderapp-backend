import { ApiProperty } from '@nestjs/swagger';

export class PaginationResultType<T> {
  @ApiProperty()
  data!: T[];
  @ApiProperty()
  pages!: number;
  @ApiProperty()
  count!: number;
}
