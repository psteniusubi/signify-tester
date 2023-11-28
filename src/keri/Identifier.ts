import { SignifyClient } from 'signify-ts';
import { AID, ContactType, IdentifierType, KeyStateType, MembersType, get_contact, get_identifier, get_keyState, get_members } from './signify';

export abstract class IdentifierOrContact {
    readonly client: SignifyClient;
    readonly alias: string;
    private _keyState?: Promise<KeyStateType>;
    constructor(client: SignifyClient, alias: string) {
        this.client = client;
        this.alias = alias;
        this._keyState = undefined;
    }
    compare(other: IdentifierOrContact): number {
        return this.getId().localeCompare(other.getId());
    }
    abstract getId(): AID;
    async getKeyState(): Promise<KeyStateType> {
        let id: AID = this.getId();
        return await (this._keyState ??= get_keyState(this.client, id));
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
    private readonly identifier: IdentifierType;
    constructor(client: SignifyClient, identifier: IdentifierType) {
        super(client, identifier.name);
        this.identifier = identifier;
    }
    getIdentifier(): IdentifierType {
        return this.identifier;
    }
    getId(): AID {
        return this.identifier.prefix;
    }
}

export class Group extends Identifier {
    static async create(client: SignifyClient, alias: string): Promise<Group> {
        let identifier = await get_identifier(client, alias);
        return await Group.createFromIdentifier(client, identifier);
    }
    static async createFromIdentifier(client: SignifyClient, identifier: IdentifierType): Promise<Group> {
        return new Group(client, identifier);
    }
    private _members?: Promise<MembersType>;
    constructor(client: SignifyClient, identifier: IdentifierType) {
        super(client, identifier);
        if (identifier.group === undefined) throw new Error(`Group(${identifier.name}): not group`);
        this._members = undefined;
    }
    async getMembers(): Promise<MembersType> {
        return await (this._members ??= get_members(this.client, this.alias));
    }
    async isLead(): Promise<boolean> {
        let members = await this.getMembers();
        let ids: AID[] = members.signing.map(i => i.aid);
        let n = ids.indexOf(this.getIdentifier().group!.mhab.prefix);
        return n === 0;
    }
}

export class Contact extends IdentifierOrContact {
    static async create(client: SignifyClient, alias: string): Promise<Contact> {
        let contact = await get_contact(client, alias);
        return this.createFromContact(client, contact);
    }
    static async createFromContact(client: SignifyClient, contact: ContactType): Promise<Contact> {
        return new Contact(client, contact);
    }
    private readonly contact: ContactType;
    constructor(client: SignifyClient, contact: ContactType) {
        super(client, contact.alias);
        this.contact = contact;
    }
    getContact(): ContactType {
        return this.contact;
    }
    getId(): AID {
        return this.contact.id;
    }
}