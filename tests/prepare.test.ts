import { describe, test } from '@jest/globals';
import { createClients, createIdentifiers, createContacts } from './prepare';
import { name1_id, name2_id, name3_id } from './prepare';

beforeAll(createClients);
beforeAll(createIdentifiers);
beforeAll(createContacts);

describe("Prepare", () => {
    test("test1", async () => {
        expect(name1_id).toBeDefined();
        expect(name2_id).toBeDefined();
        expect(name3_id).toBeDefined();
    });
});
