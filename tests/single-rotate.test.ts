import { describe, test } from '@jest/globals';
import { client1, createClients, createContacts, createIdentifiers } from './prepare';
import { NAME1 } from '../src/keri/config';
import { RotationRequest, rotate_identifier, wait_operation } from '../src/keri/signify';

beforeAll(createClients);
beforeAll(createIdentifiers);
beforeAll(createContacts);

describe("SingleRotate", () => {
    test("name1", async () => {
        let req: RotationRequest = {};
        let res = await rotate_identifier(client1, NAME1, req);
        await wait_operation(client1, res.op);
    });
});
