import { describe, test } from '@jest/globals';
import { client1, client2, createClients, createIdentifiers, createContacts, name1_id, config } from './prepare';
import { AGENT, CreateIdentifierRequest, Identifier, add_endRole, create_identifier, get_agentIdentifier, get_notifications, list_operations, wait_operation } from '../src/keri/signify';
import { debug_json } from '../src/util/helper';
import { NAME1 } from '../src/keri/config';

beforeAll(createClients);
beforeAll(createIdentifiers);
beforeAll(createContacts);

describe("SingleDelegate", () => {
    const DELEGATE = "delegate";
    test("step1", async () => {
        // delegator is name1 on client1
        let identifierRequest: CreateIdentifierRequest = {
            delpre: name1_id,
            // toad: config.toad,
            // wits: config.wits
        };
        // delegate on client2
        let identifierResponse = await create_identifier(client2, DELEGATE, identifierRequest);
        debug_json("create_identifier", identifierResponse.serder.ked);
    });
    test("step2", async () => {
        // lookup delegate on client2
        let id = await Identifier.create(client2, DELEGATE);
        // anchoring event
        let anchor = {
            i: id.getId(),
            s: 0,
            d: id.getId()
        };
        // interact with name1 on client1
        let res1 = await client1.identifiers().interact(NAME1, anchor);
        await wait_operation(client1, await res1.op());
    });
    test("step3", async () => {
        // lookup delegate on client2
        let id = await Identifier.create(client2, DELEGATE);
        // wait for delegation operation
        await wait_operation(client2, { name: `delegation.${id.getId()}` });
    });
    test("step4", async () => {
        // add end roles to delegate on client1
        let endRoleResponse = await add_endRole(client2, {
            alias: DELEGATE,
            role: AGENT,
            eid: get_agentIdentifier(client2)
        });
        await wait_operation(client2, endRoleResponse.op);
    });

    // let id = await Identifier.create(client2, alias);
    // let oobi = await get_oobi(client2, alias, AGENT);
    // await resolve_oobi(client1, alias, oobi.oobis[0]);
    // await client2.identifiers().rotate(alias, {
    // });      
    // let payload: DelegateRequestPayload = {
    //     delpre: identifierRequest.delpre
    // };
    // let sender = await get_identifier(client2, alias);
    // expect(sender.state).toBeDefined();
    // let state = sender.state!;
    // let seal: SealEventType = [
    //     SEAL_EVENT,
    //     {
    //         i: sender.prefix,
    //         s: state.ee.s,
    //         d: state.ee.d,
    //     }
    // ];
    // let sigers = identifierResponse.sigs.map(i => new Siger({ qb64: i }));
    // let ims = d(messagize(identifierResponse.serder, sigers));
    // let atc = ims.substring(identifierResponse.serder.size);
    // let embeds: DelegateRequestEmbeds = {
    //     evt: [identifierResponse.serder, atc]
    // };
    // let recipients: AID[] = [identifierRequest.delpre!];
    // let request: DelegateRequest = {
    //     sender: sender,
    //     // topic: alias,
    //     route: "/delegate/request",
    //     payload: payload,
    //     embeds: embeds,
    //     recipients: recipients
    // };
    // try {
    //     let response = await send_exchange(client2, request);
    // } catch (e) {
    //     console.error(e);
    // }

    test("client1", async () => {
        let operations = await list_operations(client1);
        debug_json("list_operations", operations);
        for await (let note of get_notifications(client1)) {
            debug_json("client1", note);
        }
        let reply = await client1.escrows().listReply();
        debug_json("listReply", reply);
    });
    test("client2", async () => {
        let operations = await list_operations(client2);
        debug_json("list_operations", operations);
        for await (let note of get_notifications(client2)) {
            debug_json("client1", note);
        }
        let reply = await client2.escrows().listReply();
        debug_json("listReply", reply);
    });
});
