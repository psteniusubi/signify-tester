import { SignifyClient } from 'signify-ts';
import { debug_in } from '../util/helper';
import { AID } from './primitives';
import { OperationType, wait_operation } from './wait_operation';

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
    debug_in(`get_keyState(${id})`, res, "KeyStateType");
    if (res.length < 1) throw new Error(`get_keyState(${id}): not found`);
    return res[0];
}

export async function query_keyState(client: SignifyClient, id: AID, sn: number | undefined = undefined, anchor: AID | undefined = undefined): Promise<KeyStateType> {
    let op: OperationType = await client.keyStates().query(id, sn, anchor);
    op = await wait_operation(client, op);
    let res: KeyStateType = op.response;
    debug_in(`query_keyState(${id},${sn},${anchor})`, res, "KeyStateType");
    return res;
}

export async function get_keyStates(client: SignifyClient, ids: AID[]): Promise<KeyStateType[]> {
    return await Promise.all(ids.map(i => get_keyState(client, i)));
    // let tasks: Promise<KeyStateType>[] = [];
    // for (let id of ids) {
    //     tasks.push(get_keyState(client, id));
    // }
    // return await Promise.all(tasks);
}

