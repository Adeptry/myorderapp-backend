import { ApiProperty } from '@nestjs/swagger';

export class MoaError {
  @ApiProperty()
  response?: any;

  @ApiProperty()
  status?: number;
}
