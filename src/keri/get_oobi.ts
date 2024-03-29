import { SignifyClient } from 'signify-ts';
import { OperationType, AGENT, WITNESS, wait_operation } from './signify';
import { debug_in } from '../util/helper';
export { AGENT, WITNESS } from './endRole';

export const OOBI_DEFAULT_ROLE = AGENT;
// export const OOBI_DEFAULT_ROLE = WITNESS;

export interface OobiType {
    role: string,
    oobis: string[]
}

export async function get_oobi(client: SignifyClient, alias: string, role: string = OOBI_DEFAULT_ROLE): Promise<OobiType> {
    let res: OobiType = await client.oobis().get(alias, role);
    debug_in(`get_oobi(${alias})`, res, "OobiType");
    return res;
}

export async function resolve_oobi(client: SignifyClient, alias: string, value: string): Promise<void> {
    let op: OperationType = await client.oobis().resolve(value, alias);
    await wait_operation(client, op);
}

