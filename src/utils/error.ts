import { ApiProperty } from '@nestjs/swagger';

export class MoaError {
  @ApiProperty()
  response?: any;

  @ApiProperty()
  status?: number;
}

export class NestError {
  @ApiProperty()
  statusCode?: number;

  @ApiProperty()
  message?: string;

  @ApiProperty()
  error?: string;
}
