import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ModifierLocationOverride } from 'src/catalogs/entities/modifier-location-override.entity';
import { BaseService } from 'src/utils/base-service';
import { Repository } from 'typeorm';

@Injectable()
export class ModifierLocationOverridesService extends BaseService<ModifierLocationOverride> {
  constructor(
    @InjectRepository(ModifierLocationOverride)
    protected readonly repository: Repository<ModifierLocationOverride>,
  ) {
    super(repository);
  }
}
