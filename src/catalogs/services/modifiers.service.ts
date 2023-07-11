import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/utils/base-service';
import { Repository } from 'typeorm';
import { ModifierList } from '../entities/modifier-list.entity';
import { Modifier } from '../entities/modifier.entity';

@Injectable()
export class ModifiersService extends BaseService<Modifier> {
  constructor(
    @InjectRepository(Modifier)
    protected readonly repository: Repository<Modifier>,
  ) {
    super(repository);
  }

  async loadModifierListForModifier(
    modifier: Modifier,
  ): Promise<ModifierList | null | undefined> {
    return await this.repository
      .createQueryBuilder()
      .relation(Modifier, 'modifierList')
      .of(modifier)
      .loadOne();
  }
}
