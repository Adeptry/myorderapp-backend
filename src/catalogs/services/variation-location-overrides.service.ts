import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/utils/base-service';
import { Repository } from 'typeorm';
import { VariationLocationOverride } from '../entities/variation-location-override.entity';

@Injectable()
export class VariationLocationOverridesService extends BaseService<VariationLocationOverride> {
  constructor(
    @InjectRepository(VariationLocationOverride)
    protected readonly repository: Repository<VariationLocationOverride>,
  ) {
    super(repository);
  }
}
