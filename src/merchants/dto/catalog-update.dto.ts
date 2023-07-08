import { ApiProperty } from '@nestjs/swagger';

export class MoaCatalogUpdateInput {
  @ApiProperty()
  merchantMoaId?: string;

  @ApiProperty()
  merchantSquareId?: string;
}
