import { SignifyClient } from 'signify-ts';
import { ContactType, IdentifierType, KeyStateType, get_contact, get_identifier, get_keyState } from './signify';

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