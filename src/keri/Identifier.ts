import { EmptyMaterialError, SignifyClient } from 'signify-ts';
import { ContactType, IdentifierType, KeyStateType, MemberType, MembersType, get_contact, get_identifier, get_keyState, get_members } from './signify';

export abstract class IdentifierOrContact {
    readonly client: SignifyClient;
    readonly alias: string;
    _keyState?: KeyStateType;
    constructor(client: SignifyClient, alias: string) {
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
    static async create(client: SignifyClient, alias: string): Promise<Identifier | Group> {
        let identifier = await get_identifier(client, alias);
        return await Identifier.createFromIdentifier(client, identifier);
    }
    static async createFromIdentifier(client: SignifyClient, identifier: IdentifierType): Promise<Identifier | Group> {
        return new Identifier(client, identifier);
    }
    readonly identifier: IdentifierType;
    constructor(client: SignifyClient, identifier: IdentifierType) {
        super(client, identifier.name);
        this.identifier = identifier;
    }
    getIdentifier(): IdentifierType {
        return this.identifier;
    }
    getId(): string {
        return this.identifier.prefix;
    }
}

export class Group extends Identifier {
    static async create(client: SignifyClient, alias: string): Promise<Group> {
        let identifier = await get_identifier(client, alias);
        return await Group.createFromIdentifier(client, identifier);
    }
    static async createFromIdentifier(client: SignifyClient, identifier: IdentifierType): Promise<Group> {
        let members = await get_members(client, identifier.name);
        return new Group(client, identifier, members);
    }
    readonly members: MembersType;
    constructor(client: SignifyClient, identifier: IdentifierType, members: MembersType) {
        super(client, identifier);
        if (identifier.group === undefined) throw new Error(`Group(${identifier.name}): not group`);
        this.members = members;
    }
    isLead(): boolean {
        let ids = this.members.signing.map(i => i.aid);
        let n = ids.indexOf(this.getIdentifier().group!.mhab.prefix);
        return n === 0;
    }
}

export class Contact extends IdentifierOrContact {
    static async create(client: SignifyClient, alias: string): Promise<Contact> {
        let contact = await get_contact(client, alias);
        return new Contact(client, alias, contact);
    }
    readonly contact: ContactType;
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