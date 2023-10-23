import { SignifyClient } from 'signify-ts';
import { OperationType, wait_operation } from './operation';
import { debug_json } from '../util/helper';

export interface OobiType {
    role: string,
    oobis: string[]
}

export async function get_oobi(client: SignifyClient, alias: string, role: string = "agent"): Promise<OobiType> {
    let res: OobiType = await client.oobis().get(alias, role);
    debug_json(`get_oobi(${alias})`, res);
    return res;
}

export async function resolve_oobi(client: SignifyClient, alias: string, value: string): Promise<void> {
    let op: OperationType = await client.oobis().resolve(value, alias);
    await wait_operation(client, op);
}

