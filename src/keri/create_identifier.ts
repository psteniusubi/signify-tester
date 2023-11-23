import { SignifyClient, CreateIdentiferArgs, EventResult, RotateIdentifierArgs, } from 'signify-ts';
import { Serder } from "signify-ts";
import { AID, KeyStateType, QB64, get_agentIdentifier } from "./signify";
import { AGENT, AddEndRoleRequest, IdentifierType, add_endRole } from "./signify";
import { OperationType, wait_operation } from "./signify";
import { Configuration } from './config';
import { debug_in, debug_out } from '../util/helper';

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

export async function create_identifier(client: SignifyClient, alias: string, request: CreateIdentifierRequest | CreateIdentiferArgs): Promise<CreateIdentifierResponse> {
    debug_out(`create_identifier(${alias})`, request, "CreateIdentiferArgs");
    let result: EventResult = await client.identifiers().create(alias, request);
    let response: CreateIdentifierResponse = {
        serder: result.serder,
        sigs: result.sigs as QB64[],
        op: await result.op()
    };
    debug_in(`create_identifier(${alias})`, response, "CreateIdentifierResponse");
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

export interface AnchorRequest {
    i: AID,
    s: number,
    d: AID
}

export type InteractionRequest = AnchorRequest | object;

export interface InteractionResponse {
    serder: Serder;
    sigs: QB64[];
    op: OperationType;
}

export async function interact_identifier(client: SignifyClient, alias: string, data: InteractionRequest): Promise<InteractionResponse> {
    debug_out(`interact_identifier(${alias})`, data, "InteractionRequest");
    let result: EventResult = await client.identifiers().interact(alias, data);
    let response: InteractionResponse = {
        serder: result.serder,
        sigs: result.sigs as QB64[],
        op: await result.op()
    };
    debug_in(`interact_identifier(${alias})`, response, "InteractionResponse");
    return response;
}

export interface RotationRequest extends RotateIdentifierArgs {
    cuts?: AID[],
    adds?: AID[],
    states?: KeyStateType[];
    rstates?: KeyStateType[];
}

export interface RotationResponse {
    serder: Serder;
    sigs: QB64[];
    op: OperationType;
}

export async function rotate_identifier(client: SignifyClient, alias: string, request: RotationRequest | RotateIdentifierArgs): Promise<RotationResponse> {
    debug_out(`rotate_identifier(${alias})`, request, "RotationRequest");
    let result: EventResult = await client.identifiers().rotate(alias, request);
    let response: RotationResponse = {
        serder: result.serder,
        sigs: result.sigs as QB64[],
        op: await result.op()
    };
    debug_in(`rotate_identifier(${alias})`, response, "RotationResponse");
    return response;
}
