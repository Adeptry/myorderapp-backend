import { ApiProperty } from '@nestjs/swagger';

export class CatalogCreateDto {
  @ApiProperty()
  merchantId?: string;

  @ApiProperty()
  merchantSquareId?: string;
}
