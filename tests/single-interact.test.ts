import { describe, test } from '@jest/globals';
import { client1, createClients, createContacts, createIdentifiers } from './prepare';
import { NAME1 } from '../src/keri/config';
import { InteractionRequest, interact_identifier, wait_operation } from '../src/keri/signify';

beforeAll(createClients);
beforeAll(createIdentifiers);
beforeAll(createContacts);

describe("SingleInteract", () => {
    test("name1", async () => {
        let req: InteractionRequest = {};
        let res = await interact_identifier(client1, NAME1, req);
        await wait_operation(client1, res.op);
    });
});
