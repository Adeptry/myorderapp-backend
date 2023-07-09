import { ApiProperty } from '@nestjs/swagger';

export class PaginationOptions {
  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}
