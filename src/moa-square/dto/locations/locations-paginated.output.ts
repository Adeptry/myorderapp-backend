import { ApiProperty } from '@nestjs/swagger';
import { InfinityPaginationResultType } from '../../../utils/types/infinity-pagination-result.type.js';
import { LocationEntity } from '../../entities/locations/location.entity.js';

export class LocationPaginatedResponse extends InfinityPaginationResultType<LocationEntity> {
  @ApiProperty({
    type: () => LocationEntity,
    isArray: true,
    required: false,
    nullable: true,
  })
  data!: LocationEntity[];
}
