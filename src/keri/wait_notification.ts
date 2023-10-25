import { SignifyClient } from 'signify-ts';
import { RangeType } from './signify';
import { debug_json, wait_async_operation } from '../util/helper';

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

export async function list_notifications(client: SignifyClient, start?: number, end?: number): Promise<NotificationRangeType> {
    let res: NotificationRangeType = await client.notifications().list(start, end);
    debug_json(`list_notifications(start=${start},end=${end})`, res);
    return res;
}

export async function* get_notifications(client: SignifyClient): AsyncGenerator<NotificationType> {
    const PAGE = 20;
    let start = 0;
    let end = start + PAGE - 1;
    let total = Number.MAX_VALUE;
    while (start < total) {
        let range = await list_notifications(client, start, end);
        total = range.total;
        start += range.notes.length;
        end = start + PAGE - 1;
        for (let i of range.notes) {
            yield i;
        }
    }
}

export async function wait_notification(client: SignifyClient, route: string): Promise<NotificationType> {
    let notification: NotificationType = await wait_async_operation(async () => {
        for await (let note of get_notifications(client)) {
            if (note.a.r === route && note.r === false) return note;
        }
        return undefined;
    });
    return notification;
}

export async function mark_notification(client: SignifyClient, notification: NotificationType): Promise<void> {
    await client.notifications().mark(notification.i);
}
