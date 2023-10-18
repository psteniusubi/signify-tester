import { SignifyClient } from 'signify-ts';
import { OperationType, wait_operation } from './operation';

export interface OobiType {
    role: string,
    oobis: string[]
}

export async function get_oobi(client: SignifyClient, alias: string, role: string = "agent"): Promise<OobiType> {
    let res = await client.oobis().get(alias, role);
    return res;
}

export async function resolve_oobi(client: SignifyClient, alias: string, value: string): Promise<void> {
    let op: OperationType = await client.oobis().resolve(value, alias);
    await wait_operation(client, op);
}

