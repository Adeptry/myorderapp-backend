import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ModifierList } from 'src/catalogs/entities/modifier-list.entity';
import { BaseService } from 'src/utils/base-service';
import { Repository } from 'typeorm';

@Injectable()
export class ModifierListsService extends BaseService<ModifierList> {
  constructor(
    @InjectRepository(ModifierList)
    protected readonly repository: Repository<ModifierList>,
  ) {
    super(repository);
  }
}
