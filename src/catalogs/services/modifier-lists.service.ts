import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ModifierList } from 'src/catalogs/entities/modifier-list.entity';
import { EntityRepositoryService } from 'src/utils/entity-repository-service';
import { Repository } from 'typeorm';

@Injectable()
export class ModifierListsService extends EntityRepositoryService<ModifierList> {
  constructor(
    @InjectRepository(ModifierList)
    protected readonly repository: Repository<ModifierList>,
  ) {
    super(repository);
  }
}
