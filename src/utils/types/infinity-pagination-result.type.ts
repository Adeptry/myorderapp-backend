import { ApiProperty } from '@nestjs/swagger';

export class InfinityPaginationResultType<T> {
  @ApiProperty()
  data: T[];
  @ApiProperty()
  hasNextPage: boolean;
}
