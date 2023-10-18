import { SignifyClient, CreateIdentiferArgs, } from 'signify-ts';
import { Algos, Serder, Tier } from "signify-ts";
import { KeyStateType } from "./keystate";
import { IdentifierType } from "./identifier";
import { OperationType } from "./operation";

export interface CreateIdentifierRequest {
    transferable?: boolean;
    isith?: string | number | string[];
    nsith?: string | number | string[];
    wits?: string[];
    toad?: number;
    proxy?: string;
    delpre?: string;
    dcode?: string;
    data?: any;
    algo?: Algos;
    pre?: string;
    states?: KeyStateType[];
    rstates?: KeyStateType[];
    prxs?: any[];
    nxts?: any[];
    mhab?: IdentifierType;
    keys?: any[];
    ndigs?: any[];
    bran?: string;
    count?: number;
    ncount?: number;
    tier?: Tier;
    extern_type?: string;
    extern?: any;
}

export interface CreateIdentifierResponse {
    serder: Serder;
    sigs: string[];
    op: OperationType;
}

export async function create_identifier(client: SignifyClient, alias: string, request: CreateIdentifierRequest): Promise<CreateIdentifierResponse> {
    let args: CreateIdentiferArgs = request;
    let res = await client.identifiers().create(alias, args);
    return {
        serder: res.serder,
        sigs: res.sigs,
        op: await res.op()
    };
}