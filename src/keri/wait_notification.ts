import { SignifyClient } from 'signify-ts';
import { AID, RangeType } from './signify';
import { AsyncOperation, debug_in, wait_async_operation } from '../util/helper';

export interface NotificationType {
    i: AID,
    dt: string,
    r: boolean,
    a: {
        r: string,
        d: AID
    }
}

export interface NotificationRangeType extends RangeType {
    notes: NotificationType[]
}

export async function list_notifications(client: SignifyClient, start?: number, end?: number): Promise<NotificationRangeType> {
    let res: NotificationRangeType = await client.notifications().list(start, end);
    // debug_json(`list_notifications(start=${start},end=${end})`, res, "NotificationRangeType");
    return res;
}

export type NotificationPredicate = (notification: NotificationType) => boolean;

export const UNREAD_NOTIFICATION: NotificationPredicate = (note: NotificationType) => note.r === false;

export async function* get_notifications(client: SignifyClient, predicate: NotificationPredicate | undefined = undefined): AsyncGenerator<NotificationType, any, undefined> {
    const PAGE = 20;
    let start = 0;
    let end = start + PAGE - 1;
    let total = Number.MAX_VALUE;
    while (start < total) {
        let range = await list_notifications(client, start, end);
        total = range.total;
        start += range.notes.length;
        end = start + PAGE - 1;
        if (predicate === undefined) {
            debug_in("get_notifications", range.notes, "NotificationType");
            yield* range.notes;
        } else {
            for (let i of range.notes) {
                debug_in("get_notifications", i, "NotificationType");
                if (predicate(i)) {
                    yield i;
                }
            }
        }
    }
}

export async function find_notification(client: SignifyClient, predicate: NotificationPredicate): Promise<NotificationType | undefined> {
    for await (let note of get_notifications(client, predicate)) {
        return note;
    }
    return undefined;
}

export async function has_notification(client: SignifyClient, predicate: NotificationPredicate): Promise<boolean> {
    for await (let note of get_notifications(client, predicate)) {
        return true;
    }
    return false;
}

export async function wait_notification(client: SignifyClient, route: string): Promise<NotificationType> {
    // notification is unread and matches route
    const predicate: NotificationPredicate = (note: NotificationType) => (note.r === false) && (note.a.r === route);
    const async_operation: AsyncOperation<NotificationType> = async () => {
        return await find_notification(client, predicate);
    };
    let notification: NotificationType = await wait_async_operation(async_operation);
    return notification;
}

export async function mark_notification(client: SignifyClient, notification: NotificationType): Promise<void> {
    try {
        await client.notifications().mark(notification.i);
    } catch {
        // ignore
    }
}

export async function delete_notification(client: SignifyClient, notification: NotificationType): Promise<void> {
    await mark_notification(client, notification);
    let path = `/notifications/${notification.i}`;
    let response: Response = await client.fetch(path, "DELETE", null);
    if (!response.ok) throw new Error(await response.text());
}
