import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import firebaseAdminPkg from 'firebase-admin';
import { Repository } from 'typeorm';
import { FirebaseAdminService } from '../firebase-admin/firebase-admin.service.js';
import { Merchant } from '../merchants/entities/merchant.entity.js';
import { EntityRepositoryService } from '../utils/entity-repository-service.js';
import { MerchantUpdateInput } from './dto/update-merchant.input.js';
const { credential } = firebaseAdminPkg;

@Injectable()
export class MerchantsService extends EntityRepositoryService<Merchant> {
  private readonly logger = new Logger(MerchantsService.name);

  constructor(
    @InjectRepository(Merchant)
    protected readonly repository: Repository<Merchant>,
    @Inject(FirebaseAdminService)
    private readonly firebaseAdminService: FirebaseAdminService,
  ) {
    super(repository);
  }

  async assignAndSave(id: string, updateInput: MerchantUpdateInput) {
    const entity = await this.findOneOrFail({ where: { id } });
    Object.assign(entity, updateInput);
    return await this.save(entity);
  }

  /*
   * Firebase
   */

  firebaseAdminApp(params: { merchant: Merchant }) {
    const entity = params.merchant;

    try {
      const app = this.firebaseAdminService.getApp(entity.id);
      return app;
    } catch {
      // do nothing, the app doesn't exist
    }
    try {
      const appOptions = JSON.parse(JSON.stringify(entity.firebaseAppOptions));
      const app = this.firebaseAdminService.initializeApp(
        {
          credential: credential.cert(appOptions),
          databaseURL: entity.firebaseDatabaseUrl,
        },
        entity.id,
      );
      return app;
    } catch (error: any) {
      this.logger.log(error);
      return null;
    }
  }
}
