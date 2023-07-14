import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/utils/base-service';
import { Repository } from 'typeorm';
import { Modifier } from '../entities/modifier.entity';

@Injectable()
export class ModifiersService extends BaseService<Modifier> {
  constructor(
    @InjectRepository(Modifier)
    protected readonly repository: Repository<Modifier>,
  ) {
    super(repository);
  }
}
