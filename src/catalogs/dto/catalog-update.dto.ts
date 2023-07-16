import { ApiProperty } from '@nestjs/swagger';

export class CatalogUpdateDto {
  @ApiProperty()
  merchantId?: string;

  @ApiProperty()
  merchantSquareId?: string;
}
