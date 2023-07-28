import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Variation } from 'src/catalogs/entities/variation.entity';
import { BaseService } from 'src/utils/base-service';
import { Repository } from 'typeorm';

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
          'COALESCE(variationLocationOverrides.amount, variations.priceInCents)',
          'variations_priceInCents',
        );
    }

    return query;
  }
}
