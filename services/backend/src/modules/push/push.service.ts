import { Injectable, Logger } from '@nestjs/common';
import Expo, { ExpoPushMessage } from 'expo-server-sdk';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly expo = new Expo();

  async send(token: string | null | undefined, title: string, body: string, data?: Record<string, unknown>) {
    if (!token || !Expo.isExpoPushToken(token)) {
      this.logger.debug(`Invalid or missing push token: ${token}`);
      return;
    }

    const message: ExpoPushMessage = { to: token, sound: 'default', title, body, data: data ?? {} };
    try {
      const chunks = this.expo.chunkPushNotifications([message]);
      for (const chunk of chunks) {
        const tickets = await this.expo.sendPushNotificationsAsync(chunk);
        for (const ticket of tickets) {
          if (ticket.status === 'error') {
            this.logger.error(`Push error: ${ticket.message}`);
          }
        }
      }
      this.logger.log(`Push sent: "${title}"`);
    } catch (err) {
      this.logger.error(`Push failed: ${(err as Error).message}`);
    }
  }
}
