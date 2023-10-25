import { describe, expect, test } from '@jest/globals';
import { Agent, Authenticater, Controller, KeyManager, SignifyClient } from 'signify-ts';
import { AGENT, AddEndRoleBuilder, AddEndRoleRequest, MultisigIcpBuilder, Identifier, add_endRole, create_identifier, create_single_identifier, get_contact, get_identifier, get_oobi, has_endRole, mark_notification, resolve_oobi, wait_notification, wait_operation } from "../src/keri/signify";
import { Configuration, connect_or_boot, getLocalConfig } from "../src/keri/config";
import { MULTISIG_ICP, MULTISIG_RPY, send_exchange } from '../src/keri/signify';

const CLIENT1 = "client1";
const CLIENT2 = "client2";
const NAME1 = "name1";
const CONTACT1 = "contact1";
const GROUP1 = "group1";

describe("SignifyClient", () => {
    let config: Configuration;
    let client1: SignifyClient;
    let client2: SignifyClient;
    beforeAll(async () => {
        config = await getLocalConfig();
        let tasks = [
            connect_or_boot(config, CLIENT1),
            connect_or_boot(config, CLIENT2)
        ];
        [client1, client2] = await Promise.all(tasks);
    })
    test("client1", async () => {
        expect(client1).toBeInstanceOf(SignifyClient);
        expect(client1.agent).toBeInstanceOf(Agent);
        expect(client1.authn).toBeInstanceOf(Authenticater);
        expect(client1.controller).toBeInstanceOf(Controller);
        expect(client1.manager).toBeInstanceOf(KeyManager);
    });
    test("name1", async () => {
        try {
            await get_identifier(client1, NAME1);
            if (!has_endRole(client1, NAME1, AGENT, client1.agent?.pre)) {
                let req: AddEndRoleRequest = {
                    alias: NAME1,
                    role: AGENT,
                    eid: client1.agent?.pre
                };
                let r = await add_endRole(client1, req);
                await wait_operation(client1, r.op);
            }
        } catch {
            await create_single_identifier(client1, config, NAME1, undefined);
            await get_identifier(client1, NAME1);
        }
    });
    test("name2", async () => {
        try {
            await get_identifier(client2, NAME1);
            if (!has_endRole(client2, NAME1, AGENT, client2.agent?.pre)) {
                let req: AddEndRoleRequest = {
                    alias: NAME1,
                    role: AGENT,
                    eid: client2.agent?.pre
                };
                let r = await add_endRole(client2, req);
                await wait_operation(client2, r.op);
            }
        } catch {
            await create_single_identifier(client2, config, NAME1, undefined);
            await get_identifier(client2, NAME1);
        }
    });
    test("oobi1", async () => {
        let oobi = await get_oobi(client1, NAME1, AGENT);
        try {
            let r = await get_contact(client2, CONTACT1);
            if (r.oobi !== oobi.oobis[0]) {
                await resolve_oobi(client2, CONTACT1, oobi.oobis[0]);
            }
        } catch {
            await resolve_oobi(client2, CONTACT1, oobi.oobis[0]);
        }
    });
    test("oobi2", async () => {
        let oobi = await get_oobi(client2, NAME1, AGENT);
        try {
            let r = await get_contact(client1, CONTACT1);
            if (r.oobi !== oobi.oobis[0]) {
                await resolve_oobi(client2, CONTACT1, oobi.oobis[0]);
            }
        } catch {
            await resolve_oobi(client1, CONTACT1, oobi.oobis[0]);
        }
    });
    test("group1", async () => {
        let builder = await MultisigIcpBuilder.create(client1, GROUP1, NAME1, [CONTACT1]);
        let request = await builder.buildCreateIdentifierRequest(config);
        let response = await create_identifier(client1, builder.alias, request);
        let exn = await builder.buildMultisigIcpRequest(request, response);
        await send_exchange(client1, exn);
    });
    test("group2", async () => {
        let n = await wait_notification(client2, MULTISIG_ICP);
        let builder = await MultisigIcpBuilder.create(client2, GROUP1, NAME1, []);
        for await (let request of builder.acceptCreateIdentifierRequest(n)) {
            let response = await create_identifier(client2, builder.alias, request);
            let exn = await builder.buildMultisigIcpRequest(request, response);
            await send_exchange(client2, exn);
        }
        await mark_notification(client2, n);
    });
    test("group3", async () => {
        let group = await Identifier.create(client1, GROUP1);
        await wait_operation(client1, { name: `group.${group.getId()}` });
    })
    test("group4", async () => {
        let group = await Identifier.create(client2, GROUP1);
        await wait_operation(client2, { name: `group.${group.getId()}` });
    })
    test("endrole1", async () => {
        let builder = await AddEndRoleBuilder.create(client1, GROUP1, NAME1);
        for await (let addEndRoleRequest of builder.buildAddEndRoleRequest()) {
            let addEndRoleResponse = await add_endRole(client1, addEndRoleRequest);
            let rpyRequest = await builder.buildMultisigRpyRequest(addEndRoleRequest, addEndRoleResponse);
            let rpyResponse = await send_exchange(client1, rpyRequest);
        }
    });
    test("endrole2a", async () => {
        let builder = await AddEndRoleBuilder.create(client2, GROUP1, NAME1);
        let n = await wait_notification(client2, MULTISIG_RPY);
        for await (let addEndRoleRequest of builder.acceptAddEndRoleRequest(n)) {
            let addEndRoleResponse = await add_endRole(client2, addEndRoleRequest);
            let rpyRequest = await builder.buildMultisigRpyRequest(addEndRoleRequest, addEndRoleResponse);
            let rpyResponse = await send_exchange(client2, rpyRequest);
        }
        await mark_notification(client2, n);
    });
    test("endrole2b", async () => {
        let builder = await AddEndRoleBuilder.create(client2, GROUP1, NAME1);
        let n = await wait_notification(client2, MULTISIG_RPY);
        for await (let addEndRoleRequest of builder.acceptAddEndRoleRequest(n)) {
            let addEndRoleResponse = await add_endRole(client2, addEndRoleRequest);
            let rpyRequest = await builder.buildMultisigRpyRequest(addEndRoleRequest, addEndRoleResponse);
            let rpyResponse = await send_exchange(client2, rpyRequest);
        }
        await mark_notification(client2, n);
    });
    test("endrole3", async () => {
        let builder = await AddEndRoleBuilder.create(client1, GROUP1, NAME1);
        let group = await builder._group;
        for await (let eid of builder.getEids()) {
            await wait_operation(client1, { name: `endrole.${group.getId()}.agent.${eid}` });
        }
    });
    test("endrole4", async () => {
        let builder = await AddEndRoleBuilder.create(client2, GROUP1, NAME1);
        let group = await builder._group;
        for await (let eid of builder.getEids()) {
            await wait_operation(client2, { name: `endrole.${group.getId()}.agent.${eid}` });
        }
    });
});
