import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CategoryUpdateAllDto,
  CategoryUpdateDto,
} from 'src/catalogs/dto/category-update.dto';
import { Category } from 'src/catalogs/entities/category.entity';
import { BaseService } from 'src/utils/base-service';
import { Repository } from 'typeorm';

@Injectable()
export class CategoriesService extends BaseService<Category> {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectRepository(Category)
    protected readonly repository: Repository<Category>,
  ) {
    super(repository);
  }

  async assignAndSave(params: { id: string; input: CategoryUpdateDto }) {
    const entity = await this.findOneOrFail({
      where: { id: params.id },
    });
    if (params.input.moaOrdinal != undefined) {
      this.logger.verbose(
        `Updating category ${params.id} moaOrdinal: ${params.input.moaOrdinal}`,
      );
      entity.moaOrdinal = params.input.moaOrdinal;
    }
    if (params.input.moaEnabled != undefined) {
      entity.moaEnabled = params.input.moaEnabled;
    }
    return await this.save(entity);
  }

  async updateAll(inputs: CategoryUpdateAllDto[]) {
    const entities: Category[] = [];

    for (const input of inputs) {
      const entity = await this.findOneOrFail({
        where: { id: input.id },
      });
      if (input.moaOrdinal !== undefined) {
        entity.moaOrdinal = input.moaOrdinal;
      }
      if (input.moaEnabled !== undefined) {
        entity.moaEnabled = input.moaEnabled;
      }
      entities.push(entity);
    }

    return await this.saveAll(entities);
  }
}
