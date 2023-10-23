import { Serder, SignifyClient } from "signify-ts";
import { IdentifierType } from "./identifier";

export const MULTISIG_ICP = "/multisig/icp";
export const MULTISIG_RPY = "/multisig/rpy";

export interface MultisigIcpPayload {
    gid?: string;
    smids?: string[];
    rmids?: string[];
}

export interface MultisigIcpEmbeds {
    icp?: (string | Serder)[];
}

export interface MultisigRpyPayload {
    gid?: string;
}

export interface MultisigRpyEmbeds {
    rpy?: (string | Serder)[];
}

export interface ExchangeRequest {
    sender?: string;
    topic?: string;
    sender_id?: IdentifierType;
    route?: string;
    payload?: MultisigIcpPayload | MultisigRpyPayload | object;
    embeds?: MultisigIcpEmbeds | MultisigRpyEmbeds | object;
    recipients?: string[];
}

export interface ExchangeResponse {

}

export async function send_exchange(client: SignifyClient, request: ExchangeRequest): Promise<ExchangeResponse> {
    let res = await client.exchanges().send(
        request.sender ?? "",
        request.topic ?? "",
        request.sender_id ?? {},
        request.route ?? "",
        request.payload ?? {},
        request.embeds ?? {},
        request.recipients ?? []);
    return res;
}