import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocationsService } from '../locations/locations.service.js';
import { MerchantsService } from '../merchants/merchants.service.js';
import { SquareService } from '../square/square.service.js';
import { UsersService } from '../users/users.service.js';
import { EntityRepositoryService } from '../utils/entity-repository-service.js';
import { CustomerUpdateDto } from './dto/update-customer.dto.js';
import { Customer } from './entities/customer.entity.js';

@Injectable()
export class CustomersService extends EntityRepositoryService<Customer> {
  constructor(
    @InjectRepository(Customer)
    protected readonly repository: Repository<Customer>,
    private readonly usersService: UsersService,
    private readonly squareService: SquareService,
    private readonly merchantsService: MerchantsService,
    private readonly locationsService: LocationsService,
  ) {
    super(repository);
  }

  async createAndSave(params: { userId: string; merchantId: string }) {
    const { userId, merchantId } = params;

    const user = await this.usersService.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    if (
      await this.findOne({
        where: { userId, merchantId },
      })
    ) {
      throw new BadRequestException('Customer already exists');
    }

    const merchant = await this.merchantsService.findOne({
      where: { id: merchantId },
    });
    if (!merchant) {
      throw new NotFoundException(`Merchant ${merchantId} not found`);
    }

    if (!merchant?.squareAccessToken) {
      throw new BadRequestException(
        `Merchant does not have Square access token`,
      );
    }

    const customer = await this.save(
      this.create({
        merchantId: merchant.id,
        userId: userId,
      }),
    );

    const response = await this.squareService.createCustomer({
      accessToken: merchant.squareAccessToken,
      request: {
        emailAddress: user.email ?? undefined,
        givenName: user.firstName ?? undefined,
        familyName: user.lastName ?? undefined,
        idempotencyKey: customer.id,
      },
    });

    if (!response.result.customer?.id) {
      throw new InternalServerErrorException(
        `Failed to create Square customer`,
      );
    }

    customer.squareId = response.result.customer?.id;

    return await this.save(customer);
  }

  async updateAndSave(params: {
    id: string;
    merchantId: string;
    customerUpdateDto: CustomerUpdateDto;
  }) {
    const { id, merchantId, customerUpdateDto } = params;
    const customer = await this.findOne({
      where: { id, merchantId },
    });

    if (customer == null) {
      throw new NotFoundException(`Customer ${id} not found`);
    }

    let save = false;

    if (customerUpdateDto.preferredLocationId !== undefined) {
      if (customerUpdateDto.preferredLocationId !== null) {
        const location = await this.locationsService.findOne({
          where: { id: customerUpdateDto.preferredLocationId },
        });
        if (!location) {
          throw new NotFoundException(
            `Location ${customerUpdateDto.preferredLocationId}`,
          );
        }
        customer.preferredLocation = location;
      } else {
        customer.preferredLocation = null;
      }

      save = true;
    }

    if (save) {
      return await this.save(customer);
    } else {
      return customer;
    }
  }
}
