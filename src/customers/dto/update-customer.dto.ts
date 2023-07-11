import { PartialType } from '@nestjs/swagger';
import { CustomerCreateDto } from './create-customer.dto';

export class CustomerUpdateDto extends PartialType(CustomerCreateDto) {}
