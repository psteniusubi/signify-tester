import { SignifyClient, CreateIdentiferArgs, EventResult, } from 'signify-ts';
import { Algos, Serder, Tier } from "signify-ts";
import { KeyStateType } from "./keystate";
import { IdentifierType } from "./identifier";
import { OperationType } from "./operation";

export interface CreateIdentifierRequest extends CreateIdentiferArgs {
    states?: KeyStateType[];
    rstates?: KeyStateType[];
    mhab?: IdentifierType;
}

export interface CreateIdentifierResponse {
    serder: Serder;
    sigs: string[];
    op: OperationType;
}

export async function create_identifier(client: SignifyClient, alias: string, request: CreateIdentiferArgs): Promise<CreateIdentifierResponse> {
    let result: EventResult = await client.identifiers().create(alias, request);
    let response: CreateIdentifierResponse = {
        serder: result.serder,
        sigs: result.sigs,
        op: await result.op()
    };
    return response;
}
