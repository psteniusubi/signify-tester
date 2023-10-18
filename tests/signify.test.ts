import { describe, expect, test } from '@jest/globals';
import { Agent, Authenticater, Controller, KeyManager, SignifyClient } from 'signify-ts';
import { add_endRole, create_single_identifier, get_contact, get_endRoles, get_identifier, get_oobi, has_endRole, resolve_oobi } from "../src/keri/signify";
import { connect_or_boot, getLocalConfig } from "../src/keri/config";
import { json2string } from '../src/util/helper';

const config = getLocalConfig();
const CLIENT1 = "client1";
const CLIENT2 = "client2";
const NAME1 = "name1";
const MEMBER1 = "member1";
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
            let r = await get_contact(client2, MEMBER1);
            if (r.oobi !== oobi.oobis[0]) {
                await resolve_oobi(client2, MEMBER1, oobi.oobis[0]);
            }
        } catch {
            await resolve_oobi(client2, MEMBER1, oobi.oobis[0]);
        }
    });
    test("oobi2", async () => {
        let oobi = await get_oobi(client2, NAME1, "agent");
        try {
            let r = await get_contact(client1, MEMBER1);
            if (r.oobi !== oobi.oobis[0]) {
                await resolve_oobi(client2, MEMBER1, oobi.oobis[0]);
            }
        } catch {
            await resolve_oobi(client1, MEMBER1, oobi.oobis[0]);
        }
    });
});
