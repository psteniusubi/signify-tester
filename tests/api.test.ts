import { Agent, Authenticater, Controller, KeyManager, SignifyClient } from "signify-ts";
import { Configuration, NAME1, connect_or_boot, getLocalConfig } from "../src/keri/config";
import { get_identifiers, get_name_by_identifier, get_names_by_identifiers } from "../src/keri/signify";
import { debug_json } from "../src/util/helper";
import { Identifier, lookup } from "../src/keri/signify";

const CLIENT1 = "client1";
const CLIENT2 = "client2";

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
        let r1 = await lookup(client1, { name: ["name1"] });
        expect(r1.length).toBe(1);
        expect(r1[0].id).toBe("ECuoqcg1XOf_TxsOi2fM2Ir_1OFFPEv04QcdLeAhIWHU");
        expect(r1[0].name).toBe("name1");
        r1 = await lookup(client1, { id: ["ECuoqcg1XOf_TxsOi2fM2Ir_1OFFPEv04QcdLeAhIWHU"] });
        expect(r1.length).toBe(1);
        expect(r1[0].id).toBe("ECuoqcg1XOf_TxsOi2fM2Ir_1OFFPEv04QcdLeAhIWHU");
        expect(r1[0].name).toBe("name1");
    });
    test("lookup2", async () => {
        let r1 = await lookup(client1, { name: ["name1", "name2"] });
        expect(r1.length).toBe(2);
        expect(r1[0].id).toBe("ECuoqcg1XOf_TxsOi2fM2Ir_1OFFPEv04QcdLeAhIWHU");
        expect(r1[0].name).toBe("name1");
        expect(r1[1].id).toBe("EPVuJrtafiiXkrmsJVuz92jXjrtqUL6ByFEZe0H6PZhR");
        expect(r1[1].name).toBe("name2");
        r1 = await lookup(client1, { id: r1.map(i => i.id) });
        expect(r1.length).toBe(2);
        expect(r1[0].id).toBe("ECuoqcg1XOf_TxsOi2fM2Ir_1OFFPEv04QcdLeAhIWHU");
        expect(r1[0].name).toBe("name1");
        expect(r1[1].id).toBe("EPVuJrtafiiXkrmsJVuz92jXjrtqUL6ByFEZe0H6PZhR");
        expect(r1[1].name).toBe("name2");
    });
    test("lookup3", async () => {
        let r1 = await lookup(client1, { type: ["identifier"], name: ["name1", "name2", "contact1", "contact2", "contact3"] });
        expect(r1.length).toBe(2);
        expect(r1[0].id).toBe("ECuoqcg1XOf_TxsOi2fM2Ir_1OFFPEv04QcdLeAhIWHU");
        expect(r1[0].name).toBe("name1");
        expect(r1[1].id).toBe("EPVuJrtafiiXkrmsJVuz92jXjrtqUL6ByFEZe0H6PZhR");
        expect(r1[1].name).toBe("name2");
        r1 = await lookup(client1, { type: ["identifier"], id: r1.map(i => i.id) });
        expect(r1.length).toBe(2);
        expect(r1[0].id).toBe("ECuoqcg1XOf_TxsOi2fM2Ir_1OFFPEv04QcdLeAhIWHU");
        expect(r1[0].name).toBe("name1");
        expect(r1[1].id).toBe("EPVuJrtafiiXkrmsJVuz92jXjrtqUL6ByFEZe0H6PZhR");
        expect(r1[1].name).toBe("name2");
    });
    test("lookup4", async () => {
        let r1 = await lookup(client1, { type: ["contact"], name: ["name1", "name2", "contact1", "contact2", "contact3"] });
        expect(r1.length).toBe(3);
        expect(r1[0].id).toBe("EJWS5NjAqNKHrx7nAApOLV94Sdr7vNJRv5rCVHY5YXEs");
        expect(r1[0].name).toBe("contact2");
        expect(r1[1].id).toBe("EMrgBLjdbev9zBs29sCyhggkSK9SgLbiR406uUjuYwrb");
        expect(r1[1].name).toBe("contact2");
        expect(r1[2].id).toBe("ENi-AxpriYfJgWuGodGoaXgNLN-S2CSnfo7wUMWH8vUy");
        expect(r1[2].name).toBe("contact3");
        r1 = await lookup(client1, { type: ["contact"], id: r1.map(i => i.id) });
        expect(r1.length).toBe(3);
        expect(r1[0].id).toBe("EJWS5NjAqNKHrx7nAApOLV94Sdr7vNJRv5rCVHY5YXEs");
        expect(r1[0].name).toBe("contact2");
        expect(r1[1].id).toBe("EMrgBLjdbev9zBs29sCyhggkSK9SgLbiR406uUjuYwrb");
        expect(r1[1].name).toBe("contact2");
        expect(r1[2].id).toBe("ENi-AxpriYfJgWuGodGoaXgNLN-S2CSnfo7wUMWH8vUy");
        expect(r1[2].name).toBe("contact3");
    });
});
