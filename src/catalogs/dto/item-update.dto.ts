import { ApiProperty } from '@nestjs/swagger';

export class MoaItemUpdateInput {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  moaOrdinal?: number;

  @ApiProperty()
  moaEnabled?: boolean;

  @ApiProperty()
  imageUlid?: string;
}
