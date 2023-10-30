import { describe, test } from '@jest/globals';
import { SignifyClient } from 'signify-ts';
import { AGENT, AddEndRoleBuilder, AddEndRoleRequest, MultisigIcpBuilder, add_endRole, create_identifier, create_single_identifier, get_contact, get_identifier, get_oobi, has_endRole, resolve_oobi, wait_notification, wait_operation, CreateIdentifierRequest, MultisigIcpRequest, Group, Identifier, delete_notification, list_operations, list_notifications, get_notifications, get_group_request, UNREAD_NOTIFICATION, IdentifierType, invoke_lookup, IDENTIFIER, CONTACT } from "../src/keri/signify";
import { Configuration, connect_or_boot, getLocalConfig, NAME1, CONTACT1, GROUP1, CONTACT2, CONTACT3 } from "../src/keri/config";
import { MULTISIG_ICP, MULTISIG_RPY, send_exchange } from '../src/keri/signify';
import { debug_json } from '../src/util/helper';

const CLIENT1 = "client1";
const CLIENT2 = "client2";
const CLIENT3 = "client3";

export let config: Configuration;
export let client1: SignifyClient;
export let client2: SignifyClient;
export let client3: SignifyClient;

export async function createClients() {
    config = await getLocalConfig();
    let tasks = [
        connect_or_boot(config, CLIENT1),
        connect_or_boot(config, CLIENT2),
        connect_or_boot(config, CLIENT3)
    ];
    [client1, client2, client3] = await Promise.all(tasks);
}

async function exist_identifier(client: SignifyClient, alias: string): Promise<boolean> {
    let r = await invoke_lookup(client, { type: [IDENTIFIER], name: [alias] });
    if (r.length < 1) return false;
    return r[0].type === IDENTIFIER && r[0].name === alias;
}

async function exist_contact(client: SignifyClient, alias: string): Promise<boolean> {
    let r = await invoke_lookup(client, { type: [CONTACT], name: [alias] });
    if (r.length < 1) return false;
    return r[0].type === CONTACT && r[0].name === alias;
}

async function get_or_create_identifier(client: SignifyClient, alias: string): Promise<string[]> {
    if (await exist_identifier(client, alias)) {
        if (!has_endRole(client, alias, AGENT, client.agent?.pre)) {
            let req: AddEndRoleRequest = {
                alias: alias,
                role: AGENT,
                eid: client.agent?.pre
            };
            let r = await add_endRole(client, req);
            await wait_operation(client, r.op);
        }
    } else {
        await create_single_identifier(client, config, alias, undefined);
    }
    let t: IdentifierType = await get_identifier(client, alias);
    expect(t).toHaveProperty("state");
    expect(t).not.toHaveProperty("group");
    let oobi = await get_oobi(client, alias, AGENT);
    return [t.prefix, oobi.oobis[0]];
}

async function get_or_create_contact(client: SignifyClient, alias: string, oobi: string): Promise<void> {
    if (await exist_contact(client, alias)) {
        let r = await get_contact(client, alias);
        if (r.oobi !== oobi) {
            await resolve_oobi(client, alias, oobi);
        }
    } else {
        await resolve_oobi(client, alias, oobi);
    }
}

export let name1_id: string, name1_oobi: string;
export let name2_id: string, name2_oobi: string;
export let name3_id: string, name3_oobi: string;

export async function createIdentifiers() {
    let tasks = [
        get_or_create_identifier(client1, NAME1),
        get_or_create_identifier(client2, NAME1),
        get_or_create_identifier(client3, NAME1),
    ];
    let res = await Promise.all(tasks);
    [name1_id, name1_oobi] = res[0];
    [name2_id, name2_oobi] = res[1];
    [name3_id, name3_oobi] = res[2];
}

export async function createContacts() {
    let tasks = [
        get_or_create_contact(client1, CONTACT2, name2_oobi),
        get_or_create_contact(client1, CONTACT3, name3_oobi),
        get_or_create_contact(client2, CONTACT1, name1_oobi),
        get_or_create_contact(client2, CONTACT3, name3_oobi),
        get_or_create_contact(client3, CONTACT1, name1_oobi),
        get_or_create_contact(client3, CONTACT2, name2_oobi),
    ];
    await Promise.all(tasks);
}

beforeAll(createClients);
beforeAll(createIdentifiers);
beforeAll(createContacts);

describe("CreateIdentifiers", () => {
    test("test1", async () => {
        expect(name1_id).not.toBeNull();
        expect(name2_id).not.toBeNull();
        expect(name3_id).not.toBeNull();
    });
});

describe("SignifyClient", () => {
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
        await delete_notification(client1, n);
        n = await wait_notification(client1, MULTISIG_RPY);
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
        // check results
        let operations = await list_operations(client1);
        debug_json("list_operations", operations);
        expect(operations.length).toBe(0);
        for await (let note of get_notifications(client1, UNREAD_NOTIFICATION)) {
            let r = await get_group_request(client1, note);
            expect(r).toHaveLength(0);
        }
    });
    test("client2", async () => {
        // check results
        let operations = await list_operations(client2);
        debug_json("list_operations", operations);
        expect(operations.length).toBe(0);
        for await (let note of get_notifications(client2, UNREAD_NOTIFICATION)) {
            let r = await get_group_request(client2, note);
            expect(r).toHaveLength(0);
        }
    });
    test("client3", async () => {
        // oobi group1 to client3
        let oobi = await get_oobi(client1, GROUP1, AGENT);
        await resolve_oobi(client3, "group1", oobi.oobis[0]);
    });
});
