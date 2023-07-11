import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/utils/base-service';
import { Repository } from 'typeorm';
import { Variation } from '../entities/variation.entity';

@Injectable()
export class VariationsService extends BaseService<Variation> {
  constructor(
    @InjectRepository(Variation)
    protected readonly repository: Repository<Variation>,
  ) {
    super(repository);
  }
}
