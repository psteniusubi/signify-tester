import { Serder, SignifyClient } from "signify-ts";
import { IdentifierType } from "./signify";
import { debug_json } from "../util/helper";

export const MULTISIG_ICP = "/multisig/icp";
export const MULTISIG_RPY = "/multisig/rpy";

// ExchangeRequest

export interface ExchangeRequest {
    sender?: string;
    topic?: string;
    sender_id?: IdentifierType;
    route?: string;
    payload?: any;
    embeds?: any;
    recipients?: string[];
}

// /multisig/icp

export interface MultisigIcpRequestPayload {
    gid?: string;
    smids?: string[];
    rmids?: string[];
}

export interface MultisigIcpRequestEmbeds {
    icp?: (string | Serder)[];
}

export interface MultisigIcpRequest extends ExchangeRequest {
    payload?: MultisigIcpRequestPayload;
    embeds?: MultisigIcpRequestEmbeds;
}

// /multisig/rpy

export interface MultisigRpyRequestPayload {
    gid?: string;
}

export interface MultisigRpyRequestEmbeds {
    rpy?: (string | Serder)[];
}

export interface MultisigRpyRequest extends ExchangeRequest {
    payload?: MultisigRpyRequestPayload;
    embeds?: MultisigRpyRequestEmbeds;
}

// ExchangeResponse

export interface ExchangeResponse {
}

export async function send_exchange(client: SignifyClient, request: ExchangeRequest): Promise<ExchangeResponse> {
    let res: ExchangeResponse = await client.exchanges().send(
        request.sender ?? "",
        request.topic ?? "",
        request.sender_id ?? {},
        request.route ?? "",
        request.payload ?? {},
        request.embeds ?? {},
        request.recipients ?? []);
    debug_json(`send_exchange(${request.sender})`, res);
    return res;
}