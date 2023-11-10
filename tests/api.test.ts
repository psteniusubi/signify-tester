import { Agent, Authenticater, Controller, KeyManager, SignifyClient } from "signify-ts";
import { NAME1 } from "../src/keri/config";
import { AGENT, WITNESS, get_identifiers, get_name_by_identifier, get_names_by_identifiers, get_oobi } from "../src/keri/signify";
import { debug_json } from "../src/util/helper";
import { Identifier, invoke_lookup } from "../src/keri/signify";
import { createClients, createContacts, createIdentifiers, client1, client2, name1_id, get_or_create_identifier, name2_id, name3_id } from "./prepare";

beforeAll(createClients);
beforeAll(createIdentifiers);
beforeAll(createContacts);

describe("Api", () => {
    let name1b_id: string;
    beforeAll(async () => {
        [name1b_id] = await get_or_create_identifier(client1, "name2");
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
        let oobi = await get_oobi(client1, "name1", AGENT);
        expect(oobi.oobis).toHaveLength(1);
        oobi = await get_oobi(client1, "name1", WITNESS);
        expect(oobi.oobis).toHaveLength(3);
    });
    test("delegate", async () => {
        let oobi = await get_oobi(client2, "delegate", AGENT);
        expect(oobi.oobis).toHaveLength(1);
        oobi = await get_oobi(client2, "delegate", WITNESS);
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
        let r1 = await invoke_lookup(client1, { name: ["name1"] });
        expect(r1.length).toBe(1);
        expect(r1[0].id).toBe(name1_id);
        expect(r1[0].name).toBe("name1");
        r1 = await invoke_lookup(client1, { id: [name1_id] });
        expect(r1.length).toBe(1);
        expect(r1[0].id).toBe(name1_id);
        expect(r1[0].name).toBe("name1");
    });
    test("lookup2", async () => {
        let r1 = await invoke_lookup(client1, { name: ["name1", "name2"] });
        r1 = r1.sort((a, b) => a.name!.localeCompare(b.name!));
        expect(r1.length).toBe(2);
        expect(r1[0].id).toBe(name1_id);
        expect(r1[0].name).toBe("name1");
        expect(r1[1].id).toBe(name1b_id);
        expect(r1[1].name).toBe("name2");
        r1 = await invoke_lookup(client1, { id: r1.map(i => i.id) });
        r1 = r1.sort((a, b) => a.name!.localeCompare(b.name!));
        expect(r1.length).toBe(2);
        expect(r1[0].id).toBe(name1_id);
        expect(r1[0].name).toBe("name1");
        expect(r1[1].id).toBe(name1b_id);
        expect(r1[1].name).toBe("name2");
    });
    test("lookup3", async () => {
        let r1 = await invoke_lookup(client1, { type: ["identifier"], name: ["name1", "name2", "contact1", "contact2", "contact3"] });
        r1 = r1.sort((a, b) => a.name!.localeCompare(b.name!));
        expect(r1.length).toBe(2);
        expect(r1[0].id).toBe(name1_id);
        expect(r1[0].name).toBe("name1");
        expect(r1[1].id).toBe(name1b_id);
        expect(r1[1].name).toBe("name2");
        r1 = await invoke_lookup(client1, { type: ["identifier"], id: r1.map(i => i.id) });
        r1 = r1.sort((a, b) => a.name!.localeCompare(b.name!));
        expect(r1.length).toBe(2);
        expect(r1[0].id).toBe(name1_id);
        expect(r1[0].name).toBe("name1");
        expect(r1[1].id).toBe(name1b_id);
        expect(r1[1].name).toBe("name2");
    });
    test("lookup4", async () => {
        let r1 = await invoke_lookup(client1, { type: ["contact"], name: ["name1", "name2", "contact1", "contact2", "contact3"] });
        r1 = r1.sort((a, b) => a.name!.localeCompare(b.name!));
        expect(r1.length).toBe(2);
        expect(r1[0].id).toBe(name2_id);
        expect(r1[0].name).toBe("contact2");
        expect(r1[1].id).toBe(name3_id);
        expect(r1[1].name).toBe("contact3");
        r1 = await invoke_lookup(client1, { type: ["contact"], id: r1.map(i => i.id) });
        r1 = r1.sort((a, b) => a.name!.localeCompare(b.name!));
        expect(r1.length).toBe(2);
        expect(r1[0].id).toBe(name2_id);
        expect(r1[0].name).toBe("contact2");
        expect(r1[1].id).toBe(name3_id);
        expect(r1[1].name).toBe("contact3");
    });
});
