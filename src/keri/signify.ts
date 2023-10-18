import { SignifyClient, CreateIdentiferArgs, Algos, Siger, d, messagize } from 'signify-ts';
import { Configuration } from "../config";
import { json2string } from "../util/helper";
import { OperationType, wait_operation } from './operation';
import { get_contacts } from './contacts';
import { KeyStateType, get_keyState, get_keyStates } from './keystate';
import { get_group_request } from './group';
import { add_endRole, get_identifier } from './identifier';
import { IdentifierOrContact, Identifier, Contact } from './identifier';

export * from "./operation";
export * from "./contacts";
export * from "./keystate";
export * from "./oobi";
export * from "./notification";
export * from "./group";
export * from "./identifier";

export interface RangeType {
    start: number,
    end: number,
    total: number,
}

export async function create_single_identifier(client: SignifyClient, config: Configuration, alias: string, salt?: string): Promise<void> {
    let args: CreateIdentiferArgs = {
        toad: config.toad,
        wits: config.wits,
        bran: salt ?? undefined
    };
    let res = await client.identifiers().create(alias, args);
    let op: OperationType = await res.op();
    await wait_operation(client, op);
    await add_endRole(client, alias, "agent", client.agent?.pre);
}

export class GroupBuilder {
    static async create(client: SignifyClient, lead: string, members: string[]): Promise<GroupBuilder> {
        let tasks = members.map(alias => Contact.create(client, alias));
        let builder = new GroupBuilder(client, await Identifier.create(client, lead));
        for (let task of tasks) {
            builder.addMember(await task);
        }
        return builder;
    }
    client: SignifyClient;
    lead: Identifier;
    members: Contact[];
    constructor(client: SignifyClient, lead: Identifier) {
        this.client = client;
        this.lead = lead;
        this.members = new Array<Contact>(0);
    }
    addMember(member: Contact) {
        this.members.push(member);
    }
    getIds(): IdentifierOrContact[] {
        let list = new Array<IdentifierOrContact>(this.lead, ...this.members);
        list = list.sort((a, b) => a.compare(b));
        return list;
    }
    async getKeyStates(): Promise<KeyStateType[]> {
        let tasks = this.getIds().map(id => id.getKeyState());
        return await Promise.all(tasks);
    }
    getSith(): string[] {
        let sith = new Array<string>(1 + this.members.length);
        sith = sith.fill(`1/${sith.length}`);
        return sith;
    }
    async getArgs(config: Configuration): Promise<CreateIdentiferArgs> {
        let sith = this.getSith();
        let states = await this.getKeyStates();
        let kargs: CreateIdentiferArgs = {
            algo: Algos.group,
            mhab: this.lead.getIdentifier(),
            isith: sith,
            nsith: sith,
            toad: config.toad,
            wits: config.wits,
            states: states,
            rstates: states
        };
        return kargs;
    }
}

export async function create_group_identifier(client: SignifyClient, config: Configuration, alias: string, lead: string, members: string[]): Promise<void> {
    let sith = new Array<string>(1 + members.length);
    sith = sith.fill(`1/${sith.length}`);
    let lead_id = await get_identifier(client, lead);
    console.log(json2string(lead_id));
    let contact_ids = await get_contacts(client, members);
    let states = await get_keyStates(client, [lead_id.prefix].concat(contact_ids.map(contact => contact.id)));
    let rstates = states;
    let kargs: CreateIdentiferArgs = {
        algo: Algos.group,
        mhab: lead_id,
        isith: sith,
        nsith: sith,
        toad: config.toad,
        wits: config.wits,
        states: states,
        rstates: rstates
    };
    console.log(json2string(kargs));

    let res = await client.identifiers().create(alias, kargs);
    let op: OperationType = await res.op();
    console.log(json2string(op));

    let serder = res.serder
    let sigs = res.sigs
    let sigers = sigs.map((sig) => new Siger({ qb64: sig }));
    let ims = d(messagize(serder, sigers));
    let atc = ims.substring(serder.size);
    let embeds = {
        icp: [serder, atc],
    }
    let smids = states.map((state) => state.i);
    let rmids = smids;
    let recp = states.map((state) => state.i);
    await client.exchanges().send(lead, alias, lead_id, "/multisig/icp",
        { 'gid': serder.pre, smids: smids, rmids: rmids }, embeds, recp)

    // op = await client.identifiers().addEndRole(alias, "agent", client.agent?.pre);
    // await wait_operation(client, op);
}

export async function accept_group_identifier(client: SignifyClient, alias: string, member: string, id: string): Promise<void> {
    let exn = (await get_group_request(client, id)).pop()!.exn;
    console.log(json2string(exn));
    let member_id = await get_identifier(client, member);
    let icp = exn.e.icp;
    let states = await get_keyStates(client, exn.a.smids);
    let rstates = await get_keyStates(client, exn.a.rmids);
    let kargs: CreateIdentiferArgs = {
        algo: Algos.group,
        mhab: member_id,
        isith: icp.kt,
        nsith: icp.nt,
        toad: parseInt(icp.bt),
        wits: icp.b,
        states: states,
        rstates: rstates
    };
    console.log(json2string(kargs));

    let res = await client.identifiers().create(alias, kargs);
    let op: OperationType = await res.op();
    console.log(json2string(op));

    let serder = res.serder
    let sigs = res.sigs
    let sigers = sigs.map((sig) => new Siger({ qb64: sig }));
    let ims = d(messagize(serder, sigers));
    let atc = ims.substring(serder.size);
    let embeds = {
        icp: [serder, atc],
    }
    let smids = states.map((state) => state.i);
    let rmids = rstates.map((state) => state.i);
    let recp = states.map((state) => state.i);
    await client.exchanges().send(member, alias, member_id, "/multisig/icp",
        { 'gid': serder.pre, smids: smids, rmids: rmids }, embeds, recp)

    // op = await client.identifiers().addEndRole(alias, "agent", client.agent?.pre);
    // await wait_operation(client, op);
}

