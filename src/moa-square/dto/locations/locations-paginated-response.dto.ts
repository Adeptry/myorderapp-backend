import { ApiProperty } from '@nestjs/swagger';
import { PaginationResultType } from '../../../database/pagination-result.type.js';
import { LocationEntity } from '../../entities/location.entity.js';

export class LocationPaginatedResponse extends PaginationResultType<LocationEntity> {
  @ApiProperty({
    type: () => LocationEntity,
    isArray: true,
    required: false,
    nullable: true,
  })
  data!: LocationEntity[];
}
