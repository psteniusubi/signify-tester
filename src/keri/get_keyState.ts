import { SignifyClient } from 'signify-ts';
import { debug_json } from '../util/helper';

export interface KeyStateType {
    i: string;
    ee: {
        s: string;
        d: string;
        br: any[];
        ba: any[];
    }
    [property: string]: any,
}

export async function get_keyState(client: SignifyClient, id: string): Promise<KeyStateType> {
    let res: KeyStateType[] = await client.keyStates().get(id);
    debug_json(`get_keyState(${id})`, res);
    if (res.length < 1) throw new Error(`get_keyState(${id}): not found`);
    return res[0];
}

export async function get_keyStates(client: SignifyClient, ids: string[]): Promise<KeyStateType[]> {
    let tasks: Promise<KeyStateType>[] = [];
    for (let id of ids) {
        tasks.push(get_keyState(client, id));
    }
    return await Promise.all(tasks);
}

