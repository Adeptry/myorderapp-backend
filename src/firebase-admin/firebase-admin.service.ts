import { Injectable } from '@nestjs/common';
import {
  App,
  AppOptions,
  deleteApp,
  getApp,
  initializeApp,
} from 'firebase-admin/app';
import { getAppCheck } from 'firebase-admin/app-check';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { getStorage } from 'firebase-admin/storage';
import { AppLogger } from '../logger/app.logger.js';

@Injectable()
export class FirebaseAdminService {
  constructor(protected readonly logger: AppLogger) {
    logger.setContext(FirebaseAdminService.name);
  }

  initializeApp(options?: AppOptions, appName?: string): App {
    this.logger.verbose(this.initializeApp.name);
    return initializeApp(options, appName);
  }

  async deleteApp(app: App) {
    this.logger.verbose(this.deleteApp.name);
    await deleteApp(app);
  }

  getApp(appName?: string): App {
    this.logger.verbose(this.getApp.name);
    return getApp(appName);
  }

  auth(app?: App) {
    this.logger.verbose(this.auth.name);
    return getAuth(app);
  }

  firestore(app: App) {
    this.logger.verbose(this.firestore.name);
    return getFirestore(app);
  }

  messaging(app?: App) {
    this.logger.verbose(this.messaging.name);
    return getMessaging(app);
  }

  storage(app?: App) {
    this.logger.verbose(this.storage.name);
    return getStorage(app);
  }

  database(app?: App) {
    this.logger.verbose(this.database.name);
    return getDatabase(app);
  }

  appCheck(app?: App) {
    this.logger.verbose(this.appCheck.name);
    return getAppCheck(app);
  }
}
