import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CustomerCreateDto } from './dto/create-customer.dto';
import { CustomerUpdateDto } from './dto/update-customer.dto';

@ApiTags('Customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  create(@Body() createCustomerDto: CustomerCreateDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  findAll() {
    return this.customersService.find();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne({ where: { id } });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: CustomerUpdateDto,
  ) {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customersService.delete(id);
  }
}
