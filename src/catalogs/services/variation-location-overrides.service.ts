import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { VariationLocationOverride } from 'src/catalogs/entities/variation-location-override.entity';
import { BaseService } from 'src/utils/base-service';
import { Repository } from 'typeorm';

@Injectable()
export class VariationLocationOverridesService extends BaseService<VariationLocationOverride> {
  constructor(
    @InjectRepository(VariationLocationOverride)
    protected readonly repository: Repository<VariationLocationOverride>,
  ) {
    super(repository);
  }
}
