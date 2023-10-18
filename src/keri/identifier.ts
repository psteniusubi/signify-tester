import { SignifyClient } from 'signify-ts';
import { ContactType, KeyStateType, RangeType, get_contact, get_keyState, wait_operation } from './signify';

export interface IdentifierType {
    name: string,
    prefix: string,
    [property: string]: any
}

export interface IdentifierRangeType extends RangeType {
    aids: IdentifierType[]
}

export async function list_identifiers(client: SignifyClient): Promise<IdentifierRangeType> {
    let res: IdentifierRangeType = await client.identifiers().list();
    return res;
}

export async function get_identifier(client: SignifyClient, alias: string): Promise<IdentifierType> {
    let res = await client.identifiers().get(alias);
    return res;
}

export interface EndRoleType {
    cid: string,
    role: string,
    eid: string
}

export async function get_endRoles(client: SignifyClient, alias: string): Promise<EndRoleType[]> {
    let path = `/identifiers/${alias}/endroles`;
    let res = await client.fetch(path, "GET", null);
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
}

export async function add_endRole(client: SignifyClient, alias: string, role: string, eid?: string, stamp: string | undefined = undefined): Promise<void> {
    let op = await client.identifiers().addEndRole(alias, role, eid, stamp);
    await wait_operation(client, op);
}

export async function has_endRole(client: SignifyClient, alias: string, role: string, eid?: string): Promise<boolean> {
    let list = await get_endRoles(client, alias);
    for (let i of list) {
        if (i.role === role && i.eid === eid) {
            return true;
        }
    }
    return false;
}

export abstract class IdentifierOrContact {
    client: SignifyClient;
    alias: string;
    _keyState?: KeyStateType;
    constructor(client: SignifyClient, alias: string) {
        this.client = client;
        this.alias = alias;
    }
    abstract getId(): Promise<string>;
    async getKeyState(): Promise<KeyStateType> {
        let id = await this.getId();
        return this._keyState ??= await get_keyState(this.client, id);
    }
}

export class Identifier extends IdentifierOrContact {
    _identifier?: IdentifierType;
    constructor(client: SignifyClient, alias: string) {
        super(client, alias);
    }
    async getIdentifier(): Promise<IdentifierType> {
        return this._identifier ??= await get_identifier(this.client, this.alias);
    }
    async getId(): Promise<string> {
        let identifier = await this.getIdentifier();
        return identifier.prefix;
    }
}

export class Contact extends IdentifierOrContact {
    _contact?: ContactType;
    constructor(client: SignifyClient, alias: string) {
        super(client, alias);
    }
    async getContact(): Promise<ContactType> {
        return this._contact ??= await get_contact(this.client, this.alias);
    }
    async getId(): Promise<string> {
        let contact = await this.getContact();
        return contact.id;
    }
}