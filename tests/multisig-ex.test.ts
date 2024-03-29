import { SignifyClient } from "signify-ts";
import { debug_json, set_fs_log } from "../src/util/helper";
import { client1, client2, client3, config, createClients, createContacts, createIdentifiers } from "./prepare";
import { MultisigIcpBuilder, CreateIdentifierRequest, create_identifier, MultisigIcpRequest, send_exchange, wait_notification, MULTISIG_ICP, mark_notification, invoke_lookup, GroupIcpRequest, IDENTIFIER, get_icp_requests, list_operations, get_identifier_by_name, OperationType, wait_operation, AddEndRoleBuilder, add_endRole, MULTISIG_RPY, GroupRpyRequest, get_name_by_identifier, has_endRole, get_rpy_requests, get_oobi, AGENT } from "../src/keri/signify";
import { CONTACT2, CONTACT3, GROUP1, NAME1 } from "../src/keri/config";

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
    let group = (await builder.getGroup())!;
    for (let eid of await builder.getEids()) {
        let op: OperationType = { name: `endrole.${group.getId()}.agent.${eid}` };
        await wait_operation(client, op);
    }
}

class MultisigMemberController {
    static async createMember(client: SignifyClient, alias: string): Promise<MultisigMemberController> {
        return new MultisigMemberController(client, alias);
    }
    readonly client: SignifyClient;
    readonly alias: string;
    constructor(client: SignifyClient, alias: string) {
        this.client = client;
        this.alias = alias;
    }
    async join_icp() {
        let builder = await MultisigIcpBuilder.create(this.client, this.alias);
        // wait for /multisig/icp 
        let n = await wait_notification(this.client, MULTISIG_ICP);
        for (let icp of await get_icp_requests(this.client, n)) {
            if (await is_icp_done(this.client, icp)) {
                continue;
            }
            // join create multisig
            let createIdentifierRequest = await builder.acceptGroupIcpRequest(icp);
            let createIdentifierResponse = await create_identifier(this.client, builder.alias, createIdentifierRequest);
            // send /multisig/icp 
            let icpRequest = await builder.buildMultisigIcpRequest(createIdentifierRequest, createIdentifierResponse);
            let icpResponse = await send_exchange(this.client, icpRequest);
        }
        await mark_notification(this.client, n);
    }
    async wait_icp() {
        let id = await get_identifier_by_name(this.client, this.alias);
        let op: OperationType = { name: `group.${id}` };
        await wait_operation(this.client, op);
    }
    async icp() {
        await this.join_icp();
        await this.wait_icp();
    }
    async join_rpy() {
        let builder = await AddEndRoleBuilder.create(this.client);
        // wait for /multisig/rpy
        let n = await wait_notification(this.client, MULTISIG_RPY);
        for (let rpy of await get_rpy_requests(this.client, n)) {
            if (await is_rpy_done(this.client, rpy)) {
                continue;
            }
            // join end role authorization
            let addEndRoleRequest = await builder.acceptGroupRpyRequest(rpy);
            let addEndRoleResponse = await add_endRole(this.client, addEndRoleRequest);
            // send /multisig/rpy 
            let rpyRequest = await builder.buildMultisigRpyRequest(addEndRoleRequest, addEndRoleResponse);
            let rpyResponse = await send_exchange(this.client, rpyRequest);
        }
        await mark_notification(this.client, n);
    }
    async join_rpys() {
        let builder = await AddEndRoleBuilder.create(this.client, this.alias);
        for (let eid of await builder.getEids()) {
            await wait_multisig_rpy(this.client);
        }
    }
    async wait_rpy() {
        let builder = await AddEndRoleBuilder.create(this.client, this.alias);
        let group = (await builder.getGroup())!;
        for (let eid of await builder.getEids()) {
            let op: OperationType = { name: `endrole.${group.getId()}.agent.${eid}` };
            await wait_operation(this.client, op);
        }
    }
    async rpy() {
        await this.join_rpys();
        await this.wait_rpy();
    }
    async process() {
        await this.icp();
        await this.rpy();
    }
}

class MultisigLeadController extends MultisigMemberController {
    static async createLead(client: SignifyClient, alias: string, lead: string, members: string[]): Promise<MultisigLeadController> {
        return new MultisigLeadController(client, alias, lead, members);
    }
    readonly lead: string;
    readonly members: string[];
    constructor(client: SignifyClient, alias: string, lead: string, members: string[]) {
        super(client, alias);
        this.lead = lead;
        this.members = members;
    }
    async lead_icp() {
        // lead create multisig 
        let builder = await MultisigIcpBuilder.create(this.client, this.alias, this.lead, this.members);
        // create multisig
        let createIdentifierRequest: CreateIdentifierRequest = await builder.buildCreateIdentifierRequest(config);
        let createIdentifierResponse = await create_identifier(this.client, builder.alias, createIdentifierRequest);
        // send /multisig/icp 
        let icpRequest: MultisigIcpRequest = await builder.buildMultisigIcpRequest(createIdentifierRequest, createIdentifierResponse);
        let icpResponse = await send_exchange(this.client, icpRequest);
    }
    override async icp() {
        await this.lead_icp();
        await super.icp();
    }
    async lead_rpy() {
        // lead end role authorization 
        let builder = await AddEndRoleBuilder.create(this.client, this.alias);
        // add endrole
        for (let addEndRoleRequest of await builder.buildAddEndRoleRequest()) {
            let addEndRoleResponse = await add_endRole(this.client, addEndRoleRequest);
            // send /multisig/rpy 
            let rpyRequest = await builder.buildMultisigRpyRequest(addEndRoleRequest, addEndRoleResponse);
            let rpyResponse = await send_exchange(this.client, rpyRequest);
        }
    }
    override async rpy() {
        await this.lead_rpy();
        await super.rpy();
    }
}

async function leader_icp(client: SignifyClient) {
    let lead = await MultisigLeadController.createLead(client, GROUP1, NAME1, [CONTACT2]);
    await lead.icp();
    // await lead.lead_icp();
    // await lead.join_icp();
    // await lead.wait_icp();
    // await lead_multisig_icp(client);
    // await wait_multisig_icp(client);
    // await wait_multisig_icp_operation(client);
}

async function member_icp(client: SignifyClient) {
    let member = await MultisigMemberController.createMember(client, GROUP1);
    await member.icp();
    // await member.join_icp();
    // await member.wait_icp();
    // await wait_multisig_icp(client);
    // await wait_multisig_icp_operation(client);
}

async function leader_rpy(client: SignifyClient) {
    let lead = await MultisigLeadController.createLead(client, GROUP1, NAME1, [CONTACT2]);
    await lead.rpy();
    // await lead.lead_rpy();
    // await lead.join_rpys();
    // await lead.wait_rpy();
    // await lead_multisig_rpy(client);
    // await wait_multisig_rpys(client);
    // await wait_multisig_rpy_operation(client);
}

async function member_rpy(client: SignifyClient) {
    let member = await MultisigMemberController.createMember(client, GROUP1);
    await member.rpy();
    // await member.join_rpys();
    // await member.wait_rpy();
    // await wait_multisig_rpys(client);
    // await wait_multisig_rpy_operation(client);
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
    test.skip("icp", async () => {
        let tasks = [
            leader_icp(client1),
            member_icp(client2)
        ];
        await Promise.allSettled(tasks);
    }, 15000);
    test.skip("rpy", async () => {
        let tasks = [
            leader_rpy(client1),
            member_rpy(client2)
        ];
        await Promise.allSettled(tasks);
    }, 15000);
    test.skip("workflow", async () => {
        let tasks = [
            leader(client1),
            member(client2)
        ];
        await Promise.allSettled(tasks);
    }, 15000)
    test("workflow2", async () => {
        let lead = await MultisigLeadController.createLead(client1, GROUP1, NAME1, [CONTACT2]);
        let member1 = await MultisigMemberController.createMember(client2, GROUP1);
        let tasks = [
            lead.process(),
            member1.process(),
        ];
        await Promise.allSettled(tasks);
    }, 15000);
    test("workflow3", async () => {
        let lead = await MultisigLeadController.createLead(client1, GROUP1, NAME1, [CONTACT2, CONTACT3]);
        let member1 = await MultisigMemberController.createMember(client2, GROUP1);
        let member2 = await MultisigMemberController.createMember(client3, GROUP1);
        let tasks = [
            lead.process(),
            member1.process(),
            member2.process(),
        ];
        await Promise.allSettled(tasks);
    }, 15000);
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
