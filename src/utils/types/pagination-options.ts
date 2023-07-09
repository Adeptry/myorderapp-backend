import { ApiProperty } from '@nestjs/swagger';

export class IPaginationOptions {
  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}
