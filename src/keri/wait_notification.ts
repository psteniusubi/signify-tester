import { SignifyClient } from 'signify-ts';
import { RangeType } from './signify';
import { wait_async_operation } from '../util/helper';

export interface NotificationType {
    i: string,
    dt: string,
    r: boolean,
    a: {
        r: string,
        d: string
    }
}

export interface NotificationRangeType extends RangeType {
    notes: NotificationType[]
}

export async function list_notifications(client: SignifyClient): Promise<NotificationRangeType> {
    let res: NotificationRangeType = await client.notifications().list();
    return res;
}

export async function wait_notification(client: SignifyClient, route: string): Promise<NotificationType> {
    let notification: NotificationType = await wait_async_operation(async () => {
        let res = await list_notifications(client);
        let n = res.notes.filter(note => note.a.r === route && note.r === false).pop();
        return n;
    });
    return notification;
}

export async function mark_notification(client: SignifyClient, notification: NotificationType): Promise<void> {
    await client.notifications().mark(notification.i);
}
