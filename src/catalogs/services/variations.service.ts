import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Variation } from 'src/catalogs/entities/variation.entity';
import { BaseService } from 'src/utils/base-service';
import { Repository } from 'typeorm';
import { VariationUpdateDto } from '../dto/variation-update.dto';

@Injectable()
export class VariationsService extends BaseService<Variation> {
  constructor(
    @InjectRepository(Variation)
    protected readonly repository: Repository<Variation>,
  ) {
    super(repository);
  }

  joinManyQuery(params: { itemId: string; locationId?: string }) {
    const { itemId, locationId } = params;

    const query = this.createQueryBuilder('variations').where(
      'variations.itemId = :itemId',
      {
        itemId,
      },
    );

    if (locationId) {
      query
        .leftJoinAndSelect(
          'variations.locationOverrides',
          'variationLocationOverrides',
          'variationLocationOverrides.locationId = :locationId',
          { locationId },
        )
        .addSelect(
          'COALESCE(variationLocationOverrides.amount, variations.priceAmount)',
          'variations_priceAmount',
        );
    }

    return query;
  }

  async assignAndSave(params: { id: string; input: VariationUpdateDto }) {
    const entity = await this.findOneOrFail({ where: { id: params.id } });
    if (params.input.moaEnabled !== undefined) {
      entity.moaEnabled = params.input.moaEnabled;
    }
    return await this.save(entity);
  }
}
