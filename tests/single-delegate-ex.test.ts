import { describe, test } from '@jest/globals';
import { client1, client2, config, createClients } from './prepare';
import { AID, AnchorRequest, CreateIdentifierRequest, create_identifier, create_single_identifier, get_contact, get_identifier, get_keyState, get_oobi, interact_identifier, resolve_oobi, wait_operation } from '../src/keri/signify';

beforeAll(createClients);

const DELEGATOR = "delegator";
const DELEGATE = "delegate";

describe("SingleDelegateEx", () => {
    test("integration", async () => {
        // client1
        await create_single_identifier(client1, config, DELEGATOR);
        let oobi = await get_oobi(client1, DELEGATOR);
        let delegator = await get_identifier(client1, DELEGATOR);
        await get_keyState(client1, delegator.prefix);

        // client2
        await resolve_oobi(client2, DELEGATOR, oobi.oobis[0]);
        let delegator_contact = await get_contact(client2, DELEGATOR);
        await get_keyState(client2, delegator_contact.id);
        let identifierRequest: CreateIdentifierRequest = {
            // toad: config.toad,
            // wits: config.wits,
            delpre: delegator.prefix
        };
        let identifierResponse = await create_identifier(client2, DELEGATE, identifierRequest);
        let delegate_id: AID = identifierResponse.serder.pre as AID;

        // client1
        let anchor: AnchorRequest = {
            i: delegate_id,
            s: 0,
            d: delegate_id
        };
        let interactionResponse = await interact_identifier(client1, DELEGATOR, anchor);
        await wait_operation(client1, interactionResponse.op);

        // client2
        await wait_operation(client2, identifierResponse.op);
    });
});
