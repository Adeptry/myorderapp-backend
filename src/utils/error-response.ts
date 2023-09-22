import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponse {
  @ApiProperty()
  statusCode?: number;

  @ApiProperty()
  message?: string;

  @ApiProperty()
  url?: string;

  @ApiProperty()
  method?: string;

  @ApiProperty()
  timestamp?: string;

  @ApiProperty()
  fields?: Record<string, string>;

  constructor(partial: Partial<ErrorResponse>) {
    Object.assign(this, partial);
  }
}
