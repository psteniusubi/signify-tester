import { EventResult, Serder, SignifyClient } from 'signify-ts';
import { AID, OperationType, QB64 } from './signify';
import { debug_json } from '../util/helper';

export const AGENT = "agent";
export const WITNESS = "witness";

export interface EndRoleType {
    cid: AID;
    role: string;
    eid: AID;
}

export function get_agentIdentifier(client: SignifyClient): AID {
    if (client.agent === null) throw new Error();
    return client.agent!.pre as AID;
}

export async function get_endRoles(client: SignifyClient, alias: string, role: string | undefined = undefined): Promise<EndRoleType[]> {
    let path = (role !== undefined) ? `/identifiers/${alias}/endroles/${role}` : `/identifiers/${alias}/endroles`;
    let response: Response = await client.fetch(path, "GET", null);
    if (!response.ok) throw new Error(await response.text());
    let res: EndRoleType[] = await response.json();
    debug_json(`get_endRoles(${alias},role=${role})`, res, "EndRoleType");
    return res;
}

export interface AddEndRoleRequest {
    alias?: string;
    role?: string;
    eid?: AID;
    stamp?: string;
}

/**
 * @see CreateIdentifierResponse
 */
export interface AddEndRoleResponse {
    serder: Serder;
    sigs: QB64[];
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
        sigs: res.sigs as QB64[],
        op: await res.op()
    };
    return response;
}

export async function has_endRole(client: SignifyClient, alias: string, role: string, eid?: AID): Promise<boolean> {
    let list = await get_endRoles(client, alias, role);
    for (let i of list) {
        if (i.role === role && i.eid === eid) {
            return true;
        }
    }
    return false;
}

