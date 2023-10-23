import { EventResult, Serder, SignifyClient } from 'signify-ts';
import { ContactType, KeyStateType, OperationType, RangeType, get_contact, get_keyState, wait_operation } from './signify';
import { debug_json } from '../util/helper';

export interface IdentifierType {
    name: string;
    prefix: string;
    state: {
        ee: {
            s: string;
            d: string;
            br: any[];
            ba: any[];
        };
        [property: string]: any;
    },
    [property: string]: any;
}

export interface IdentifierRangeType extends RangeType {
    aids: IdentifierType[]
}

export async function list_identifiers(client: SignifyClient): Promise<IdentifierRangeType> {
    let res: IdentifierRangeType = await client.identifiers().list();
    return res;
}

export async function get_identifier(client: SignifyClient, alias: string): Promise<IdentifierType> {
    let res: IdentifierType = await client.identifiers().get(alias);
    debug_json(`get_identifier(${alias})`, res);
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

export interface AddEndRoleResponse {
    serder: Serder;
    sigs: string[];
    op: OperationType;
}

export async function add_endRole(client: SignifyClient, alias: string, role: string, eid?: string, stamp: string | undefined = undefined): Promise<AddEndRoleResponse> {
    let res: EventResult = await client.identifiers().addEndRole(alias, role, eid, stamp);
    return {
        serder: res.serder,
        sigs: res.sigs,
        op: await res.op()
    };
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
    alias?: string;
    _keyState?: KeyStateType;
    constructor(client: SignifyClient, alias: string | undefined) {
        this.client = client;
        this.alias = alias;
    }
    compare(other: IdentifierOrContact): number {
        return this.getId().localeCompare(other.getId());
    }
    abstract getId(): string;
    async getKeyState(): Promise<KeyStateType> {
        let id = await this.getId();
        return this._keyState ??= await get_keyState(this.client, id);
    }
}

export class Identifier extends IdentifierOrContact {
    static async create(client: SignifyClient, alias: string): Promise<Identifier> {
        let identifier = await get_identifier(client, alias);
        return new Identifier(client, alias, identifier);
    }
    static async createFromIdentifier(client: SignifyClient, identifier: IdentifierType): Promise<Identifier> {
        return new Identifier(client, undefined, identifier);
    }
    identifier: IdentifierType;
    constructor(client: SignifyClient, alias: string | undefined, identifier: IdentifierType) {
        super(client, alias);
        this.identifier = identifier;
    }
    getIdentifier(): IdentifierType {
        return this.identifier;
    }
    getId(): string {
        return this.identifier.prefix;
    }
}

export class Contact extends IdentifierOrContact {
    static async create(client: SignifyClient, alias: string): Promise<Contact> {
        let contact = await get_contact(client, alias);
        return new Contact(client, alias, contact);
    }
    contact: ContactType;
    constructor(client: SignifyClient, alias: string, contact: ContactType) {
        super(client, alias);
        this.contact = contact;
    }
    getContact(): ContactType {
        return this.contact;
    }
    getId(): string {
        return this.contact.id;
    }
}