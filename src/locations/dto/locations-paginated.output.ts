import { ApiProperty } from '@nestjs/swagger';
import { Location } from '../../locations/entities/location.entity.js';
import { InfinityPaginationResultType } from '../../utils/types/infinity-pagination-result.type.js';

export class LocationPaginatedResponse extends InfinityPaginationResultType<Location> {
  @ApiProperty({
    type: () => Location,
    isArray: true,
    required: false,
    nullable: true,
  })
  data!: Location[];
}
