import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BusinessHoursPeriod } from 'src/locations/entities/business-hours-period.entity';
import { EntityRepositoryService } from 'src/utils/entity-repository-service';
import { Repository } from 'typeorm';

@Injectable()
export class BusinessHoursPeriodsService extends EntityRepositoryService<BusinessHoursPeriod> {
  private readonly logger = new Logger(BusinessHoursPeriodsService.name);

  constructor(
    @InjectRepository(BusinessHoursPeriod)
    protected readonly repository: Repository<BusinessHoursPeriod>,
  ) {
    super(repository);
  }
}
