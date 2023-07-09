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

@Injectable()
export class FirebaseAdminService {
  initializeApp(options?: AppOptions, appName?: string): App {
    return initializeApp(options, appName);
  }

  async deleteApp(app: App) {
    await deleteApp(app);
  }

  getApp(appName?: string): App {
    return getApp(appName);
  }

  auth(app?: App) {
    return getAuth(app);
  }

  firestore(app: App) {
    return getFirestore(app);
  }

  messaging(app?: App) {
    return getMessaging(app);
  }

  storage(app?: App) {
    return getStorage(app);
  }

  database(app?: App) {
    return getDatabase(app);
  }

  appCheck(app?: App) {
    return getAppCheck(app);
  }
}
