import { ApiProperty } from '@nestjs/swagger';

export class MoaCategoryUpdateInput {
  @ApiProperty()
  moaId!: string;

  @ApiProperty()
  moaOrdinal?: number;

  @ApiProperty()
  moaEnabled?: boolean;
}
