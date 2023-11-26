import { describe, test } from '@jest/globals';
import { client1, client2, createClients, createContacts, createIdentifiers, name1_id } from './prepare';
import { NAME1 } from '../src/keri/config';
import { RotationRequest, RotationResponse, get_keyState, rotate_identifier, wait_operation } from '../src/keri/signify';
import { debug_json } from '../src/util/helper';

beforeAll(createClients);
beforeAll(createIdentifiers);
beforeAll(createContacts);

describe("single-rotate", () => {
    beforeAll(() => {
        expect(name1_id).not.toBeNull();
    });
    test("name1", async () => {
        let state1 = await get_keyState(client1, name1_id);
        let s1 = parseInt(state1.s);

        let req: RotationRequest = {};
        let res: RotationResponse = await rotate_identifier(client1, NAME1, req);
        let op = await wait_operation(client1, res.op);
        debug_json("wait_operation", op.response);

        let state2 = await get_keyState(client1, name1_id);
        let s2 = parseInt(state2.s);
        expect(s2).toEqual(s1 + 1);
        expect(state1.k[0]).not.toEqual(state2.k[0]);

        let state3 = await get_keyState(client2, name1_id);
        let s3 = parseInt(state3.s);
        expect(s3).toEqual(s2);
    });
});
