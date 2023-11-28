import { describe, test } from '@jest/globals';
import { client1, client2, createClients, lookupIdentifiers, name1_id, name2_id } from './prepare';
import { Group, KeyStateType, MULTISIG_ROT, MultisigRotBuilder, OperationType, RotationRequest, get_identifier_by_name, get_keyState, get_oobi, mark_notification, query_keyState, rotate_identifier, send_exchange, wait_notification, wait_operation } from "../src/keri/signify";
import { GROUP1, NAME1 } from '../src/keri/config';
import { debug_json, set_fs_log } from '../src/util/helper';

beforeAll(createClients);
beforeAll(lookupIdentifiers);
beforeAll(() => set_fs_log(true));

describe("multisig-rotate", () => {
    test("step0a", async () => {
        let res1 = await rotate_identifier(client1, NAME1, {});
        let res2 = await rotate_identifier(client2, NAME1, {});
        await Promise.all([
            wait_operation(client1, res1.op),
            wait_operation(client2, res2.op)
        ]);
    });
    test("step0b", async () => {
        let state1 = await query_keyState(client1, name1_id, 1);
        expect(parseInt(state1.s)).toBeGreaterThanOrEqual(0);
        let state2 = await query_keyState(client1, name2_id, 1);
        expect(parseInt(state2.s)).toBeGreaterThanOrEqual(0);
    });
    test("step1", async () => {
        let group = await Group.create(client1, GROUP1);
        let members = await group.getMembers();
        let states: KeyStateType[] = await Promise.all(members.signing.map(i => get_keyState(client1, i.aid)));
        let rstates: KeyStateType[] = await Promise.all(members.rotation.map(i => get_keyState(client1, i.aid)));
        let rotationRequest: RotationRequest = {
            states: states,
            rstates: rstates
        };
        let rotationResponse = await rotate_identifier(client1, GROUP1, rotationRequest);
        let builder = await MultisigRotBuilder.create(client1);
        let rotRequest = await builder.buildMultisigRotRequest(rotationResponse);
        let rotResponse = await send_exchange(client1, rotRequest);
    });
    test("step2", async () => {
        let n = await wait_notification(client2, MULTISIG_ROT);
        let builder = await MultisigRotBuilder.create(client2);
        for (let [name, rotationRequest] of await builder.acceptGroupRotNotification(n)) {
            expect(name).toEqual(GROUP1);
            let rotationResponse = await rotate_identifier(client2, name, rotationRequest);
            let rotRequest = await builder.buildMultisigRotRequest(rotationResponse);
            let rotResponse = await send_exchange(client2, rotRequest);
        }
        mark_notification(client2, n);
    });
    test("step3", async () => {
        let n = await wait_notification(client1, MULTISIG_ROT);
        let builder = await MultisigRotBuilder.create(client1);
        for (let [name, rotationRequest] of await builder.acceptGroupRotNotification(n)) {
            expect(name).toEqual(GROUP1);
        }
        mark_notification(client1, n);
    });
    test("step4", async () => {
        let group_id = await get_identifier_by_name(client1, GROUP1);
        let op: OperationType = { name: `group.${group_id}` };
        await wait_operation(client1, op);
    });
    test("step5", async () => {
        let group_id = await get_identifier_by_name(client2, GROUP1);
        let op: OperationType = { name: `group.${group_id}` };
        await wait_operation(client2, op);
    });
    test("oobi", async () => {
        await get_oobi(client1, GROUP1);
    });
});
