import { SignifyClient, CreateIdentiferArgs, EventResult, } from 'signify-ts';
import { Serder } from "signify-ts";
import { AID, KeyStateType, QB64, get_agentIdentifier } from "./signify";
import { AGENT, AddEndRoleRequest, IdentifierType, add_endRole } from "./signify";
import { OperationType, wait_operation } from "./signify";
import { Configuration } from './config';
import { debug_json } from '../util/helper';

/**
 * Extends CreateIdentiferArgs
 * <p>Overrides types for states, rstates and mhab
 */
export interface CreateIdentifierRequest extends CreateIdentiferArgs {
    wits?: AID[];
    delpre?: AID;
    states?: KeyStateType[];
    rstates?: KeyStateType[];
    mhab?: IdentifierType;
}

export interface CreateIdentifierResponse {
    serder: Serder;
    sigs: QB64[];
    op: OperationType;
}

export async function create_identifier(client: SignifyClient, alias: string, request: CreateIdentiferArgs): Promise<CreateIdentifierResponse> {
    debug_json(`create_identifier(${alias})`, request, "CreateIdentiferArgs");
    let result: EventResult = await client.identifiers().create(alias, request);
    let response: CreateIdentifierResponse = {
        serder: result.serder,
        sigs: result.sigs as QB64[],
        op: await result.op()
    };
    debug_json(`create_identifier(${alias})`, response, "CreateIdentifierResponse");
    return response;
}

export async function create_single_identifier(client: SignifyClient, config: Configuration, alias: string, salt?: string): Promise<void> {
    let req1: CreateIdentifierRequest = {
        toad: config.toad,
        wits: config.wits,
        bran: salt ?? undefined
    };
    let res1 = await create_identifier(client, alias, req1);
    await wait_operation(client, res1.op);
    let req2: AddEndRoleRequest = {
        alias: alias,
        role: AGENT,
        eid: get_agentIdentifier(client)
    }
    let res2 = await add_endRole(client, req2);
    await wait_operation(client, res2.op);
}

