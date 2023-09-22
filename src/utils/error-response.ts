import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponse {
  @ApiProperty({ required: false, nullable: true })
  statusCode?: number;

  @ApiProperty({ required: false, nullable: true })
  message?: string;

  @ApiProperty({ required: false, nullable: true })
  url?: string;

  @ApiProperty({ required: false, nullable: true })
  method?: string;

  @ApiProperty({ required: false, nullable: true })
  timestamp?: string;

  @ApiProperty({
    required: false,
    nullable: true,
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  fields?: Record<string, string>;

  constructor(partial: Partial<ErrorResponse>) {
    Object.assign(this, partial);
  }
}
