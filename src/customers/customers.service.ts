import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsRelations, Repository } from 'typeorm';
import { LocationsService } from '../locations/locations.service.js';
import { AppLogger } from '../logger/app.logger.js';
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
    protected readonly logger: AppLogger,
  ) {
    logger.setContext(CustomersService.name);
    super(repository, logger);
  }

  async findOneWithUserIdAndMerchantIdOrPath(params: {
    where: {
      userId: string;
      merchantIdOrPath: string;
    };
    relations?: FindOptionsRelations<Customer>;
  }) {
    return await this.findOne({
      where: [
        {
          userId: params.where.userId,
          merchantId: params.where.merchantIdOrPath,
        },
        {
          userId: params.where.userId,
          merchant: {
            appConfig: {
              path: params.where.merchantIdOrPath,
            },
          },
        },
      ],
      relations: params.relations,
    });
  }

  async findOneWithIdAndMerchantIdOrPath(params: {
    where: {
      id: string;
      merchantIdOrPath: string;
    };
    relations?: FindOptionsRelations<Customer>;
  }) {
    return await this.findOne({
      where: [
        { id: params.where.id, merchantId: params.where.merchantIdOrPath },
        {
          id: params.where.id,
          merchant: {
            appConfig: {
              path: params.where.merchantIdOrPath,
            },
          },
        },
      ],
      relations: params.relations,
    });
  }

  async createOne(params: { userId: string; merchantIdOrPath: string }) {
    const { userId, merchantIdOrPath } = params;
    this.logger.verbose(this.createOne.name);

    const user = await this.usersService.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const merchant = await this.merchantsService.findOneByIdOrPath({
      where: { idOrPath: merchantIdOrPath },
    });
    if (!merchant?.id) {
      throw new NotFoundException(`Merchant ${merchantIdOrPath} not found`);
    }

    if (
      await this.findOne({
        where: { userId, merchantId: merchant.id },
      })
    ) {
      throw new BadRequestException('Customer already exists');
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

    customer.preferredLocation = await this.locationsService.findOne({
      where: { isMain: true, merchantId: merchant.id },
    });

    const response = await this.squareService.createCustomerOrThrow({
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

  async updateOne(params: {
    id: string;
    merchantId: string;
    customerUpdateDto: CustomerUpdateDto;
  }) {
    this.logger.verbose(this.updateOne.name);
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
