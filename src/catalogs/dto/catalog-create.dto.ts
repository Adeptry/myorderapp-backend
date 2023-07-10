import { ApiProperty } from '@nestjs/swagger';

export class MoaCatalogCreateInput {
  @ApiProperty()
  merchantId?: string;

  @ApiProperty()
  merchantSquareId?: string;
}
