import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/utils/base-service';
import { Repository } from 'typeorm';
import { ModifierList } from '../entities/modifier-list.entity';

@Injectable()
export class ModifierListsService extends BaseService<ModifierList> {
  constructor(
    @InjectRepository(ModifierList)
    protected readonly repository: Repository<ModifierList>,
  ) {
    super(repository);
  }
}
