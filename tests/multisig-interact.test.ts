import { describe, test } from '@jest/globals';
import { client1, client2, createClients } from './prepare';
import { Group, IDENTIFIER, InteractionRequest, MULTISIG_IXN, MultisigIxnBuilder, OperationType, get_identifier_by_name, get_ixn_request, get_oobi, interact_identifier, invoke_lookup, list_operations, mark_notification, send_exchange, wait_notification, wait_operation } from "../src/keri/signify";
import { GROUP1 } from '../src/keri/config';
import { debug_json } from '../src/util/helper';

beforeAll(createClients);

describe("Multisig-Interact", () => {
    test("step1", async () => {
        let interactionRequest: InteractionRequest = {};
        let interactionResponse = await interact_identifier(client1, GROUP1, interactionRequest);
        let builder = await MultisigIxnBuilder.create(client1);
        let ixnRequest = await builder.buildMultisigIxnRequest(interactionResponse);
        let ixnResponse = await send_exchange(client1, ixnRequest);
    });
    test("step2", async () => {
        let n = await wait_notification(client2, MULTISIG_IXN);
        expect(n).not.toBeNull();
        let builder = await MultisigIxnBuilder.create(client2);
        for await (let [name, data] of builder.acceptGroupIxnNotification(n)) {
            let interactionResponse = await interact_identifier(client2, name, data);
            let ixnRequest = await builder.buildMultisigIxnRequest(interactionResponse);
            let ixnResponse = await send_exchange(client2, ixnRequest);
        }
        // let ixnRequest = await get_ixn_request(client2, n);
        // for (let ixn of ixnRequest) {
        //     let group_id = ixn.exn.a.gid;
        //     let res = await invoke_lookup(client2, { type: [IDENTIFIER], id: [group_id] });
        //     expect(res).toHaveLength(1);
        //     expect(res[0].name).toEqual(GROUP1);
        // }
        mark_notification(client2, n);
    });
    test("step3", async () => {
        let n = await wait_notification(client1, MULTISIG_IXN);
        let builder = await MultisigIxnBuilder.create(client2);
        for await (let [name, data] of builder.acceptGroupIxnNotification(n)) {
        }
        mark_notification(client1, n);
    });
    test("step4", async () => {
        let group_id = await get_identifier_by_name(client1, GROUP1);
        let op: OperationType = { name: `group.${group_id}` };
        await wait_operation(client1, op);
    });
    test("step5", async () => {
        let group_id = await get_identifier_by_name(client2, GROUP1);
        let op: OperationType = { name: `group.${group_id}` };
        await wait_operation(client2, op);
    });
    test("oobi", async () => {
        await get_oobi(client1, GROUP1);
    });
});
