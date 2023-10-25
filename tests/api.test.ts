import { Agent, Authenticater, Controller, KeyManager, SignifyClient } from "signify-ts";
import { Configuration, NAME1, connect_or_boot, getLocalConfig } from "../src/keri/config";
import { get_identifiers, get_names_by_identifiers } from "../src/keri/get_identifier";
import { debug_json } from "../src/util/helper";
import { Identifier } from "../src/keri/Identifier";

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
        }
    });
    test("get_identifiers_by_ids", async () => {
        let name1 = await Identifier.create(client1, NAME1);
        let name: string | undefined = undefined;
        for await (let i of get_names_by_identifiers(client1, [name1.getId()])) {
            name = i;
        }
        expect(name1.alias).toEqual(name);
    });
});
