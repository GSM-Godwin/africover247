import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private app: admin.app.App | null = null;

  onModuleInit() {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn(
        '[Firebase] Credentials not configured — push notifications disabled',
      );
      return;
    }

    try {
      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      this.logger.log('[Firebase] Admin SDK initialized');
    } catch (err) {
      this.logger.error('[Firebase] Failed to initialize:', err);
    }
  }

  async sendPushNotification(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<boolean> {
    if (!this.app) {
      this.logger.log(
        `[Firebase STUB] Push to ${token.slice(0, 20)}...: ${title}`,
      );
      return false;
    }

    try {
      await admin.messaging().send({
        token,
        notification: { title, body },
        data: data || {},
        android: {
          priority: 'high',
          notification: { sound: 'default' },
        },
        apns: {
          payload: {
            aps: { sound: 'default', badge: 1 },
          },
        },
      });
      this.logger.log(`[Firebase] Push sent to ${token.slice(0, 20)}...`);
      return true;
    } catch (err: any) {
      this.logger.error(`[Firebase] Push failed: ${err.message}`);
      return false;
    }
  }

  async sendPushToUser(
    pushToken: string | null,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (!pushToken) return;
    await this.sendPushNotification(pushToken, title, body, data);
  }
}
