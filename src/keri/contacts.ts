import { SignifyClient } from 'signify-ts';
import { debug_in } from '../util/helper';
import { AID, CONTACT, invoke_lookup } from './signify';

export interface ContactType {
    id: AID,
    alias: string,
    oobi: string,
    challenges?: any[],
    wellKnowns?: any[]
}

export async function list_contacts(client: SignifyClient): Promise<ContactType[]> {
    let res: ContactType[] = await client.contacts().list();
    return res;
}

export async function get_contact(client: SignifyClient, alias: string): Promise<ContactType> {
    let res: ContactType[] = await client.contacts().list(undefined, "alias", `^${alias}$`);
    if (res.length < 1) throw Error(`get_contact(${alias}): not found`);
    debug_in(`get_contact(${alias})`, res[0], "ContactType");
    return res[0];
}

export async function get_contacts(client: SignifyClient, aliases: string[]): Promise<ContactType[]> {
    return await Promise.all(aliases.map(i => get_contact(client, i)));
    // let tasks: Promise<ContactType>[] = [];
    // for (let alias of aliases) {
    //     tasks.push(get_contact(client, alias));
    // }
    // return await Promise.all(tasks);
}

export async function get_name_by_contact(client: SignifyClient, id: AID): Promise<string> {
    for (let i of await invoke_lookup(client, { type: [CONTACT], id: [id] })) {
        if (i.name !== undefined) {
            return i.name;
        }
    }
    throw new Error(`get_name_by_contact(${id}): not found`);
}

export async function get_contact_by_name(client: SignifyClient, name: string): Promise<AID> {
    for (let i of await invoke_lookup(client, { type: [CONTACT], name: [name] })) {
        if (i.id !== undefined) {
            return i.id;
        }
    }
    throw new Error(`get_contact_by_name(${name}): not found`);
}