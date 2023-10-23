import { SignifyClient, Algos, Siger, d, messagize } from 'signify-ts';
import { Configuration } from "../config";
import { wait_operation } from './operation';
import { KeyStateType, get_keyState } from './keystate';
import { get_icp_request } from './group';
import { add_endRole } from './identifier';
import { IdentifierOrContact, Identifier, Contact } from './identifier';
import { CreateIdentifierRequest, CreateIdentifierResponse, create_identifier } from './CreateIdentifier';
import { MULTISIG_ICP, MultisigIcpRequest, MultisigIcpRequestEmbeds, MultisigIcpRequestPayload } from './Exchange';
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
    let res1 = await create_identifier(client, alias, request);
    await wait_operation(client, res1.op);
    let res2 = await add_endRole(client, alias, "agent", client.agent?.pre);
    await wait_operation(client, res2.op);
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
        let exn = (await get_icp_request(this.client, notification)).pop()!.exn;
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
    async buildExchangeRequest(identifierRequest: CreateIdentifierRequest, identifierResponse: CreateIdentifierResponse): Promise<MultisigIcpRequest> {
        let payload: MultisigIcpRequestPayload = {
            gid: identifierResponse.serder.pre,
            smids: identifierRequest.states?.map(i => i.i),
            rmids: identifierRequest.rstates?.map(i => i.i),
        };
        let sigers = identifierResponse.sigs.map(i => new Siger({ qb64: i }));
        let ims = d(messagize(identifierResponse.serder, sigers));
        let atc = ims.substring(identifierResponse.serder.size);
        let embeds: MultisigIcpRequestEmbeds = {
            icp: [identifierResponse.serder, atc]
        };
        let recipients: string[] = identifierRequest.states!.map(i => i.i);
        let request: MultisigIcpRequest = {
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
