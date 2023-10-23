import { describe, expect, test } from '@jest/globals';
import { Agent, Authenticater, Controller, KeyManager, Siger, SignifyClient, d, messagize } from 'signify-ts';
import { CreateIdentifierRequest, GroupBuilder, Identifier, add_endRole, create_identifier, create_single_identifier, get_contact, get_identifier, get_members, get_oobi, has_endRole, list_notifications, resolve_oobi, wait_operation } from "../src/keri/signify";
import { connect_or_boot, getLocalConfig } from "../src/keri/config";
import { debug_json, wait_async_operation } from '../src/util/helper';
import { ExchangeRequest, MULTISIG_RPY, MultisigRpyEmbeds, MultisigRpyPayload, send_exchange } from '../src/keri/Exchange';

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
                let r = await add_endRole(client1, NAME1, "agent", client1.agent?.pre);
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
            if (!has_endRole(client2, NAME1, "agent", client2.agent?.pre)) {
                let r = await add_endRole(client2, NAME1, "agent", client2.agent?.pre);
                await wait_operation(client2, r.op);
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
        debug_json("CreateIdentifierRequest", request);
        let response = await create_identifier(client1, builder.alias, request);
        debug_json("create_identifier", response.op);
        let exn = await builder.buildExchangeRequest(request, response);
        debug_json("ExchangeRequest", exn);
        await send_exchange(client1, exn);
    });
    test("group2", async () => {
        let n = await wait_async_operation(async () => {
            let res = await list_notifications(client2);
            let n = res.notes.filter(note => note.a.r === "/multisig/icp" && note.r === false).pop();
            return n;
        });
        expect(n).not.toBeNull();
        debug_json("NotificationType", n);
        let builder = await GroupBuilder.create(client2, GROUP1, NAME1, []);
        let request = await builder.acceptCreateIdentifierRequest(n!);
        debug_json("CreateIdentifierRequest", request);
        let response = await create_identifier(client2, builder.alias, request);
        debug_json("create_identifier", response.op);
        await client2.notifications().mark(n.i);
        let exn = await builder.buildExchangeRequest(request, response);
        debug_json("ExchangeRequest", exn);
        await send_exchange(client2, exn);
    });
    test("members", async () => {
        let members = await get_members(client1, GROUP1);
        debug_json("members", members);
        debug_json("members.signing", members.signing);
        debug_json("members.signing[0].aid", members.signing[0].aid);
        debug_json("members.signing[0].ends", members.signing[0].ends);
        debug_json("members.signing[0].ends.agent", members.signing[0].ends.agent);
        debug_json("members.signing[0].ends.witness", members.signing[0].ends.witness);
        debug_json("members.rotation", members.rotation);
    });
    test("endrole1", async () => {
        let lead = await Identifier.create(client1, NAME1);
        let group = await Identifier.create(client1, GROUP1);
        let members = await get_members(client1, GROUP1);
        let eid1 = Object.keys(members.signing[0].ends.agent).pop()!;
        expect(eid1).not.toBeNull();
        let stamp = new Date().toISOString().replace("Z", "000+00:00");
        let res1 = await add_endRole(client1, GROUP1, "agent", eid1, stamp);
        let payload: MultisigRpyPayload = {
            gid: group.getId()
        };
        let seal = [
            "SealEvent",
            {
                i: group.getIdentifier().prefix,
                s: group.getIdentifier().state.ee.s,
                d: group.getIdentifier().state.ee.d,
            }
        ];
        let sigers = res1.sigs.map(i => new Siger({ qb64: i }));
        let ims = d(messagize(res1.serder, sigers, seal));
        let atc = ims.substring(res1.serder.size);;
        let embeds: MultisigRpyEmbeds = {
            rpy: [res1.serder, atc]
        };
        let recipients = members.signing.map(i => i.aid);
        let request: ExchangeRequest = {
            sender: lead.alias,
            topic: group.alias,
            sender_id: await lead.getIdentifier(),
            route: MULTISIG_RPY,
            payload: payload,
            embeds: embeds,
            recipients: recipients
        };
        let response = await send_exchange(client1, request);
    });
});
