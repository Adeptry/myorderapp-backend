import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/utils/base-service';
import { Repository } from 'typeorm';
import { ModifierLocationOverride } from '../entities/modifier-location-override.entity';

@Injectable()
export class ModifierLocationOverridesService extends BaseService<ModifierLocationOverride> {
  constructor(
    @InjectRepository(ModifierLocationOverride)
    protected readonly repository: Repository<ModifierLocationOverride>,
  ) {
    super(repository);
  }
}
