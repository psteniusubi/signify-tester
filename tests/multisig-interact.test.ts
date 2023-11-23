import { describe, test } from '@jest/globals';
import { client1, client2, createClients } from './prepare';
import { AnchorRequest, MULTISIG_IXN, MultisigIxnBuilder, OperationType, get_contact_by_name, get_identifier_by_name, get_oobi, interact_identifier, mark_notification, send_exchange, wait_notification, wait_operation } from "../src/keri/signify";
import { CONTACT3, GROUP1 } from '../src/keri/config';

beforeAll(createClients);

describe("Multisig-Interact", () => {
    test("step1", async () => {
        let id = await get_contact_by_name(client1, CONTACT3);
        let interactionRequest: AnchorRequest = {
            i: id,
            s: 0,
            d: id
        };
        let interactionResponse = await interact_identifier(client1, GROUP1, interactionRequest);
        let builder = await MultisigIxnBuilder.create(client1);
        let ixnRequest = await builder.buildMultisigIxnRequest(interactionResponse);
        let ixnResponse = await send_exchange(client1, ixnRequest);
    });
    test("step2", async () => {
        let n = await wait_notification(client2, MULTISIG_IXN);
        let builder = await MultisigIxnBuilder.create(client2);
        for await (let [name, data] of builder.acceptGroupIxnNotification(n)) {
            let interactionResponse = await interact_identifier(client2, name, data);
            let ixnRequest = await builder.buildMultisigIxnRequest(interactionResponse);
            let ixnResponse = await send_exchange(client2, ixnRequest);
        }
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
