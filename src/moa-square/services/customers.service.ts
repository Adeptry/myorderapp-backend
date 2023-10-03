import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NestSquareService } from 'nest-square';
import { FindOptionsRelations, Repository } from 'typeorm';
import { EntityRepositoryService } from '../../database/entity-repository-service.js';
import { UsersService } from '../../users/users.service.js';
import { CustomerPatchBody } from '../dto/customers/customer-patch-body.dto.js';
import { CustomerEntity } from '../entities/customer.entity.js';
import { LocationsService } from './locations.service.js';
import { MerchantsService } from './merchants.service.js';

@Injectable()
export class CustomersService extends EntityRepositoryService<CustomerEntity> {
  protected readonly logger: Logger;

  constructor(
    @InjectRepository(CustomerEntity)
    protected readonly repository: Repository<CustomerEntity>,
    private readonly usersService: UsersService,
    private readonly squareService: NestSquareService,
    private readonly merchantsService: MerchantsService,
    private readonly locationsService: LocationsService,
  ) {
    const logger = new Logger(CustomersService.name);
    super(repository, logger);
    this.logger = logger;
  }

  async findOneWithUserIdAndMerchantIdOrPath(params: {
    where: {
      userId: string;
      merchantIdOrPath: string;
    };
    relations?: FindOptionsRelations<CustomerEntity>;
  }) {
    this.logger.verbose(this.findOneWithUserIdAndMerchantIdOrPath.name);
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
    relations?: FindOptionsRelations<CustomerEntity>;
  }) {
    this.logger.verbose(this.findOneWithIdAndMerchantIdOrPath.name);
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

    const response = await this.squareService.retryOrThrow(
      merchant.squareAccessToken,
      (client) =>
        client.customersApi.createCustomer({
          emailAddress: user.email ?? undefined,
          givenName: user.firstName ?? undefined,
          familyName: user.lastName ?? undefined,
          idempotencyKey: customer.id,
          referenceId: customer.id,
        }),
    );

    if (!response.result.customer?.id) {
      throw new InternalServerErrorException(
        `Failed to create Square customer`,
      );
    }

    customer.squareId = response.result.customer?.id;

    return await this.save(customer);
  }

  async patchOne(params: {
    id: string;
    merchantId: string;
    body: CustomerPatchBody;
  }) {
    this.logger.verbose(this.patchOne.name);
    const { id, merchantId, body } = params;
    const {
      preferredLocationId,
      preferredSquareCardId,
      firstName,
      lastName,
      phoneNumber,
    } = body;

    const merchant = await this.merchantsService.findOneOrFail({
      where: { id: merchantId },
    });
    const { squareAccessToken } = merchant;
    if (!squareAccessToken) {
      throw new BadRequestException(
        `Merchant does not have Square access token`,
      );
    }

    const customer = await this.findOneOrFail({
      where: { id, merchantId },
    });
    const { userId, squareId } = customer;
    if (!userId || !squareId) {
      throw new BadRequestException(`Customer does not have Square ID`);
    }

    if (userId && (firstName || lastName || phoneNumber)) {
      await this.usersService.patch(
        { where: { id: userId } },
        { firstName, lastName, phoneNumber },
      );

      await this.squareService.retryOrThrow(squareAccessToken, (client) => {
        return client.customersApi.updateCustomer(squareId, {
          givenName: firstName,
          familyName: lastName,
          phoneNumber,
        });
      });
    }

    let saveCustomer = false;

    if (preferredLocationId !== undefined) {
      if (preferredLocationId !== null) {
        const location = await this.locationsService.findOne({
          where: { id: preferredLocationId },
        });
        if (!location) {
          throw new NotFoundException(`Location ${preferredLocationId}`);
        }
        customer.preferredLocation = location;
      } else {
        customer.preferredLocation = null;
      }

      saveCustomer = true;
    }

    if (preferredSquareCardId !== undefined) {
      customer.preferredSquareCardId = preferredSquareCardId;
      saveCustomer = true;
    }

    if (saveCustomer) {
      return await this.save(customer);
    } else {
      return customer;
    }
  }
}
