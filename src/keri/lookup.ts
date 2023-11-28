import { SignifyClient } from "signify-ts";
import { debug_in } from "../util/helper";
import { AID } from "./signify";

export const IDENTIFIER = "identifier";
export const CONTACT = "contact";

export interface LookupRequest {
    type?: string[] | undefined,
    id?: AID[] | undefined,
    name?: string[] | undefined,
}

export interface LookupType {
    type: string;
    id: AID;
    name?: string | undefined;
}

export async function invoke_lookup(client: SignifyClient, request: LookupRequest): Promise<LookupType[]> {
    let q = new URLSearchParams();
    request.type?.forEach(i => q.append("type", i));
    request.id?.forEach(i => q.append("id", i));
    request.name?.forEach(i => q.append("name", i));
    let url = `/lookup?${q}`;
    let res = await client.fetch(url, "GET", undefined);
    if (!res.ok) throw new Error(`${url}: ${await res.text()}`);
    let response: LookupType[] = await res.json();
    debug_in(url, response, "LookupType");
    return response;
}

