import { describe, test } from '@jest/globals';
import { AGENT, AddEndRoleBuilder, MultisigIcpBuilder, add_endRole, create_identifier, get_oobi, resolve_oobi, wait_notification, wait_operation, CreateIdentifierRequest, MultisigIcpRequest, Group, Identifier, delete_notification, list_operations, get_notifications, get_group_request, UNREAD_NOTIFICATION, get_endRoles, Contact, has_endRole, get_agentIdentifier, get_icp_request, get_rpy_request } from "../src/keri/signify";
import { NAME1, GROUP1, CONTACT2 } from "../src/keri/config";
import { MULTISIG_ICP, MULTISIG_RPY, send_exchange } from '../src/keri/signify';
import { debug_json } from '../src/util/helper';
import { createClients, createIdentifiers, createContacts, config, client1, client2, client3, name2_id } from './prepare';

beforeAll(createClients);
beforeAll(createIdentifiers);
beforeAll(createContacts);

describe("MultisigIcp", () => {
    test("group1a", async () => {
        // lead multisig inception
        // contact2 is name1 on client2
        let builder = await MultisigIcpBuilder.create(client1, GROUP1, NAME1, [CONTACT2]);
        let createIdentifierRequest: CreateIdentifierRequest = await builder.buildCreateIdentifierRequest(config);
        expect(createIdentifierRequest.mhab?.name).toStrictEqual(NAME1);
        let createIdentifierResponse = await create_identifier(client1, builder.alias, createIdentifierRequest);
        let icpRequest: MultisigIcpRequest = await builder.buildMultisigIcpRequest(createIdentifierRequest, createIdentifierResponse);
        expect(icpRequest.sender_id?.name).toStrictEqual(NAME1);
        let icpResponse = await send_exchange(client1, icpRequest);
    });
    test("group2", async () => {
        // wait for icp notification from contact1 to name1 (client1 -> client2)
        let n = await wait_notification(client2, MULTISIG_ICP);
        let builder = await MultisigIcpBuilder.create(client2, GROUP1);
        for await (let createIdentifierRequest of builder.acceptGroupIcpNotification(n)) {
            expect(createIdentifierRequest.mhab?.name).toStrictEqual(NAME1);
            let createIdentifierResponse = await create_identifier(client2, builder.alias, createIdentifierRequest);
            let icpRequest = await builder.buildMultisigIcpRequest(createIdentifierRequest, createIdentifierResponse);
            expect(icpRequest.sender_id?.name).toStrictEqual(NAME1);
            let icpResponse = await send_exchange(client2, icpRequest);
        }
        await delete_notification(client2, n);
    });
    test("group1b", async () => {
        // wait for icp notification from contact2 to name1 (client2 -> client1)
        let n = await wait_notification(client1, MULTISIG_ICP);
        let icp = await get_icp_request(client1, n);
        expect(icp).toHaveLength(1);
        expect(icp[0].exn.i).toStrictEqual(name2_id);
        // TODO: check notification contents
        delete_notification(client1, n);
    });
    test("group3", async () => {
        // multisig inception completed
        let identifier = await Identifier.create(client1, GROUP1);
        await wait_operation(client1, { name: `group.${identifier.getId()}` });
        let group = await Group.create(client1, GROUP1);
        let members = group.members;
        let ids = members.signing.map(i => i.aid);
        let lead_id = group.getIdentifier().group?.mhab;
        let n = ids.indexOf(lead_id!.prefix);
        expect(n).toBe(0);
    })
    test("group4", async () => {
        // multisig inception completed
        let identifier = await Identifier.create(client2, GROUP1);
        await wait_operation(client2, { name: `group.${identifier.getId()}` });
        let group = await Group.create(client2, GROUP1);
        let members = group.members;
        let ids = members.signing.map(i => i.aid);
        let lead_id = group.getIdentifier().group?.mhab;
        let n = ids.indexOf(lead_id!.prefix);
        expect(n).toBe(1);
    })
    test("endrole1a", async () => {
        // lead end role authorization
        let builder = await AddEndRoleBuilder.create(client1, GROUP1);
        for await (let addEndRoleRequest of builder.buildAddEndRoleRequest()) {
            let addEndRoleResponse = await add_endRole(client1, addEndRoleRequest);
            let rpyRequest = await builder.buildMultisigRpyRequest(addEndRoleRequest, addEndRoleResponse);
            expect(rpyRequest.sender).toStrictEqual(NAME1);
            let rpyResponse = await send_exchange(client1, rpyRequest);
        }
    });
    test("endrole2a", async () => {
        // wait for rpy notification from contact1 to name1 (client1 -> client2)
        let builder = await AddEndRoleBuilder.create(client2);
        let n = await wait_notification(client2, MULTISIG_RPY);
        for await (let addEndRoleRequest of builder.acceptGroupRpyNotification(n)) {
            expect(addEndRoleRequest.alias).toStrictEqual(GROUP1);
            let addEndRoleResponse = await add_endRole(client2, addEndRoleRequest);
            let rpyRequest = await builder.buildMultisigRpyRequest(addEndRoleRequest, addEndRoleResponse);
            expect(rpyRequest.sender).toStrictEqual(NAME1);
            let rpyResponse = await send_exchange(client2, rpyRequest);
        }
        await delete_notification(client2, n);
    });
    test("endrole2b", async () => {
        // wait for rpy notification from contact1 to name1 (client1 -> client2)
        let builder = await AddEndRoleBuilder.create(client2);
        let n = await wait_notification(client2, MULTISIG_RPY);
        for await (let addEndRoleRequest of builder.acceptGroupRpyNotification(n)) {
            expect(addEndRoleRequest.alias).toStrictEqual(GROUP1);
            let addEndRoleResponse = await add_endRole(client2, addEndRoleRequest);
            let rpyRequest = await builder.buildMultisigRpyRequest(addEndRoleRequest, addEndRoleResponse);
            expect(rpyRequest.sender).toStrictEqual(NAME1);
            let rpyResponse = await send_exchange(client2, rpyRequest);
        }
        await delete_notification(client2, n);
    });
    test("endrole1b", async () => {
        // wait for rpy notification from contact2 to name1 (client2 -> client1)
        let n = await wait_notification(client1, MULTISIG_RPY);
        let rpy = await get_rpy_request(client1, n);
        expect(rpy).toHaveLength(1);
        expect(rpy[0].exn.i).toStrictEqual(name2_id);
        // TODO: check notification contents
        await delete_notification(client1, n);
        n = await wait_notification(client1, MULTISIG_RPY);
        rpy = await get_rpy_request(client1, n);
        expect(rpy).toHaveLength(1);
        expect(rpy[0].exn.i).toStrictEqual(name2_id);
        // TODO: check notification contents
        await delete_notification(client1, n);
    });
    test("endrole3", async () => {
        // end role authorization completed
        let builder = await AddEndRoleBuilder.create(client1, GROUP1);
        let group = await builder._group!;
        for await (let eid of builder.getEids()) {
            await wait_operation(client1, { name: `endrole.${group.getId()}.agent.${eid}` });
        }
    });
    test("endrole4", async () => {
        // end role authorization completed
        let builder = await AddEndRoleBuilder.create(client2, GROUP1);
        let group = await builder._group!;
        for await (let eid of builder.getEids()) {
            await wait_operation(client2, { name: `endrole.${group.getId()}.agent.${eid}` });
        }
    });
    test("client1", async () => {
        // check pending operations
        let operations = await list_operations(client1);
        debug_json("list_operations", operations);
        expect(operations).toHaveLength(0);
        // check notifications
        for await (let note of get_notifications(client1, UNREAD_NOTIFICATION)) {
            let r = await get_group_request(client1, note);
            expect(r).toHaveLength(0);
            expect(note).toBeUndefined();
        }
        // check end roles
        expect(await has_endRole(client1, GROUP1, AGENT, get_agentIdentifier(client1))).toBeTruthy();
        expect(await has_endRole(client1, GROUP1, AGENT, get_agentIdentifier(client2))).toBeTruthy();
        expect(await get_endRoles(client1, GROUP1)).toHaveLength(2);
        // key state
        let group = await Group.create(client1, GROUP1);
        expect(await group.getKeyState()).toBeDefined();
    });
    test("client2", async () => {
        // check pending operations
        let operations = await list_operations(client2);
        debug_json("list_operations", operations);
        expect(operations).toHaveLength(0);
        // check notifications
        for await (let note of get_notifications(client2, UNREAD_NOTIFICATION)) {
            let r = await get_group_request(client2, note);
            expect(r).toHaveLength(0);
            expect(note).toBeUndefined();
        }
        // check end roles
        expect(await has_endRole(client2, GROUP1, AGENT, get_agentIdentifier(client1))).toBeTruthy();
        expect(await has_endRole(client2, GROUP1, AGENT, get_agentIdentifier(client2))).toBeTruthy();
        expect(await get_endRoles(client2, GROUP1)).toHaveLength(2);
        // key state
        let group = await Group.create(client2, GROUP1);
        expect(await group.getKeyState()).toBeDefined();
    });
    test("client3", async () => {
        // oobi group1 to client3
        let oobi = await get_oobi(client1, GROUP1, AGENT);
        await resolve_oobi(client3, "ex-group1", oobi.oobis[0]);
        let contact = await Contact.create(client3, "ex-group1");
        expect(await contact.getKeyState()).toBeDefined();
    });
});
