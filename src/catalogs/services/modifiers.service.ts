import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Modifier } from 'src/catalogs/entities/modifier.entity';
import { EntityRepositoryService } from 'src/utils/entity-repository-service';
import { Repository } from 'typeorm';

@Injectable()
export class ModifiersService extends EntityRepositoryService<Modifier> {
  constructor(
    @InjectRepository(Modifier)
    protected readonly repository: Repository<Modifier>,
  ) {
    super(repository);
  }
}
