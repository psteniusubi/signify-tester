import { SignifyClient } from "signify-ts";
import { debug_json } from "../util/helper";

export const IDENTIFIER = "identifier";
export const CONTACT = "contact";

export interface LookupRequest {
    type?: string[] | undefined,
    id?: string[] | undefined,
    name?: string[] | undefined,
}

export interface LookupType {
    type: string;
    id: string;
    name?: string | undefined;
}

export async function lookup(client: SignifyClient, request: LookupRequest): Promise<LookupType[]> {
    let q = new URLSearchParams();
    request.type?.forEach(i => q.append("type", i));
    request.id?.forEach(i => q.append("id", i));
    request.name?.forEach(i => q.append("name", i));
    let url = `/lookup?${q}`;
    let res = await client.fetch(url, "GET", undefined);
    if (!res.ok) throw new Error(`${url}: ${await res.text()}`);
    let response: LookupType[] = await res.json();
    debug_json(url, response, "LookupType");
    return response;
}

