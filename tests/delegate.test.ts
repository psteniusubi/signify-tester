import { describe, test } from '@jest/globals';
import { config, client1, client2, createClients, createIdentifiers, createContacts, name1_id } from './prepare';
import { AGENT, AddEndRoleRequest, CreateIdentifierRequest, add_endRole, create_identifier, get_notifications, wait_operation } from '../src/keri/signify';
import { debug_json } from '../src/util/helper';

beforeAll(createClients);
beforeAll(createIdentifiers);
beforeAll(createContacts);

describe("Delegate", () => {
    test("name2", async () => {
        const alias = "name2";
        let req1: CreateIdentifierRequest = {
            toad: config.toad,
            wits: config.wits,
            bran: undefined,
            delpre: name1_id,
        };
        let res1 = await create_identifier(client2, alias, req1);
        await wait_operation(client2, res1.op);
        let req2: AddEndRoleRequest = {
            alias: alias,
            role: AGENT,
            eid: client2.agent?.pre
        }
        let res2 = await add_endRole(client2, req2);
        await wait_operation(client2, res2.op);
    });
    test("client1", async () => {
        for await (let note of await get_notifications(client1)) {
            debug_json("client1", note);
        }
    })
});
