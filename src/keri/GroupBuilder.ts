import { Siger, SignifyClient, d, messagize } from "signify-ts";
import { Contact, Identifier, IdentifierOrContact } from "./signify";
import { KeyStateType, get_keyState } from "./signify";
import { Configuration } from "./config";
import { CreateIdentifierRequest, CreateIdentifierResponse } from "./signify";
import { Algos } from "signify-ts";
import { NotificationType } from "./signify";
import { get_icp_request } from "./signify";
import { MULTISIG_ICP, MultisigIcpRequest, MultisigIcpRequestEmbeds, MultisigIcpRequestPayload } from "./signify";

export class GroupBuilder {
    static async create(client: SignifyClient, alias: string, lead: string, members: string[]): Promise<GroupBuilder> {
        let tasks = members.map(alias => Contact.create(client, alias));
        let lead_id = await Identifier.create(client, lead);
        let builder = new GroupBuilder(client, alias, lead_id);
        builder.addMember(lead_id);
        for (let task of tasks) {
            builder.addMember(await task);
        }
        // builder.sortMembers();
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
        let exn = (await get_icp_request(this.client, notification))[0].exn;
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
