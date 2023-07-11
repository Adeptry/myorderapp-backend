import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/utils/base-service';
import { Repository } from 'typeorm';
import { Item } from '../entities/item.entity';
import { ModifierList } from '../entities/modifier-list.entity';

@Injectable()
export class ModifierListsService extends BaseService<ModifierList> {
  constructor(
    @InjectRepository(ModifierList)
    protected readonly repository: Repository<ModifierList>,
  ) {
    super(repository);
  }

  async loadItemsForModifierList(modifierList: ModifierList): Promise<Item[]> {
    return this.repository
      .createQueryBuilder()
      .relation(ModifierList, 'items')
      .of(modifierList)
      .loadMany();
  }
}
