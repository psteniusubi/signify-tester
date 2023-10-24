import { EventResult, Serder, SignifyClient } from 'signify-ts';
import { OperationType } from './signify';
import { debug_json } from '../util/helper';

export const AGENT = "agent";

export interface EndRoleType {
    cid: string,
    role: string,
    eid: string
}

export async function get_endRoles(client: SignifyClient, alias: string): Promise<EndRoleType[]> {
    let path = `/identifiers/${alias}/endroles`;
    let response: Response = await client.fetch(path, "GET", null);
    if (!response.ok) throw new Error(await response.text());
    let res: EndRoleType[] = await response.json();
    debug_json(`get_endRoles(${alias})`, res);
    return res;
}

export interface AddEndRoleRequest {
    alias?: string;
    role?: string;
    eid?: string;
    stamp?: string;
}

/**
 * @see CreateIdentifierResponse
 */
export interface AddEndRoleResponse {
    serder: Serder;
    sigs: string[];
    op: OperationType;
}

export async function add_endRole(client: SignifyClient, request: AddEndRoleRequest): Promise<AddEndRoleResponse> {
    let res: EventResult = await client.identifiers().addEndRole(
        request.alias ?? "",
        request.role ?? "",
        request.eid,
        request.stamp
    );
    let response: AddEndRoleResponse = {
        serder: res.serder,
        sigs: res.sigs,
        op: await res.op()
    };
    return response;
}

export async function has_endRole(client: SignifyClient, alias: string, role: string, eid?: string): Promise<boolean> {
    let list = await get_endRoles(client, alias);
    for (let i of list) {
        if (i.role === role && i.eid === eid) {
            return true;
        }
    }
    return false;
}

