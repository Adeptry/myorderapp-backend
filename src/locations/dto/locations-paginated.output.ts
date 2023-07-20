import { ApiProperty } from '@nestjs/swagger';
import { Location } from 'src/locations/entities/location.entity';
import { InfinityPaginationResultType } from 'src/utils/types/infinity-pagination-result.type';

export class LocationPaginatedResponse extends InfinityPaginationResultType<Location> {
  @ApiProperty({ type: () => Location, isArray: true, required: false })
  data: Location[];
}
