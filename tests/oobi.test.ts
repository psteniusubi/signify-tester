import { CONTACT1, NAME1 } from "../src/keri/config";
import { AGENT, Contact, WITNESS, get_oobi, invoke_lookup, resolve_oobi } from "../src/keri/signify";
import { client1, client2, client3, createClients, createIdentifiers } from "./prepare";

beforeAll(createClients);
beforeAll(createIdentifiers);

describe("Oobi", () => {
    test("agent", async () => {
        let lookup = await invoke_lookup(client2, { name: [CONTACT1] });
        expect(lookup).toHaveLength(0);
        let oobi = await get_oobi(client1, NAME1, AGENT);
        await resolve_oobi(client2, CONTACT1, oobi.oobis[0]);
        let contact = await Contact.create(client2, CONTACT1);
        expect(contact.contact.oobi).toMatch(/^http:\/\/localhost:3902\/oobi\/.*/);
        let state = await contact.getKeyState();
        expect(state).toBeDefined();
    });
    test("witness", async () => {
        let lookup = await invoke_lookup(client3, { name: [CONTACT1] });
        expect(lookup).toHaveLength(0);
        let oobi = await get_oobi(client2, NAME1, WITNESS);
        await resolve_oobi(client3, CONTACT1, oobi.oobis[0]);
        let contact = await Contact.create(client3, CONTACT1);
        expect(contact.contact.oobi).not.toMatch(/^http:\/\/localhost:3902\/oobi\/.*/);
        let state = await contact.getKeyState();
        expect(state).toBeDefined();
    });
});
