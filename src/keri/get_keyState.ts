import { SignifyClient } from 'signify-ts';
import { debug_json } from '../util/helper';
import { AID } from './primitives';

export interface KeyStateType {
    i: AID;
    ee: {
        s: AID | string;
        d: AID;
        br: any[];
        ba: any[];
    }
    [property: string]: any,
}

export async function get_keyState(client: SignifyClient, id: AID): Promise<KeyStateType> {
    let res: KeyStateType[] = await client.keyStates().get(id);
    debug_json(`get_keyState(${id})`, res, "KeyStateType");
    if (res.length < 1) throw new Error(`get_keyState(${id}): not found`);
    return res[0];
}

export async function get_keyStates(client: SignifyClient, ids: AID[]): Promise<KeyStateType[]> {
    let tasks: Promise<KeyStateType>[] = [];
    for (let id of ids) {
        tasks.push(get_keyState(client, id));
    }
    return await Promise.all(tasks);
}

