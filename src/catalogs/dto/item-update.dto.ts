import { ApiProperty } from '@nestjs/swagger';

export class MoaItemUpdateInput {
  @ApiProperty()
  moaId!: string;

  @ApiProperty()
  moaOrdinal?: number;

  @ApiProperty()
  moaEnabled?: boolean;

  @ApiProperty()
  imageUlid?: string;
}
