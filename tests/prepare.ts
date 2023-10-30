import { SignifyClient } from 'signify-ts';
import { Configuration, connect_or_boot, getLocalConfig, NAME1, CONTACT1, CONTACT2, CONTACT3 } from "../src/keri/config";
import { AGENT, AddEndRoleRequest, CONTACT, IDENTIFIER, IdentifierType, add_endRole, create_single_identifier, get_contact, get_identifier, get_oobi, has_endRole, invoke_lookup, resolve_oobi, wait_operation } from '../src/keri/signify';

const CLIENT1 = "client1";
const CLIENT2 = "client2";
const CLIENT3 = "client3";

export let config: Configuration;
export let client1: SignifyClient;
export let client2: SignifyClient;
export let client3: SignifyClient;

export async function createClients() {
    config = await getLocalConfig();
    let tasks = [
        connect_or_boot(config, CLIENT1),
        connect_or_boot(config, CLIENT2),
        connect_or_boot(config, CLIENT3)
    ];
    [client1, client2, client3] = await Promise.all(tasks);
}

async function exist_identifier(client: SignifyClient, alias: string): Promise<boolean> {
    let r = await invoke_lookup(client, { type: [IDENTIFIER], name: [alias] });
    if (r.length < 1) return false;
    return r[0].type === IDENTIFIER && r[0].name === alias;
}

async function exist_contact(client: SignifyClient, alias: string): Promise<boolean> {
    let r = await invoke_lookup(client, { type: [CONTACT], name: [alias] });
    if (r.length < 1) return false;
    return r[0].type === CONTACT && r[0].name === alias;
}

export async function get_or_create_identifier(client: SignifyClient, alias: string): Promise<string[]> {
    if (await exist_identifier(client, alias)) {
        if (!has_endRole(client, alias, AGENT, client.agent?.pre)) {
            let req: AddEndRoleRequest = {
                alias: alias,
                role: AGENT,
                eid: client.agent?.pre
            };
            let r = await add_endRole(client, req);
            await wait_operation(client, r.op);
        }
    } else {
        await create_single_identifier(client, config, alias, undefined);
    }
    let t: IdentifierType = await get_identifier(client, alias);
    expect(t).toHaveProperty("state");
    expect(t).not.toHaveProperty("group");
    let oobi = await get_oobi(client, alias, AGENT);
    return [t.prefix, oobi.oobis[0]];
}

export async function get_or_create_contact(client: SignifyClient, alias: string, oobi: string): Promise<void> {
    if (await exist_contact(client, alias)) {
        let r = await get_contact(client, alias);
        if (r.oobi !== oobi) {
            await resolve_oobi(client, alias, oobi);
        }
    } else {
        await resolve_oobi(client, alias, oobi);
    }
}

export let name1_id: string, name1_oobi: string;
export let name2_id: string, name2_oobi: string;
export let name3_id: string, name3_oobi: string;

export async function createIdentifiers() {
    let tasks = [
        get_or_create_identifier(client1, NAME1),
        get_or_create_identifier(client2, NAME1),
        get_or_create_identifier(client3, NAME1),
    ];
    let res = await Promise.all(tasks);
    [name1_id, name1_oobi] = res[0];
    [name2_id, name2_oobi] = res[1];
    [name3_id, name3_oobi] = res[2];
}

export async function createContacts() {
    let tasks = [
        get_or_create_contact(client1, CONTACT2, name2_oobi),
        get_or_create_contact(client1, CONTACT3, name3_oobi),
        get_or_create_contact(client2, CONTACT1, name1_oobi),
        get_or_create_contact(client2, CONTACT3, name3_oobi),
        get_or_create_contact(client3, CONTACT1, name1_oobi),
        get_or_create_contact(client3, CONTACT2, name2_oobi),
    ];
    await Promise.all(tasks);
}