import { SignifyClient } from 'signify-ts';
import { RangeType } from './signify';

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

