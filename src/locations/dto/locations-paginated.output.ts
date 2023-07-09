import { ApiProperty } from '@nestjs/swagger';
import { InfinityPaginationResultType } from 'src/utils/types/infinity-pagination-result.type';
import { MoaLocation } from '../entities/location.entity';

export class MoaLocationPaginatedResponse extends InfinityPaginationResultType<MoaLocation> {
  @ApiProperty({ type: () => MoaLocation, isArray: true, required: false })
  data: MoaLocation[];

  @ApiProperty({ required: false })
  count?: number;

  @ApiProperty({ required: false })
  page?: number;
}
