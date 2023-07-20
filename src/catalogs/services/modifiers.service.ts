import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Modifier } from 'src/catalogs/entities/modifier.entity';
import { BaseService } from 'src/utils/base-service';
import { Repository } from 'typeorm';

@Injectable()
export class ModifiersService extends BaseService<Modifier> {
  constructor(
    @InjectRepository(Modifier)
    protected readonly repository: Repository<Modifier>,
  ) {
    super(repository);
  }
}
