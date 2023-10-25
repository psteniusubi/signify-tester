import { SignifyClient } from 'signify-ts';
import { OperationType, wait_operation } from './signify';
import { debug_json } from '../util/helper';
import { AGENT } from './signify';

export interface OobiType {
    role: string,
    oobis: string[]
}

export async function get_oobi(client: SignifyClient, alias: string, role: string = AGENT): Promise<OobiType> {
    let res: OobiType = await client.oobis().get(alias, role);
    debug_json(`get_oobi(${alias})`, res, "OobiType");
    return res;
}

export async function resolve_oobi(client: SignifyClient, alias: string, value: string): Promise<void> {
    let op: OperationType = await client.oobis().resolve(value, alias);
    await wait_operation(client, op);
}

