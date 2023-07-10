import { ApiProperty } from '@nestjs/swagger';

export class MoaCatalogUpdateInput {
  @ApiProperty()
  merchantId?: string;

  @ApiProperty()
  merchantSquareId?: string;
}
