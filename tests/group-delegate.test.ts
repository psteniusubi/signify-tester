import { describe, test } from '@jest/globals';
import { AGENT, AID, CreateIdentifierRequest, CreateIdentifierResponse, ExchangeRequest, ExchangeResponse, Identifier, MULTISIG_ICP, MultisigIcpBuilder, MultisigIcpRequest, create_identifier, delete_notification, get_oobi, list_notifications, list_operations, send_exchange, wait_notification, wait_operation } from '../src/keri/signify';
import { createClients, createContacts, createIdentifiers, client1, client2, client3, config, name3_id } from './prepare';
import { CONTACT2, GROUP1, NAME1 } from '../src/keri/config';
import { Serder } from 'signify-ts';
import { debug_json } from '../src/util/helper';

beforeAll(createClients);
beforeAll(createIdentifiers);
beforeAll(createContacts);

export interface DelegateRequestPayload {
    delpre?: AID;
}

export interface DelegateRequestEmbeds {
    evt?: [Serder, string];
}

export interface DelegateRequest extends ExchangeRequest {
    payload?: DelegateRequestPayload;
    embeds?: DelegateRequestEmbeds;
}

describe("GroupDelegate", () => {
    test("step1", async () => {
        let builder = await MultisigIcpBuilder.create(client1, GROUP1, NAME1, [CONTACT2]);

        let createIdentifierRequest: CreateIdentifierRequest = await builder.buildCreateIdentifierRequest(config);
        createIdentifierRequest.delpre = name3_id;
        let createIdentifierResponse: CreateIdentifierResponse = await create_identifier(client1, builder.alias, createIdentifierRequest);

        let icpRequest: MultisigIcpRequest = await builder.buildMultisigIcpRequest(createIdentifierRequest, createIdentifierResponse);
        expect(icpRequest.sender?.name).toStrictEqual(NAME1);
        let icpResponse: ExchangeResponse = await send_exchange(client1, icpRequest);

        // let payload: DelegateRequestPayload = {
        //     delpre: createIdentifierRequest.delpre
        // };
        // let seal: SealEventType = [
        //     SEAL_EVENT,
        //     {
        //         i: createIdentifierResponse.serder.pre as AID,
        //         s: 0,
        //         d: createIdentifierResponse.serder.pre as AID,
        //     }
        // ];
        // let sigers = createIdentifierResponse.sigs.map(i => new Siger({ qb64: i }));
        // let ims = d(messagize(createIdentifierResponse.serder, sigers, seal));
        // let atc = ims.substring(createIdentifierResponse.serder.size);
        // let embeds: DelegateRequestEmbeds = {
        //     evt: [createIdentifierResponse.serder, atc]
        // };
        // let recipients: AID[] = [createIdentifierRequest.delpre!];
        // let request: DelegateRequest = {
        //     sender: await get_identifier(client1, NAME1),
        //     topic: GROUP1,
        //     route: "/delegate/request",
        //     payload: payload,
        //     embeds: embeds,
        //     recipients: recipients
        // };
        // try {
        //     let response = await send_exchange(client1, request);
        // } catch (e) {
        //     console.error(e);
        // }
    });
    test("step2", async () => {
        let n = await wait_notification(client2, MULTISIG_ICP);
        let builder = await MultisigIcpBuilder.create(client2, GROUP1);
        for await (let createIdentifierRequest of builder.acceptGroupIcpNotification(n)) {
            expect(createIdentifierRequest.mhab?.name).toStrictEqual(NAME1);
            expect(createIdentifierRequest.delpre).toBe(name3_id);
            let createIdentifierResponse = await create_identifier(client2, builder.alias, createIdentifierRequest);
            let icpRequest = await builder.buildMultisigIcpRequest(createIdentifierRequest, createIdentifierResponse);
            expect(icpRequest.sender?.name).toStrictEqual(NAME1);
            let icpResponse = await send_exchange(client2, icpRequest);
        }
        await delete_notification(client2, n);
    });
    test("step3", async () => {
        let id = await Identifier.create(client1, GROUP1);
        let anchor = {
            i: id.getId(),
            s: 0,
            d: id.getId()
        };
        let res1 = await client3.identifiers().interact(NAME1, anchor);
        await wait_operation(client3, await res1.op());
    });
    test("status", async () => {
        debug_json("client1", await list_operations(client1));
        debug_json("client1", await list_notifications(client1));
        debug_json("client2", await list_operations(client2));
        debug_json("client2", await list_notifications(client2));
        debug_json("client3", await list_operations(client3));
        debug_json("client3", await list_notifications(client3));
    });
    test("oobi", async () => {
        await get_oobi(client1, NAME1, AGENT);
        await get_oobi(client2, NAME1, AGENT);
        await get_oobi(client3, NAME1, AGENT);
        await get_oobi(client1, GROUP1, AGENT);
    });
});
