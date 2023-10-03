import { Injectable, Logger } from '@nestjs/common';

import firebaseAdminPkg from 'firebase-admin';
import { FirebaseAdminService } from '../../firebase-admin/firebase-admin.service.js';
import { MerchantEntity } from '../entities/merchant.entity.js';
import { MerchantsService } from './merchants.service.js';

const { credential } = firebaseAdminPkg;

@Injectable()
export class MerchantsFirebaseService {
  private readonly logger = new Logger(MerchantsFirebaseService.name);

  constructor(
    protected readonly service: MerchantsService,
    private readonly firebaseAdminService: FirebaseAdminService,
  ) {
    this.logger.verbose(this.constructor.name);
  }

  /*
   * Firebase
   */

  firebaseAdminApp(params: { merchant: MerchantEntity }) {
    const entity = params.merchant;

    try {
      const app = this.firebaseAdminService.getApp(entity.id);
      return app;
    } catch (error) {
      // do nothing, the app doesn't exist
      this.logger.log(error);
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
