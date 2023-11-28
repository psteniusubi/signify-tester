import { describe, test } from '@jest/globals';
import { AGENT, AID, AddEndRoleBuilder, AnchorRequest, CreateIdentifierRequest, CreateIdentifierResponse, ExchangeRequest, ExchangeResponse, MULTISIG_ICP, MULTISIG_RPY, MultisigIcpBuilder, MultisigIcpRequest, OperationType, add_endRole, create_identifier, delete_notification, get_oobi, interact_identifier, list_notifications, list_operations, mark_notification, send_exchange, wait_notification, wait_operation } from '../src/keri/signify';
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

describe("group-delegate", () => {
    let group_id: AID | undefined = undefined;
    test("step1", async () => {
        // lead group icp on client1
        let builder = await MultisigIcpBuilder.create(client1, GROUP1, NAME1, [CONTACT2]);
        let createIdentifierRequest: CreateIdentifierRequest = await builder.buildCreateIdentifierRequest(config);
        createIdentifierRequest.toad = undefined;
        createIdentifierRequest.wits = undefined;
        createIdentifierRequest.delpre = name3_id;
        let createIdentifierResponse: CreateIdentifierResponse = await create_identifier(client1, builder.alias, createIdentifierRequest);
        group_id = createIdentifierResponse.serder.pre as AID;
        expect(`group.${group_id}`).toEqual(createIdentifierResponse.op.name);
        // send /multisig/icp from client1 to client2
        let icpRequest: MultisigIcpRequest = await builder.buildMultisigIcpRequest(createIdentifierRequest, createIdentifierResponse);
        expect(icpRequest.sender?.name).toEqual(NAME1);
        let icpResponse: ExchangeResponse = await send_exchange(client1, icpRequest);
    });
    test("step2", async () => {
        // wait for /multisig/icp from client1 to client2
        let n = await wait_notification(client2, MULTISIG_ICP);
        let builder = await MultisigIcpBuilder.create(client2, GROUP1);
        for (let createIdentifierRequest of await builder.acceptGroupIcpNotification(n)) {
            expect(createIdentifierRequest.mhab?.name).toStrictEqual(NAME1);
            expect(createIdentifierRequest.delpre).toBe(name3_id);
            let createIdentifierResponse = await create_identifier(client2, builder.alias, createIdentifierRequest);
            // send /multisig/icp from client2 to client1
            let icpRequest = await builder.buildMultisigIcpRequest(createIdentifierRequest, createIdentifierResponse);
            expect(icpRequest.sender?.name).toStrictEqual(NAME1);
            let icpResponse = await send_exchange(client2, icpRequest);
        }
        await mark_notification(client2, n);
    });
    test("step3", async () => {
        // wait for /multisig/icp from client2 to client1
        let n = await wait_notification(client1, MULTISIG_ICP);
        let builder = await MultisigIcpBuilder.create(client1, GROUP1);
        for (let createIdentifierRequest of await builder.acceptGroupIcpNotification(n)) {
            expect(createIdentifierRequest.mhab?.name).toStrictEqual(NAME1);
            expect(createIdentifierRequest.delpre).toBe(name3_id);
        }
        await mark_notification(client1, n);
    });
    test("step4", async () => {
        // anchor delegate on client3
        let anchor: AnchorRequest = {
            i: group_id!,
            s: 0,
            d: group_id!
        };
        let res1 = await interact_identifier(client3, NAME1, anchor);
        await wait_operation(client3, res1.op);
    });
    test("step5", async () => {
        // wait for group icp operation on client1
        let op: OperationType = { name: `group.${group_id}` };
        await wait_operation(client1, op);
    });
    test("step6", async () => {
        // wait for group icp operation on client2
        let op: OperationType = { name: `group.${group_id}` };
        await wait_operation(client2, op);
    });
    test("step7", async () => {
        // lead end role authorization on client1
        let builder = await AddEndRoleBuilder.create(client1, GROUP1);
        for (let addEndRoleRequest of await builder.buildAddEndRoleRequest()) {
            let addEndRoleResponse = await add_endRole(client1, addEndRoleRequest);
            let rpyRequest = await builder.buildMultisigRpyRequest(addEndRoleRequest, addEndRoleResponse);
            expect(rpyRequest.sender?.name).toStrictEqual(NAME1);
            // send /multisig/rpy from client1 to client2
            let rpyResponse = await send_exchange(client1, rpyRequest);
        }
    });
    test("step8", async () => {
        // wait for first /multisig/icp from client1 to client2
        let builder = await AddEndRoleBuilder.create(client2);
        let n = await wait_notification(client2, MULTISIG_RPY);
        for (let addEndRoleRequest of await builder.acceptGroupRpyNotification(n)) {
            expect(addEndRoleRequest.alias).toStrictEqual(GROUP1);
            let addEndRoleResponse = await add_endRole(client2, addEndRoleRequest);
            let rpyRequest = await builder.buildMultisigRpyRequest(addEndRoleRequest, addEndRoleResponse);
            expect(rpyRequest.sender?.name).toStrictEqual(NAME1);
            // send /multisig/rpy from client2 to client1
            let rpyResponse = await send_exchange(client2, rpyRequest);
        }
        await mark_notification(client2, n);
    });
    test("step9", async () => {
        // wait for second /multisig/icp from client1 to client2
        let builder = await AddEndRoleBuilder.create(client2);
        let n = await wait_notification(client2, MULTISIG_RPY);
        for (let addEndRoleRequest of await builder.acceptGroupRpyNotification(n)) {
            expect(addEndRoleRequest.alias).toStrictEqual(GROUP1);
            let addEndRoleResponse = await add_endRole(client2, addEndRoleRequest);
            let rpyRequest = await builder.buildMultisigRpyRequest(addEndRoleRequest, addEndRoleResponse);
            expect(rpyRequest.sender?.name).toStrictEqual(NAME1);
            // send /multisig/rpy from client2 to client1
            let rpyResponse = await send_exchange(client2, rpyRequest);
        }
        await mark_notification(client2, n);
    });
    test("step10", async () => {
        let builder = await AddEndRoleBuilder.create(client1);
        // wait for first /multisig/icp from client2 to client1
        let n = await wait_notification(client1, MULTISIG_RPY);
        for (let addEndRoleRequest of await builder.acceptGroupRpyNotification(n)) {
            expect(addEndRoleRequest.alias).toStrictEqual(GROUP1);
        }
        await mark_notification(client1, n);
    });
    test("step11", async () => {
        let builder = await AddEndRoleBuilder.create(client1);
        // wait for second /multisig/icp from client2 to client1
        let n = await wait_notification(client1, MULTISIG_RPY);
        for (let addEndRoleRequest of await builder.acceptGroupRpyNotification(n)) {
            expect(addEndRoleRequest.alias).toStrictEqual(GROUP1);
        }
        await mark_notification(client1, n);
    });
    test("step12", async () => {
        // wait for end role operation on client1
        let builder = await AddEndRoleBuilder.create(client1, GROUP1);
        let group = (await builder.getGroup())!;
        for (let eid of await builder.getEids()) {
            await wait_operation(client1, { name: `endrole.${group.getId()}.agent.${eid}` });
        }
    });
    test("step13", async () => {
        // wait for end role operation on client2
        let builder = await AddEndRoleBuilder.create(client2, GROUP1);
        let group = (await builder.getGroup())!;
        for (let eid of await builder.getEids()) {
            await wait_operation(client2, { name: `endrole.${group.getId()}.agent.${eid}` });
        }
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
