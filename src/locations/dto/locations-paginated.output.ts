import { ApiProperty } from '@nestjs/swagger';
import { InfinityPaginationResultType } from 'src/utils/types/infinity-pagination-result.type';
import { Location } from '../entities/location.entity';

export class MoaLocationPaginatedResponse extends InfinityPaginationResultType<Location> {
  @ApiProperty({ type: () => Location, isArray: true, required: false })
  data: Location[];
}
