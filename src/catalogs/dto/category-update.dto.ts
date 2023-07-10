import { ApiProperty } from '@nestjs/swagger';

export class MoaCategoryUpdateInput {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  moaOrdinal?: number;

  @ApiProperty()
  moaEnabled?: boolean;
}
