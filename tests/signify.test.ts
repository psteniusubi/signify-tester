import { describe, expect, test } from '@jest/globals';
import { Agent, Authenticater, Controller, KeyManager, SignifyClient } from 'signify-ts';
import { Contact, GroupBuilder, Identifier, OperationType, add_endRole, create_group_identifier, create_identifier, create_single_identifier, get_contact, get_endRoles, get_group_request, get_identifier, get_oobi, has_endRole, list_notifications, resolve_oobi } from "../src/keri/signify";
import { connect_or_boot, getLocalConfig } from "../src/keri/config";
import { json2string, wait_async_operation } from '../src/util/helper';
import { send_exchange } from '../src/keri/Exchange';

const config = getLocalConfig();
const CLIENT1 = "client1";
const CLIENT2 = "client2";
const NAME1 = "name1";
const CONTACT1 = "contact1";
const GROUP1 = "group1";

describe("SignifyClient", () => {
    let client1: SignifyClient;
    let client2: SignifyClient;
    beforeAll(async () => {
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
            if (!has_endRole(client1, NAME1, "agent", client1.agent?.pre)) {
                await add_endRole(client1, NAME1, "agent", client1.agent?.pre);
            }
        } catch {
            await create_single_identifier(client1, config, NAME1, undefined);
            await get_identifier(client1, NAME1);
        }
    });
    test("name2", async () => {
        try {
            await get_identifier(client2, NAME1);
            if (!has_endRole(client2, NAME1, "agent", client2.agent?.pre)) {
                await add_endRole(client2, NAME1, "agent", client2.agent?.pre);
            }
        } catch {
            await create_single_identifier(client2, config, NAME1, undefined);
            await get_identifier(client2, NAME1);
        }
    });
    test("oobi1", async () => {
        let oobi = await get_oobi(client1, NAME1, "agent");
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
        let oobi = await get_oobi(client2, NAME1, "agent");
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
        let builder = await GroupBuilder.create(client1, GROUP1, NAME1, [CONTACT1]);
        let request = await builder.buildCreateIdentifierRequest(config);
        console.debug(json2string(request));
        let response = await create_identifier(client1, builder.alias, request);
        console.debug(json2string(response.op));
        let exn = await builder.buildExchangeRequest(request, response);
        console.debug(json2string(exn));
        await send_exchange(client1, exn);
    });
    test("group2", async () => {
        let n = await wait_async_operation(async () => {
            let res = await list_notifications(client2);
            let n = res.notes.filter(note => note.a.r === "/multisig/icp" && note.r === false).pop();
            return n;
        });
        expect(n).not.toBeNull();
        console.debug(json2string(n));
        let builder = await GroupBuilder.accept(client2, GROUP1, NAME1);
        let request = await builder.acceptCreateIdentifierRequest(n!);
        console.debug(json2string(request));
        let response = await create_identifier(client2, builder.alias, request);
        console.debug(json2string(response.op));
        let exn = await builder.buildExchangeRequest(request, response);
        console.debug(json2string(exn));
        await send_exchange(client2, exn);
    });
});
