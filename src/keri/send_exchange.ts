import { Serder, SignifyClient } from "signify-ts";
import { AID, IdentifierType } from "./signify";
import { debug_in } from "../util/helper";

export const MULTISIG_ICP = "/multisig/icp";
export const MULTISIG_RPY = "/multisig/rpy";

// ExchangeRequest

export interface ExchangeRequest {
    sender?: IdentifierType;
    topic?: string;
    route?: string;
    payload?: any;
    embeds?: any;
    recipients?: AID[];
}

// /multisig/icp

export interface MultisigIcpRequestPayload {
    gid?: AID;
    smids?: AID[];
    rmids?: AID[];
}

export interface MultisigIcpRequestEmbeds {
    icp?: [Serder, string];
}

export interface MultisigIcpRequest extends ExchangeRequest {
    payload?: MultisigIcpRequestPayload;
    embeds?: MultisigIcpRequestEmbeds;
}

// /multisig/rpy

export interface MultisigRpyRequestPayload {
    gid?: AID;
}

export interface MultisigRpyRequestEmbeds {
    rpy?: [Serder, string];
}

export interface MultisigRpyRequest extends ExchangeRequest {
    payload?: MultisigRpyRequestPayload;
    embeds?: MultisigRpyRequestEmbeds;
}

// ExchangeResponse

export interface ExchangeResponse {
}

// SealEvent

export const SEAL_EVENT = "SealEvent";

export type SealEventType = [
    string,
    {
        i: AID;
        s: AID | string | number
        d: AID;
    }
];

export async function send_exchange(client: SignifyClient, request: ExchangeRequest): Promise<ExchangeResponse> {
    let res: ExchangeResponse = await client.exchanges().send(
        request.sender?.name ?? "",
        request.topic ?? "",
        request.sender ?? {},
        request.route ?? "",
        request.payload ?? {},
        request.embeds ?? {},
        request.recipients ?? []);
    debug_in(`send_exchange(${request.sender?.name})`, res, "ExchangeResponse");
    return res;
}