import { ApiProperty } from '@nestjs/swagger';

export class MoaCatalogCreateInput {
  @ApiProperty()
  merchantMoaId?: string;

  @ApiProperty()
  merchantSquareId?: string;
}
