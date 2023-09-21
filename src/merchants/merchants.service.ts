import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import firebaseAdminPkg from 'firebase-admin';
import { FindOptionsRelations, Repository } from 'typeorm';
import { FirebaseAdminService } from '../firebase-admin/firebase-admin.service.js';
import { AppLogger } from '../logger/app.logger.js';
import { Merchant } from '../merchants/entities/merchant.entity.js';
import { RestfulEntityRepositoryService } from '../utils/restful-entity-repository-service.js';

const { credential } = firebaseAdminPkg;

@Injectable()
export class MerchantsService extends RestfulEntityRepositoryService<Merchant> {
  constructor(
    @InjectRepository(Merchant)
    protected readonly repository: Repository<Merchant>,
    private readonly firebaseAdminService: FirebaseAdminService,
    protected readonly logger: AppLogger,
  ) {
    logger.setContext(MerchantsService.name);
    super(repository, logger);
  }

  async findOneByIdOrPath(params: {
    where: { idOrPath: string };
    relations?: FindOptionsRelations<Merchant>;
  }) {
    return await this.findOne({
      where: [
        { id: params.where.idOrPath },
        { appConfig: { path: params.where.idOrPath } },
      ],
      relations: params.relations,
    });
  }

  /*
   * Firebase
   */

  firebaseAdminApp(params: { merchant: Merchant }) {
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
