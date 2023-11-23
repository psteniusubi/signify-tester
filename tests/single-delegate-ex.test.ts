import { describe, test } from '@jest/globals';
import { client1, client2, config, createClients } from './prepare';
import { AID, AnchorRequest, CreateIdentifierRequest, create_identifier, create_single_identifier, get_contact, get_identifier, get_keyState, get_oobi, interact_identifier, resolve_oobi, wait_operation } from '../src/keri/signify';

beforeAll(createClients);

const DELEGATOR = "delegator";
const DELEGATE = "delegate";

describe("SingleDelegateEx", () => {
    test("integration", async () => {
        // client1: delegator
        await create_single_identifier(client1, config, DELEGATOR);
        let oobi = await get_oobi(client1, DELEGATOR);
        let delegator = await get_identifier(client1, DELEGATOR);
        await get_keyState(client1, delegator.prefix);

        // client2: oobi delegator
        await resolve_oobi(client2, DELEGATOR, oobi.oobis[0]);
        let delegator_contact = await get_contact(client2, DELEGATOR);
        // client2: delegate
        let identifierRequest: CreateIdentifierRequest = {
            // toad: config.toad,
            // wits: config.wits,
            delpre: delegator_contact.id
        };
        let identifierResponse = await create_identifier(client2, DELEGATE, identifierRequest);
        let delegate_id: AID = identifierResponse.serder.pre as AID;

/*        
        let sender = await get_identifier(client2, DELEGATE);
        let state = await get_keyState(client2, delegate_id);
        let payload: DelegateRequestPayload = {
            delpre: identifierRequest.delpre
        };
        let seal: SealEventType = [
            SEAL_EVENT,
            {
                i: state.di,
                s: state.ee.s,
                d: state.ee.d,
            }
        ];
        let sigers = identifierResponse.sigs.map(i => new Siger({ qb64: i }));
        let ims = d(messagize(identifierResponse.serder, sigers, seal));
        let atc = ims.substring(identifierResponse.serder.size);
        let embeds: DelegateRequestEmbeds = {
            evt: [identifierResponse.serder, atc]
        };
        let recipients: AID[] = [identifierRequest.delpre!];
        let request: DelegateRequest = {
            sender: sender,
            // topic: alias,
            route: "/delegate/request",
            payload: payload,
            embeds: embeds,
            recipients: recipients
        };
        debug_out(`send_exchange(${request.sender?.name})`, request, "DelegateRequest");
        let response = await send_exchange(client2, request);

        // client1: wait
        let n = await wait_notification(client1, "/delegate/request");
*/        

        // client1: interact delegator
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
