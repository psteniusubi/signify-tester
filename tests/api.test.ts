import { Agent, Authenticater, Controller, KeyManager, SignifyClient } from "signify-ts";
import { CONTACT1, CONTACT2, CONTACT3, NAME1 } from "../src/keri/config";
import { AGENT, CONTACT, IDENTIFIER, WITNESS, get_identifiers, get_name_by_identifier, get_names_by_identifiers, get_oobi } from "../src/keri/signify";
import { debug_json } from "../src/util/helper";
import { Identifier, invoke_lookup } from "../src/keri/signify";
import { createClients, createContacts, createIdentifiers, client1, client2, name1_id, get_or_create_identifier, name2_id, name3_id } from "./prepare";

beforeAll(createClients);
beforeAll(createIdentifiers);
beforeAll(createContacts);

const NAME1B = "name1b";
const DELEGATE = "delegate";
let name1b_id: string;

describe("api", () => {
    beforeAll(async () => {
        [name1b_id] = await get_or_create_identifier(client1, NAME1B);
    });
    test("client1", async () => {
        expect(client1).toBeInstanceOf(SignifyClient);
        expect(client1.agent).toBeInstanceOf(Agent);
        expect(client1.authn).toBeInstanceOf(Authenticater);
        expect(client1.controller).toBeInstanceOf(Controller);
        expect(client1.manager).toBeInstanceOf(KeyManager);
    });
    test("get_identifiers", async () => {
        let n = 0;
        for await (let i of get_identifiers(client1)) {
            debug_json(`identifier ${n++}`, i);
            // let res = await client1.fetch(`/identifier/${i.prefix}`, "GET", undefined);
            // expect(res.ok).toBeTruthy();
            // let t1: IdentifierType = await res.json();
            // res = await client1.fetch(`/identifiers/${t1.name}`, "GET", undefined);
            // expect(res.ok).toBeTruthy();
            // let t2: IdentifierType = await res.json();
            // expect(json2string(t1)).toBe(json2string(t2));
        }
    });
    test("name1", async () => {
        let oobi = await get_oobi(client1, NAME1, AGENT);
        expect(oobi.oobis).toHaveLength(1);
        oobi = await get_oobi(client1, NAME1, WITNESS);
        expect(oobi.oobis).toHaveLength(3);
    });
    test.skip("delegate", async () => {
        // see single-delegate
        let oobi = await get_oobi(client2, DELEGATE, AGENT);
        expect(oobi.oobis).toHaveLength(1);
        oobi = await get_oobi(client2, DELEGATE, WITNESS);
        expect(oobi.oobis).toHaveLength(0);
    });
    test("get_names_by_identifiers", async () => {
        let name1 = await Identifier.create(client1, NAME1);
        let name: string | undefined = undefined;
        for (let i of await get_names_by_identifiers(client1, [name1.getId()])) {
            name = i.name;
        }
        expect(name1.alias).toEqual(name);
    });
    test("get_name_by_identifier", async () => {
        let name1 = await Identifier.create(client1, NAME1);
        let name = await get_name_by_identifier(client1, name1.getId());
        expect(name1.alias).toEqual(name);
    });
    test("lookup1", async () => {
        let r1 = await invoke_lookup(client1, { name: [NAME1] });
        expect(r1.length).toBe(1);
        expect(r1[0].id).toBe(name1_id);
        expect(r1[0].name).toBe(NAME1);
        r1 = await invoke_lookup(client1, { id: [name1_id] });
        expect(r1.length).toBe(1);
        expect(r1[0].id).toBe(name1_id);
        expect(r1[0].name).toBe(NAME1);
    });
    test("lookup2", async () => {
        let r1 = await invoke_lookup(client1, { name: [NAME1, NAME1B] });
        r1 = r1.sort((a, b) => a.name!.localeCompare(b.name!));
        expect(r1.length).toBe(2);
        expect(r1[0].id).toBe(name1_id);
        expect(r1[0].name).toBe(NAME1);
        expect(r1[1].id).toBe(name1b_id);
        expect(r1[1].name).toBe(NAME1B);
        r1 = await invoke_lookup(client1, { id: r1.map(i => i.id) });
        r1 = r1.sort((a, b) => a.name!.localeCompare(b.name!));
        expect(r1.length).toBe(2);
        expect(r1[0].id).toBe(name1_id);
        expect(r1[0].name).toBe(NAME1);
        expect(r1[1].id).toBe(name1b_id);
        expect(r1[1].name).toBe(NAME1B);
    });
    test("lookup3", async () => {
        let r1 = await invoke_lookup(client1, { type: [IDENTIFIER], name: [NAME1, NAME1B, CONTACT1, CONTACT2, CONTACT3] });
        r1 = r1.sort((a, b) => a.name!.localeCompare(b.name!));
        expect(r1.length).toBe(2);
        expect(r1[0].id).toBe(name1_id);
        expect(r1[0].name).toBe(NAME1);
        expect(r1[1].id).toBe(name1b_id);
        expect(r1[1].name).toBe(NAME1B);
        r1 = await invoke_lookup(client1, { type: [IDENTIFIER], id: r1.map(i => i.id) });
        r1 = r1.sort((a, b) => a.name!.localeCompare(b.name!));
        expect(r1.length).toBe(2);
        expect(r1[0].id).toBe(name1_id);
        expect(r1[0].name).toBe(NAME1);
        expect(r1[1].id).toBe(name1b_id);
        expect(r1[1].name).toBe(NAME1B);
    });
    test("lookup4", async () => {
        let r1 = await invoke_lookup(client1, { type: [CONTACT], name: [NAME1, NAME1B, CONTACT1, CONTACT2, CONTACT3] });
        r1 = r1.sort((a, b) => a.name!.localeCompare(b.name!));
        expect(r1.length).toBe(2);
        expect(r1[0].id).toBe(name2_id);
        expect(r1[0].name).toBe(CONTACT2);
        expect(r1[1].id).toBe(name3_id);
        expect(r1[1].name).toBe(CONTACT3);
        r1 = await invoke_lookup(client1, { type: [CONTACT], id: r1.map(i => i.id) });
        r1 = r1.sort((a, b) => a.name!.localeCompare(b.name!));
        expect(r1.length).toBe(2);
        expect(r1[0].id).toBe(name2_id);
        expect(r1[0].name).toBe(CONTACT2);
        expect(r1[1].id).toBe(name3_id);
        expect(r1[1].name).toBe(CONTACT3);
    });
});
