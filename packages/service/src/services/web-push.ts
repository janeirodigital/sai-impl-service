import "dotenv/config";
import webpush, { PushSubscription } from 'web-push';
import { getLoggerFor } from '@digita-ai/handlersjs-logging';

const logger = getLoggerFor('web-push', 5, 5)


export const sendWebPush = async (webId: string, subscriptions: PushSubscription[]): Promise<void> => {
  webpush.setVapidDetails(process.env.PUSH_NOTIFICATION_EMAIL!, process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);

  // TODO: i18n
  const notificationPayload = {
    notification: {
      title: 'SAI authorization agent',
      body: 'Someone shared data with you',
      data: {
       webId
      }
    }
  };
  try {
    await Promise.all(subscriptions.map((sub) => webpush.sendNotification(sub, JSON.stringify(notificationPayload))));
  } catch(err) {
    logger.error('Sending push notification failed', err)
  }
};
