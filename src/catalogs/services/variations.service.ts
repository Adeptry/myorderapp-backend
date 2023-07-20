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
}
