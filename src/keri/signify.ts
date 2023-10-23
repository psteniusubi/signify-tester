import { SignifyClient, CreateIdentiferArgs, Algos, Siger, d, messagize } from 'signify-ts';
import { Configuration } from "../config";
import { json2string } from "../util/helper";
import { OperationType, wait_operation } from './operation';
import { get_contacts } from './contacts';
import { KeyStateType, get_keyState, get_keyStates } from './keystate';
import { GroupRequestType, get_group_request } from './group';
import { add_endRole, get_identifier } from './identifier';
import { IdentifierOrContact, Identifier, Contact } from './identifier';
import { CreateIdentifierRequest, CreateIdentifierResponse, create_identifier } from './CreateIdentifier';
import { ExchangeRequest, MULTISIG_ICP, MultisigIcpEmbeds, MultisigIcpPayload, send_exchange } from './Exchange';
import { NotificationType } from './notification';

export * from "./operation";
export * from "./contacts";
export * from "./keystate";
export * from "./oobi";
export * from "./notification";
export * from "./group";
export * from "./identifier";
export * from "./RangeType";
export * from "./CreateIdentifier";
export * from "./Exchange";

export async function create_single_identifier(client: SignifyClient, config: Configuration, alias: string, salt?: string): Promise<void> {
    let request: CreateIdentifierRequest = {
        toad: config.toad,
        wits: config.wits,
        bran: salt ?? undefined
    };
    let response = await create_identifier(client, alias, request);
    await wait_operation(client, response.op);
    await add_endRole(client, alias, "agent", client.agent?.pre);
}

export class GroupBuilder {
    static async create(client: SignifyClient, alias: string, lead: string, members: string[]): Promise<GroupBuilder> {
        let tasks = members.map(alias => Contact.create(client, alias));
        let lead_id = await await Identifier.create(client, lead);
        let builder = new GroupBuilder(client, alias, lead_id);
        builder.addMember(lead_id);
        for (let task of tasks) {
            builder.addMember(await task);
        }
        builder.sortMembers();
        return builder;
    }
    client: SignifyClient;
    alias: string;
    lead: Identifier;
    members: IdentifierOrContact[];
    constructor(client: SignifyClient, alias: string, lead: Identifier) {
        this.client = client;
        this.alias = alias;
        this.lead = lead;
        this.members = new Array<Contact>(0);
    }
    addMember(member: IdentifierOrContact) {
        this.members.push(member);
    }
    sortMembers() {
        this.members.sort((a, b) => a.compare(b));
    }
    getIds(): IdentifierOrContact[] {
        return this.members;
    }
    async getKeyStates(): Promise<KeyStateType[]> {
        let tasks = this.getIds().map(id => id.getKeyState());
        return await Promise.all(tasks);
    }
    getSith(): string[] {
        let sith = new Array<string>(this.members.length);
        sith = sith.fill(`1/${sith.length}`);
        return sith;
    }
    async buildCreateIdentifierRequest(config: Configuration): Promise<CreateIdentifierRequest> {
        let isith = this.getSith();
        let nsith = isith;
        let states = await this.getKeyStates();
        let rstates = states;
        let request: CreateIdentifierRequest = {
            algo: Algos.group,
            mhab: this.lead.getIdentifier(),
            isith: isith,
            nsith: nsith,
            toad: config.toad,
            wits: config.wits,
            states: states,
            rstates: rstates
        };
        return request;
    }
    async acceptCreateIdentifierRequest(notification: NotificationType): Promise<CreateIdentifierRequest> {
        let exn = (await get_group_request(this.client, notification.a.d)).pop()!.exn;
        let isith = exn.e.icp.kt;
        let nsith = exn.e.icp.nt;
        let states = await Promise.all(exn.a.smids.map(i => get_keyState(this.client, i)));
        let rstates = await Promise.all(exn.a.rmids.map(i => get_keyState(this.client, i)));
        let request: CreateIdentifierRequest = {
            algo: Algos.group,
            mhab: this.lead.getIdentifier(),
            isith: isith,
            nsith: nsith,
            toad: parseInt(exn.e.icp.bt),
            wits: exn.e.icp.b,
            states: states,
            rstates: rstates
        };
        return request;
    }
    async buildExchangeRequest(identifierRequest: CreateIdentifierRequest, identifierResponse: CreateIdentifierResponse): Promise<ExchangeRequest> {
        let payload: MultisigIcpPayload = {
            gid: identifierResponse.serder.pre,
            smids: identifierRequest.states?.map(i => i.i),
            rmids: identifierRequest.rstates?.map(i => i.i),
        };
        let sigers = identifierResponse.sigs.map(i => new Siger({ qb64: i }));
        let ims = d(messagize(identifierResponse.serder, sigers));
        let atc = ims.substring(identifierResponse.serder.size);
        let embeds: MultisigIcpEmbeds = {
            icp: [identifierResponse.serder, atc]
        };
        let recipients: string[] = identifierRequest.states!.map(i => i.i);
        let request: ExchangeRequest = {
            sender: this.lead.alias,
            topic: this.alias,
            sender_id: identifierRequest.mhab,
            route: MULTISIG_ICP,
            payload: payload,
            embeds: embeds,
            recipients: recipients
        };
        return request;
    }
}

export async function create_group_identifier(client: SignifyClient, config: Configuration, alias: string, lead: string, members: string[]): Promise<void> {
    let sith = new Array<string>(1 + members.length);
    sith = sith.fill(`1/${sith.length}`);
    let lead_id = await get_identifier(client, lead);
    // console.log(json2string(lead_id));
    let contact_ids = await get_contacts(client, members);
    let states = await get_keyStates(client, [lead_id.prefix].concat(contact_ids.map(contact => contact.id)));
    let rstates = states;
    let request: CreateIdentifierRequest = {
        algo: Algos.group,
        mhab: lead_id,
        isith: sith,
        nsith: sith,
        toad: config.toad,
        wits: config.wits,
        states: states,
        rstates: rstates
    };
    console.log(json2string(request));

    let response = await create_identifier(client, alias, request);
    // console.log(json2string(response.op));

    let serder = response.serder
    let sigs = response.sigs
    let sigers = sigs.map((sig) => new Siger({ qb64: sig }));
    let ims = d(messagize(serder, sigers));
    let atc = ims.substring(serder.size);
    let embeds = {
        icp: [serder, atc],
    }
    let smids = states.map((state) => state.i);
    let rmids = smids;
    let recp = states.map((state) => state.i);
    // await client.exchanges().send(lead, alias, lead_id, "/multisig/icp",
    //     { 'gid': serder.pre, smids: smids, rmids: rmids }, embeds, recp)
    let exn: ExchangeRequest = {
        sender: lead,
        topic: alias,
        sender_id: lead_id,
        route: MULTISIG_ICP,
        payload: { 'gid': serder.pre, smids: smids, rmids: rmids },
        embeds: embeds,
        recipients: recp
    }
    console.log(json2string(exn));
    await send_exchange(client, exn);

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
    let request: CreateIdentifierRequest = {
        algo: Algos.group,
        mhab: member_id,
        isith: icp.kt,
        nsith: icp.nt,
        toad: parseInt(icp.bt),
        wits: icp.b,
        states: states,
        rstates: rstates
    };
    console.log(json2string(request));

    let response = await create_identifier(client, alias, request);
    console.log(json2string(response.op));

    let serder = response.serder
    let sigs = response.sigs
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

