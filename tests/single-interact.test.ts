import { describe, test } from '@jest/globals';
import { client1, createClients, createContacts, createIdentifiers } from './prepare';
import { NAME1 } from '../src/keri/config';
import { wait_operation } from '../src/keri/signify';

beforeAll(createClients);
beforeAll(createIdentifiers);
beforeAll(createContacts);

describe("SingleInteract", () => {
    const DELEGATE = "delegate";
    test("name1", async () => {
        let res = await client1.identifiers().interact(NAME1, {
        });
        await wait_operation(client1, await res.op());
    });
});
