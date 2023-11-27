import { SignifyClient } from "signify-ts";
import { debug_json, set_fs_log } from "../src/util/helper";
import { client1, client2, config, createClients, createContacts, createIdentifiers } from "./prepare";
import { MultisigIcpBuilder, CreateIdentifierRequest, create_identifier, MultisigIcpRequest, send_exchange, wait_notification, MULTISIG_ICP, mark_notification, invoke_lookup, GroupIcpRequest, IDENTIFIER, get_icp_requests, list_operations, get_identifier_by_name, OperationType, wait_operation, AddEndRoleBuilder, add_endRole, MULTISIG_RPY, GroupRpyRequest, get_name_by_identifier, has_endRole, get_rpy_requests, get_oobi, AGENT } from "../src/keri/signify";
import { CONTACT1, CONTACT2, GROUP1, NAME1 } from "../src/keri/config";

beforeAll(() => set_fs_log(false));
beforeAll(createClients);
beforeAll(createIdentifiers);
beforeAll(createContacts);

async function lead_multisig_icp(client: SignifyClient) {
    // lead create multisig 
    let builder = await MultisigIcpBuilder.create(client, GROUP1, NAME1, [CONTACT2]);
    // create multisig
    let createIdentifierRequest: CreateIdentifierRequest = await builder.buildCreateIdentifierRequest(config);
    let createIdentifierResponse = await create_identifier(client, builder.alias, createIdentifierRequest);
    // send /multisig/icp 
    let icpRequest: MultisigIcpRequest = await builder.buildMultisigIcpRequest(createIdentifierRequest, createIdentifierResponse);
    let icpResponse = await send_exchange(client, icpRequest);
}

async function is_icp_done(client: SignifyClient, icp: GroupIcpRequest): Promise<boolean> {
    for (let i of await invoke_lookup(client, { type: [IDENTIFIER], id: [icp.exn.a.gid] })) {
        return true;
    }
    return false;
}

async function wait_multisig_icp(client: SignifyClient) {
    let builder = await MultisigIcpBuilder.create(client, GROUP1);
    // wait for /multisig/icp 
    let n = await wait_notification(client, MULTISIG_ICP);
    for (let icp of await get_icp_requests(client, n)) {
        if (await is_icp_done(client, icp)) {
            continue;
        }
        // join create multisig
        let createIdentifierRequest = await builder.acceptGroupIcpRequest(icp);
        let createIdentifierResponse = await create_identifier(client, builder.alias, createIdentifierRequest);
        // send /multisig/icp 
        let icpRequest = await builder.buildMultisigIcpRequest(createIdentifierRequest, createIdentifierResponse);
        let icpResponse = await send_exchange(client, icpRequest);
    }
    await mark_notification(client, n);
}

async function wait_multisig_icp_operation(client: SignifyClient) {
    let id = await get_identifier_by_name(client, GROUP1);
    let op: OperationType = { name: `group.${id}` };
    await wait_operation(client, op);
}

async function lead_multisig_rpy(client: SignifyClient) {
    // lead end role authorization 
    let builder = await AddEndRoleBuilder.create(client, GROUP1);
    // add endrole
    for (let addEndRoleRequest of await builder.buildAddEndRoleRequest()) {
        let addEndRoleResponse = await add_endRole(client, addEndRoleRequest);
        // send /multisig/rpy 
        let rpyRequest = await builder.buildMultisigRpyRequest(addEndRoleRequest, addEndRoleResponse);
        let rpyResponse = await send_exchange(client, rpyRequest);
    }
}

async function is_rpy_done(client: SignifyClient, rpy: GroupRpyRequest): Promise<boolean> {
    let alias = await get_name_by_identifier(client, rpy.exn.e.rpy.a.cid);
    return await has_endRole(client, alias, rpy.exn.e.rpy.a.role, rpy.exn.e.rpy.a.eid);
}

async function wait_multisig_rpy(client: SignifyClient) {
    let builder = await AddEndRoleBuilder.create(client);
    // wait for /multisig/rpy
    let n = await wait_notification(client, MULTISIG_RPY);
    for (let rpy of await get_rpy_requests(client, n)) {
        if (await is_rpy_done(client, rpy)) {
            continue;
        }
        // join end role authorization
        let addEndRoleRequest = await builder.acceptGroupRpyRequest(rpy);
        let addEndRoleResponse = await add_endRole(client, addEndRoleRequest);
        // send /multisig/rpy 
        let rpyRequest = await builder.buildMultisigRpyRequest(addEndRoleRequest, addEndRoleResponse);
        let rpyResponse = await send_exchange(client, rpyRequest);
    }
    await mark_notification(client, n);
}

async function wait_multisig_rpys(client: SignifyClient) {
    let builder = await AddEndRoleBuilder.create(client, GROUP1);
    for (let eid of await builder.getEids()) {
        await wait_multisig_rpy(client);
    }
}

async function wait_multisig_rpy_operation(client: SignifyClient) {
    let builder = await AddEndRoleBuilder.create(client, GROUP1);
    let group = await builder._group!;
    for (let eid of await builder.getEids()) {
        let op: OperationType = { name: `endrole.${group.getId()}.agent.${eid}` };
        await wait_operation(client, op);
    }
}

async function leader_icp(client: SignifyClient) {
    await lead_multisig_icp(client);
    await wait_multisig_icp(client);
    await wait_multisig_icp_operation(client);
}

async function member_icp(client: SignifyClient) {
    await wait_multisig_icp(client);
    await wait_multisig_icp_operation(client);
}

async function leader_rpy(client: SignifyClient) {
    await lead_multisig_rpy(client);
    await wait_multisig_rpys(client);
    await wait_multisig_rpy_operation(client);
}

async function member_rpy(client: SignifyClient) {
    await wait_multisig_rpys(client);
    await wait_multisig_rpy_operation(client);
}

async function leader(client: SignifyClient) {
    await leader_icp(client);
    await leader_rpy(client);
}

async function member(client: SignifyClient) {
    await member_icp(client);
    await member_rpy(client);
}

describe("multisig", () => {
    test("workflow", async () => {
        let tasks = [
            leader(client1),
            member(client2)
        ];
        await Promise.allSettled(tasks);
    }, 15000)
    test("oobi", async () => {
        let oobi1 = await get_oobi(client1, GROUP1, AGENT);
        expect(oobi1.oobis).toHaveLength(1);
        let oobi2 = await get_oobi(client2, GROUP1, AGENT);
        expect(oobi2.oobis).toHaveLength(1);
    });
    test("operations", async () => {
        debug_json("list_operations(client1)", await list_operations(client1));
        debug_json("list_operations(client2)", await list_operations(client2));
    });
});
