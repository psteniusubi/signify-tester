import { SignifyClient } from 'signify-ts';

export interface ContactType {
    id: string,
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
    if (res.length < 1) throw Error(`get_contact: ${alias}`);
    return res.pop()!;
}

export async function get_contacts(client: SignifyClient, aliases: string[]): Promise<ContactType[]> {
    let tasks: Promise<ContactType>[] = [];
    for (let alias of aliases) {
        tasks.push(get_contact(client, alias));
    }
    return await Promise.all(tasks);
}

